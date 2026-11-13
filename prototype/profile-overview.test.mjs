import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
const drawing=source.slice(source.indexOf('function drawWaves('),source.indexOf('\nfunction drawDetailWave('));
function fixture(){
 const tracks=Array.from({length:4},(_,i)=>({id:'track-'+i,bpm:126+i,duration:30,cues:[]}));
 const buffers=new Map(tracks.map(t=>[t.id,{}])),pending=buffers.get(tracks[0].id),geometry=[],painted=[],errors=[];
 let settle,fail,ready=false;const promise=new Promise((resolve,reject)=>{settle=resolve;fail=reject;});
 const decks=tracks.map((track,index)=>({index,track,rate:1,control:{focused:index===0,pointer:index===0?7:null}}));
 const canvases=decks.map((d,index)=>({index,attrs:new Map(),getBoundingClientRect(){geometry.push(index);return{width:400,height:60};},setAttribute(k,v){this.attrs.set(k,v);}}));
 const labels=decks.map(()=>({textContent:''})),state={deckCount:4,decks,focus:0};
 const scope={state,engine:{buffers},sourceWaveLoads:new WeakSet(),overviewWaveViews:[],colors:['red','blue','green','orange'],
  waveformView:()=>({kind:'original',label:'Decoded waveform'}),notify:message=>errors.push(message),
  prepareWaveCanvas:canvas=>({width:400,height:60,context:{clearRect(){painted.push(canvas.index);},fillRect(){}}}),
  paintSourceOverview:(ctx,buffer)=>buffer===pending&&!ready?promise:null,
  $:selector=>{const wave=/^#wave-(\d)$/.exec(selector),label=/^\[data-wave-scope="(\d)"\]$/.exec(selector);return wave?canvases[+wave[1]]:label?labels[+label[1]]:null;}};
 vm.createContext(scope);vm.runInContext(drawing,scope);
 return{scope,state,tracks,buffers,pending,geometry,painted,errors,canvases,labels,
  reset(){geometry.length=0;painted.length=0;},complete(){ready=true;settle({});},reject(){fail(Error('profile failed'));}};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function expectOwners(f,indices){assert.deepEqual(f.geometry,indices,'A ready profile must not measure unrelated overview geometry');assert.deepEqual(f.painted,indices,'A ready profile must not repaint unrelated overviews');}

test('ready source profile refreshes its current overview and accessible labels while retaining controls',async()=>{
 const f=fixture(),owner=f.state.decks[0].control,canvas=f.canvases[0];f.scope.drawWaves(f.tracks[0]);
 assert.equal(f.labels[0].textContent,'Preparing decoded source waveform…');f.reset();f.complete();await flush();
 expectOwners(f,[0]);assert.equal(f.labels[0].textContent,'Decoded waveform · 126.0 BPM');assert.equal(canvas.attrs.get('aria-label'),'Deck 1: Decoded waveform');
 assert.equal(f.canvases[0],canvas);assert.equal(f.state.decks[0].control,owner);assert.equal(owner.pointer,7);assert.equal(owner.focused,true);assert.equal(f.state.focus,0);assert.deepEqual(f.errors,[]);
});
test('ready profile follows current duplicate owners and skips hidden or replaced decks',async()=>{
 const f=fixture();f.state.deckCount=2;f.state.decks[1].track=f.tracks[0];f.state.decks[3].track=f.tracks[0];
 f.scope.drawWaves(f.tracks[0]);f.state.decks[0].track=f.tracks[2];f.reset();f.complete();await flush();expectOwners(f,[1]);
 assert.equal(f.state.decks[0].track,f.tracks[2]);assert.equal(f.labels[1].textContent,'Decoded waveform · 126.0 BPM');assert.deepEqual(f.errors,[]);
});
test('one ready AudioBuffer refreshes distinct current track objects sharing that buffer',async()=>{
 const f=fixture();f.buffers.set(f.tracks[1].id,f.pending);f.scope.drawWaves(f.tracks[0]);f.reset();f.complete();await flush();expectOwners(f,[0,1]);
 assert.equal(f.labels[0].textContent,'Decoded waveform · 126.0 BPM');assert.equal(f.labels[1].textContent,'Decoded waveform · 127.0 BPM');
});
test('profile completion discovers a new visible buffer owner acquired after preparation started',async()=>{
 const f=fixture();f.scope.drawWaves(f.tracks[0]);f.state.decks[0].track=f.tracks[2];f.buffers.set(f.tracks[1].id,f.pending);
 f.reset();f.complete();await flush();expectOwners(f,[1]);assert.equal(f.labels[1].textContent,'Decoded waveform · 127.0 BPM');
 assert.equal(f.canvases[1].attrs.get('aria-label'),'Deck 2: Decoded waveform');assert.equal(f.state.decks[0].track,f.tracks[2]);
});
test('old profile completion does not redraw when the same track now owns another decoded buffer',async()=>{
 const f=fixture();f.scope.drawWaves(f.tracks[0]);f.buffers.set(f.tracks[0].id,{});f.reset();f.complete();await flush();expectOwners(f,[]);assert.deepEqual(f.errors,[]);
});
test('rejected profile reports its error without replacing controls or redrawing unrelated overviews',async()=>{
 const f=fixture(),owner=f.state.decks[0].control;f.scope.drawWaves(f.tracks[0]);f.reset();f.reject();await flush();expectOwners(f,[]);
 assert.deepEqual(f.errors,['Waveform unavailable: profile failed']);assert.equal(f.state.decks[0].control,owner);assert.equal(owner.pointer,7);
});
