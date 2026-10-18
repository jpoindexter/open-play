import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {validateLPFParameters} from '../prototype/lpf-parameters.js';
const rows=[];
const valid={Resonance:'1.77',Slope:'12 dB','Min Freq':'400 Hz','Max Freq':'400 Hz'};
function check(name,proposal,ok,fields=[]){const original=structuredClone(proposal),r=validateLPFParameters(proposal);assert.equal(r.ok,ok,name);assert.deepEqual(proposal,original,name+' mutated input');if(!ok){assert.equal(r.params,null);assert.deepEqual(Object.keys(r.errors).sort(),fields.sort(),name);}rows.push({name,proposal,result:r,inputUnchanged:true,passed:true});return r;}
check('Omitted fields use defaults',{},true);
assert.deepEqual(check('Units, exponent, whitespace normalize as one proposal',{Resonance:' 2e0 ',Slope:'18 dB/octave','Min Freq':'.4 kHz','Max Freq':'4e2 HZ',legacy:'keep'},true).params,{Resonance:'2',Slope:'18 dB','Min Freq':'400 Hz','Max Freq':'400 Hz',legacy:'keep'});
check('Numeric lower boundaries',{Resonance:.1,Slope:6,'Min Freq':20,'Max Freq':20},true);
check('Numeric upper boundaries',{Resonance:12,Slope:48,'Min Freq':20000,'Max Freq':20000},true);
for(const value of ['','NaN','Infinity','1e999','400 Hz junk',null,{},[]])check('Reject invalid frequency '+JSON.stringify(value),{...valid,'Min Freq':value},false,['Min Freq']);
check('Frequency below supported range',{...valid,'Min Freq':'19 Hz'},false,['Min Freq']);
check('Frequency above supported range',{...valid,'Max Freq':'20.001 kHz'},false,['Max Freq']);
check('Reject whole crossed proposal',{...valid,Resonance:'2','Min Freq':'900 Hz','Max Freq':'800 Hz'},false,['Min Freq','Max Freq']);
check('Reject slope not multiple of six',{...valid,Slope:'19 dB'},false,['Slope']);
check('Reject resonance and slope together',{...valid,Resonance:'-1',Slope:'54 dB'},false,['Resonance','Slope']);
const r={scope:'Pure LPF parser policy only; no browser/audio/vendor-range acceptance',passed:true,cases:rows};
writeFileSync(fileURLToPath(new URL('../docs/prototype/lpf-validation-policy-results.json',import.meta.url)),JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify({cases:rows.length,passed:true}));
