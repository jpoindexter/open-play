import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto,createHash} from 'node:crypto';
import {validateBackup,validateMetadata,trackMetadata,createLibraryBackup} from './library-state.js';
import {createSessionStorage,sessionKey} from './session-storage.js';
import {snapshotDeckSession} from './deck-session.js';
import {newDeck} from './fixtures.js';
import {normalizeStemCrateTrack} from './stem-crate.js';

const app=fs.readFileSync(new URL('./app.js',import.meta.url),'utf8');
const panels=fs.readFileSync(new URL('./panels.js',import.meta.url),'utf8');
const section=(source,start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));
const bytes=new Uint8Array([1,2,3,4]),hash=createHash('sha256').update(bytes).digest('hex'),id='local-'+hash;
const file={name:'controlled.wav',size:bytes.length,arrayBuffer:async()=>bytes.slice().buffer};
const metadata={title:'Recovered song',cues:[{position:5,name:'Saved cue'}],savedLoops:[{start:7,end:9,name:'Saved loop'}]};

function recovery(tags=[{id,...metadata}]){
 const records=new Map(),owner=createSessionStorage({getItem:key=>records.get(key)??null,setItem:(key,value)=>records.set(key,value)});owner.load();
 const s={tracks:[],localTags:{},crates:[],settings:{},decks:Array.from({length:4},(_,i)=>newDeck(i)),deckCount:2,selected:'demo-0',samples:[],analysisSettings:{onImport:false},video:{},fxTempo:[],fxBeatMultipliers:[1,1],mappings:[],prepare:[],history:[],historySessions:[]};
 const nodes={},exports=[];
 const ctx=vm.createContext({validateBackup,validateMetadata,trackMetadata,createLibraryBackup,snapshotDeckSession,normalizeStemCrateTrack,crypto:webcrypto,
  s,state:s,sessionStorage:owner,$:id=>nodes[id]??={},trackById:id=>s.tracks.find(t=>t.id===id),a:{trackGain:{refresh(){}}},
  engine:{position:d=>d.position,buffer:async t=>{t.duration=20;return {duration:20};},setMonitorSettings(){},setMixerSettings(){}},
  snapshotVideoState:x=>x,normalizeFXTempoSettings:x=>x,updateSessionStatus(){},monitorState(){},mixerSettingsFromPreferences(){},refreshChannelFilters(){},applyEQBoost(){},renderCrates(){},renderTracks(){},renderDecks(){},notify(){},colors:['#abcdef'],saveLocalAudio:async t=>{t.storage='saved';return true;},download:(_name,value)=>exports.push(JSON.parse(value)),enqueueAnalysis(){throw Error('Unexpected analysis');}});
 vm.runInContext(section(app,'function sessionSnapshot(){','function dialog(').replace('export function persist','function persist'),ctx);
 vm.runInContext(section(panels,'$("#export-library").onclick = () =>','$("#find-duplicates").onclick'),ctx);
 vm.runInContext(section(app,'async function importLocalFiles(files) {','const analysisQueue = []'),ctx);
 const backup=app.match(/\n  backup:(.*),\n  recover:/)[1];
 const fallback=vm.runInContext(`(${backup})`,ctx);
 return {s,owner,records,nodes,exports,fallback,ctx,restore:()=>nodes['#restore-library'].onchange({target:{files:[{text:async()=>JSON.stringify({format:'open-play-prototype-1',crates:[{id:'recovery',name:'Recovery',tracks:[id]}],settings:{},tags})}]}})};
}

test('backup restore retains absent audio metadata through both exports, session reload and later import',async()=>{
 const run=recovery();await run.restore();
 assert.match(run.nodes['#library-tool-result'].textContent,/restored and saved/);
 const saved=run.owner.load();assert.deepEqual(saved.localTags[hash],metadata);
 run.nodes['#export-library'].onclick();
 for(const backup of [run.exports[0],run.fallback()])assert.deepEqual(validateBackup(JSON.parse(JSON.stringify(backup))).tags,[{id,...metadata}]);
 run.s.localTags=saved.localTags;
 const [track]=await run.ctx.importLocalFiles([file]);
 assert.equal(track.id,id);assert.equal(track.duration,20);assert.equal(track.title,metadata.title);
 assert.deepEqual(JSON.parse(JSON.stringify(track.cues)),metadata.cues);assert.deepEqual(JSON.parse(JSON.stringify(track.savedLoops)),metadata.savedLoops);
 assert.equal(run.owner.status().blocked,false);assert.deepEqual(run.owner.load().localTags[hash].cues,metadata.cues);
 run.s.localTags[hash]={...metadata,title:'Stale metadata'};track.title='Current edit';
 assert.equal(createLibraryBackup(run.s).tags.filter(tag=>tag.id===id).length,1);
 assert.equal(createLibraryBackup(run.s).tags.find(tag=>tag.id===id).title,'Current edit');
});

test('restored positions outside decoded duration still block saving and preserve the original record',async()=>{
 const run=recovery([{id,...metadata,cues:[{position:21}]}]);await run.restore();
 const original=run.records.get(sessionKey);await run.ctx.importLocalFiles([file]);
 assert.equal(run.owner.status().blocked,true);assert.match(run.owner.status().error,/cue.position/);
 assert.equal(run.records.get(sessionKey),original);
});
