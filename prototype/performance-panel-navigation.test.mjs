import test from 'node:test';
import assert from 'node:assert/strict';
import {createPerformancePanelNavigation} from './performance-panel-navigation.js';
test('Settings FX return survives refresh and an already open panel, without following unrelated navigation',()=>{
 const state={panel:null},panel={hidden:true},routes=[{dataset:{panel:'fx'},classList:{remove(){},toggle(){}}}];
 let controls={},renderCount=0,returned=[];
 const head={prepend(button){controls[button.id]=button;}};
 const navigation=createPerformancePanelNavigation({state,$:selector=>selector==='#panel'?panel:selector==='#panel .panel-head'?head:controls[selector.slice(1)],$$:()=>routes,render(){renderCount++;controls={'close-panel':{}};},returnToSettings:scroll=>returned.push(scroll)});
 const previousDocument=globalThis.document;
 globalThis.document={createElement:()=>({dataset:{},setAttribute(){}})};
 try{
  navigation.open('fx');assert.equal(controls['panel-settings-back'],undefined);
  navigation.open('fx',137);assert.equal(panel.hidden,false);assert.equal(renderCount,2);
  navigation.refresh();assert.equal(typeof controls['panel-settings-back']?.onclick,'function');
  controls['panel-settings-back'].onclick();assert.deepEqual(returned,[137]);assert.equal(state.panel,null);assert.equal(panel.hidden,true);
  navigation.open('fx');assert.equal(controls['panel-settings-back'],undefined);
  navigation.open('fx',0);controls['close-panel'].onclick();navigation.open('fx');assert.equal(controls['panel-settings-back'],undefined);
  navigation.open('fx',9);navigation.open('sampler');assert.equal(controls['panel-settings-back'],undefined);
 }finally{globalThis.document=previousDocument;}
});
