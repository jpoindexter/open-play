import assert from 'node:assert/strict';
import test from 'node:test';
import {snapFaderValue as snap,refineFaders} from './fader-preview.js';
for(const kind of ['tempo','cross']){
 const range={min:kind==='tempo'?-8:-1,max:kind==='tempo'?8:1,kind};
 const near=range.max*.02;
 assert.equal(snap(near,range),0);assert.equal(snap(-near,range),0);
 assert.equal(snap(near,range,true),near);
 assert.equal(snap(range.max*.1,range),range.max*.1);
 assert.equal(snap(99,range),range.max);assert.equal(snap(-99,range),range.min);
}
const level={min:0,max:1,kind:'level'};
assert.equal(snap(.01,level),0);assert.equal(snap(.99,level),1);
assert.equal(snap(.5,level),.5);assert.equal(snap(.8,level),.8);
assert.equal(snap(.01,level,true),.01);assert.equal(snap(.99,level,true),.99);
console.log('Fader detent thresholds, bypass, endpoints and free positions pass.');

test('channel and crossfader reset through their existing owners, once, with keyboard parity',()=>{
 const element=()=>({style:{setProperty(){}},dataset:{},setAttribute(){},append(){}});
 const range=(id,value,min,max,dataset={})=>Object.assign(new EventTarget(),{
  id,value:String(value),min:String(min),max:String(max),dataset,disabled:false,title:'Fader',parentElement:element(),setAttribute(){},
 });
 const level=range('level',.4,0,1),cross=range('crossfader',.6,-1,1),tempo=range('tempo',2,-8,8,{tempo:'0'});
 const inputs=[level,cross,tempo],writes=[],changes=[];
 for(const input of inputs){input.addEventListener('input',()=>writes.push([input.id,Number(input.value)]));input.addEventListener('change',()=>changes.push(input.id));}
 const previous=globalThis.document;
 globalThis.document={body:{dataset:{workspace:'serato'}},createElement:element,querySelectorAll:()=>inputs};
 const home=modifiers=>Object.assign(new Event('keydown',{cancelable:true}),{key:'Home',...modifiers});
 try{
  refineFaders();refineFaders();
  level.dispatchEvent(new Event('dblclick',{cancelable:true}));
  assert.equal(Number(level.value),.8);assert.equal(Number(cross.value),.6);assert.equal(Number(tempo.value),2);
  assert.deepEqual(writes,[['level',.8]]);assert.deepEqual(changes,['level']);
  cross.dispatchEvent(new Event('dblclick',{cancelable:true}));assert.equal(Number(cross.value),0);
  level.value='.2';const keyboard=home({ctrlKey:true});level.dispatchEvent(keyboard);
  assert.equal(Number(level.value),.8);assert(keyboard.defaultPrevented);
  cross.value='.3';cross.dispatchEvent(home({metaKey:true}));assert.equal(Number(cross.value),0);
  level.disabled=true;level.value='.2';level.dispatchEvent(new Event('dblclick'));
  assert.equal(Number(level.value),.2);level.disabled=false;
  const nativeHome=home({});level.dispatchEvent(nativeHome);assert(!nativeHome.defaultPrevented);
  const tempoHome=home({ctrlKey:true});tempo.dispatchEvent(tempoHome);
  assert(!tempoHome.defaultPrevented);assert.equal(Number(tempo.value),2);
  assert.deepEqual(writes,[['level',.8],['crossfader',0],['level',.8],['crossfader',0]]);
  assert.deepEqual(changes,['level','crossfader','level','crossfader']);
 }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});
