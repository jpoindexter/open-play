import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {planKeySync} from './pitchplay.js';
import {refreshAnalysisControls} from './analysis-presentation.js';
import {refreshDeckSwitches,refreshTransportControls} from './transport-presentation.js';
import {refreshLoopControls} from './loop-presentation.js';
const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
function node(){
 const attrs=new Map(),classes=new Set();
 return{isConnected:true,textContent:'',dataset:{},classList:{contains:k=>classes.has(k),toggle(k,on){on?classes.add(k):classes.delete(k);}},getAttribute:k=>attrs.get(k),setAttribute:(k,v)=>attrs.set(k,v),closest:()=>null};
}
test('actual Key Sync actions retain four-deck controls and refresh feedback, with structural fallback',async()=>{
 const decks=Array.from({length:4},(_,index)=>({index,track:{id:'t'+index,key:index?'F#':'C',savedLoops:[]},keySync:index===0,keySyncTag:index?'F#':'C',rate:1,keyShift:0,loopLength:4,tab:'Cues',mode:'INT'}));
 const state={decks,deckCount:4,layout:'Horizontal',settings:{'Sync Mode':'Smart Sync'}},nodes=new Map(),keys=decks.map(node);
 const root={querySelector(s){
  if(!nodes.has(s)){
   const n=node(),deck=s.match(/^\.deck\[data-focus="(\d+)"\]$/);
   if(deck)n.querySelector=q=>q==='.deck-key'?keys[+deck[1]]:root.querySelector(q.replace(']',`][data-deck="${deck[1]}"]`));
   nodes.set(s,n);
  }
  return nodes.get(s);
 }};
 let rebuilds=0,preparations=0,painted=[];
 const cancel={cancelDeck(){}},loopPads={...cancel};
 const scope={state,document:root,renderedDeckShape:'Horizontal/4/Smart Sync',planKeySync,
  engine:{position:()=>0,async setPitch(d,{keylock,semitones}){preparations++;Object.assign(d,{keylock,keyShift:semitones});}},
  deckScratchControls:cancel,pitchPlay:cancel,manualLoops:cancel,slicer:cancel,loopPads,
  refreshAnalysisControls:(s,t)=>refreshAnalysisControls(s,t,root),refreshDeckSwitches:(s,i)=>refreshDeckSwitches(s,i,root),
  refreshTransportControls:s=>refreshTransportControls(s,root),refreshLoopControls:(s,p)=>refreshLoopControls(s,p,root),
  drawWaves:t=>painted.push(t),smartSync:{reconcile(){}},notify(){},
  renderDecks(){rebuilds++;for(const n of nodes.values())n.isConnected=false;},
 };
 vm.runInNewContext(source.slice(source.indexOf('async function deckAction('),source.indexOf('\nlet importTail='))+'\n'+source.slice(source.indexOf('function refreshLoopDecks('),source.indexOf('\nconst manualLoops='))+'\nglobalThis.press=deckAction;',scope);
 const witness=root.querySelector('[data-action="keylock"][data-deck="3"]');
 const preview=root.querySelector('.library-wave-preview img');
 const sync=root.querySelector('[data-action="keySync"][data-deck="0"]');
 await scope.press('keySync',0,{});
 assert.equal(rebuilds,0,'Key Sync OFF globally replaces controls');assert(witness.isConnected&&preview.isConnected);
 assert.equal(sync.getAttribute('aria-pressed'),'false');assert.equal(preparations,0);
 await scope.press('keySync',0,{});
 assert.equal(rebuilds,0);assert(witness.isConnected&&preview.isConnected);assert.equal(preparations,1);
 assert.equal(sync.getAttribute('aria-pressed'),'true');assert.equal(decks[0].keylock,true);
 assert(keys[0].getAttribute('aria-label').startsWith('Deck 1 track key: '));assert(painted.every(t=>t===decks[0].track));
 state.layout='Vertical';await scope.press('keySync',0,{});assert.equal(rebuilds,1,'Structural change must retain the existing rebuild fallback');
});
