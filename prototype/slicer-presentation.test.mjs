import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createSlicer} from './slicer.js';
import {refreshSlicerControls} from './slicer-presentation.js';
import {refreshLoopControls} from './loop-presentation.js';
const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
function node(){
 const attrs=new Map(),classes=new Set();
 return{isConnected:true,textContent:'',value:'',dataset:{},classList:{contains:k=>classes.has(k),toggle(k,on){on?classes.add(k):classes.delete(k);}},getAttribute:k=>attrs.get(k),setAttribute:(k,v)=>attrs.set(k,v)};
}
test('actual Slicer callbacks retain four-deck controls and deck-local feedback through hold/release/domain/end',async()=>{
 const track={id:'shared',bpm:120,grid:0,duration:48,savedLoops:[]};
 const decks=Array.from({length:4},(_,index)=>({index,track,tab:'Slicer',mode:'INT',position:4,playing:false,rate:1,loop:false,loopIn:0,loopOut:0,loopLength:4,slice:null}));
 const state={decks,deckCount:4,layout:'Horizontal',settings:{'Sync Mode':'Smart Sync'}},nodes=new Map(),pads=decks.map(()=>Array.from({length:8},(_,i)=>Object.assign(node(),{dataset:{pad:String(i)},textContent:`Slice ${i+1}`})));
 let missing=false,rebuilds=0,focus=node(),drawn=[];
 const root={get activeElement(){return focus;},querySelector(s){if(missing&&s==='[data-slice-quant="0"]')return null;if(!nodes.has(s))nodes.set(s,node());return nodes.get(s);},querySelectorAll(s){return pads[Number(s.match(/data-deck="(\d+)"/)[1])];}};
 const engine={ctx:{currentTime:0},voices:new Map(),startTokens:new Map(),init(){},position:d=>d.position,voiceClock:d=>{const start=d.position,at=engine.ctx.currentTime;return when=>start+Math.max(0,when-at)*d.rate;},
  async setLoop(d,on,start,end,options={}){engine.startTokens.set(d.index,(engine.startTokens.get(d.index)||0)+1);Object.assign(d,{loop:on,loopIn:start,loopOut:end});if(options.positionAt)d.position=options.positionAt(engine.ctx.currentTime);if(options.playing!==undefined)d.playing=options.playing;},
  pause(d){d.playing=false;engine.startTokens.set(d.index,(engine.startTokens.get(d.index)||0)+1);},onEnd:async d=>{d.track={...track,id:'replacement'};d.tab='Cues';}};
 const scope={state,engine,createSlicer,document:root,renderedDeckShape:'Horizontal/4/Smart Sync',notify:m=>assert.fail(m),loopPads:{},
  refreshSlicerControls:(s,d)=>refreshSlicerControls(s,d,root),refreshLoopControls:(s,p)=>refreshLoopControls(s,p,root),
  smartSync:{reconcile(){}},refreshTransportControls(){},drawWaves:t=>drawn.push(t),
  renderDecks(){rebuilds++;for(const n of nodes.values())n.isConnected=false;focus=null;},
 };
 const refresh=source.slice(source.indexOf('function refreshLoopDecks('),source.indexOf('\nconst manualLoops='));
 const callback=source.slice(source.indexOf('function renderLoopDecks('),source.indexOf('\nconst loopPads='));
 vm.runInNewContext(refresh+'\n'+callback+'\n'+source.match(/^const slicer = createSlicer.*$/m)[0]+'\nglobalThis.actions={slicer,refresh:renderLoopDecks};',scope);
 const d=decks[0],witness=root.querySelector('[data-mix="level"][data-deck="3"]'),preview=root.querySelector('.library-wave-preview img'),owner=focus;
 assert.equal(await scope.actions.slicer.press('hold',d,2),true);
 assert.equal(rebuilds,0,'Slicer press globally replaces controls');assert(witness.isConnected&&preview.isConnected);assert.equal(focus,owner);
 assert.equal(pads[0][2].getAttribute('aria-pressed'),'true');assert.equal(pads[1][2].getAttribute('aria-pressed'),undefined,'Shared-track deck must not inherit the gesture');
 assert.equal(pads[0][2].textContent,'Slice 3');assert.equal(root.querySelector('[data-action="loop"][data-deck="0"]').getAttribute('aria-pressed'),'true');
 await scope.actions.slicer.release('hold');assert.equal(d.playing,false);assert.equal(pads[0][2].getAttribute('aria-pressed'),'false');assert.equal(rebuilds,0);
 d.slicerDomain=16;d.sliceQuant=.25;await scope.actions.slicer.domainLoop(d,true);
 assert.equal(root.querySelector('[data-slice-domain="0"]').value,'16');assert.equal(root.querySelector('[data-slice-quant="0"]').value,'0.25');assert.equal(root.querySelector('[data-action="slicerLoop"][data-deck="0"]').getAttribute('aria-pressed'),'true');
 await scope.actions.slicer.domainLoop(d,false);assert.equal(rebuilds,0);assert(drawn.every(t=>t===track));
 d.position=47;d.playing=true;await scope.actions.slicer.press('end',d,0);engine.ctx.currentTime=2;await scope.actions.slicer.release('end');
 assert.equal(d.track.id,'replacement');assert.equal(d.tab,'Cues');assert.equal(rebuilds,0);assert(witness.isConnected&&preview.isConnected);
 d.tab='Slicer';missing=true;scope.actions.refresh(d);assert.equal(rebuilds,1,'Missing structure needs existing fallback');missing=false;
 state.layout='Vertical';scope.actions.refresh(d);assert.equal(rebuilds,2,'Layout changes need existing fallback');
});
