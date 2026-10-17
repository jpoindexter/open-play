import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import * as midi from '../prototype/midi.js';

// An independent Open Play mapping policy, not an inferred Serato taper.
const checks=[];
function check(name,run){try{const evidence=run();checks.push({name,passed:true,evidence});}catch(error){checks.push({name,passed:false,error:error.message});}}
const cc=value=>midi.decodeMIDI([0xb0,16,value]);
check('A full seven-bit controller sweep reaches both limits and neutral',()=>{
 assert.equal(typeof midi.keyShiftSemitones,'function','MIDI Key Shift action is missing');
 const values=[0,32,63,64,95,127].map(value=>midi.keyShiftSemitones(cc(value),'7-bit absolute',0));
 assert.deepEqual(values,[-24,-12,0,0,12,24]);return{values};
});
check('Relative encoders accumulate semitones in both supported encodings',()=>{
 let value=0;const steps=[1,1,127,127].map(v=>value=midi.keyShiftSemitones(cc(v),'Relative two’s complement',value));
 assert.deepEqual(steps,[1,2,1,0]);
 const offset=[65,65,63,64].map(v=>value=midi.keyShiftSemitones(cc(v),'Relative offset',value));
 assert.deepEqual(offset,[1,2,1,1]);return{steps,offset};
});
check('Absolute pitch-bend uses its fourteen-bit range rather than seven-bit scaling',()=>{
 const messages=[[0xe0,0,0],[0xe0,0,64],[0xe0,127,127]].map(midi.decodeMIDI);
 const values=messages.map(m=>midi.keyShiftSemitones(m,'14-bit absolute',0));
 assert.deepEqual(values,[-24,0,24]);return{values};
});
check('Paired fourteen-bit CC messages keep the parser pair and reach center',()=>{
 const pairs=new Map(), a=midi.decodeMIDI([0xb0,0,64]), b=midi.decodeMIDI([0xb0,32,0]);
 assert.equal(midi.keyShiftSemitones(a,'14-bit absolute',0,pairs),0);
 assert.equal(midi.keyShiftSemitones(b,'14-bit absolute',0,pairs),0);
 assert.deepEqual([...pairs.values()],[[64,0]]);return{pair:[...pairs.values()][0]};
});
check('Relative motion saturates declared pitch-renderer limits and leaves zero-delta neutral',()=>{
 assert.equal(midi.keyShiftSemitones(cc(1),'Relative two’s complement',24),24);
 assert.equal(midi.keyShiftSemitones(cc(127),'Relative two’s complement',-24),-24);
 assert.equal(midi.keyShiftSemitones(cc(0),'Relative two’s complement',5),5);return{range:[-24,24]};
});
check('Note-off does not turn a learned velocity control into minimum pitch',()=>{
 assert.equal(midi.keyShiftSemitones(midi.decodeMIDI([0x80,60,20]),'7-bit absolute',7),null);
 assert.equal(midi.keyShiftSemitones(midi.decodeMIDI([0x90,60,0]),'7-bit absolute',7),null);
 assert.equal(midi.keyShiftSemitones(midi.decodeMIDI([0x90,60,127]),'7-bit absolute',7),24);return{noteOffIgnored:true};
});
check('Non-finite input cannot dispatch a non-finite audio parameter',()=>{
 assert.throws(()=>midi.keyShiftSemitones({...cc(1),value:NaN},'7-bit absolute',0),RangeError);
 assert.throws(()=>midi.keyShiftSemitones(cc(1),'Relative offset',NaN),RangeError);return{invalidRejected:true};
});
check('Synthetic review messages use the same MIDI decoder for CC, note-off and pitch bend',()=>{
 assert.equal(typeof midi.syntheticMIDIMessage,'function','Configurable synthetic MIDI review input is missing');
 const cc=midi.syntheticMIDIMessage({type:'CC',channel:2,number:16,value:96});
 const bend=midi.syntheticMIDIMessage({type:'Pitch bend',channel:1,number:0,value:8192});
 const off=midi.syntheticMIDIMessage({type:'Note',channel:1,number:60,value:0});
 assert.deepEqual(cc,{type:'CC',channel:2,number:16,value:96,pressed:true});
 assert.equal(bend.value,8192);assert.equal(bend.type,'Pitch bend');assert.equal(off.pressed,false);return{cc,bend,off};
});
check('Synthetic input rejects invalid fields rather than dispatching corrupt MIDI',()=>{
 for(const fields of [{channel:0},{channel:17},{number:128},{value:128},{value:1.2},{type:'SysEx'}])
  assert.throws(()=>midi.syntheticMIDIMessage({type:'CC',channel:1,number:1,value:64,...fields}),RangeError);
 return{invalidFieldSets:6};
});
check('Fourteen-bit CC mapping accepts only its actual MSB/LSB pair',()=>{
 assert.equal(typeof midi.matchesMIDIMap,'function','Bounded MIDI mapping match is missing');
 const mapping={type:'CC',channel:1,number:16,encoding:'14-bit absolute'};
 const accepted=[16,48,80,112].map(number=>midi.matchesMIDIMap(midi.decodeMIDI([0xb0,number,64]),mapping));
 assert.deepEqual(accepted,[true,true,false,false]);
 assert.equal(midi.matchesMIDIMap(midi.decodeMIDI([0xb0,16,64]),{...mapping,number:80}),false);
 assert.equal(midi.matchesMIDIMap(midi.decodeMIDI([0xb1,16,64]),mapping),false);return{accepted};
});
const files=['prototype/midi.js','prototype/app.js','prototype/panels.js'];
const result={executed_at:new Date().toISOString(),scope:'Actual MIDI decoder/conversion policy only. No UI, audio, physical device or vendor equivalence acceptance.',passed:checks.filter(c=>c.passed).length,failed:checks.filter(c=>!c.passed).length,checks,source_hashes:files.map(path=>({path,sha256:crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex')}))};
const output=process.argv[2]||'docs/prototype/midi-keyshift-controlled-results.json';fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));assert.equal(result.failed,0);
