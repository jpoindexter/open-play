// Harness-only prelude: ordered before the frozen vendor dependency by static imports.
if(typeof AudioWorkletProcessor==='function'&&typeof registerProcessor==='function'){
 const nativeRegister=globalThis.registerProcessor;
 const interception=function(name,Processor){
  if(name!=='signalsmith-stretch-open-play-disposable')return nativeRegister(name,Processor);
  class ObservedProcessor extends Processor{
   constructor(...args){super(...args);this.__proof={processCalls:0,dspCalls:0,terminalReturns:0,disposedProcessCalls:0,initialReady:this.wasmReady};this.__diagnostic=null;const dispatch=this.port.onmessage;this.port.onmessage=event=>{if(event.data[0]==='__open_play_diagnostics'){this.__diagnostic?.close();this.__diagnostic=event.data[1];this.__identity=event.data[2];this.__diagnostic.onmessage=({data})=>{if(data.type==='snapshot')this.__publish(data.id);};this.__publish('attached');return;}return dispatch.call(this.port,event);};}
   __publish(id){this.__diagnostic?.postMessage({id,identity:this.__identity,frame:currentFrame,...this.__proof,disposed:this.disposed,wasmReady:this.wasmReady,retainedSourceBuffers:this.audioBuffers.length,retainedModule:!!this.wasmModule,pendingProcessorCommands:this.pendingMessages.length});}
   process(...args){this.__proof.processCalls++;if(this.disposed)this.__proof.disposedProcessCalls++;if(this.wasmModule){const module=this.wasmModule,old=module._process;if(!old.__disposalProof){const proof=this.__proof;const observed=function(...values){proof.dspCalls++;return old.apply(this,values);};observed.__disposalProof=true;module._process=observed;}}
    const result=super.process(...args);if(result===false){this.__proof.terminalReturns++;this.__publish('terminal-return');}return result;
   }
  }
  const result=nativeRegister(name,ObservedProcessor);globalThis.registerProcessor=nativeRegister;return result;
 };
 globalThis.registerProcessor=interception;
 if(globalThis.registerProcessor!==interception)throw Error('Diagnostic registration hook is not writable');
}
