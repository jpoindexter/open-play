// Mapping catalogs are local data. No controller scripts, native code or SysEx
// are evaluated. Source provenance and physical compatibility are separate.
import {officialFactoryDigests} from './controller-factory-digests.js';
import {controllerPerformanceTarget,validateControllerConditions} from './controller-performance.js';
import {controllerMixerTarget} from './controller-mixer.js';
export const controllerCatalogFormat='open-play-controller-catalog-v1';
export const controllerCatalogMaxBytes=32*1024*1024;
const sha=/^[a-f0-9]{64}$/;
const commands=/^Deck [1-4] (play|load|cue|sync|sync off|loop|hot cue [1-8]|headphone cue|slip|quantize|vinyl|previous|tempo range|auto loop four|loop in|loop out|loop half|loop double|jog touch|stutter|tap tempo)$/;
const continuous=/^Deck [1-4] (level|high|mid|low|trim|filter|tempo|tempo ignore)$/;
const relative=['Relative two’s complement','Relative offset'];
// Populate only from reviewed recovery evidence, never an imported claim.
const verifiedProfiles=new WeakSet();
const authenticatedFields=['adapterVersion','name','sourceFile','sourceSHA256','sourceEnvelope','controls','mappings','issues','outputBranches'];
function canonical(value){
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonical(value[key])).join(',')+'}';
  return JSON.stringify(value);
}
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
async function sha256(bytes){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');}
export async function attestControllerCatalog(catalog){
  for(const p of catalog.profiles){
    const expected=officialFactoryDigests[p.sourceSHA256];
    if(!expected)continue;
    const data=Object.fromEntries(authenticatedFields.map(key=>[key,p[key]??null]));
    const actual=await sha256(new TextEncoder().encode(canonical(data)));
    if(!(Array.isArray(expected)?expected:[expected]).includes(actual))throw Error('Known factory source has modified or unsupported catalog content; import the reviewed factory-adapter output.');
    verifiedProfiles.add(p);freeze(p);
  }
  return catalog;
}
export function controllerSourceLabel(profile){
  if(verifiedProfiles.has(profile))return 'Official Serato';
  return profile.provenance?.kind==='alternative'
    ?`Alternative mapping — ${profile.provenance.name}`:'User mapping';
}
export function validateControllerMapping(mapping){
  const fields=['target','type','channel','number','encoding','invert','sourceControlIndex','sourceCaseIndex','sourceAction','conditions'];
  if(!mapping||Object.keys(mapping).some(key=>!fields.includes(key)))throw Error('Mapping has unsupported options; keep it inactive until an adapter handles them.');
  if(!Number.isInteger(mapping.channel)||mapping.channel<1||mapping.channel>16||!Number.isInteger(mapping.number)||mapping.number<0||mapping.number>127)throw Error('Invalid MIDI channel or controller number.');
  if(mapping.invert!==undefined&&typeof mapping.invert!=='boolean')throw Error('Invalid mapping direction.');
  if(controllerMixerTarget.test(mapping.target)){
    const button=/ (enable|menu)$/.test(mapping.target);
    if(button?(mapping.type!=='Note'||mapping.encoding!=='7-bit absolute'):(mapping.type!=='CC'||!['7-bit absolute','14-bit absolute'].includes(mapping.encoding)||(mapping.encoding==='14-bit absolute'&&mapping.number>31)))throw Error('Unsupported factory mixer/FX input encoding.');
  }else if(controllerPerformanceTarget.test(mapping.target)){
    if(mapping.type!=='Note'||mapping.encoding!=='7-bit absolute')throw Error('Controller performance actions need Note press/release.');
  }else if(['Library browse','Library fast browse'].includes(mapping.target)){
    if(mapping.type!=='CC'||!relative.includes(mapping.encoding))throw Error('Imported browse needs an explicit relative CC encoding.');
  }else if(mapping.target==='Crossfader'||continuous.test(mapping.target)){
    if(mapping.type!=='CC'||!['7-bit absolute','14-bit absolute'].includes(mapping.encoding)||(mapping.encoding==='14-bit absolute'&&mapping.number>31))throw Error('Continuous controls need a supported absolute CC/pair encoding.');
  }else if((!commands.test(mapping.target)&&!['Prepare add','Prepare open','Library backward'].includes(mapping.target))||mapping.type!=='Note'||mapping.encoding!=='7-bit absolute')throw Error('This catalog action has no supported adapter.');
  const conditions=validateControllerConditions(mapping.conditions);
  return {target:mapping.target,type:mapping.type,channel:mapping.channel,number:mapping.number,encoding:mapping.encoding,invert:!!mapping.invert,...(conditions?{conditions}:{})};
}
export function parseControllerCatalog(text,{kind='user',name=''}={}){
  if(typeof text!=='string'||new TextEncoder().encode(text).length>controllerCatalogMaxBytes)throw Error('Choose a catalog JSON of at most32MiB.');
  const catalog=JSON.parse(text);
  if(catalog?.format!==controllerCatalogFormat||!Array.isArray(catalog.profiles)||catalog.profiles.length>4096)throw Error('Choose an Open Play controller catalog produced by the mapping adapter.');
  if(!['user','alternative'].includes(kind))throw Error('Imported source claims cannot establish Official Serato provenance.');
  name=String(name).trim();if(kind==='alternative'&&(!name||name.length>160))throw Error('Name the alternative mapping source (at most160characters).');
  const stack=[[catalog,0]];let nodes=0;
  while(stack.length){const [value,depth]=stack.pop();if(++nodes>500000||depth>64)throw Error('Catalog nesting/node limit exceeded.');if(value&&typeof value==='object')for(const child of Object.values(value))stack.push([child,depth+1]);}
  const ids=new Set();
  for(const profile of catalog.profiles){
    if(!profile||!sha.test(profile.id)||profile.id!==profile.sourceSHA256||ids.has(profile.id))throw Error('Invalid or duplicate profile source identity.');
    ids.add(profile.id);
    if(typeof profile.name!=='string'||!profile.name||profile.name.length>256||!Array.isArray(profile.controls)||!Array.isArray(profile.mappings)||!Array.isArray(profile.issues))throw Error('Invalid controller profile.');
    profile.mappings.forEach(validateControllerMapping);
    // Retain the raw claim for review, without promoting its authority.
    if(profile.provenance&&!Object.hasOwn(profile,'importedProvenanceClaim'))profile.importedProvenanceClaim=profile.provenance;
    profile.provenance={kind,name:kind==='alternative'?name:''};
    delete profile.officialSourceVerified;
    profile.bindingRequired=true;profile.deviceMatch=null;profile.physicalCompatibilityVerified=false;
  }
  return catalog;
}
export function bindControllerProfile(profile,device,current){
  if(!device?.id||device.state!=='connected')throw Error('Select a connected MIDI input before applying this profile.');
  const result=[...current],added=[],conflicts=[],unchanged=[],seen=new Set();
  const runtime=m=>JSON.stringify({target:m.target,type:m.type||'CC',channel:m.channel,number:m.number,encoding:m.encoding,invert:!!m.invert,...(m.conditions?{conditions:m.conditions}:{})});
  const incoming=new Set(profile.mappings.map(m=>runtime(validateControllerMapping(m))));
  for(const source of profile.mappings){
    const next={...validateControllerMapping(source),deviceId:device.id,controllerProfile:profile.id,mappingSource:controllerSourceLabel(profile)};
    // Multiple cases/actions at one source address belong to one input graph.
    // Existing assignments still own their address; incoming siblings coexist.
    const same=old=>old.deviceId===device.id&&runtime(old)===runtime(next);
    if(current.some(same)){unchanged.push(source);continue;}
    const overlap=current.some(old=>(!old.deviceId||old.deviceId===device.id)&&(old.type||'CC')===next.type&&old.channel===next.channel&&(old.number===next.number||(next.type==='CC'&&(old.encoding==='14-bit absolute'||next.encoding==='14-bit absolute')&&old.number<64&&next.number<64&&old.number%32===next.number%32))&&!(verifiedProfiles.has(profile)&&old.controllerProfile===profile.id&&old.mappingSource==='Official Serato'&&incoming.has(runtime(old))));
    const identity=JSON.stringify(next);
    if(overlap)conflicts.push(source);else if(!seen.has(identity)){seen.add(identity);result.push(next);added.push(next);}
  }
  return {mappings:result,added,conflicts,unchanged};
}
export function createControllerCatalogStore({factory=globalThis.indexedDB,name='openplay-controller-catalog-v1'}={}){
  let opening=null;
  function open(){
    if(opening)return opening;
    opening=new Promise((resolve,reject)=>{
      if(!factory?.open){reject(Error('Controller catalog storage is unavailable.'));return;}
      let settled=false;const request=factory.open(name,1);
      const timer=setTimeout(()=>{settled=true;reject(Error('Controller catalog storage did not open.'));},5000);
      request.onupgradeneeded=()=>{if(settled){request.transaction.abort();return;}request.result.createObjectStore('catalogs',{keyPath:'id'});};
      request.onerror=()=>{clearTimeout(timer);reject(request.error);};
      request.onblocked=()=>{settled=true;clearTimeout(timer);reject(Error('Close another Open Play tab to open catalog storage.'));};
      request.onsuccess=()=>{clearTimeout(timer);if(settled){request.result.close();return;}settled=true;const db=request.result;db.onversionchange=()=>{db.close();opening=null;};resolve(db);};
    }).catch(error=>{opening=null;throw error;});return opening;
  }
  async function transaction(mode,run){const db=await open();return new Promise((resolve,reject)=>{
    let value;const tx=db.transaction('catalogs',mode);tx.oncomplete=()=>resolve(value);tx.onabort=()=>reject(tx.error||Error('Controller catalog transaction aborted.'));tx.onerror=()=>{};
    try{run(tx.objectStore('catalogs'),next=>{value=next;});}catch(error){tx.abort();reject(error);}
  });}
  return {
    async importText(text,source){
      const catalog=await attestControllerCatalog(parseControllerCatalog(text,source)),bytes=new TextEncoder().encode(text);
      const id=await sha256(bytes);
      // Different source labels do not overwrite an earlier import of these bytes.
      return transaction('readwrite',(store,set)=>{const get=store.get(id);get.onsuccess=()=>{if(get.result){set({record:get.result,duplicate:true});return;}const record={id,catalog,importedAt:new Date().toISOString()};store.add(record);set({record,duplicate:false});};});
    },
    async profiles(){
      const records=await transaction('readonly',(store,set)=>{const get=store.getAll();get.onsuccess=()=>set(get.result);});
      const unique=new Map();
      for(const record of records){
        // Recheck persisted data: IndexedDB clones do not retain trust stamps.
        const catalog=await attestControllerCatalog(parseControllerCatalog(JSON.stringify(record.catalog),record.catalog.profiles[0]?.provenance));
        for(const p of catalog.profiles){const previous=unique.get(p.id);const revision=profile=>verifiedProfiles.has(profile)?Number(/-v(\d+)$/.exec(profile.adapterVersion)?.[1]||0):0;if(!previous||revision(p)>revision(previous))unique.set(p.id,p);}
      }
      return [...unique.values()];
    },
  };
}
