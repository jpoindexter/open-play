import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {createBeatgrid,gridBPM} from './beatgrid.js';

const source=await readFile(new URL('./panels.js',import.meta.url),'utf8');
const start=source.indexOf('  function grid(d) {'),end=source.indexOf('  function settings(',start);
assert(start>=0&&end>start,'Unique grid editor source boundary');
function editor(failure){
 const track={title:'Track',bpm:120,grid:0,duration:300,gridWarpMarkers:[]};
 const nodes=new Map(),calls=[],node=selector=>{
  if(!nodes.has(selector))nodes.set(selector,{value:selector==='#grid-bpm'?'125':'0',close:()=>calls.push('close')});
  return nodes.get(selector);
 };
 const context={createBeatgrid,gridBPM,time:String,mountGridDrift(){},notify:assert.fail,
  $:node,persist:()=>calls.push('persist'),renderTracks:()=>calls.push('tracks'),renderDecks:()=>calls.push('rebuild'),
  a:{drawWaves:t=>{assert.equal(t,track);calls.push('waves');}},
  engine:{position:()=>0,onGridWillChange:t=>{assert.equal(t.bpm,120);calls.push('before');return 'owned';},onGridChanged:async(t,before)=>{assert.equal(before,'owned');assert.equal(t.bpm,125);calls.push('realign');if(failure)throw Error('realignment failed');}},
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
