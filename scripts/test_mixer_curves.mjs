import assert from 'node:assert/strict';
import {normalizeMixerSettings as normalize,crossfaderGain as cross,upfaderGain as up,mixerSettingsFromPreferences} from '../prototype/mixer-curves.js';
import {AudioEngine} from '../prototype/engine.js';
const close=(a,b)=>assert(Math.abs(a-b)<1e-10,`${a} != ${b}`),defaults=normalize();
for(const x of [-1,-.5,0,.5,1]){close(cross(x,'A',defaults),Math.min(1,1-x));close(cross(x,'B',defaults),Math.min(1,1+x));}
for(const curve of ['Linear','Power'])for(const amount of [0,.5,1]){
 const s=normalize({curve,amount});let last=-1;
 for(let n=0;n<=100;n++){const x=n/50-1,a=cross(x,'A',s),b=cross(x,'B',s);assert(a>=0&&a<=1&&b>=0&&b<=1&&b>=last);last=b;close(a,cross(-x,'B',s));close(cross(x,'A',normalize({...s,reverse:true})),b);close(cross(x,'Thru',s),1);close(cross(x,'A',normalize({...s,disabled:true})),1);}
 close(cross(-1,'A',s),1);close(cross(-1,'B',s),0);
}
close(cross(0,'A',normalize({amount:0})),.5);close(cross(0,'A',normalize({curve:'Power',amount:0})),.25);close(up(.5,normalize({upfader:0})),.0625);close(up(.5,normalize({upfader:1})),Math.sqrt(Math.sqrt(.5)));
// Actual engine routing method with controlled AudioParams: selected Stem Slip
// sources take the assigned curve; complement and pre-fader cue stay separate.
const engine=new AudioEngine(),param=()=>({gain:{setTargetAtTime(v){this.value=v;}}});
engine.ctx={currentTime:1};engine.nodes=Array.from({length:4},()=>({gain:param(),level:.5,trim:1,pfl:true,ordinaryCue:param(),stemMonitor:{gate:param()}}));
const pfl=[];engine.audioMonitor={setPFL:(...v)=>pfl.push(v)};engine.voices.set(2,{stemSlipTransport:{}});engine.deckStates.set(2,{stemSlip:'vocal'});const routes=Array.from({length:4},()=>param());engine.stemStates.set(2,{routes});engine.setMixerSettings({amount:0,assignments:['B','A','B','Thru']});engine.setCross(-1);
assert.deepEqual(engine.nodes.map(n=>n.gain.gain.value),[0,.5,.5,.5]);assert.deepEqual(routes.map(r=>r.gain.value),[0,1,1,1]);assert.equal(engine.nodes[2].ordinaryCue.gain.value,0);assert.equal(engine.nodes[2].stemMonitor.gate.gain.value,1);assert(pfl.every(v=>v[1]===true&&v[2]===1));
assert.throws(()=>engine.setCross(NaN),/finite/);engine.setCross(20);assert.equal(engine.cross,1);
assert.deepEqual(mixerSettingsFromPreferences({}),defaults);
console.log(JSON.stringify({passed:true,scope:'Independent curve endpoints/default preservation/monotonicity plus actual engine method with controlled AudioParams; browser recording separate',checks:6}));
