import assert from 'node:assert/strict';
import {snapFaderValue as snap} from './fader-preview.js';
for(const kind of ['tempo','cross']){
 const range={min:kind==='tempo'?-8:-1,max:kind==='tempo'?8:1,kind};
 const near=range.max*.02;
 assert.equal(snap(near,range),0);assert.equal(snap(-near,range),0);
 assert.equal(snap(near,range,true),near);
 assert.equal(snap(range.max*.1,range),range.max*.1);
 assert.equal(snap(99,range),range.max);assert.equal(snap(-99,range),range.min);
}
const level={min:0,max:1,kind:'level'};
assert.equal(snap(.01,level),0);assert.equal(snap(.99,level),1);
assert.equal(snap(.5,level),.5);assert.equal(snap(.8,level),.8);
assert.equal(snap(.01,level,true),.01);assert.equal(snap(.99,level,true),.99);
console.log('Fader detent thresholds, bypass, endpoints and free positions pass.');
