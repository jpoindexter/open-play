import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioEngine} from './engine.js';
import {prepareExtendedEffects} from './extended-effects.js';
import {mixerFields,mixerSettingsFromPreferences,normalizeMixerSettings} from './mixer-curves.js';
const param=()=>({value:0,setTargetAtTime(v){this.value=v;}});
const node=()=>({outputs:new Set(),gain:param(),frequency:param(),connect(next){this.outputs.add(next);},disconnect(){this.outputs.clear();}});
const strip=()=>({high:node(),filter:node(),monitorTap:node(),gain:node(),gate:node(),level:.8,trim:1});
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const dry=n=>{assert.deepEqual([...n.high.outputs],[n.monitorTap]);assert.equal(n.filter.outputs.size,0);assert.equal(n.channelEffect,null);};

test('app preference defaults off while standalone engine policy stays backward compatible',()=>{
  assert.equal(normalizeMixerSettings().filtersEnabled,true);
  assert.equal(mixerSettingsFromPreferences({}).filtersEnabled,false);
  assert.equal(mixerSettingsFromPreferences({'Channel Filters':true}).filtersEnabled,true);
  assert.equal(mixerSettingsFromPreferences({'Channel Filters':'true'}).filtersEnabled,false);
  assert.equal(mixerFields.has('Channel Filters'),true);
});

test('actual channel strips bypass hidden Filter and assigned FX while retaining their amounts',async t=>{
  const previous=globalThis.AudioWorkletNode;
  globalThis.AudioWorkletNode=class{constructor(ctx,name,options){Object.assign(this,node(),{options,port:{postMessage(){},close(){}}});}};
  t.after(()=>{if(previous===undefined)delete globalThis.AudioWorkletNode;else globalThis.AudioWorkletNode=previous;});
  const engine=new AudioEngine();
  engine.ctx={currentTime:1,createGain:node,audioWorklet:{async addModule(){}}};
  engine.effectsReady=prepareExtendedEffects(engine.ctx);await engine.effectsReady;
  engine.nodes=Array.from({length:4},(_,i)=>({...strip(),channelValue:[-.7,.3,0,.8][i],stemMonitor:strip()}));
  await Promise.all(engine.nodes.map((_,i)=>engine.applyChannelFX(i)));
  assert.equal(engine.nodes[0].high.outputs.has(engine.nodes[0].filter),true);
  const settings=engine.setMixerSettings({...engine.mixerSettings,filtersEnabled:false});
  for(const n of engine.nodes)for(const s of [n,n.stemMonitor])dry(s);
  assert.equal(settings.filtersEnabled,false);
  engine.mix(0,'filter',.45);assert.equal(engine.nodes[0].channelValue,.45);dry(engine.nodes[0]);
  engine.setMixerSettings({...settings,filtersEnabled:true});await flush();
  for(const n of engine.nodes)for(const s of [n,n.stemMonitor]){
    assert.equal(s.channelValue,n.channelValue);
    assert.equal(s.high.outputs.has(s.channelValue?s.filter:s.monitorTap),true);
  }
  engine.setMixerSettings({...settings,filtersEnabled:false});
  let ready;engine.effectsReady=new Promise(resolve=>ready=resolve);
  await engine.setChannelFX('Noise'); // Disabled controls must not wait for FX preparation.
  engine.mix(0,'filter',-.65);
  engine.setMixerSettings({...settings,filtersEnabled:true});
  engine.setMixerSettings({...settings,filtersEnabled:false});ready();await flush();
  for(const n of engine.nodes)for(const s of [n,n.stemMonitor])dry(s);
  engine.setMixerSettings({...settings,filtersEnabled:true});await flush();
  assert.equal(engine.channelFXType,'Noise');assert.equal(engine.nodes[0].channelValue,-.65);
  const effects=engine.nodes.flatMap(n=>[n.channelEffect,n.stemMonitor.channelEffect]);
  assert(effects.every(Boolean));
  for(const effect of effects)assert.equal(effect.processor.options.processorOptions.spec.name,'Channel Noise');
  assert.equal(effects[0].processor.options.processorOptions.spec.depth,65);
  engine.setMixerSettings({...settings,filtersEnabled:false});
  for(const n of engine.nodes)for(const s of [n,n.stemMonitor])dry(s);
  const fresh={...strip(),channelValue:.9};engine.applyChannelFXStrip(fresh);dry(fresh);
  assert.equal(fresh.channelValue,.9);
  const errors=[],failure=Error('Controlled FX preparation rejection');let reject;
  engine.onError=error=>errors.push(error);engine.effectsReady=new Promise((_,no)=>reject=no);
  engine.setMixerSettings({...settings,filtersEnabled:true});
  engine.setMixerSettings({...settings,filtersEnabled:false});reject(failure);await flush();
  assert.deepEqual(errors,[failure]);
  for(const n of engine.nodes)for(const s of [n,n.stemMonitor])dry(s);
});
