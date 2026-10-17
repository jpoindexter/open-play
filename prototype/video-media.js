// Original selection policy only. No decoding, object URLs, filesystem access,
// playback, fader movement or vendor-runtime equivalence is implied.
const evidence = 'docs/research/VIDEO_REMAINING_WORKFLOWS.md';
const fallbackExtensions = Object.freeze(['mp4','m4v','webm','ogv','ogg','mov','avi','mpg','mpeg','wmv','mkv','3gp','flv','divx']);
const families = Object.freeze([
  Object.freeze({name:'mp4',extensions:Object.freeze(['mp4','m4v']),mime:Object.freeze(['video/mp4','video/x-m4v'])}),
  Object.freeze({name:'webm',extensions:Object.freeze(['webm']),mime:Object.freeze(['video/webm'])}),
  Object.freeze({name:'ogg-video',extensions:Object.freeze(['ogv','ogg']),mime:Object.freeze(['video/ogg','application/ogg'])}),
  Object.freeze({name:'quicktime',extensions:Object.freeze(['mov']),mime:Object.freeze(['video/quicktime'])}),
]);
export const videoMediaPolicy = Object.freeze({
  evidence,referenceRuntimeVerified:false,
  documented:'Enabled Media Crate supplies visuals for audio lacking associated video. Recovered official Video manual141226 p12 says explicit Next advances in crate order even when Random is enabled; automatic track-load selection may remain Random. Historical manual, not current runtime equivalence.',
  manualEvidence:'docs/research/video-manual-gaps.json VMG-010; official141226 PDF2015-04-09, SHA25685c57756dc96587b7b4822e2911decb4b9202f5a1d6b1cba047e1159236ae66c',
  supersededIndependentPolicy:'Before the recovered manual, Random also governed explicit Next. Prior random-Next passes established that independent behavior only. This source conflict supersedes that policy without erasing historical runs or claiming4.0.10 runtime parity.',
  independent:'Explicit valid association wins even when fallback is off. Ordered shared cursor wraps; explicit Next always advances that cursor in crate order without consuming randomness. Automatic track-load resolution retains Random and excludes that track’s current fallback when multiple candidates exist. Each track caches fallback until advance, association change or asset removal; exact reference shared-cursor/wrap rules remain unverified.',
  clipEnd:'Selection never auto-advances at clip end. Caller owns loop/hold/transport and decode/error UI; no end-of-clip behavior is inferred from track-load fallback.',
  recognizedFamilies:families,extensionHints:fallbackExtensions,
  validation:'Real named Blob/File with video/* MIME, or a recognized video extension when MIME is absent, generic or conflicting. Contradictions produce asset warnings rather than codec/product gates. Clearly nonvideo files without video evidence are rejected. Metadata eligibility only: actual mixer decoding is authoritative. Whole add batch validates before mutation; duplicate File references remain distinct explicitly added entries.',
  ownership:'Assets hold original immutable Blob/File byte references. No URLs are created. Removing one track association never disposes shared bytes; remove/dispose drops library references only. No arbitrary asset/track/transaction count cap.',
});
export const videoTransitionSelectionPolicy = Object.freeze({
  evidence,referenceRuntimeVerified:false,
  documented:'Historical official guidance documents sequential automatic transition selection on track load, optional Random, and manual Next. Selection is distinct from crossfader motion.',
  independent:'Initial selection is the catalog Crossfade baseline if present, otherwise its first entry. Sequential Next wraps; Random excludes current when more than one entry exists. Manual Next works while automatic selection is off. A logical transaction is consumed once even if automatic selection was off at observation; enabling later does not replay it.',
  clipEnd:'No clip-end event or automatic fader motion exists in this selector.',
  candidateStatus:'Counts derive only from caller-supplied catalog provenance/candidate/baseline metadata. Localization candidates are not verified reference menu entries.',
});

function identifier(value,label) {
  if ((typeof value==='string' && value.length>0) || (typeof value==='number' && Number.isFinite(value))) return value;
  throw new TypeError(`${label} must be a nonempty string or finite number.`);
}
function configuration(input={}) {
  if(!input || typeof input!=='object' || Array.isArray(input))throw new TypeError('Selection configuration must be an object.');
  for(const key of ['enabled','random'])if(input[key]!==undefined&&typeof input[key]!=='boolean')throw new TypeError(`${key} must be boolean.`);
  return input;
}
function randomIndex(random,count) {
  const value=random();
  if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>=1)throw new RangeError('Random source must return a finite number in [0,1).');
  return Math.floor(value*count);
}
function checkRandom(random){if(typeof random!=='function')throw new TypeError('random must be a function.');}
function metadata(file) {
  // slice performs the platform Blob brand check, including cross-realm Blobs;
  // duck-typed mutable objects do not qualify as immutable byte storage.
  try {Blob.prototype.slice.call(file,0,0);}catch{throw new TypeError('Video media must contain real named Blob/File objects.');}
  if(typeof file.name!=='string'||!file.name.trim())throw new TypeError('Video media needs a nonempty filename.');
  const extension=/\.([^.]+)$/.exec(file.name)?.[1].toLowerCase(), family=families.find(f=>f.extensions.includes(extension));
  const mime=typeof file.type==='string'?file.type.split(';')[0].trim().toLowerCase():'';
  const videoMime=mime.startsWith('video/'),knownExtension=fallbackExtensions.includes(extension),warnings=[];
  if(!videoMime&&!knownExtension)throw new TypeError(`No video metadata evidence for ${file.name}. Actual decoding remains caller-owned.`);
  if(videoMime&&!knownExtension)warnings.push('Video MIME accepted despite an unrecognized filename extension; decoding is not established.');
  if(knownExtension&&mime&&mime!=='application/octet-stream'&&!videoMime&&mime!=='application/ogg')
    warnings.push('Filename suggests video but MIME conflicts; accepted as a candidate pending actual decode.');
  if(videoMime&&family&&!family.mime.includes(mime))warnings.push('Video MIME and recognized extension family differ; actual decode is authoritative.');
  return {name:file.name,family:family?.name??null,warnings:Object.freeze(warnings)};
}

export function createVideoMediaLibrary({random=Math.random}={}) {
  checkRandom(random);
  const entries=[],associations=new Map(),resolved=new Map();
  let enabled=false,randomMode=false,cursor=-1,lastSelected=null,serial=0,disposed=false;
  const live=()=>{if(disposed)throw new Error('Video media library was disposed.');};
  const find=id=>entries.find(entry=>entry.id===id);
  const result=(asset,kind,reason)=>Object.freeze({asset,kind,reason});
  function choose(excludeId,ordered=false) {
    if(randomMode&&!ordered){const candidates=entries.length>1?entries.filter(e=>e.id!==excludeId):entries;
      const selected=candidates[randomIndex(random,candidates.length)];cursor=entries.indexOf(selected);return selected;}
    cursor=(cursor+1)%entries.length;return entries[cursor];
  }
  function selection(trackId,advance,ordered) {
    live();identifier(trackId,'trackId');
    if(typeof advance!=='boolean')throw new TypeError('advance must be boolean.');
    const associated=find(associations.get(trackId));
    if(associated)return result(associated,'associated','explicit-association');
    if(!enabled)return result(null,'none','fallback-disabled');
    if(!entries.length)return result(null,'none','empty-library');
    const cached=resolved.get(trackId);
    if(cached&&!advance)return cached;
    const asset=choose(cached?.asset.id??lastSelected,ordered);lastSelected=asset.id;
    const selected=result(asset,'fallback','fallback-enabled-without-association');resolved.set(trackId,selected);return selected;
  }
  function resolve(trackId,{advance=false}={}){return selection(trackId,advance,false);}
  return {
    add(files) {
      live();if(!files||typeof files==='string'||typeof files[Symbol.iterator]!=='function')throw new TypeError('add needs an iterable of named Blob/File objects.');
      const batch=Array.from(files),details=batch.map(metadata);
      const added=batch.map((file,i)=>Object.freeze({id:`video-media:${++serial}`,name:details[i].name,file,warnings:details[i].warnings}));
      for(const asset of added)entries.push(asset);return added;
    },
    assets(){live();return entries.slice();},
    remove(id){
      live();const index=entries.findIndex(e=>e.id===id);if(index<0)return false;
      entries.splice(index,1);if(index<=cursor)cursor--;if(lastSelected===id)lastSelected=null;
      for(const [track,assetId] of associations)if(assetId===id)associations.delete(track);
      for(const [track,selected] of resolved)if(selected.asset.id===id)resolved.delete(track);
      return true;
    },
    associate(trackId,id){
      live();identifier(trackId,'trackId');if(id!==null&&!find(id))throw new RangeError('Associated video asset is not in this library.');
      if(id===null){if(associations.delete(trackId))resolved.delete(trackId);return null;}
      if(associations.get(trackId)!==id){associations.set(trackId,id);resolved.delete(trackId);}return id;
    },
    association(trackId){live();identifier(trackId,'trackId');return associations.get(trackId)??null;},
    resolve,
    next(trackId){return selection(trackId,true,true);},
    configure(input={}){live();const next=configuration(input);if(next.enabled!==undefined)enabled=next.enabled;if(next.random!==undefined)randomMode=next.random;return {enabled,random:randomMode};},
    diagnostics(){return {disposed,enabled,random:randomMode,assetCount:entries.length,associationCount:associations.size,resolvedTrackCount:resolved.size,cursor,lastSelectedAssetId:lastSelected,policy:videoMediaPolicy};},
    dispose(){if(disposed)return;disposed=true;entries.length=0;associations.clear();resolved.clear();cursor=-1;lastSelected=null;},
  };
}

export function createVideoTransitionSelector(catalog,{random=Math.random}={}) {
  checkRandom(random);
  if(!Array.isArray(catalog))throw new TypeError('Transition catalog must be an array.');
  const entries=catalog.map(entry=>{
    if(!entry||typeof entry!=='object'||typeof entry.name!=='string'||!entry.name)throw new TypeError('Every transition needs a nonempty name.');
    return Object.freeze({name:entry.name,provenance:entry.provenance??null,candidate:entry.candidate===true,baseline:entry.baseline===true});
  });
  const names=entries.map(e=>e.name);if(new Set(names).size!==names.length)throw new TypeError('Transition names must be unique.');
  let selected=names.includes('Crossfade')?'Crossfade':names[0]??null,enabled=false,randomMode=false,disposed=false,automaticSelections=0;
  const seen=new Set(),live=()=>{if(disposed)throw new Error('Video transition selector was disposed.');};
  function next(){
    live();if(!names.length)return null;
    if(randomMode){const candidates=names.length>1?names.filter(name=>name!==selected):names;selected=candidates[randomIndex(random,candidates.length)];}
    else selected=names[(names.indexOf(selected)+1)%names.length];
    return selected;
  }
  return {
    configure(input={}){live();const value=configuration(input);if(value.enabled!==undefined)enabled=value.enabled;if(value.random!==undefined)randomMode=value.random;return {enabled,random:randomMode};},
    current(){live();return selected;},next,
    select(name){live();if(!names.includes(name))throw new RangeError('Unknown transition name.');selected=name;return selected;},
    onTrackLoad(transactionId){
      live();identifier(transactionId,'transactionId');if(seen.has(transactionId))return selected;
      // Mark after successful selection: a broken random provider can be fixed
      // and retried without silently consuming the logical load.
      if(enabled&&names.length){next();automaticSelections++;}seen.add(transactionId);return selected;
    },
    diagnostics(){return {disposed,enabled,random:randomMode,current:selected,catalogCount:entries.length,
      manifestCount:entries.filter(e=>e.provenance==='manifest').length,candidateCount:entries.filter(e=>e.candidate).length,
      baselineCount:entries.filter(e=>e.baseline).length,observedTransactions:seen.size,automaticSelections,policy:videoTransitionSelectionPolicy};},
    dispose(){if(disposed)return;disposed=true;seen.clear();selected=null;},
  };
}
