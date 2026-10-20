import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
const start=source.indexOf('document.addEventListener("keydown", async (e) => {',source.indexOf('$("#library-tools")'));
const end=source.indexOf("window.addEventListener('blur',()=>void jogBend",start);
function fixture({modal=false}={}){
  const handlers={},calls=[],decks=[{index:0,track:{},tab:'Cues'},{index:1,track:{},tab:'Cues'}];
  const context={document:{addEventListener:(k,v)=>handlers[k]=v},$:()=>({open:modal,focus:()=>calls.push('search')}),state:{settings:{},decks,prepare:[]},
    loopHoldTarget:()=>null,loopOperation(){},notify(){},cueHolds:{press:async(...args)=>calls.push(['cue',...args]),release:(...args)=>calls.push(['release',...args])},
    deckAction:async(...args)=>calls.push(['action',...args]),censorHolds:{release(){}},jogBend:{releaseHold:async()=>{}},loopPads:{release(){}},pitchPlay:{release(){}},slicer:{release(){}},panels:{sampleAction:(...a)=>calls.push(['sample',...a]),releaseSampleHolds(){}}};
  vm.runInNewContext(source.slice(start,end),context);
  const event=(extra={})=>({key:'i',code:'KeyI',target:{tagName:'BODY',dataset:{},closest:()=>null},preventDefault(){},getModifierState:()=>false,...extra});
  return {handlers,calls,decks,event};
}
test('unintended Command/Ctrl/Alt combinations cannot change playback',async()=>{
  for(const modifiers of [{metaKey:true},{ctrlKey:true},{altKey:true}])for(const key of ['i','k','o','p','1','\\']){
    if((modifiers.metaKey||modifiers.ctrlKey)&&key==='p')continue;
    const {handlers,calls,event}=fixture();await handlers.keydown(event({key,...modifiers}));assert.deepEqual(calls,[],JSON.stringify({key,...modifiers}));
  }
});
test('typing, editable content, composition and modal focus do not trigger deck actions',async()=>{
  for(const extra of [{isComposing:true},{target:{tagName:'DIV',isContentEditable:true,dataset:{},closest:()=>null}},{target:{tagName:'INPUT',dataset:{},closest:()=>null}}]){
    const {handlers,calls,event}=fixture();await handlers.keydown(event(extra));assert.deepEqual(calls,[]);
  }
  const {handlers,calls,event}=fixture({modal:true});await handlers.keydown(event({key:'Enter',target:{tagName:'BUTTON',dataset:{action:'cue',deck:'0'},closest:()=>null}}));assert.deepEqual(calls,[]);
});
test('intended cue deletion, search, temporary cue and Option sampler stop remain',async()=>{
  const {handlers,calls,event}=fixture();
  await handlers.keydown(event({key:'!',code:'Digit1',metaKey:true,shiftKey:true}));assert.equal(calls.at(-1)[0],'cue');assert.equal(calls.at(-1)[4],true);
  await handlers.keydown(event({key:'f',metaKey:true}));assert.equal(calls.at(-1),'search');
  await handlers.keydown(event());assert.equal(calls.at(-1)[0],'cue');
  await handlers.keydown(event({key:'x',altKey:true}));assert.deepEqual(calls.at(-1),['sample',1,'stop','keyboard']);
});
test('cue release survives changed focus, modifiers and keyboard character',async()=>{
  const {handlers,calls,event}=fixture();await handlers.keydown(event());
  const key=calls[0][1];handlers.keyup(event({key:'ˆ',metaKey:true,altKey:true,target:{tagName:'INPUT',dataset:{}}}));
  assert(calls.some(c=>c[0]==='release'&&c[1]===key));
});
