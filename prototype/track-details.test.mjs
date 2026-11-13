import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {saveTrackDetails,refreshTrackDetails} from './track-details.js';

function fixture(bpm=123){
 const track={bpm,title:'Before',key:'Am',duration:300},fields=new FormData(),calls=[];
 for(const [k,v] of Object.entries({title:'After',artist:'Artist',album:'Album',bpm,key:'Am',comment:'Note',color:'#123456',rating:4,locked:'on'}))fields.set(k,v);
 const engine={onGridWillChange:t=>{calls.push(['before',t.bpm,t.title]);return 'owned';},onGridChanged:async(t,before)=>calls.push(['after',t.bpm,before])};
 return {track,fields,calls,engine,persist:()=>calls.push(['persist',track.bpm])};
}
test('changed precise BPM revokes old ownership before mutation, then persists and awaits realignment',async()=>{
 const f=fixture();f.fields.set('bpm','124.230000123');
 await saveTrackDetails(f.track,f.fields,f.engine,f.persist);
 assert.deepEqual(f.calls,[['before',123,'Before'],['persist',124.230000123],['after',124.230000123,'owned']]);
 assert.equal(f.track.metadataSources.bpm,'manual');assert.equal(f.track.locked,true);
});
test('unchanged BPM does not disturb Sync; failed realignment reports saved metadata',async()=>{
 const f=fixture();await saveTrackDetails(f.track,f.fields,f.engine,f.persist);
 assert.deepEqual(f.calls,[['persist',123]]);assert.equal(f.track.title,'After');
 f.fields.set('bpm','124');f.engine.onGridChanged=async()=>{throw Error('voice failed');};
 await assert.rejects(saveTrackDetails(f.track,f.fields,f.engine,f.persist),/Details saved; playback realignment failed: voice failed/);
 assert.equal(f.track.bpm,124);assert.equal(f.calls.at(-1)[0],'persist');
});
test('failed detail persistence still realigns changed BPM and keeps the save failure explicit',async()=>{
 const f=fixture();f.fields.set('bpm','124.23');
 await assert.rejects(saveTrackDetails(f.track,f.fields,f.engine,()=>false),/session only.*Saving failed/s);
 assert.deepEqual(f.calls,[['before',123,'Before'],['after',124.23,'owned']]);
 assert.equal(f.track.title,'After');
});
test('failed persistence plus realignment failure never claims metadata was saved',async()=>{
 const f=fixture();f.fields.set('bpm','124.23');f.engine.onGridChanged=async()=>{throw Error('voice failed');};
 await assert.rejects(saveTrackDetails(f.track,f.fields,f.engine,()=>false),/session only; saving failed; playback realignment failed: voice failed/);
});
test('metadata refresh reaches duplicate visible owners without replacing their controls',()=>{
 const track={title:'Edited',artist:'Artist',duration:300,key:'Am'},other={key:'C'};
 const nodes=[0,1,2].map(()=>({title:{},artist:{},querySelector(s){return s==='.deck-title strong'?this.title:s==='.deck-title small'?this.artist:null;}}));
 const root={querySelector:s=>nodes[Number(s.match(/data-focus="(\d)"/)[1])]};
 refreshTrackDetails({deckCount:3,decks:[{index:0,track},{index:1,track:other},{index:2,track}]},track,String,root);
 assert.equal(nodes[0].title.textContent,'Edited');assert.equal(nodes[2].artist.textContent,'Artist · 300');
 assert.equal(nodes[1].title.textContent,undefined);
});
test('actual form rejects duplicate submissions and does not close a replacement dialog',async()=>{
 const source=await readFile(new URL('./panels.js',import.meta.url),'utf8');
 const start=source.indexOf('  function trackDetails(t) {'),end=source.indexOf('  function editPad(',start);
 let resolve,saves=0,closes=0,refreshes=0;
 const button={},status={setAttribute(){}},form={isConnected:true,querySelector:()=>button,append(){}};
 const body={querySelector:()=>form};
 const context={track:{bpm:123,color:'#123456'},esc:String,document:{createElement:()=>status},FormData:class{},
  dialog:(_t,_html,mount)=>mount(body),$:()=>({close:()=>closes++}),s:{},time:String,engine:{},persist(){},
  renderTracks(){},refreshTrackDetails:()=>refreshes++,a:{drawWaves(){}},
  saveTrackDetails:()=>{saves++;return new Promise(r=>{resolve=r;});}};
 vm.runInNewContext(source.slice(start,end)+'\ntrackDetails(track);',context);
 const first=form.onsubmit({preventDefault(){}});await form.onsubmit({preventDefault(){}});
 assert.equal(saves,1);assert.equal(button.disabled,true);
 form.isConnected=false;resolve();await first;
 assert.equal(closes,0);assert.equal(refreshes,1);assert.equal(button.disabled,false);
});
