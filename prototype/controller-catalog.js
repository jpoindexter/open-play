// Mapping catalogs are local data. No controller scripts, native code or SysEx
// are evaluated. Source provenance and physical compatibility are separate.
export const controllerCatalogFormat='open-play-controller-catalog-v1';
export const controllerCatalogMaxBytes=32*1024*1024;
const sha=/^[a-f0-9]{64}$/;
const commands=/^Deck [1-4] (play|load|cue|sync|sync off|loop|hot cue [1-8])$/;
const relative=['Relative two’s complement','Relative offset'];
// Populate only from reviewed recovery evidence, never an imported claim.
const officialSourceHashes=new Set();
export function controllerSourceLabel(profile){
  if(officialSourceHashes.has(profile.sourceSHA256))return 'Official Serato';
  return profile.provenance?.kind==='alternative'
    ?`Alternative mapping — ${profile.provenance.name}`:'User mapping';
}
export function validateControllerMapping(mapping){
  const fields=['target','type','channel','number','encoding','invert','sourceControlIndex','sourceAction'];
  if(!mapping||Object.keys(mapping).some(key=>!fields.includes(key)))throw Error('Mapping has unsupported options; keep it inactive until an adapter handles them.');
  if(!Number.isInteger(mapping.channel)||mapping.channel<1||mapping.channel>16||!Number.isInteger(mapping.number)||mapping.number<0||mapping.number>127)throw Error('Invalid MIDI channel or controller number.');
  if(mapping.invert!==undefined&&typeof mapping.invert!=='boolean')throw Error('Invalid mapping direction.');
  if(mapping.target==='Library browse'){
    if(mapping.type!=='CC'||!relative.includes(mapping.encoding))throw Error('Imported browse needs an explicit relative CC encoding.');
  }else if(!commands.test(mapping.target)||mapping.type!=='Note'||mapping.encoding!=='7-bit absolute')throw Error('This catalog action has no supported unconditional adapter.');
  return {target:mapping.target,type:mapping.type,channel:mapping.channel,number:mapping.number,encoding:mapping.encoding,invert:!!mapping.invert};
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
    if(profile.provenance)profile.importedProvenanceClaim=profile.provenance;
    profile.provenance={kind,name:kind==='alternative'?name:''};
    profile.bindingRequired=true;profile.deviceMatch=null;profile.physicalCompatibilityVerified=false;
  }
  return catalog;
}
export function bindControllerProfile(profile,device,current){
  if(!device?.id||device.state!=='connected')throw Error('Select a connected MIDI input before applying this profile.');
  const result=[...current],added=[],conflicts=[];
  for(const source of profile.mappings){
    const next={...validateControllerMapping(source),deviceId:device.id,controllerProfile:profile.id,mappingSource:controllerSourceLabel(profile)};
    const overlap=result.some(old=>(!old.deviceId||old.deviceId===device.id)&&(old.type||'CC')===next.type&&old.channel===next.channel&&(old.number===next.number||(old.type==='CC'&&old.encoding==='14-bit absolute'&&old.number<64&&next.number<64&&old.number%32===next.number%32)));
    if(overlap)conflicts.push(source);else{result.push(next);added.push(next);}
  }
  return {mappings:result,added,conflicts};
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
      const catalog=parseControllerCatalog(text,source),bytes=new TextEncoder().encode(text);
      const id=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
      // Different source labels do not overwrite an earlier import of these bytes.
      return transaction('readwrite',(store,set)=>{const get=store.get(id);get.onsuccess=()=>{if(get.result){set({record:get.result,duplicate:true});return;}const record={id,catalog,importedAt:new Date().toISOString()};store.add(record);set({record,duplicate:false});};});
    },
    async profiles(){return transaction('readonly',(store,set)=>{const get=store.getAll();get.onsuccess=()=>{const unique=new Map();for(const record of get.result)for(const p of record.catalog.profiles)if(!unique.has(p.id))unique.set(p.id,p);set([...unique.values()]);};});},
  };
}
