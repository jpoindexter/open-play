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

test('cached library previews need no geometry; uncached visible and newly revealed rows still load',async()=>{
 const start=source.indexOf('  async function pump(){'),end=source.indexOf('\n  const visibility=',start);
 assert(start>=0&&end>start);
 const tracks=Array.from({length:12},(_,i)=>({id:String(i)})),rows=tracks.map(track=>({dataset:{track:track.id},visible:true}));
 const records=new Map(tracks.map(track=>[track.id,{phase:'ready',src:'cached:'+track.id}])),retained=[...records.values()],geometry=[],loaded=[];
 const scope={busy:false,active:()=>true,rows:()=>rows,state:{tracks},keyFor:t=>t.id,records,
  onScreen:row=>{geometry.push(row.dataset.track);return row.visible;},refresh(){},
  thumbnail:async track=>{loaded.push(track.id);return {src:'new:'+track.id};},URL:{revokeObjectURL(){}}};
 vm.createContext(scope);vm.runInContext(source.slice(start,end),scope);
 await scope.pump();
 assert.deepEqual(geometry,[],'Cached previews must not force layout when viewport visibility changes');
 assert.deepEqual([...records.values()],retained);
 records.delete('10');records.delete('11');rows[10].visible=false;
 await scope.pump();
 assert.deepEqual(loaded,['11'],'Only the visible uncached row should decode');
 assert(geometry.every(id=>id==='10'||id==='11'),'Ready rows remain unmeasured during a cache miss');
 assert.equal(records.has('10'),false);assert.equal(records.get('11').phase,'ready');
 rows[10].visible=true;await scope.pump();
 assert.deepEqual(loaded,['11','10'],'Scrolling reveals the remaining uncached preview');
 assert.equal(scope.busy,false);
});
