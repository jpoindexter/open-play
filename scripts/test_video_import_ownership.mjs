// Executes current app.load + eject + panels.importKaraoke + engine.setStemSlip(off).
// Controlled audio import/buffer and UI adapters: no browser/File/Canvas proof.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const app=await readFile(new URL('../prototype/app.js',import.meta.url),'utf8');
const panels=await readFile(new URL('../prototype/panels.js',import.meta.url),'utf8');
const engine=await readFile(new URL('../prototype/engine.js',import.meta.url),'utf8');
function extract(source,start,end){const a=source.indexOf(start),b=source.indexOf(end,a);assert(a>=0&&b>a);return source.slice(a,b);}
const requestSource=extract(app,'const deckLoadRequests =','async function load(index,');
const loadSource=extract(app,'async function load(index,','\nasync function play(d)');
const ejectSource=extract(app,'async function deckAction(','\n  if (!d.track)')+'\n}';
const pairSource=extract(panels,'  async function importKaraoke(','\n  function video()');
const offSource=extract(engine,'  async setStemSlip(d, mode) {','\n  async stemSlipBuffers(');
function environment() {
 const original={id:'original',duration:10,bpm:120,cues:[],analyzed:true};
 const pair={...original,id:'pair'},newer={...original,id:'newer'};
 const deck={index:0,track:original,stemSlip:'vocal',playing:false,position:0,rate:1,videoLoadGeneration:0};
 const state={decks:[deck],settings:{},flip:{deck:-1}},notifications=[],calls={graphics:0,persist:0,buffers:[]};
 const runtime={rateOwners:new WeakMap(),stemSlipRateTokens:new Map(),voices:new Map(),stemSlipTracks:new Map(),cross:0,
  position:d=>d.position,pause:d=>{d.playing=false;},setCross(){},configureFX(){},buffer:async t=>{calls.buffers.push(t.id);}};
 // Real off branch sets mode synchronously but still returns an async Promise.
 runtime.setStemSlip=new Function('return ({'+offSource+'}).setStemSlip;')();
 const noop=()=>{},cancel={cancelDeck:noop},scope={state,trackById:id=>[original,pair,newer].find(t=>t.id===id),
  notify:text=>notifications.push(text),engine:runtime,pitchPlay:cancel,stemSlipControls:cancel,
  flipAutomation:{stop:noop},renderDecks:noop,drawWaves:noop,renderTracks:noop,enqueueAnalysis:noop,ensurePreparedStems:noop};
 const {load,deckAction}=new Function(...Object.keys(scope),requestSource+loadSource+ejectSource+';return {load,deckAction};')(...Object.values(scope));
 const importKaraoke=new Function('s','a','karaokeImportTokens','load','videoMixer','renderTracks','persist',pairSource+';return importKaraoke;')(
  state,{importFiles:async()=>[pair]},[0,0],load,{loadKaraoke:async()=>{calls.graphics++;}},noop,()=>calls.persist++);
 return {state,deck,original,pair,newer,calls,notifications,load,eject:()=>deckAction('eject',0),
  pairImport:()=>importKaraoke({index:0,audio:{name:'pair.mp3'},graphics:{name:'pair.cdg',size:48},transparency:'index',crop:false})};
}
const settle=p=>p.then(value=>({status:'fulfilled',value}),error=>({status:'rejected',message:error.message}));
const tests=[],test=(name,run)=>tests.push({name,run});
test('Older pair disarm cannot overwrite a later ordinary audio load (initial red regression)',async()=>{
 const e=environment(),pair=settle(e.pairImport());await Promise.resolve();assert.equal(e.deck.stemSlip,'off');assert.equal(e.deck.track,e.original);
 await e.load(0,e.newer.id);const outcome=await pair;
 assert.equal(e.deck.track,e.newer);assert.equal(e.deck.videoLoadGeneration,1);assert.equal(outcome.status,'rejected');assert.equal(e.calls.graphics,0);assert.equal(e.calls.persist,0);
 return {trackId:e.deck.track.id,pairOutcome:outcome};
});
test('Older ordinary disarm cannot overwrite a later ordinary audio load',async()=>{
 const e=environment(),old=e.load(0,e.pair.id);assert.equal(e.deck.stemSlip,'off');assert.equal(e.deck.track,e.original);await e.load(0,e.newer.id);await old;
 assert.equal(e.deck.track,e.newer);assert.equal(e.deck.videoLoadGeneration,1);assert.deepEqual(e.calls.buffers,['newer']);
});
test('Eject invalidates an older pair import suspended in disarm',async()=>{
 const e=environment(),pair=settle(e.pairImport());await Promise.resolve();await e.eject();const outcome=await pair;
 assert.equal(e.deck.track,null);assert.equal(e.deck.videoLoadGeneration,0);assert.equal(outcome.status,'rejected');assert.equal(e.calls.graphics,0);
});
test('Eject invalidates an older ordinary load suspended in disarm',async()=>{
 const e=environment(),old=e.load(0,e.pair.id);await e.eject();await old;assert.equal(e.deck.track,null);assert.equal(e.deck.position,0);assert.deepEqual(e.calls.buffers,[]);
});
test('An older eject suspended in disarm cannot erase a later ordinary audio load',async()=>{
 const e=environment(),old=e.eject();assert.equal(e.deck.stemSlip,'off');await e.load(0,e.newer.id);await old;
 assert.equal(e.deck.track,e.newer);assert.equal(e.deck.videoLoadGeneration,1);
});
test('Normal armed load retains requested position and increments video generation once',async()=>{
 const e=environment();await e.load(0,e.newer.id,{position:3});assert.equal(e.deck.track,e.newer);assert.equal(e.deck.position,3);assert.equal(e.deck.videoLoadGeneration,1);assert.equal(e.deck.stemSlip,'off');assert.equal(e.deck.playing,false);assert.deepEqual(e.calls.buffers,['newer']);
});
test('Normal armed MP3+CDG import still commits graphics and metadata',async()=>{
 const e=environment(),track=await e.pairImport();assert.equal(track,e.pair);assert.equal(e.deck.track,e.pair);assert.equal(e.deck.videoLoadGeneration,1);assert.equal(track.type,'MP3+G');assert.equal(e.calls.graphics,1);assert.equal(e.calls.persist,1);
});
test('Playing lock enabled during disarm prevents a resumed replacement',async()=>{
 const e=environment(),old=e.load(0,e.pair.id);e.deck.playing=true;e.state.settings['Lock Playing Deck']=true;await old;
 assert.equal(e.deck.track,e.original);assert.equal(e.deck.playing,true);assert.equal(e.deck.videoLoadGeneration,0);assert.equal(e.notifications.length,1);
});
test('Deck object replacement during disarm leaves the replacement owner intact',async()=>{
 const e=environment(),old=e.load(0,e.pair.id),replacement={...e.deck,track:e.newer};e.state.decks[0]=replacement;await old;
 assert.equal(e.state.decks[0],replacement);assert.equal(replacement.track,e.newer);assert.deepEqual(e.calls.buffers,[]);
});
test('Ordinary unarmed load and ordinary eject preserve their synchronous commit behavior',async()=>{
 const e=environment();e.deck.stemSlip='off';const loading=e.load(0,e.newer.id);assert.equal(e.deck.track,e.newer);await loading;const ejecting=e.eject();assert.equal(e.deck.track,null);await ejecting;assert.equal(e.deck.position,0);
});
const checks=[];for(const {name,run} of tests){try{checks.push({name,passed:true,evidence:await run()});}catch(error){checks.push({name,passed:false,error:error.stack});}}
const report={scope:'Executed extracted actual app.load/eject + panels.importKaraoke + engine.setStemSlip off with controlled UI/audio adapters. This does not establish browser import, File decode, Canvas capture or native acceptance.',
 sourceSHA256:createHash('sha256').update(requestSource+loadSource+ejectSource+pairSource+offSource).digest('hex'),
 passed:checks.filter(c=>c.passed).length,failed:checks.filter(c=>!c.passed).length,checks};
const output=JSON.stringify(report,null,2)+'\n';console.log(output);const outputIndex=process.argv.indexOf('--output');if(outputIndex>=0)await writeFile(process.argv[outputIndex+1],output);if(report.failed)process.exitCode=1;
