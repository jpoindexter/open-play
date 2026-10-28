import {settingsSchema,demoTracks} from './fixtures.js';
import {createBeatgrid} from './beatgrid.js';
import {validateDeckSession} from './deck-session.js';
import {ruleFields,ruleOperators} from './library.js';

const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const string=x=>typeof x==='string';
const bool=x=>typeof x==='boolean';
const number=x=>typeof x==='number'&&Number.isFinite(x);
const range=(min,max)=>x=>number(x)&&x>=min&&x<=max;
const list=check=>x=>Array.isArray(x)&&x.every(check);
const nullable=check=>x=>x===null||check(x);
const color=x=>string(x)&&/^#[\da-f]{6}$/i.test(x);
const nonnegative=range(0,Number.MAX_SAFE_INTEGER);
const check=(ok,path)=>{if(!ok)throw new TypeError(`Invalid library data: ${path}. Nothing was restored.`);};
function fields(value,spec,path){
  check(object(value),path);
  for(const [key,valid] of Object.entries(spec))if(Object.hasOwn(value,key))check(valid(value[key]),`${path}.${key}`);
  return value;
}
function required(value,spec,path){fields(value,spec,path);for(const key of Object.keys(spec))check(Object.hasOwn(value,key),`${path}.${key}`);return value;}
function safeJSON(value,path='library',depth=0){
  check(depth<80,path);
  if(value===null||string(value)||bool(value)||number(value))return;
  check(object(value)||Array.isArray(value),path);
  for(const [key,entry] of Object.entries(value)){
    check(!['__proto__','prototype','constructor'].includes(key),`${path}.${key}`);
    safeJSON(entry,`${path}.${key}`,depth+1);
  }
}
export const metadataFields=['title','artist','album','bpm','key','plays','rating','comment','color','cues','savedLoops','grid','gridMarkers','gridWarpMarkers','locked','flips','sampleGain','trackGainDb','autoGainSchema','autoGainOffsetDb','autoGainPendingDb','analysisResult','metadataSources','analysisGainDb','metadataRevision','stemJob','stemModel','stemBackend','inStemCrate'];
export function trackMetadata(track){return Object.fromEntries(metadataFields.filter(key=>track[key]!==undefined).map(key=>[key,track[key]]));}
export function createLibraryBackup({tracks,localTags={},crates,settings}){
  const tags=new Map();
  for(const [hash,metadata] of Object.entries(localTags))if(/^[a-f0-9]{64}$/.test(hash)){
    const id='local-'+hash;tags.set(id,{id,...trackMetadata(metadata)});
  }
  for(const track of tracks)tags.set(track.id,{id:track.id,...trackMetadata(track)});
  return {format:'open-play-prototype-1',crates,settings,tags:[...tags.values()]};
}
function analysis(value){
  if(value===null)return true;
  required(value,{duration:nonnegative,analyzedDuration:nonnegative,gain:object,warnings:list(string)},'analysis');
  fields(value,{bpm:nullable(nonnegative),key:nullable(string),partial:bool,tempo:nullable(object),keyEstimate:nullable(object),loudness:nullable(object)},'analysis');
  required(value.gain,{recommendedDb:nullable(number)},'analysis.gain');
  fields(value.gain,{rmsDbfs:nullable(number),samplePeakDbfs:nullable(number),clippedSamples:nonnegative},'analysis.gain');
  if(value.grid!==null&&value.grid!==undefined)required(value.grid,{firstBeat:number,beats:list(number)},'analysis.grid');
  for(const key of ['tempo','keyEstimate'])if(value[key])fields(value[key],{confidence:range(0,1)},`analysis.${key}`);
  if(value.loudness)fields(value.loudness,{integratedLUFS:nullable(number),channels:nonnegative,reason:nullable(string)},'analysis.loudness');
  return true;
}
export function validateMetadata(input,track={}){
  fields(input,{title:string,artist:string,album:string,key:string,comment:string,color,bpm:range(0,999),rating:range(0,5),plays:x=>Number.isSafeInteger(x)&&x>=0,grid:nullable(number),locked:bool,inStemCrate:bool,
    cues:list(nullable(object)),savedLoops:list(nullable(object)),gridMarkers:list(number),gridWarpMarkers:list(object),flips:list(nullable(object)),
    sampleGain:range(-24,24),trackGainDb:range(-24,24),autoGainSchema:x=>x===1,autoGainOffsetDb:range(-48,48),autoGainPendingDb:range(-24,24),analysisGainDb:nullable(number),metadataRevision:nonnegative,
    analysisResult:analysis,metadataSources:object,stemJob:nullable(string),stemModel:nullable(string),stemBackend:nullable(string)},'track');
  const limit=number(track.duration)?track.duration:Number.MAX_SAFE_INTEGER;
  for(const cue of input.cues||[])if(cue){required(cue,{position:range(0,limit)},'cue');fields(cue,{name:string,color},'cue');}
  for(const loop of input.savedLoops||[])if(loop){required(loop,{start:range(0,limit),end:range(0,limit)},'loop');check(loop.end>loop.start,'loop.end');fields(loop,{name:string,locked:bool},'loop');}
  for(const marker of input.gridWarpMarkers||[])required(marker,{time:range(0,limit),bpm:range(Number.MIN_VALUE,999)},'warp marker');
  const candidate={...track,...input};
  if(candidate.gridWarpMarkers?.length){check(number(candidate.grid)&&candidate.bpm>0,'warp grid');createBeatgrid(candidate);}
  for(const flip of input.flips||[])if(flip){
    required(flip,{events:list(object),duration:nonnegative},'flip');fields(flip,{name:string,trackId:string,loop:bool,snap:bool},'flip');
    for(const event of flip.events){required(event,{kind:string,offset:nonnegative},'flip event');fields(event,{position:range(0,limit),reverse:bool},'flip event');}
  }
  if(input.metadataSources)for(const source of Object.values(input.metadataSources))check(string(source),'metadata source');
  return trackMetadata(input);
}
export function validateSettings(input){
  check(object(input),'settings');const output={};
  for(const [name,type] of Object.values(settingsSchema).flat()){
    if(type==='section'||!Object.hasOwn(input,name))continue;
    // Existing Setup inputs saved numeric values as strings before validation existed.
    const raw=input[name],value=['range','number'].includes(type)&&string(raw)&&raw.trim()!==''?Number(raw):raw;check(Array.isArray(type)?type.includes(value):type==='check'?bool(value):type==='range'?range(0,100)(value):number(value),`settings.${name}`);output[name]=value;
  }
  if(Object.hasOwn(input,'Master Output Level')){check(range(-12,12)(input['Master Output Level']),'master level');output['Master Output Level']=input['Master Output Level'];}
  return output;
}
function crates(input){
  check(Array.isArray(input),'crates');const ids=new Set();
  for(const crate of input){
    required(crate,{id:string,name:string,tracks:list(string)},'crate');check(crate.id&&!ids.has(crate.id),'duplicate/empty crate id');ids.add(crate.id);
    fields(crate,{parent:nullable(string),smart:bool,live:bool,collapsed:bool,favorite:bool,color,cached:list(string),rules:list(object),match:x=>['all','any'].includes(x)},'crate');
    for(const rule of crate.rules||[])required(rule,{field:x=>Object.hasOwn(ruleFields,x),operator:x=>ruleOperators.includes(x),value:x=>string(x)||number(x)},'crate rule');
  }
  const byId=new Map(input.map(c=>[c.id,c]));
  for(const crate of input){const seen=new Set([crate.id]);let parent=crate.parent;while(parent){check(!seen.has(parent),'crate parent cycle');seen.add(parent);parent=byId.get(parent)?.parent;}}
  return input;
}
export function validateBackup(data,tracks=[]){
  safeJSON(data);check(object(data)&&data.format==='open-play-prototype-1','backup format');
  const result={crates:crates(data.crates),settings:validateSettings(data.settings??{}),tags:[]};
  check(Array.isArray(data.tags??[]),'backup tags');const ids=new Set();
  for(const tag of data.tags||[]){required(tag,{id:string},'tag');check(!ids.has(tag.id),'duplicate tag');ids.add(tag.id);const track=tracks.find(t=>t.id===tag.id)||tag;
    result.tags.push({id:tag.id,...validateMetadata(tag,track)});
  }
  return result;
}
function historyEvents(events){
  check(list(object)(events),'history');
  for(const event of events)required(event,{id:string,title:string,time:string,deck:range(1,4)},'history event');
}
export function validateSavedState(data){
  safeJSON(data);check(object(data),'saved session');const result={...data};
  if(data.deckSession!==undefined)validateDeckSession(data.deckSession);
  if(data.crates!==undefined)result.crates=crates(data.crates);
  if(data.settings!==undefined)result.settings=validateSettings(data.settings);
  for(const key of ['tags','localTags'])if(data[key]!==undefined){check(object(data[key]),key);result[key]=Object.fromEntries(Object.entries(data[key]).map(([id,tag])=>[id,validateMetadata(tag,key==='tags'?demoTracks.find(t=>t.id===id):undefined)]));}
  if(data.prepare!==undefined)check(list(string)(data.prepare),'prepare');
  if(data.history!==undefined)historyEvents(data.history);
  if(data.historySessions!==undefined){
    check(list(object)(data.historySessions),'history sessions');
    for(const session of data.historySessions){required(session,{time:string,entries:list(object)},'history session');historyEvents(session.entries);}
  }
  if(data.analysisSettings!==undefined){fields(data.analysisSettings,{onImport:bool,analyzeKey:bool,analyzeTempo:bool,minBpm:range(30,299),maxBpm:range(31,300),maxSeconds:range(1,86400)},'analysis settings');check((data.analysisSettings.minBpm??50)<(data.analysisSettings.maxBpm??220),'analysis BPM range');}
  if(data.mappings!==undefined){check(list(object)(data.mappings),'mappings');for(const m of data.mappings){required(m,{target:string,channel:range(1,16),number:range(0,127),encoding:string},'mapping');fields(m,{type:string,deviceId:string,conditions:list(object)},'mapping');}}
  if(data.fxBeatMultipliers!==undefined)check(list(range(Number.MIN_VALUE,64))(data.fxBeatMultipliers),'FX multipliers');
  // Video/FX have their own defensive normalizers; do not replace their compatibility rules.
  return result;
}
