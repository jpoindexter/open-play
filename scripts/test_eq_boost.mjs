import assert from 'node:assert/strict';
import {eqBands,normalizeEQBoost,boundedEQGain,rescaleEQGain} from '../prototype/mixer-curves.js';
import {AudioEngine} from '../prototype/engine.js';
import {createDeckMIDIRouter} from '../prototype/deck-midi.js';
import {syntheticMIDIMessage} from '../prototype/midi.js';
assert.equal(normalizeEQBoost('12 dB'),12);assert.equal(normalizeEQBoost('invalid'),6);assert.equal(rescaleEQGain(3,6,12),6);assert.equal(rescaleEQGain(11.5,12,6),5.75);assert.equal(rescaleEQGain(-12,6,12),-12);assert.equal(rescaleEQGain(0,12,6),0);assert.throws(()=>boundedEQGain(NaN,12),/finite/);
const param=()=>({gain:{setTargetAtTime(v){this.value=v;}}}),engine=new AudioEngine();engine.setEQBoost(12);assert.equal(engine.ctx,null,'Preference must not initialize audio');engine.setEQBoost(6);
engine.ctx={currentTime:1};engine.nodes=Array.from({length:4},()=>({eqTargets:{low:6,mid:0,high:-12},low:param(),mid:param(),high:param(),stemMonitor:{low:param(),mid:param(),high:param()}}));engine.setEQBoost(12);
for(const n of engine.nodes){assert.deepEqual(n.eqTargets,{low:12,mid:0,high:-12});for(const band of eqBands)assert.equal(n[band].gain.value,n.stemMonitor[band].gain.value);}
engine.setEQBoost(6);for(const n of engine.nodes)assert.deepEqual(n.eqTargets,{low:6,mid:0,high:-12});engine.mix(0,'mid',50);assert.equal(engine.nodes[0].eqTargets.mid,6);assert.throws(()=>engine.mix(0,'mid',Infinity),/finite/);
const calls=[],state={settings:{'EQ Boost':'6 dB'},decks:Array.from({length:4},(_,index)=>({index,low:0,mid:0,high:0}))},router=createDeckMIDIRouter({state,engine:{mix:(...args)=>calls.push(args)},actions:{}});
let cases=0;
for(const boost of [6,12]){state.settings['EQ Boost']=`${boost} dB`;for(let i=0;i<4;i++)for(const band of eqBands){const mapping={target:`Deck ${i+1} ${band}`,encoding:'7-bit absolute'};
for(const [value,expected] of [[127,boost],[64,0],[0,-24]]){await router.dispatch(syntheticMIDIMessage({type:'CC',channel:1,number:20,value}),mapping);assert.equal(state.decks[i][band],expected);assert.equal(calls.at(-1)[2],expected);}
state.decks[i][band]=boost;await router.dispatch(syntheticMIDIMessage({type:'CC',channel:1,number:20,value:1}),{...mapping,encoding:'Relative two’s complement'});assert.equal(state.decks[i][band],boost);await router.dispatch(syntheticMIDIMessage({type:'CC',channel:1,number:20,value:127}),{...mapping,encoding:'Relative two’s complement'});assert.equal(state.decks[i][band],boost-.5);cases++;}}
console.log(JSON.stringify({passed:true,midiBandDeckRangeCases:cases,scope:'Actual engine EQ methods with controlled AudioParams, all four decks/three bands and two boost settings through actual MIDI dispatch. Rendered audio/UI/reload separate.',checks:['Positive knob fraction and cuts/neutral preserved across range changes','No AudioContext initialization from preference','Main and selected-stem cue-strip EQ targets stay consistent','Engine bounds nonfinite/out-of-range values','GUI-independent MIDI max/neutral/cut/relative clamp for both ranges']}));
