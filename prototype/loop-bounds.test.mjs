import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {AudioEngine} from './engine.js';
test('invalid loop requests and starts preserve existing transport before any graph or ownership change',async()=>{
 const engine=new AudioEngine(),d={index:0,track:{duration:30},position:3,loop:false,loopIn:2,loopOut:6,playing:true},voice={};
 engine.voices.set(0,voice);let hooks=0;engine.onValidateTransport=()=>hooks++;
 for(const [start,end] of [[4,4],[6,2],[-1,2],[2,31],[NaN,4],[2,Infinity]]){
  const before={...d};await assert.rejects(engine.setLoop(d,true,start,end),RangeError);assert.deepEqual(d,before);assert.equal(engine.voices.get(0),voice);assert.equal(hooks,0);
 }
 Object.assign(d,{loop:true,loopIn:4,loopOut:4});await assert.rejects(engine.start(d),RangeError);assert.equal(engine.voices.get(0),voice);assert.equal(hooks,0);
 Object.assign(d,{playing:false,loop:false});engine.position=deck=>deck.position;engine.voices.clear();await engine.setLoop(d,true,2,6);assert.equal(d.loop,true);assert.equal(d.loopIn,2);assert.equal(d.loopOut,6);await engine.setLoop(d,false,2,6);assert.equal(d.loop,false);
});
test('track-end Loop rejects before Slip begins or the deck tree is replaced',async()=>{
 const source=readFileSync(new URL('./app.js',import.meta.url),'utf8'),controller=source.slice(source.indexOf('async function deckAction('),source.indexOf('\nlet importTail='));
 const engine=new AudioEngine(),d={index:0,track:{duration:30,bpm:120},loop:false,loopIn:0,loopOut:0};let slips=0,rebuilds=0;
 engine.position=()=>30;engine.beginSlip=()=>slips++;
 const scope={engine,state:{decks:[d]},quantized:(_d,p)=>p,autoLoopEnd:()=>30,renderDecks:()=>rebuilds++};vm.runInNewContext(controller+';globalThis.press=deckAction;',scope);
 await assert.rejects(scope.press('loop',0,{}),RangeError);assert.equal(slips,0);assert.equal(d.loop,false);assert.equal(rebuilds,0);
});
