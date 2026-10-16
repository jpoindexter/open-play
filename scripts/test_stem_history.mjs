import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
let Processor, last;
const context = vm.createContext({sampleRate:128,currentFrame:0,Float32Array,Math,
  AudioWorkletProcessor:class {constructor(){this.port={postMessage(data){last=data;}};}},
  registerProcessor(name, value){Processor=value;}
});
vm.runInContext(fs.readFileSync(new URL('../prototype/stem-history-worklet.js',import.meta.url),'utf8'),context);
const processor = new Processor();
function block(left,right=left){const input=[new Float32Array(128).fill(left),new Float32Array(128).fill(right)]; const output=[new Float32Array(128),new Float32Array(128)];processor.process([input],[output]);context.currentFrame+=128;assert.ok(Math.abs(output[0][0]-left)<1e-6);assert.ok(Math.abs(output[1][0]-right)<1e-6);}
function capture(seconds,atTime=context.currentFrame/128){processor.port.onmessage({data:{type:'capture',id:1,seconds,atTime}});return last.channels;}
const tests=[];
block(.25,.5);
let channels=capture(2);
assert.ok(channels[0].slice(0,128).every(v=>v===0));assert.ok(channels[0].slice(128).every(v=>v===.25));assert.ok(channels[1].slice(128).every(v=>v===.5));tests.push({name:'Near-start captures silence padding plus actual stereo input',passed:true});
block(.75);
channels=capture(1,1);assert.ok(channels[0].every(v=>v===.25));tests.push({name:'Timestamp excludes samples processed after trigger despite late message',passed:true});
for(const value of [.1,.2,.3,.4,.5])block(value);
channels=capture(2);assert.ok(channels[0].slice(0,128).every(v=>Math.abs(v-.4)<1e-6));assert.ok(channels[0].slice(128).every(v=>v===.5));tests.push({name:'Ring wrap retains most recent actual input sequence',passed:true});
processor.port.onmessage({data:{type:'clear'}});channels=capture(2);assert.ok(channels.every(c=>c.every(v=>v===0)));tests.push({name:'Emergency clear removes prior audio history',passed:true});
const report={scope:'Executed actual AudioWorklet processor class in Node vm with deterministic input blocks. Does not establish browser scheduling or engine routing.',tests};
console.log(JSON.stringify(report,null,2));
fs.writeFileSync(new URL('../docs/prototype/stem-history-signal-results.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
