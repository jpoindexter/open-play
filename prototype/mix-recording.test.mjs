import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioEngine} from './engine.js';

function fixture(t){
 const oldWindow=globalThis.window,oldRecorder=globalThis.MediaRecorder,instances=[];
 class Recorder{
  static isTypeSupported(){return true;}
  constructor(){this.mimeType='audio/webm;codecs=opus';this.state='inactive';this.stopCalls=0;instances.push(this);}
  start(){this.state='recording';}
  stop(){
   if(this.state==='inactive')throw new DOMException('Recorder is inactive','InvalidStateError');
   this.stopCalls++;this.state='inactive';
  }
  finish(text){this.ondataavailable({data:new Blob([text])});this.onstop();}
 }
 globalThis.window={MediaRecorder:Recorder};globalThis.MediaRecorder=Recorder;
 t.after(()=>{if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;
  if(oldRecorder===undefined)delete globalThis.MediaRecorder;else globalThis.MediaRecorder=oldRecorder;});
 const engine=new AudioEngine();engine.ctx={currentTime:12};engine.destination={stream:{}};engine.resume=async()=>{};
 return {engine,instances};
}

test('rapid Start shares one recorder while audio resume is pending',async t=>{
 const {engine,instances}=fixture(t);let resume;
 const ready=new Promise(resolve=>resume=resolve);engine.resume=()=>ready;
 const first=engine.recordStart(),second=engine.recordStart();resume();
 await Promise.all([first,second]);
 assert.equal(instances.length,1,'Rapid Start created overlapping native recorders');
 const stop=engine.recordStop();instances[0].finish('one capture');await stop;
 assert.equal(engine.recording,false);
});

test('repeated Stop shares final data and cannot be overwritten by a new Start',async t=>{
 const {engine,instances}=fixture(t);await engine.recordStart();
 const first=engine.recordStop(),second=engine.recordStop();
 // Observe any rejection before comparing; the browser changes state synchronously at stop().
 let error;void second.catch(e=>error=e);await Promise.resolve();
 assert.equal(error,undefined,'Repeated Stop raised an inactive-recorder error');
 await assert.rejects(engine.recordStart(),/finish/i);
 assert.equal(instances.length,1);assert.equal(instances[0].stopCalls,1);
 instances[0].finish('complete old capture');
 const [a,b]=await Promise.all([first,second]);assert.equal(a,b);assert.equal(await a.text(),'complete old capture');
 assert.equal(engine.recording,false);
 await engine.recordStart();const next=engine.recordStop();instances[1].finish('next capture');
 assert.equal(await (await next).text(),'next capture');assert.equal(await a.text(),'complete old capture');
 assert.equal(engine.recording,false);assert.equal(await engine.recordStop(),null);
});
