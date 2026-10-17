// Pure scalar and actual Setup handler tests with a controlled DOM/mixer.
// No browser, decoded pixels, real capture, full-screen output or native proof.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {videoSettingDefaults,videoSetupFields,normalizeVideoSettings,setVideoSetting,
  videoSetupField,videoSetupValue,applyVideoSetupSetting,resetVideoSetupSettings} from '../prototype/video-settings.js';
import {snapshotVideoState,restoreVideoState} from '../prototype/video-state.js';
import {defaultSettings} from '../prototype/fixtures.js';
let passed=0;
const test=(name,run)=>{run();passed++;console.log('PASS '+name);};
const qualitySetter=video=>value=>setVideoSetting(video,'recordingQuality',value);

test('Compatibility defaults stay output/stretch/2.5 and snapshots are detached',()=>{
  assert.deepEqual(normalizeVideoSettings(),videoSettingDefaults);
  assert.deepEqual(normalizeVideoSettings(restoreVideoState({})),videoSettingDefaults);
  const result=normalizeVideoSettings({recordingQuality:'720p',mediaTreatment:'letterbox',autoCrossfadeSeconds:.25});
  result.mediaTreatment='preserve';assert.equal(normalizeVideoSettings().mediaTreatment,'stretch');
});
test('Normalization ignores inherited values/accessors/coercion and preserves finite clamp boundaries',()=>{
  let called=0;const hostile=Object.create({recordingQuality:'1080p',autoCrossfadeSeconds:.25});
  Object.defineProperty(hostile,'mediaTreatment',{get(){called++;return'preserve';}});
  assert.deepEqual(normalizeVideoSettings(hostile),videoSettingDefaults);assert.equal(called,0);
  for(const value of [NaN,Infinity,-Infinity,'1',{},[],null])assert.equal(normalizeVideoSettings({autoCrossfadeSeconds:value}).autoCrossfadeSeconds,2.5);
  assert.equal(normalizeVideoSettings({autoCrossfadeSeconds:0}).autoCrossfadeSeconds,.25);
  assert.equal(normalizeVideoSettings({autoCrossfadeSeconds:99}).autoCrossfadeSeconds,10);
});
test('All existing scalar choices roundtrip through actual Video metadata',()=>{
  for(const quality of ['output','360p','480p','720p','1080p'])for(const treatment of ['preserve','stretch','center-cut','letterbox']){
    const v={};setVideoSetting(v,'recordingQuality',quality);setVideoSetting(v,'mediaTreatment',treatment);setVideoSetting(v,'autoCrossfadeSeconds',.25);
    assert.deepEqual(normalizeVideoSettings(restoreVideoState(snapshotVideoState(v))),normalizeVideoSettings(v));
  }
});
test('Shared setter leaves media handles/FX/opacity/output dimensions untouched',()=>{
  const runtime={fx:{left:[{name:'Negative'}]},media:{bytes:new Uint8Array([1])},width:1280,height:720,channelOpacity:[.2,.8]};
  const handles={...runtime};setVideoSetting(runtime,'mediaTreatment','center-cut');setVideoSetting(runtime,'autoCrossfadeSeconds',-1);
  assert.equal(runtime.autoCrossfadeSeconds,.25);
  for(const key of Object.keys(handles))assert.equal(runtime[key],handles[key]);
});
test('Invalid choices never coerce, and inherited setters cannot observe commits',()=>{
  let called=0;const value={toString(){called++;return'720p';}};
  const v={...videoSettingDefaults};
  for(const [key,bad]of [['recordingQuality',value],['mediaTreatment','Center-Cut'],['autoCrossfadeSeconds','3'],['autoCrossfadeSeconds',NaN],['__proto__',{}]])assert.throws(()=>setVideoSetting(v,key,bad));
  assert.equal(called,0);assert.deepEqual(v,videoSettingDefaults);
  const inherited=Object.create({set mediaTreatment(value){called++;}});setVideoSetting(inherited,'mediaTreatment','preserve');
  assert.equal(called,0);assert.equal(Object.getOwnPropertyDescriptor(inherited,'mediaTreatment').value,'preserve');
});
test('Setup speed orientation maps existing 0..100 to 10..0.25 seconds without new budgets',()=>{
  const v={...videoSettingDefaults};
  for(const [speed,seconds]of [[0,10],[50,5.125],[100,.25]]){
    applyVideoSetupSetting(v,'Auto Crossfade Speed',speed);
    assert.equal(v.autoCrossfadeSeconds,seconds);assert.equal(videoSetupValue(v,'Auto Crossfade Speed'),speed);
  }
  assert.throws(()=>applyVideoSetupSetting(v,'Auto Crossfade Speed','50'),TypeError);
});
test('Setup quality cannot fall back to unguarded mutation',()=>{
  const v={...videoSettingDefaults};assert.throws(()=>applyVideoSetupSetting(v,'Video Recording Quality','720p'),/guarded mixer/);
  assert.equal(v.recordingQuality,'output');
  applyVideoSetupSetting(v,'Video Recording Quality','720p',{setRecordingQuality:qualitySetter(v)});assert.equal(v.recordingQuality,'720p');
});
test('Reset capture refusal is atomic across all three canonical fields',()=>{
  const v={recordingQuality:'1080p',mediaTreatment:'preserve',autoCrossfadeSeconds:9};const before={...v};let calls=0;
  assert.throws(()=>resetVideoSetupSettings(v,{setRecordingQuality(){calls++;throw new Error('Stop video capture');}}),/Stop video capture/);
  assert.equal(calls,1);assert.deepEqual(v,before);
  resetVideoSetupSettings(v,{setRecordingQuality:qualitySetter(v)});assert.deepEqual(v,videoSettingDefaults);
});
test('Reset validates writable scalar targets before invoking its guarded setter',()=>{
  const v={recordingQuality:'1080p',mediaTreatment:'preserve',autoCrossfadeSeconds:9};
  Object.defineProperty(v,'autoCrossfadeSeconds',{writable:false});let called=0;
  assert.throws(()=>resetVideoSetupSettings(v,{setRecordingQuality(){called++;}}),/writable/);
  assert.equal(called,0);assert.equal(v.recordingQuality,'1080p');assert.equal(v.mediaTreatment,'preserve');
});
test('Shared field metadata is immutable and exposes Match live output',()=>{
  assert(Object.isFrozen(videoSettingDefaults));assert(Object.isFrozen(videoSetupFields));assert(videoSetupFields.every(Object.isFrozen));
  assert.equal(videoSetupField('Video Recording Quality').options[0].value,'output');assert.equal(videoSetupField('Output Quality'),null);
});

// Execute the full actual panels module. Only the mixer's resource collaborator
// is replaced so no fake MediaRecorder/WebGL result can be mistaken for proof.
const original=await readFile(new URL('../prototype/panels.js',import.meta.url),'utf8');
const seam='import { createVideoMixer } from "./video.js";';assert(original.includes(seam));
const source=original.replace(seam,'const createVideoMixer=(...args)=>globalThis.__setupMixer(...args);')
  .replace(/from (["'])(\.\/[^"']+)\1/g,(_,quote,path)=>`from ${quote}${new URL('../prototype/'+path.slice(2),import.meta.url).href}${quote}`);
const {createPanels}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const unescapeHTML=text=>text.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
function environment(){
  const e={saved:0,notifications:[],guard:null,html:'',elements:new Map(),inputs:new Map(),tabs:[]};
  globalThis.document={addEventListener(){}};globalThis.window={addEventListener(){}};
  const element=(extra={})=>({value:'',type:'',dataset:{},textContent:'',...extra});
  const get=selector=>e.elements.get(selector)||null;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  e.state={fx:[[],[]],video:{recordingQuality:'output',mediaTreatment:'stretch',autoCrossfadeSeconds:2.5},settings:defaultSettings(),decks:[],samples:[],panel:null};
  e.state.settings['Video Recording Quality']='1080p';e.state.settings['Media Treatment']='Preserve';e.state.settings['Auto Crossfade Speed']='5';
  globalThis.__setupMixer=({state})=>e.mixer={get recording(){return e.guard==='active';},setRecordingQuality(value){if(e.guard)throw new Error('Stop video capture before changing recording quality.');return setVideoSetting(state.video,'recordingQuality',value);}};
  function dialog(title,html,bind){
    e.html=html;e.elements.clear();e.inputs.clear();
    for(const match of html.matchAll(/\bid="([^"]+)"/g))e.elements.set('#'+match[1],element());
    e.elements.set('#modal',element({close(){e.closed=true;}}));
    e.tabs=[...html.matchAll(/data-settings-tab="([^"]+)"/g)].map(m=>element({dataset:{settingsTab:m[1]}}));
    for(const match of html.matchAll(/<(select|input)\b([^>]*\bdata-setting="([^"]+)"[^>]*)(?:>([\s\S]*?)<\/select>|>)/g)){
      const [_,tag,attrs,rawName,inner]=match,name=unescapeHTML(rawName),input=element({dataset:{setting:name}});
      input.type=tag==='select'?'select-one':attrs.match(/type="([^"]+)"/)?.[1]||'text';
      input.value=tag==='select'?(inner.match(/<option\b([^>]*\bselected[^>]*)>/)?.[1].match(/value="([^"]+)"/)?.[1]||inner.match(/<option(?:\s[^>]*)?>([^<]*)<\/option>/)?.[1]||''):(attrs.match(/value="([^"]*)"/)?.[1]||'');
      input.value=unescapeHTML(input.value);input.checked=attrs.includes('checked');input.disabled=attrs.includes('disabled');
      Object.defineProperty(input,'valueAsNumber',{get(){return Number(input.value);}});e.inputs.set(name,input);
    }
    bind({querySelectorAll(selector){return selector==='[data-setting]'?[...e.inputs.values()]:selector==='[data-settings-tab]'?e.tabs:[];}});
  }
  e.panels=createPanels({state:e.state,engine:{},$:get,$$:()=>[],esc,notify:message=>e.notifications.push(message),dialog,persist:()=>e.saved++,colors:[]});
  e.open=()=>{e.panels.open('settings');e.tabs.find(b=>b.dataset.settingsTab==='Expansion Packs').onclick();};
  e.change=(name,value)=>{const input=e.inputs.get(name);assert(input,'Setup field not rendered');input.value=String(value);input.onchange();return input;};
  return e;
}
test('Actual Setup renders canonical Video state instead of stale fixture preferences',()=>{
  const e=environment();e.open();assert.equal(e.inputs.get('Video Recording Quality').value,'output');assert.equal(e.inputs.get('Media Treatment').value,'stretch');
  assert(Math.abs(Number(e.inputs.get('Auto Crossfade Speed').value)-76.92307692307692)<1e-10);
  assert(e.html.includes('Match live output'));assert(e.html.includes('stored simulations'));
});
test('Actual Setup edits commit all three live fields, persist once each, and do not write duplicate fields',()=>{
  const e=environment();e.open();e.change('Video Recording Quality','720p');e.change('Media Treatment','letterbox');e.change('Auto Crossfade Speed',50);
  assert.deepEqual(normalizeVideoSettings(e.state.video),{recordingQuality:'720p',mediaTreatment:'letterbox',autoCrossfadeSeconds:5.125});assert.equal(e.saved,3);
  assert.equal(e.state.settings['Video Recording Quality'],'1080p');assert.equal(e.state.settings['Media Treatment'],'Preserve');assert.equal(e.state.settings['Auto Crossfade Speed'],'5');
});
test('Actual Setup refuses pending quality edit, restores visible selection/error and avoids saving',()=>{
  const e=environment();e.open();e.guard='pending';const input=e.change('Video Recording Quality','1080p');
  assert.equal(e.state.video.recordingQuality,'output');assert.equal(input.value,'output');assert.equal(e.saved,0);
  assert.match(e.elements.get('#video-setup-status').textContent,/Stop video capture/);assert.equal(e.notifications.length,1);
});
test('Actual Setup active capture disables quality; failed Reset preserves fixtures and all operational values',()=>{
  const e=environment();Object.assign(e.state.video,{recordingQuality:'720p',mediaTreatment:'center-cut',autoCrossfadeSeconds:8});e.guard='active';e.open();
  assert(e.inputs.get('Video Recording Quality').disabled);const before=JSON.stringify(e.state);e.elements.get('#reset-settings').onclick();
  assert.equal(JSON.stringify(e.state),before);assert.equal(e.saved,0);assert.match(e.elements.get('#video-setup-status').textContent,/Stop video capture/);
});
test('Actual Setup Reset uses compatibility defaults and re-opening reflects external live changes',()=>{
  const e=environment();Object.assign(e.state.video,{recordingQuality:'720p',mediaTreatment:'center-cut',autoCrossfadeSeconds:8});e.open();e.elements.get('#reset-settings').onclick();
  assert.deepEqual(normalizeVideoSettings(e.state.video),videoSettingDefaults);assert.equal(e.saved,1);
  setVideoSetting(e.state.video,'mediaTreatment','preserve');setVideoSetting(e.state.video,'recordingQuality','480p');setVideoSetting(e.state.video,'autoCrossfadeSeconds',10);e.open();
  assert.equal(e.inputs.get('Video Recording Quality').value,'480p');assert.equal(e.inputs.get('Media Treatment').value,'preserve');assert.equal(e.inputs.get('Auto Crossfade Speed').value,'0');
});
console.log(`${passed}/${passed} Video settings pure/controlled Setup checks passed; browser acceptance remains separate.`);
