import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Execute the real file-input handler; storage/UI collaborators record side effects.
async function restore(data) {
  const source=fs.readFileSync(new URL('./panels.js',import.meta.url),'utf8');
  const begin=source.indexOf('$("#restore-library").onchange = async (e) => {');
  const end=source.indexOf('\n        };',begin)+11;
  const track={id:'one',title:'Original',cues:[],savedLoops:[],duration:200,bpm:120,grid:0};
  const s={tracks:[track],crates:[{id:'old',name:'Original',tracks:['one']}],settings:{'Quantize Value':'1 Beat'},decks:[],samples:[]};
  const before=JSON.stringify(s),nodes={},calls=[];
  let validation={};try{validation=await import('./library-state.js');}catch(error){if(error.code!=='ERR_MODULE_NOT_FOUND')throw error;}
  const ctx={...validation,s,trackById:()=>track,$:id=>nodes[id]??={},a:{trackGain:{refresh(){}}},persist(){calls.push('save');return true;},renderCrates(){},renderTracks(){},renderDecks(){},notify(){},engine:{setMonitorSettings(){},setMixerSettings(){}},monitorState(){},mixerSettingsFromPreferences(){},refreshChannelFilters(){},applyEQBoost(){}};
  vm.runInNewContext(source.slice(begin,end),ctx);
  await nodes['#restore-library'].onchange({target:{files:[{text:async()=>JSON.stringify(data)}]}});
  return {before,after:JSON.stringify(s),calls,message:nodes['#library-tool-result']?.textContent};
}
const backup=tags=>({format:'open-play-prototype-1',crates:[{id:'new',name:'Replacement',tracks:[]}],settings:{'Quantize Value':'1 Beat'},tags});
for(const [name,patch] of Object.entries({nullCues:{cues:null},badColor:{color:'" onpointerenter="bad'},badLoop:{savedLoops:[{start:5,end:2}]},badGrid:{gridWarpMarkers:[{time:4,bpm:0}]}}))test(`invalid ${name} leaves live state and persistence untouched`,async()=>{
  const result=await restore(backup([{id:'one',...patch}]));
  assert.equal(result.after,result.before);assert.deepEqual(result.calls,[]);assert.match(result.message,/invalid/i);
});
test('invalid preference cannot partially replace crates',async()=>{
  const data=backup([]);data.settings['Quantize Value']=1;
  const result=await restore(data);assert.equal(result.after,result.before);assert.deepEqual(result.calls,[]);
});
test('valid older backup restores metadata',async()=>{
  const result=await restore(backup([{id:'one',title:'Restored',cues:[{position:4,name:'Cue'}],savedLoops:[],color:'#abcdef'}]));
  assert.match(result.after,/Restored/);assert.deepEqual(result.calls,['save']);
});
