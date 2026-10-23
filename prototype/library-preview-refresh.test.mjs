import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('./library-waveform-preview.js',import.meta.url),'utf8').replace(/^import .*;$/m,'').replace('export function installLibraryWaveforms','function installLibraryWaveforms');
for(const hidden of [false,true])test(`unrelated library row updates do not rewrite ${hidden?'hidden':'shown'} preview visibility`,()=>{
 const writes=[],observers=[],tasks=[],dataset=new Proxy({}, {set(target,key,value){writes.push([key,value]);target[key]=value;return true;}});
 const head={querySelector:()=>({})},table={querySelector:()=>head},root={querySelector:()=>table,querySelectorAll:()=>[],addEventListener(){}},modal={};
 class Observer{constructor(callback){this.callback=callback;observers.push(this);}observe(){}disconnect(){}}
 const scope={document:{body:{dataset},hidden:true,querySelector:id=>id==='#tracks'?root:modal,addEventListener(){}},window:{addEventListener(){}},localStorage:{getItem:()=>hidden?'hidden':null},MutationObserver:Observer,IntersectionObserver:class{observe(){}disconnect(){}},queueMicrotask:callback=>tasks.push(callback),state:{tracks:[]},engine:{}};
 vm.createContext(scope);vm.runInContext(source,scope);scope.installLibraryWaveforms({state:scope.state,engine:scope.engine});
 assert.equal(dataset.libraryWaveforms,String(!hidden));assert.equal(writes.length,1);
 for(let i=0;i<6;i++){observers[0].callback();while(tasks.length)tasks.shift()();}
 assert.equal(writes.length,1,'Redundant body attribute writes invalidate page-wide preview selectors before geometry reads');
});
