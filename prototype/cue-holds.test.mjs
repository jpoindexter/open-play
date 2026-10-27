import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createCueHolds} from './holds.js';
import {refreshCueControls} from './transport-presentation.js';
function fixture(presentation={}) {
  const d={index:0,track:{id:'a',cues:[]},cue:2,position:2,playing:false};
  const starts=[],pending=[];
  const engine={init(){},position:d=>d.position,pause(d){d.playing=false;},
    seek(d,p){d.position=p;return new Promise(resolve=>pending.push(resolve));},
    async start(d){starts.push(d.track.id);d.playing=true;},beginSlip(){},async endSlip(){}};
  const holds=createCueHolds({engine,state:{decks:[d]},quantized:(_,p)=>p,record(){},persist(){},render(){},notify(message){throw Error(message);},...presentation});
  return {d,holds,starts,pending};
}
test('replacement invalidates pending audition and cannot latch the next Play',async()=>{
  const {d,holds,starts,pending}=fixture(),press=holds.press('i',d);
  d.track={id:'b',cues:[]};pending.shift()();await press;
  assert.deepEqual(starts,[]);assert.equal(holds.latch(d),false);
});
test('cancelDeck revokes ownership synchronously, including same-track reload/stop',async()=>{
  const {d,holds,starts,pending}=fixture(),press=holds.press('i',d);
  holds.cancelDeck(d);assert.equal(holds.latch(d),false);
  pending.shift()();await press;await holds.release('i');assert.deepEqual(starts,[]);
});
test('release before preparation finishes never starts playback',async()=>{
  const {d,holds,starts,pending}=fixture(),press=holds.press('i',d),release=holds.release('i');
  pending.splice(0).forEach(resolve=>resolve());await Promise.all([press,release]);
  assert.deepEqual(starts,[]);assert.equal(d.playing,false);assert.equal(d.position,2);
});
test('audition release returns paused, while Cue plus Play latches',async()=>{
  for(const latch of [false,true]){
    const {d,holds,pending}=fixture(),press=holds.press('i',d);pending.shift()();await press;
    assert.equal(d.playing,true);if(latch)assert.equal(holds.latch(d),true);
    const release=holds.release('i');pending.splice(0).forEach(resolve=>resolve());await release;
    assert.equal(d.playing,latch);assert.equal(d.position,2);
  }
});
test('Cue plus Play during pending preparation continues after Cue release',async()=>{
  const {d,holds,starts,pending}=fixture(),press=holds.press('i',d);
  assert.equal(holds.latch(d),true);
  await holds.release('i');
  pending.shift()();await press;
  assert.deepEqual(starts,['a']);assert.equal(d.playing,true);
});
test('cancelling a pending Cue plus Play still prevents a queued restart',async()=>{
  const {d,holds,starts,pending}=fixture(),press=holds.press('i',d);
  holds.latch(d);await holds.release('i');holds.cancelDeck(d);
  pending.shift()();await press;
  assert.deepEqual(starts,[]);assert.equal(d.playing,false);
});
test('actual Play stop revokes released Cue ownership before pending seek completes',async()=>{
  const {d,holds,starts,pending}=fixture();
  const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
  const begin=source.indexOf('async function play(d) {');
  const end=source.indexOf('\nfunction deckQuantize',begin);
  assert(begin>=0&&end>begin);
  const playRequests=new WeakMap();
  const context={cueHolds:holds,pitchPlay:{latch:()=>false},playRequests,state:{},
    cancelPendingPlay:d=>{playRequests.delete(d);d.playQueued=false;},
    slicer:{cancelDeck(){}},stemSlipControls:{cancelDeck(){}},
    engine:{pause:d=>{d.playing=false;d.processing=false;}},smartSync:{paused(){},reconcile(){}},
    persist(){},renderDecks(){},renderTracks(){},refreshTransportControls(){}};
  vm.runInNewContext(source.slice(begin,end)+';globalThis.realPlay=play;',context);
  const press=holds.press('i',d);
  holds.latch(d);await holds.release('i');
  d.processing=true;
  await context.realPlay(d);
  pending.shift()();await press;
  assert.deepEqual(starts,[],'stopped transport must not restart from the old Cue request');
  assert.equal(d.playing,false);
});

test('temporary Cue pause, cue-set and release use transport refresh without rebuilding controls',async()=>{
 let rebuilds=0,refreshes=0;
 const {d,holds,pending}=fixture({render(){rebuilds++;},refresh(){refreshes++;}});
 const audition=holds.press('i',d);pending.shift()();await audition;
 const released=holds.release('i');pending.shift()();await released;
 d.position=3;const set=holds.press('i',d);pending.shift()();await set;
 d.playing=true;const pause=holds.press('i',d);pending.shift()();await pause;
 assert.equal(rebuilds,0);assert.equal(refreshes,3);assert.equal(d.playing,false);assert.equal(d.cue,3);
});

test('hot-cue creation and deletion refresh only shared cue presentation',async()=>{
 let rebuilds=0;const refreshed=[],f=fixture({render(){rebuilds++;},refreshCues:track=>refreshed.push(track)});
 await f.holds.press('pad',f.d,0);assert.equal(f.d.track.cues[0].position,2);
 await f.holds.press('pad',f.d,0,true);assert.equal(f.d.track.cues[0],null);
 assert.equal(rebuilds,0);assert.deepEqual(refreshed,[f.d.track,f.d.track]);
});
test('Cue Point form save and delete refresh the shared track without rebuilding decks',()=>{
 const source=readFileSync(new URL('./panels.js',import.meta.url),'utf8'),begin=source.indexOf('  function editPad('),end=source.indexOf('  function columns(',begin);
 const track={cues:[{name:'Before',position:2}],duration:300},d={tab:'Cues',track},form={},fields=new Map([['name','After'],['position','3.25']]);let saves=0,rebuilds=0,closes=0;const refreshed=[];
 const context={d,esc:String,FormData:class{get(k){return fields.get(k);}},persist:()=>saves++,renderDecks:()=>rebuilds++,a:{refreshCueControls:t=>refreshed.push(t)},dialog:(_t,_h,mount)=>mount({querySelector:()=>form}),$:s=>s==='#delete-cue'?context.remove:{close:()=>closes++},remove:{}};
 vm.runInNewContext(source.slice(begin,end)+'\neditPad(d,0);',context);form.onsubmit({preventDefault(){},target:{}});context.remove.onclick();
 assert.equal(saves,2);assert.equal(closes,2);assert.equal(rebuilds,0);assert.equal(track.cues[0],null);assert.deepEqual(refreshed,[track,track]);
});

test('cue pad refresh keeps plain-layout text nodes and skips unrelated modes and owners',()=>{
 const track={cues:[{name:'Plain cue',position:2.5}]},text={nodeType:3,textContent:'+'},detail={textContent:'1'},classes=new Set();
 const pad={dataset:{pad:'0'},childNodes:[text],querySelector:s=>s==='small'?detail:null,classList:{toggle:(name,on)=>on?classes.add(name):classes.delete(name)},setAttribute(name,value){this[name]=value;}};
 const state={deckCount:3,decks:[{index:0,tab:'Cues',track},{index:1,tab:'Loops',track},{index:2,tab:'Cues',track:{}},{index:3,tab:'Cues',track}]};
 let queries=0;const root={querySelectorAll(selector){queries++;assert.match(selector,/data-deck="0"/);return[pad];}};
 refreshCueControls(state,track,String,root);assert.equal(queries,1);assert.equal(text.textContent,'Plain cue');assert.equal(detail.textContent,'2.5');assert(classes.has('set'));assert.equal(pad['aria-label'],'Deck 1 hot cue 1');
 track.cues[0]=null;refreshCueControls(state,track,String,root);assert.equal(text.textContent,'+');assert.equal(detail.textContent,1);assert(!classes.has('set'));assert.match(pad['aria-label'],/empty/);
});
