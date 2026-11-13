import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createBeatgrid} from './beatgrid.js';
const source=readFileSync(new URL('./app.js',import.meta.url),'utf8');
const body=source.slice(source.indexOf('function quantized('),source.indexOf('async function deckAction('));
test('quantized Cue and loop positions stay inside the audio at both edges',()=>{
 const state={settings:{'Quantize Value':'1 beat'}},scope={state,createBeatgrid,deckQuantize:d=>d.quantize};
 vm.runInNewContext(source.match(/^const clamp =.*$/m)[0]+'\n'+body+'\nglobalThis.snap=quantized;',scope);
 const d={quantize:true,track:{bpm:123,grid:0.3560693446462153,duration:2.3,gridWarpMarkers:[]}};
 assert.equal(scope.snap(d,0),0,'The nearest beat before the file cannot become a negative Cue/Loop In');
 assert.equal(scope.snap(d,2.3),2.3,'The nearest beat after the file cannot become an invalid Loop Out');
 assert.ok(Math.abs(scope.snap(d,1)-(d.track.grid+60/123))<1e-12,'Interior beat snapping is unchanged');
 state.settings['Quantize Value']='1/2 beat';
 assert.ok(Math.abs(scope.snap(d,.49)-(d.track.grid+30/123))<1e-12,'Fractional beat snapping is unchanged');
 d.quantize=false;assert.equal(scope.snap(d,.1234),.1234,'Free Cue/loop positions remain unsnapped');
});
