import test from 'node:test';
import assert from 'node:assert/strict';
import {refreshSyncPresentation} from './sync-presentation.js';
function fixture(){
 let writes=0;
 const node=()=>({attrs:new Map(),dataset:{syncHint:'Sync'},textContent:'',classList:{toggle(){}},getAttribute(k){return this.attrs.get(k)??null;},setAttribute(k,v){writes++;this.attrs.set(k,v);},get disabled(){return this.attrs.has('disabled');},set disabled(v){writes++;if(v)this.attrs.set('disabled','');else this.attrs.delete('disabled');}});
 const sync=node(),off=node(),master=node(),indicator=node(),label=node();indicator.querySelector=()=>label;indicator.querySelectorAll=()=>[];
 const root={querySelector:s=>s.includes('beat-position')?indicator:s.includes('"syncOff"')?off:s.includes('"syncMaster"')?master:sync};
 const deck={index:0,sync:false,syncState:'off',track:{bpm:120,grid:0,duration:60}},state={smart:true,hasGrid:true,position:0,pending:false,master:true,manual:false};
 return{deck,state,root,sync,off,master,indicator,label,refresh:()=>refreshSyncPresentation(deck,state,root),writes:()=>writes};
}
test('unchanged frame refreshes make no Sync presentation attribute writes',()=>{
 const f=fixture();f.refresh();const before=f.writes();f.refresh();assert.equal(f.writes(),before);
 assert.equal(f.sync.getAttribute('aria-pressed'),'false');assert.equal(f.off.disabled,true);assert.equal(f.master.getAttribute('aria-pressed'),'true');
});
test('pending, master, phase, relative, missing-grid and Simple states still refresh',()=>{
 const f=fixture();f.refresh();Object.assign(f.deck,{sync:true,syncState:'primary',syncRole:'primary'});Object.assign(f.state,{pending:true,manual:true,position:1});f.refresh();
 assert.equal(f.sync.getAttribute('aria-busy'),'true');assert.equal(f.sync.getAttribute('aria-pressed'),'true');assert.equal(f.off.disabled,false);assert.match(f.indicator.getAttribute('aria-label'),/beat 3 of 4/);assert.match(f.master.getAttribute('title'),/^Selected master/);
 Object.assign(f.deck,{sync:false,syncState:'relative'});Object.assign(f.state,{pending:false,master:false});f.refresh();assert.equal(f.off.disabled,false);assert.equal(f.master.getAttribute('aria-pressed'),'false');
 Object.assign(f.state,{hasGrid:false});f.deck.track=null;f.refresh();assert.equal(f.sync.disabled,true);assert.equal(f.label.textContent,'No beatgrid');
 Object.assign(f.state,{smart:false});Object.assign(f.deck,{sync:true});f.refresh();assert.equal(f.sync.disabled,false);assert.equal(f.sync.getAttribute('data-sync-state'),'beat');
});

test('Sync button exposes armed, tempo-only and beat states without replacing the control',()=>{
 const f=fixture();Object.assign(f.deck,{sync:true,syncState:'armed'});f.refresh();
 assert.equal(f.sync.textContent,'SYNC ARMED');
 f.deck.syncState='tempo';f.refresh();assert.equal(f.sync.textContent,'TEMPO SYNC');
 f.deck.syncState='beat';f.refresh();assert.equal(f.sync.textContent,'BEAT SYNC');
 f.state.smart=false;f.refresh();assert.equal(f.sync.textContent,'SIMPLE SYNC');
});
