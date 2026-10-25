import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
const rendering=source.slice(source.indexOf('let renderedSyncMode'),source.indexOf('\nfunction waveformView('));
const handlerAt=source.indexOf('$("#layout").onchange ='),helperAt=source.indexOf('function refreshWaveformOrientation(');
const orientation=source.slice(helperAt>=0&&helperAt<handlerAt?helperAt:handlerAt,source.indexOf('\n$("#deck-count").onchange',handlerAt));

// Execute actual renderDecks and #layout handler against controlled DOM/paint
// endpoints. This checks node ownership/cache policy, not CSS pixels or native lag.
function fixture(count=4,layout='Horizontal'){
 const calls={full:0,mixer:0,overview:0,detail:0},nodes=new Map(),frames=[];
 const classes=(initial='')=>{const values=new Set(initial.split(' ').filter(Boolean));return{
  contains:v=>values.has(v),add:(...v)=>v.forEach(x=>values.add(x)),remove:(...v)=>v.forEach(x=>values.delete(x)),
  toggle(v,on=!values.has(v)){on?values.add(v):values.delete(v);return on;},toString:()=>[...values].join(' ')};};
 const style=()=>{const values={},key=k=>k.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());return new Proxy({
  setProperty(k,v){values[key(k)]=v;},removeProperty(k){delete values[key(k)];}
 },{get:(target,k)=>target[k]??values[key(k)],set(target,k,v){values[key(k)]=v;return true;}});};
 let bodyClasses=classes(),detail,lanes,canvas,footer={kind:'footer'},mixerControls={kind:'mixer'},active=null;
 const previews=Array.from({length:count},(_,i)=>({src:'cached-preview-'+i}));
 const article=index=>{
  const node={index,control:{value:String(index+.25)},lane:{dataset:{waveformScrub:layout==='Horizontal'?'x':'y'}},status:{kind:'status'},
   querySelectorAll:()=>[node.lane,node.status]};
  Object.defineProperty(node,'outerHTML',{set(html){const replacement=article(index);replacement.html=html;nodes.set(index,replacement);}});return node;
 };
 const root={insertAdjacentHTML(){
  lanes={style:style(),children:[],append(node){this.children.push(node);},querySelectorAll:()=>[...nodes.values()].map(n=>n.lane)};
  lanes.style[layout==='Horizontal'?'grid-template-rows':'grid-template-columns']=`repeat(${count},minmax(0,1fr))`;
  canvas={kind:'detail-canvas'};detail={classList:classes('detail-waves'+(layout==='Horizontal'?' detail-horizontal':'')),
   querySelector:s=>s==='.waveform-scrub-lanes'?lanes:s==='canvas'?canvas:null,querySelectorAll:()=>[...nodes.values()].map(n=>n.lane)};
 },set innerHTML(html){calls.full++;nodes.clear();active=null;for(const m of html.matchAll(/data-focus="(\d+)"/g))nodes.set(Number(m[1]),article(Number(m[1])));}};
 const select={value:layout},state={layout,deckCount:count,focus:0,settings:{'Sync Mode':'Off'},decks:Array.from({length:count},(_,index)=>({index,
  track:{title:'Track '+index,artist:'Artist',duration:60,cues:[],bpm:120},rate:1,loopLength:4,mode:'INT'}))};
 const body={dataset:{},get className(){return bodyClasses.toString();},set className(v){bodyClasses=classes(v);},get classList(){return bodyClasses;}};
 const query=s=>{const match=s.match(/^\.deck\[data-focus="(\d+)"\]$/);if(match)return nodes.get(Number(match[1]));
  return({'#decks':root,'#layout':select,'.detail-waves':detail,'#detail-wave':canvas,'.waveform-scrub-lanes':lanes})[s]||null;};
 const document={body,get activeElement(){return active;},querySelector:query,querySelectorAll:s=>s==='.deck'?[...nodes.values()]:s.includes('waveform-scrub')?[...nodes.values()].map(n=>n.lane):[]};
 const scope={cancelSimpleSync(){},isSimpleSyncPending:()=>false,state,document,$:s=>s==='#quantize'?{setAttribute(){}}:query(s),colors:['a','b','c','d'],deckQuantize:()=>true,
  smartSync:{reset(){},reconcile(){}},syncMaster:{master:()=>null},parseMusicalKey:()=>null,keyLabel:()=>'',shiftedKey:()=>'',esc:String,time:String,
  autoGainMode:()=>'',trackGainDB:()=>0,loopModeMarkup:()=>'',padMarkup:()=>'',shownDeckBPM:()=>120,engine:{position:()=>0},
  deckScratchUIPolicy:{keyboard:''},stemSlipControls:{markup:()=>'',restoreFocus(){}},tempoSliders:{view:()=>({range:8,position:0,label:'Tempo',valueText:'0%'})},
  detailWaveSpan:4,changeDetailWaveZoom(){},drawWaves(track=null){if(!track||state.decks.some(d=>d.track===track))calls.overview++;},drawDetailWave(){calls.detail++;},refreshTransportControls(){},
  renderMixer(){calls.mixer++;footer={kind:'new-footer'};mixerControls={kind:'new-mixer'};},requestAnimationFrame(fn){frames.push(fn);return frames.length;}};
 vm.createContext(scope);vm.runInContext(rendering,scope);scope.renderDecks();vm.runInContext(orientation,scope);
 return{scope,state,nodes,calls,previews,document,select,get detail(){return detail;},get canvas(){return canvas;},get lanes(){return lanes;},
  get footer(){return footer;},get mixerControls(){return mixerControls;},focus(node){active=node;},change(value){select.value=value;select.onchange({target:select});},
  removeDetail(){detail=null;canvas=null;lanes=null;},flush(){for(const fn of frames.splice(0))fn(1000);},shape:()=>vm.runInContext('renderedDeckShape',scope)};
}

for(const count of [2,4])for(const from of ['Horizontal','Vertical'])test(`${count} decks ${from} orientation change preserves controls and waveform surfaces`,()=>{
 const f=fixture(count,from),to=from==='Horizontal'?'Vertical':'Horizontal',before={nodes:[...f.nodes.values()],footer:f.footer,mixer:f.mixerControls,
  detail:f.detail,canvas:f.canvas,lanes:f.lanes,previews:[...f.previews],calls:{...f.calls}},focused=f.nodes.get(0).control;
 f.focus(focused);f.change(to);f.flush();
 assert.equal(f.calls.full,before.calls.full,'Orientation alone must not rebuild deck controls');assert.equal(f.calls.mixer,before.calls.mixer);
 assert.deepEqual([...f.nodes.values()],before.nodes);assert.equal(f.document.activeElement,focused);
 assert.equal(f.footer,before.footer);assert.equal(f.mixerControls,before.mixer);assert.deepEqual(f.previews,before.previews);
 assert.equal(f.detail,before.detail);assert.equal(f.canvas,before.canvas);assert.equal(f.lanes,before.lanes);
 assert.equal(f.state.layout,to);assert.equal(f.document.body.classList.contains('layout-'+to),true);
 assert.equal(f.document.body.classList.contains('layout-'+from),false);assert.equal(f.detail.classList.contains('detail-horizontal'),to==='Horizontal');
 const axis=to==='Horizontal'?'rows':'columns',other=to==='Horizontal'?'columns':'rows';
 assert.equal(f.lanes.style['grid-template-'+axis],`repeat(${count},minmax(0,1fr))`);assert.ok(!f.lanes.style['grid-template-'+other]);
 for(const [i,node]of f.nodes){assert.equal(node.lane.dataset.waveformScrub,to==='Horizontal'?'x':'y');assert.equal(node.control.value,String(i+.25));}
 assert.ok(f.calls.overview>before.calls.overview,'Resized overview canvases need the existing redraw hook');
 assert.equal(f.shape(),`${to}/${count}/Off`,'The orientation-only DOM must own the new rendered shape');
});

test('orientation cache permits the next actual targeted deck render without replacing siblings or mixer',()=>{
 const f=fixture(),before=[...f.nodes.values()];f.change('Vertical');f.flush();const counts={...f.calls};
 f.state.decks[1].track.title='Replacement';f.scope.renderDecks(1);
 assert.equal(f.calls.full,counts.full);assert.equal(f.calls.mixer,counts.mixer);
 for(const i of [0,2,3])assert.equal(f.nodes.get(i),before[i]);assert.notEqual(f.nodes.get(1),before[1]);assert.match(f.nodes.get(1).html,/Replacement/);
});

test('same-value workspace dispatch and non-waveform layouts retain structural rendering',()=>{
 for(const [from,to]of [['Horizontal','Horizontal'],['Vertical','Vertical'],['Horizontal','Stack'],['Stack','Horizontal']]){
  const f=fixture(4,from),before=f.calls.full;f.change(to);assert.equal(f.calls.full,before+1,from+' to '+to);
 }
});

test('missing detail surfaces retain structural recovery instead of leaving an incomplete orientation',()=>{
 const f=fixture();f.removeDetail();
 const before=f.calls.full;f.change('Vertical');assert.equal(f.calls.full,before+1);
});
