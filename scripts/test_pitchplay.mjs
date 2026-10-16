import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pitchRanges,parseMusicalKey,shiftedKey,keyLabel,harmonicallyCompatible,planKeySync} from '../prototype/pitchplay.js';
const tests=[];function test(name,fn){fn();tests.push({name,passed:true});}
test('Hercules Middle map preserves documented physical order',()=>assert.deepEqual([...pitchRanges.Middle],[0,1,2,3,-4,-3,-2,-1]));
test('Up and Down retain root positions',()=>{assert.equal(pitchRanges.Up[4],0);assert.equal(pitchRanges.Down[3],0);assert.equal(pitchRanges.Up[3],7);assert.equal(pitchRanges.Down[4],-7);});
for(const [text,pc,minor] of [['8A',9,true],['8B',0,false],['1m',9,true],['1d',0,false],['Am',9,true],['F# minor',6,true],['Bb',10,false],['D♭ major',1,false]])test(`Parse ${text}`,()=>assert.deepEqual(parseMusicalKey(text),{pc,minor}));
test('Unknown key remains unknown',()=>assert.equal(parseMusicalKey('unknown'),null));
test('Relative major/minor compatible without changing mode',()=>assert.equal(harmonicallyCompatible(parseMusicalKey('Am'),parseMusicalKey('C')),true));
test('Adjacent circle-of-fifths major keys compatible',()=>assert.equal(harmonicallyCompatible(parseMusicalKey('C'),parseMusicalKey('G')),true));
test('Parallel minor/major is not automatically compatible',()=>assert.equal(harmonicallyCompatible(parseMusicalKey('Am'),parseMusicalKey('A')),false));
const own={index:0,track:{key:'Am'},keyShift:0,rate:1,keylock:true},other={index:1,track:{key:'C#m'},keyShift:0,rate:1,keylock:true};
test('Sync chooses closest compatible shift, not forced exact match',()=>{const p=planKeySync(own,[own,other]);assert.equal(p.semitones,-1);assert.equal(p.key,'Abm');});
test('Compatible relative key retains original mode and zero shift',()=>assert.equal(planKeySync(own,[own,{...other,track:{key:'C'}}]).semitones,0));
test('Missing source or peer metadata refuses sync',()=>{assert.equal(planKeySync({...own,track:{key:'—'}},[other]).ok,false);assert.equal(planKeySync(own,[own]).ok,false);});
test('Incompatible currently synced peers refuse sync',()=>assert.equal(planKeySync(own,[own,{...other,keySync:true,track:{key:'C'}},{...other,index:2,keySync:true,track:{key:'F#'}}]).ok,false));
test('Microtonal unlocked reference speed refuses false harmonic match',()=>assert.equal(planKeySync(own,[own,{...other,keylock:false,rate:1.05}]).ok,false));
test('Negative pitch shifts wrap pitch class and preserve minor mode',()=>assert.equal(keyLabel(shiftedKey(parseMusicalKey('Cm'),-1)),'Bm'));
const result={tests,passed:tests.length,scope:'Deterministic independent policy and published hardware map checks; no browser or reference DSP equivalence claim.'};console.log(JSON.stringify(result,null,2));fs.writeFileSync(new URL('../docs/prototype/pitchplay-policy-results.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
