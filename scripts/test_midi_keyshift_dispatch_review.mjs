// Independent controlled review. Executes extracted actual app/dispatcher code
// and AudioEngine.setPitch with bounded collaborators, never GUI or audio output.
// Initial output is immutable; pass a new explicit output path for every rerun.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {AudioEngine} from '../prototype/engine.js';
import {mappedValue,keyShiftSemitones,decodeMIDI,matchesMIDIMap} from '../prototype/midi.js';

const output=process.argv[2]||'docs/prototype/midi-keyshift-dispatch-review-initial-results.json';
if(fs.existsSync(output))throw Error('Preserve prior evidence; choose a new output path: '+output);
const appSource=fs.readFileSync('prototype/app.js','utf8');
const panels=fs.readFileSync('prototype/panels.js','utf8');
const receiveStart=panels.indexOf('  async function receiveMIDI(');
const receiveSource=panels.slice(receiveStart,panels.indexOf('  const midiInput =',receiveStart));
assert(receiveStart>=0&&receiveSource.includes('keyShiftSemitones'));
const helperStart=appSource.indexOf('async function setDeckKeyShift(');
const loadTail='\n  renderTracks();\n}';
const regionStart=appSource.lastIndexOf(loadTail,helperStart);
assert(regionStart>=0&&helperStart>=0,'Actual app helper boundary changed; inspect host extraction');
const helperRegion=appSource.slice(regionStart+loadTail.length,appSource.indexOf('async function play(',helperStart));

const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
const message=(number,value,channel=1)=>({...decodeMIDI([0xb0+channel-1,number,value]),timestamp:0,device:'controlled',synthetic:false});
const mapping=(target='Deck 1 key shift',number=16,encoding='Relative two’s complement')=>({target,channel:1,number,type:'CC',encoding});
function host({pending=null,mode='off',track={id:'owned'},mappings=[mapping()]}={}){
  const state={decks:Array.from({length:4},(_,index)=>({index,keyShift:0,keylock:false,keySync:false,stemSlip:index===0?mode:'off',track:index===0?track:{id:'owned-'+index},playing:false,processing:false})),mappings,midiLog:[],selected:'a'};
  const engine=Object.create(AudioEngine.prototype);
  engine.voices=new Map();engine.stemSlipPending=new Map(pending?[[0,{committing:true,promise:pending.promise}]]:[]);
  engine.cancelDeckScratchRequest=()=>{};
  let starts=0,persists=0,renders=0,trackRenders=0;
  engine.pause=d=>{d.playing=false;d.processing=false;};
  engine.start=async d=>{starts++;d.playing=true;};
  const helper=new Function('state','engine','deckScratchControls','pitchPlay','persist','renderDecks',helperRegion+
    '\nreturn {setDeckKeyShift,keyShiftIntent:typeof keyShiftIntent==="function"?keyShiftIntent:index=>state.decks[index].keyShift||0};')(
      state,engine,{cancelDeck(){}},{cancelDeck(){}},()=>persists++,()=>renders++);
  const actions={...helper,filtered:()=>[{id:'a'},{id:'b'},{id:'c'}]};
  const receive=new Function('s','mappedValue','keyShiftSemitones','midiPairs','a','$','engine','renderTracks','matchesMIDIMap',
    'let learn=false,learnedType="CC";'+receiveSource+'\nreturn receiveMIDI;')(
      state,mappedValue,keyShiftSemitones,new Map(),actions,()=>null,engine,()=>trackRenders++,matchesMIDIMap);
  return{state,engine,receive,...helper,counts:()=>({starts,persists,renders,trackRenders})};
}
const checks=[];
async function check(name,run){const evidence={};try{await run(evidence);checks.push({name,passed:true,evidence});}catch(error){checks.push({name,passed:false,evidence,error:error.message,stack:error.stack});}}

await check('Two relative increments survive actual engine pending Stem Slip commit',async e=>{
  const pending=deferred(),h=host({pending,mode:'vocal'}),d=h.state.decks[0];
  const a=h.receive(message(16,1)),b=h.receive(message(16,1));
  e.beforeCommit={actual:d.keyShift,intent:h.keyShiftIntent(0)};
  h.engine.stemSlipPending.delete(0);pending.resolve();await Promise.all([a,b]);
  e.final={actual:d.keyShift,intent:h.keyShiftIntent(0)};
  assert.equal(d.keyShift,2,'Two +1 messages must not collapse to one');
});
await check('Relative direction reversal during pending commit preserves net zero',async e=>{
  const pending=deferred(),h=host({pending,mode:'vocal'});
  const a=h.receive(message(16,1)),b=h.receive(message(16,127));
  h.engine.stemSlipPending.delete(0);pending.resolve();await Promise.all([a,b]);
  e.actual=h.state.decks[0].keyShift;assert.equal(e.actual,0);
});
await check('Unrelated CC80 andCC112 cannot alter a paired14bit CC16/48 mapping',async e=>{
  const h=host({mappings:[mapping('Deck 1 key shift',16,'14-bit absolute')]});
  await h.receive(message(16,1));e.afterMSB=h.state.decks[0].keyShift;e.beforeCounts=h.counts();
  await h.receive(message(80,127));e.afterCC80=h.state.decks[0].keyShift;
  await h.receive(message(112,0));e.afterCC112=h.state.decks[0].keyShift;e.afterCounts=h.counts();
  assert.equal(e.afterCC80,e.afterMSB,'CC80 is not the LSB for CC16');
  assert.equal(e.afterCC112,e.afterMSB,'CC112 is not the LSB for CC16');
  assert.equal(e.afterCounts.persists,e.beforeCounts.persists,'Unrelated CC must not dispatch at all');
});
await check('Legitimate14bit MSB16 andLSB48 both update the paired absolute target',async e=>{
  const h=host({mappings:[mapping('Deck 1 key shift',16,'14-bit absolute')]});
  await h.receive(message(16,1));const msb=h.state.decks[0].keyShift;
  await h.receive(message(48,127));const lsb=h.state.decks[0].keyShift;
  e.values=[msb,lsb];assert.deepEqual(e.values,[-24,-23]);
});
await check('Note-off and zero-velocity note do not dispatch pitch or cancel transport',async e=>{
  const h=host({mappings:[{...mapping('Deck 1 key shift',60,'7-bit absolute'),type:'Note'}]});
  h.state.decks[0].keyShift=7;const before=h.counts();
  for(const bytes of [[0x80,60,20],[0x90,60,0]])await h.receive({...decodeMIDI(bytes),timestamp:0,device:'controlled'});
  e.actual=h.state.decks[0].keyShift;e.counts=h.counts();assert.equal(e.actual,7);assert.equal(e.counts.persists,before.persists);
});
await check('Older request completion cannot discard newer same-track desired owner',async e=>{
  const old=deferred(),next=deferred(),h=host({pending:old,mode:'vocal'}),d=h.state.decks[0];
  const first=h.receive(message(16,1));
  // A user mode change replaces an in-flight commit on the same loaded track.
  d.stemSlip='instrumental';h.engine.stemSlipPending.set(0,{committing:true,promise:next.promise});
  const second=h.receive(message(16,1));old.resolve();await first;
  e.afterOlderCompletion={actual:d.keyShift,intent:h.keyShiftIntent(0)};
  const third=h.receive(message(16,1));h.engine.stemSlipPending.delete(0);next.resolve();await Promise.all([second,third]);
  e.final={actual:d.keyShift,intent:h.keyShiftIntent(0)};
  assert.equal(e.afterOlderCompletion.intent,2,'Old finally must not clear newer desired state');assert.equal(d.keyShift,3);
});
await check('Track replacement and newer GUI pitch survive stale MIDI completion',async e=>{
  const pending=deferred(),h=host({pending,mode:'vocal'}),d=h.state.decks[0];
  const old=h.receive(message(16,1));d.track={id:'replacement'};d.stemSlip='off';d.keyShift=0;
  await h.setDeckKeyShift(0,5);pending.resolve();await old;
  e.track=d.track.id;e.actual=d.keyShift;e.intent=h.keyShiftIntent(0);e.counts=h.counts();
  assert.equal(d.track.id,'replacement');assert.equal(d.keyShift,5);assert.equal(e.intent,5);assert.equal(e.counts.starts,0);
});
await check('Rejected pending operations discard desired intent without inventing engine rollback',async e=>{
  const pending=deferred(),h=host({pending,mode:'vocal'}),d=h.state.decks[0];
  const a=h.receive(message(16,1)),b=h.setDeckKeyShift(0,5);
  const settled=Promise.allSettled([a,b]);pending.reject(Error('controlled failed commit'));const outcomes=await settled;e.results=outcomes.map(x=>x.status);e.reasons=outcomes.map(x=>x.reason?.message);
  e.actual=d.keyShift;e.intent=h.keyShiftIntent(0);
  assert.deepEqual(e.results,['rejected','rejected']);assert.deepEqual(e.reasons,['controlled failed commit','controlled failed commit']);assert.equal(e.actual,0);assert.equal(e.intent,e.actual);
});
await check('Unloaded deck receives a bounded pitch setting without starting playback',async e=>{
  const h=host({track:null,mappings:[mapping('Deck 1 key shift',16,'7-bit absolute')]});
  await h.receive(message(16,96));e.actual=h.state.decks[0].keyShift;e.track=h.state.decks[0].track;e.counts=h.counts();
  assert.equal(e.actual,12);assert.equal(e.track,null);assert.equal(e.counts.starts,0);
});
await check('Existing relative browse mapping remains independent and unchanged',async e=>{
  const h=host({mappings:[mapping('Library browse',1),mapping()]});const before=JSON.stringify(h.state.mappings);
  await h.receive(message(1,1));e.selected=h.state.selected;e.pitch=h.state.decks.map(d=>d.keyShift);
  assert.equal(e.selected,'b');assert.deepEqual(e.pitch,[0,0,0,0]);assert.equal(JSON.stringify(h.state.mappings),before);
});
await check('Four-deck app routes requested Deck3 andDeck4 Key Shift to those decks only',async e=>{
  const h=host({mappings:[mapping('Deck 3 key shift',18,'7-bit absolute'),mapping('Deck 4 key shift',19,'7-bit absolute')]});
  await h.receive(message(18,96));await h.receive(message(19,32));e.pitch=h.state.decks.map(d=>d.keyShift);
  assert.deepEqual(e.pitch,[0,0,12,-12]);
});

const files=['prototype/midi.js','prototype/app.js','prototype/panels.js','prototype/engine.js','prototype/midi-keyshift-harness.js'];
const result={date:'2026-10-17',scope:'Actual extracted MIDI dispatch and app helper region plus actual AudioEngine.setPitch method. Controlled pending commits, track changes and no-audio collaborators. No real WebAudio/WASM, GUI, persistence store, hardware or reference acceptance.',passed:checks.filter(x=>x.passed).length,failed:checks.filter(x=>!x.passed).length,checks,sourceHashes:Object.fromEntries(files.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]))};
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({output,...result},null,2));if(result.failed)process.exitCode=1;
