import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrackGain} from './track-gain.js';

test('continuous gain edits stay live while explicit and default commits remain durable',()=>{
 const track={id:'gain',trackGainDb:0},state={tracks:[track],decks:[{index:0,track}],settings:{'Use Auto Gain':false}};
 let saves=0,live;
 const engine={setDeckTrackGain:(index,value)=>{live=value;},updateSampleTrackGain(){}};
 const gain=createTrackGain({state,engine,persist:()=>{saves++;}});
 gain.set(track,-4,{save:false});
 assert.equal(live,-4);assert.equal(track.sampleGain,-4);assert.equal(saves,0);
 gain.set(track,-3);
 assert.equal(live,-3);assert.equal(track.sampleGain,-3);assert.equal(saves,1);
});
