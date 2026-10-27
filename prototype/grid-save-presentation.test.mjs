import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {createBeatgrid,gridBPM} from './beatgrid.js';
import {saveBeatgrid} from './beatgrid-save.js';

const source=await readFile(new URL('./panels.js',import.meta.url),'utf8');
const start=source.indexOf('  function grid(d) {'),end=source.indexOf('  function settings(',start);
assert(start>=0&&end>start,'Unique grid editor source boundary');
function editor(failure,saved=true,waiting=null){
 const track={title:'Track',bpm:120,grid:0,duration:300,gridWarpMarkers:[]};
 const nodes=new Map(),calls=[],node=selector=>{
  if(!nodes.has(selector))nodes.set(selector,{isConnected:true,value:selector==='#grid-bpm'?'125':'0',close:()=>calls.push('close')});
  return nodes.get(selector);
 };
 const context={createBeatgrid,gridBPM,saveBeatgrid,time:String,mountGridDrift(){},notify:assert.fail,
  $:node,persist:()=>{calls.push('persist');return saved;},renderTracks:()=>calls.push('tracks'),renderDecks:()=>calls.push('rebuild'),
  a:{drawWaves:t=>{assert.equal(t,track);calls.push('waves');}},
  engine:{position:()=>0,onGridWillChange:t=>{assert.equal(t.bpm,calls.length?125:120);calls.push('before');return 'owned';},onGridChanged:async(t,before)=>{assert.equal(before,'owned');assert.equal(t.bpm,125);calls.push('realign');if(waiting)await waiting;if(failure)throw Error('realignment failed');}},
  dialog:(_title,_html,mount)=>mount({querySelectorAll:()=>[]})};
 vm.runInNewContext(source.slice(start,end)+'\ngrid(deck);',{...context,deck:{track}});
 return {track,calls,nodes,node};
}
test('grid save refreshes only its track after realignment, without rebuilding controls',async()=>{
 const e=editor();await e.node('#grid-save').onclick();
 assert.equal(e.track.bpm,125);assert.deepEqual(e.calls,['before','persist','realign','waves','tracks','close']);
});
test('failed realignment retains saved metadata, refreshes in place and leaves the error visible',async()=>{
 const e=editor(true);await e.node('#grid-save').onclick();
 assert.equal(e.track.bpm,125);assert.deepEqual(e.calls,['before','persist','realign','waves','tracks']);
 assert.match(e.node('#grid-status').textContent,/Grid saved; playback realignment failed: realignment failed/);
});
test('invalid BPM changes neither metadata nor playback or controls',async()=>{
 const e=editor();e.node('#grid-bpm').value='1000';await e.node('#grid-save').onclick();
 assert.equal(e.track.bpm,120);assert.deepEqual(e.calls,[]);assert.match(e.node('#grid-status').textContent,/valid BPM/);
});
test('failed grid persistence still realigns and leaves unsaved edits retryable',async()=>{
 const e=editor(false,false);await e.node('#grid-save').onclick();
 assert.equal(e.track.bpm,125);assert.deepEqual(e.calls,['before','persist','realign','waves','tracks']);
 assert.match(e.node('#grid-status').textContent,/session only.*Saving failed/s);
});
test('failed save plus failed grid realignment never claims persistence succeeded',async()=>{
 const e=editor(true,false);await e.node('#grid-save').onclick();
 assert.deepEqual(e.calls,['before','persist','realign','waves','tracks']);
 assert.match(e.node('#grid-status').textContent,/session only; saving failed; playback realignment failed/);
});
test('saved warp markers are cloned and legacy annotations clear only when requested',async()=>{
 const marker={time:4,bpm:130},track={bpm:120,gridMarkers:[5]},calls=[];
 await saveBeatgrid(track,{bpm:125,grid:.125,gridWarpMarkers:[marker]},true,{onGridChanged:async()=>calls.push('realign')},()=>true);
 assert.equal(track.gridWarpMarkers[0].time,4);marker.time=9;
 assert.equal(track.gridWarpMarkers[0].time,4);assert.deepEqual(track.gridMarkers,[]);assert.deepEqual(calls,['realign']);
});
test('pending grid save cannot submit twice',async()=>{
 let finish;const e=editor(false,true,new Promise(resolve=>{finish=resolve;})),button=e.node('#grid-save');
 const first=button.onclick(),second=button.onclick(),count=e.calls.filter(x=>x==='persist').length,disabled=button.disabled;
 finish();await Promise.all([first,second]);
 assert.equal(count,1);assert.equal(disabled,true);assert.equal(button.disabled,false);
});
test('pending grid save cannot close a replacement dialog',async()=>{
 let finish;const e=editor(false,true,new Promise(resolve=>{finish=resolve;})),button=e.node('#grid-save');
 const pending=button.onclick();button.isConnected=false;e.nodes.set('#modal',{close:()=>e.calls.push('replacement-close')});
 finish();await pending;assert(!e.calls.includes('replacement-close'));
});
test('pending grid save error stays with its original status instead of a replacement editor',async()=>{
 let finish;const e=editor(true,true,new Promise(resolve=>{finish=resolve;})),status=e.node('#grid-status'),replacement={textContent:'New editor'};
 const pending=e.node('#grid-save').onclick();e.node('#grid-save').isConnected=false;e.nodes.set('#grid-status',replacement);
 finish();await pending;assert.equal(replacement.textContent,'New editor');assert.match(status.textContent,/realignment failed/);
});
