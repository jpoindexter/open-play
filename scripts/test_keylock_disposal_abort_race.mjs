// Exact factory / controlled native-node port. No WASM, browser or PCM proof.
// Default requires the repair. --initial-reproduction asserts the original
// frozen a710 defect against the parent's ignored preserved source copy.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const initial=process.argv.includes('--initial-reproduction');
assert(process.argv.slice(2).every(arg=>arg==='--initial-reproduction'),'Unknown test argument');
const target=new URL(initial?'../local-evidence/keylock-disposable-initial-a71073ef.mjs':
  '../prototype/vendor/signalsmith-stretch/SignalsmithStretch-open-play-disposable.mjs',import.meta.url);
const source=await readFile(target);
const hash=createHash('sha256').update(source).digest('hex');
if(initial)assert.equal(hash,'a71073ef4d07278e3eda6b09f63132ce2b075c081b1d23bea2dfd6cb9aa4bd38');
const Stretch=(await import(target.href)).default;
const priorNode=globalThis.AudioWorkletNode;
let controller,instance,abortAtBoundary=false;
class NodeHost extends EventTarget {
  constructor(){
    super();instance=this;this.closed=false;this.disconnects=0;this.disposalRequests=0;
    this.port={onmessage:null,close:()=>{this.closed=true;},postMessage:data=>{
      assert.equal(data[0],'dispose-terminal','Only terminal disposal is used by this factory race test');
      this.disposalRequests++;
      queueMicrotask(()=>this.port.onmessage?.({data:['dispose-terminal',
        {disposed:true,retainedSourceBuffers:0,retainedModule:false}]}));
    }};
    queueMicrotask(()=>this.port.onmessage?.({data:['ready',{schedule:2}]}));
    // Ready's Promise is already fulfilled, but its race/factory continuation
    // has not returned ownership when this independent microtask aborts it.
    if(abortAtBoundary)queueMicrotask(()=>controller.abort());
  }
  disconnect(){this.disconnects++;}
}
const bounded=promise=>{
  let timer;return Promise.race([promise,new Promise((_,reject)=>{
    timer=setTimeout(()=>reject(new Error('Factory/disposal did not settle in 1 second')),1000);
  })]).finally(()=>clearTimeout(timer));
};
const cases=[];
try{
  globalThis.AudioWorkletNode=NodeHost;
  controller=new AbortController();
  const control=await bounded(Stretch({},undefined,{signal:controller.signal,timeoutMs:500}));
  assert.equal(control.closed,false);assert.equal(controller.signal.aborted,false);
  await bounded(control.dispose());assert.equal(control.closed,true);
  cases.push({case:'Ready owner without cancellation resolves and acknowledged disposal closes it',passed:true});

  controller=new AbortController();abortAtBoundary=true;
  let result,error;
  try{result=await bounded(Stretch({},undefined,{signal:controller.signal,timeoutMs:500}));}
  catch(caught){error=caught;}
  assert.equal(controller.signal.aborted,true);
  if(initial){
    assert(result,'Initial frozen defect unexpectedly rejected; investigate the reproduction');
    await bounded(result.dispose());
    assert.equal(result.closed,true);
    cases.push({case:'Original a710 readiness/abort boundary returns a terminal node',
      expectedInitialDefect:true,factory:'resolved',aborted:true,closed:true});
  }else{
    assert.equal(result,undefined,'Aborted owner must never receive a resolved terminal node');
    assert.equal(error?.name,'AbortError','Original ownership cancellation must be retained');
    assert.equal(instance.closed,true,'Terminal disposal ACK must precede factory rejection');
    assert.equal(instance.disposalRequests,1,'Cancellation must reuse one disposal operation');
    cases.push({case:'Ready/abort boundary rejects original AbortError after terminal ACK',passed:true,
      factory:'rejected',error:error.name,aborted:true,closed:true,disposalRequests:instance.disposalRequests});
  }
}finally{globalThis.AudioWorkletNode=priorNode;}
console.log(JSON.stringify({mode:initial?'assert preserved initial defect':'require fixed cancellation contract',
  factorySHA256:hash,cases,scope:'Exact unchanged factory with a controlled AudioWorkletNode/MessagePort collaborator. '
    +'Exercises JavaScript ownership microtask ordering, not actual worklet scheduling, DSP, browser PCM or heap release.'},null,2));
