import assert from 'node:assert/strict';
import {createControllerPerformance,validateControllerConditions} from '../prototype/controller-performance.js';
const state={decks:[{index:0,tab:'Cues'},{index:1,tab:'Cues'}]},routed=[];
const router=createControllerPerformance({state,dispatch:async(m,map)=>routed.push(map.target)});
const message=(number,pressed=true,deviceId='authored')=>({type:'Note',channel:2,number,pressed,deviceId});
const mapping=target=>({target,controllerProfile:'profile'});
const normal={...mapping('Prepare add'),conditions:[{kind:'modifier',number:1,deck:0,equals:false}]};
const shifted={...mapping('Prepare open'),conditions:[{kind:'modifier',number:1,deck:0,equals:true}]};
assert(router.matches(message(3),normal));assert(!router.matches(message(3),shifted));
await router.dispatch(message(4),mapping('Controller modifier 1'));
assert(router.matches(message(3),shifted));assert(!router.matches(message(3),normal));
await router.dispatch(message(5),mapping('Controller modifier 1'));router.release(message(4,false));
assert(router.matches(message(3),shifted),'One release cleared a separately held modifier');
assert(!router.matches(message(3,true,'other'),shifted),'Modifier leaked to another device');
router.resetInput('authored');assert(router.matches(message(3),normal));
for(const [mode,target] of [['hot cues','Deck 1 hot cue 1'],['auto loop','Deck 1 auto loop pad 1'],['loop roll','Deck 1 loop roll pad 1'],['manual loop','Deck 1 manual loop pad 1'],['stems','Deck 1 stems pad 1'],['sampler','Sampler 1'],['pitch play','Deck 1 pitch play pad 1'],['scratch bank','Deck 1 scratch bank pad 1']]){
 const button=message(20);await router.dispatch(button,mapping('Deck 1 pad mode '+mode));router.release({...button,pressed:false});
 await router.dispatch(message(0),mapping('Deck 1 active pad 1'));assert.equal(routed.at(-1),target);
 assert(router.matches(message(0),{conditions:[{kind:'padMode',deck:1,equals:mode,negate:false}]}));
 assert(!router.matches(message(0),{conditions:[{kind:'padMode',deck:1,equals:mode,negate:true}]}));
}
const before=routed.length;await router.dispatch(message(0,false),mapping('Deck 1 active pad 1'));assert.equal(routed.length,before,'Release reinterpreted the new mode');
assert.throws(()=>validateControllerConditions([{kind:'unresolved',deck:1}]),/Unknown/);
assert.throws(()=>validateControllerConditions([{kind:'modifier',deck:0,number:17,equals:true}]),/Invalid/);
console.log('Modifier predicates/ownership/device isolation, disconnect reset, eight pad modes and captured-release policy passed');
