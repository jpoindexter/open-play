import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {AudioEngine} from './engine.js';
import {createCueHolds} from './holds.js';

// Execute the real file-input handler; storage/UI collaborators record side effects.
async function restore(data,prepare=async()=>{}) {
  const source=fs.readFileSync(new URL('./panels.js',import.meta.url),'utf8');
  const begin=source.indexOf('$("#restore-library").onchange = async (e) => {');
  const end=source.indexOf('\n        };',begin)+11;
  const track={id:'one',title:'Original',cues:[],savedLoops:[],duration:200,bpm:120,grid:0};
  const s={tracks:[track],crates:[{id:'old',name:'Original',tracks:['one']}],settings:{'Quantize Value':'1 Beat','Master Output Level':-10,'Master Volume':75},decks:[],samples:[]};
  const nodes={},calls=[];
  let validation={};try{validation=await import('./library-state.js');}catch(error){if(error.code!=='ERR_MODULE_NOT_FOUND')throw error;}
  const engine=new AudioEngine();engine.setMasterDB(-10);engine.setMasterVolume(.75);
  Object.assign(engine,{setMonitorSettings(){},setMixerSettings(){}});
  const ctx={...validation,s,state:s,trackById:()=>track,$:id=>nodes[id]??={},a:{trackGain:{refresh(){}}},persist(){calls.push('save');return true;},renderCrates(){},renderTracks(){},renderDecks(){},notify(){},engine,monitorState(){},mixerSettingsFromPreferences(){},refreshChannelFilters(){},applyEQBoost(){},percent:(name,fallback)=>Number.isFinite(Number(s.settings[name]))?Math.max(0,Math.min(100,Number(s.settings[name])))/100:fallback};
  const app=fs.readFileSync(new URL('./app.js',import.meta.url),'utf8');
  vm.createContext(ctx);
  vm.runInContext(app.slice(app.indexOf('function setMasterOutput('),app.indexOf('\nconst trackGain=createTrackGain(')),ctx);
  Object.assign(ctx.a,{setMasterOutput:ctx.setMasterOutput,setMasterVolume:ctx.setMasterVolume});
  vm.runInContext(source.slice(begin,end),ctx);
  await prepare({s,engine});
  const before=JSON.stringify(s);
  await nodes['#restore-library'].onchange({target:{files:[{text:async()=>JSON.stringify(data)}]}});
  return {before,after:JSON.stringify(s),calls,message:nodes['#library-tool-result']?.textContent,masterDB:engine.masterDB,masterVolume:engine.masterVolume,readout:nodes['#master-level-value']?.textContent};
}
const backup=tags=>({format:'open-play-prototype-1',crates:[{id:'new',name:'Replacement',tracks:[]}],settings:{'Quantize Value':'1 Beat'},tags});
for(const [name,patch] of Object.entries({nullCues:{cues:null},badColor:{color:'" onpointerenter="bad'},badLoop:{savedLoops:[{start:5,end:2}]},badGrid:{gridWarpMarkers:[{time:4,bpm:0}]}}))test(`invalid ${name} leaves live state and persistence untouched`,async()=>{
  const result=await restore(backup([{id:'one',...patch}]));
  assert.equal(result.after,result.before);assert.deepEqual(result.calls,[]);assert.match(result.message,/invalid/i);
});
test('invalid preference cannot partially replace crates',async()=>{
  const data=backup([]);data.settings['Quantize Value']=1;
  const result=await restore(data);assert.equal(result.after,result.before);assert.deepEqual(result.calls,[]);
});
test('valid older backup restores metadata',async()=>{
  const result=await restore(backup([{id:'one',title:'Restored',cues:[{position:4,name:'Cue'}],savedLoops:[],color:'#abcdef'}]));
  assert.match(result.after,/Restored/);assert.deepEqual(result.calls,['save']);
  assert.equal(result.masterDB,-10);assert.equal(result.masterVolume,.75);
});
test('backup applies restored master gains and readout before one durable save',async()=>{
  const data=backup([]);Object.assign(data.settings,{'Master Output Level':-6,'Master Volume':50});
  const result=await restore(data);
  assert.equal(result.masterDB,-6,'Restored master setting must reach the current engine');
  assert.equal(result.masterVolume,.5,'Restored volume must reach the current engine');
  assert.equal(result.readout,'-6.0dB · 50%');assert.deepEqual(result.calls,['save']);
});
test('backup restore refuses temporary Cue still preparing before any playback or save',async t=>{
  let open,entered,engine,deck,holds,audition,token;
  const gate=new Promise(resolve=>open=resolve),ready=new Promise(resolve=>entered=resolve);
  t.after(async()=>{if(holds){holds.cancelDeck(deck);engine.pause(deck);}open();await audition;if(deck){assert.equal(deck.processing,false);assert.equal(deck.playing,false);assert.equal(engine.voices.size,0);}});
  const result=await restore(backup([{id:'one',title:'Unexpected replacement'}]),async fixture=>{
    engine=fixture.engine;
    deck={index:0,track:fixture.s.tracks[0],position:2,cue:2,rate:1,mode:'INT',playing:false};fixture.s.decks=[deck];
    engine.ctx={currentTime:1};engine.nodes=[{deckInput:{gain:{setTargetAtTime(){}}}}];
    engine.resume=async()=>{entered();await gate;};
    holds=createCueHolds({engine,state:fixture.s,quantized:(_,p)=>p,record(){},persist(){},render(){},notify:message=>assert.fail(message)});
    audition=holds.press('cue',deck);await ready;
    token=engine.startTokens.get(0);
    assert.equal(deck.processing,true);assert.equal(deck.playing,false);assert(!deck.playQueued);
  });
  assert.equal(result.after,result.before,'Preparing Cue must prevent restoration changing session state');
  assert.deepEqual(result.calls,[]);assert.match(result.message,/prepar|pause/i);
  assert.equal(deck.processing,true);assert.equal(engine.startTokens.get(0),token,'Rejected restore must retain the pending Cue owner');
});
