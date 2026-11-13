import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {syncButtonLabel} from './sync-presentation.js';
const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
const rendering=source.slice(source.indexOf('let renderedSyncMode'),source.indexOf('\nfunction waveformView('));
function fixture(){
 const calls={full:0,mixer:0,focus:0,draw:0,restore:0,reconcile:0},nodes=new Map();
 const lanes={children:[],append(node){node.parent=this;this.children.push(node);}};
 const article=index=>{const node={index,lane:{kind:'lane'},status:{kind:'status'},querySelectorAll:()=>[node.lane,node.status]};
  Object.defineProperty(node,'outerHTML',{set(html){const replacement=article(index);replacement.html=html;nodes.set(index,replacement);}});return node;};
 const root={insertAdjacentHTML(){},set innerHTML(html){calls.full++;nodes.clear();for(const match of html.matchAll(/data-focus="(\d+)"/g))nodes.set(Number(match[1]),article(Number(match[1])));}};
 const state={layout:'Horizontal',deckCount:4,focus:0,settings:{'Sync Mode':'Off'},decks:Array.from({length:4},(_,index)=>({index,track:{title:'Track '+index,artist:'Artist',duration:60,cues:[],bpm:120},rate:1,loopLength:4,mode:'INT'}))};
 const document={body:{className:'',classList:{contains:()=>false}},querySelector(selector){const match=selector.match(/^\.deck\[data-focus="(\d+)"\]$/);return match?nodes.get(Number(match[1])):null;},querySelectorAll:()=>[]};
 const scope={syncButtonLabel,cancelSimpleSync(){},isSimpleSyncPending:()=>false,state,document,$:selector=>selector==='#decks'?root:selector==='.waveform-scrub-lanes'?lanes:{setAttribute(){}},colors:['a','b','c','d'],uiIcons:{},
  deckQuantize:()=>true,smartSync:{reset(){},reconcile(){calls.reconcile++;}},syncMaster:{master:()=>null},parseMusicalKey:()=>null,keyLabel:()=>'',shiftedKey:()=>'',esc:String,time:String,
  autoGainMode:()=>'',trackGainDB:()=>0,loopModeMarkup:()=>'',padMarkup:()=>'',shownDeckBPM:()=>120,engine:{position:()=>0},deckScratchUIPolicy:{keyboard:''},stemSlipControls:{markup:()=>'',restoreFocus(){calls.restore++;}},
  tempoSliders:{cancel(){},view:()=>({range:8,position:0,label:'Tempo',valueText:'0%'})},detailWaveSpan:4,changeDetailWaveZoom(){},drawWaves(){calls.draw++;},renderMixer(){calls.mixer++;},refreshTransportControls(){calls.focus++;}};
 vm.createContext(scope);vm.runInContext(rendering,scope);scope.renderDecks();return{scope,state,nodes,calls,lanes,root};
}
test('load deck refresh preserves siblings, mixer and shared waveform while replacing target controls',()=>{
 const f=fixture(),before=[...f.nodes.values()],counts={...f.calls};f.state.focus=2;f.state.decks[2].track.title='Replacement';f.scope.renderDecks(2);
 assert.equal(f.calls.full,counts.full,'Load must not replace the whole deck tree');assert.equal(f.calls.mixer,counts.mixer);
 for(const index of [0,1,3])assert.equal(f.nodes.get(index),before[index]);assert.notEqual(f.nodes.get(2),before[2]);assert.match(f.nodes.get(2).html,/Replacement/);
 assert.equal(f.calls.focus,counts.focus+1);assert.equal(f.calls.restore,counts.restore+1);assert.equal(f.calls.reconcile,counts.reconcile+1);
});
test('projected real scrub lane and live status survive replacement for adapter re-projection',()=>{
 const f=fixture(),old=f.nodes.get(2);f.scope.renderDecks(2);assert.deepEqual(f.lanes.children,[old.lane,old.status]);
});
test('layout, deck-count, Sync-mode and missing-target changes retain full structural rendering',()=>{
 for(const change of [f=>f.state.layout='Vertical',f=>f.state.deckCount=2,f=>f.state.settings['Sync Mode']='Simple Sync',f=>f.nodes.delete(2)]){
  const f=fixture();change(f);const before=f.calls.full;f.scope.renderDecks(2);assert.equal(f.calls.full,before+1);
 }
});
test('partial deck rendering paints only its rebuilt overview, including shared-track siblings',()=>{
 const f=fixture(),painted=[],measured=[],originalQuery=f.scope.$;
 f.state.decks.forEach((deck,index)=>deck.track.id='track-'+index);
 f.state.decks[0].track=f.state.decks[2].track;
 const canvases=f.state.decks.map(deck=>({index:deck.index,getBoundingClientRect(){measured.push(this.index);return {width:400,height:60};},setAttribute(){}}));
 Object.assign(f.scope,{
  overviewWaveViews:[],sourceWaveLoads:new WeakSet(),waveformView:()=>({kind:'original',label:'Decoded waveform'}),
  prepareWaveCanvas:canvas=>({width:400,height:60,context:{index:canvas.index,clearRect(){},fillRect(){}}}),
  paintSourceOverview:context=>{painted.push(context.index);return null;},
  $:selector=>{const match=selector.match(/^#wave-(\d)$/);return match?canvases[Number(match[1])]:originalQuery(selector);},
 });
 f.scope.engine.buffers=new Map(f.state.decks.map(deck=>[deck.track.id,{}]));
 vm.runInContext(source.slice(source.indexOf('function drawWaves('),source.indexOf('\nfunction drawDetailWave(')),f.scope);
 const siblings=[0,1,3].map(index=>f.nodes.get(index));f.scope.renderDecks(2);
 assert.deepEqual(painted,[2],'Only the rebuilt overview needs painting, even when another deck shares its track');
 assert.deepEqual(measured,[2],'Preserved sibling overviews need no geometry reads');
 assert.deepEqual([0,1,3].map(index=>f.nodes.get(index)),siblings);
 painted.length=0;measured.length=0;f.state.layout='Vertical';f.scope.renderDecks(2);
 assert.deepEqual(painted,[0,1,2,3],'Structural fallback must paint every rebuilt overview');
 assert.deepEqual(measured,[0,1,2,3]);
});
