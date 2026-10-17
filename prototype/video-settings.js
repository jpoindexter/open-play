// Shared operational Video settings. Setup is a view of these scalar fields,
// never an independent preferences store. Existing algorithms/defaults remain.
import {recordingQualityOptions,normalizeRecordingQuality} from './video-recording.js';
import {videoTreatmentModes,normalizeVideoTreatment} from './video-treatment.js';
import {normalizeAutoCrossfadeSeconds} from './video-crossfade.js';

export const videoSettingDefaults=Object.freeze({
  recordingQuality:'output',mediaTreatment:'stretch',autoCrossfadeSeconds:2.5,
});
export const videoSetupFields=Object.freeze([
  Object.freeze({name:'Video Recording Quality',key:'recordingQuality',type:'select',options:recordingQualityOptions}),
  Object.freeze({name:'Media Treatment',key:'mediaTreatment',type:'select',options:videoTreatmentModes}),
  Object.freeze({name:'Auto Crossfade Speed',key:'autoCrossfadeSeconds',type:'range'}),
]);
const fieldsByName=new Map(videoSetupFields.map(field=>[field.name,field]));
const own=(value,key)=>value&&typeof value==='object'&&!Array.isArray(value)
  ?Object.getOwnPropertyDescriptor(value,key)?.value:undefined;

export function normalizeVideoSettings(video) {
  return {recordingQuality:normalizeRecordingQuality(own(video,'recordingQuality')),
    mediaTreatment:normalizeVideoTreatment(own(video,'mediaTreatment')),
    autoCrossfadeSeconds:normalizeAutoCrossfadeSeconds(own(video,'autoCrossfadeSeconds'))};
}
function normalizedSetting(key,value) {
  if(key==='recordingQuality') {
    if(!recordingQualityOptions.some(option=>option.value===value))
      throw new RangeError('Choose a supported recording resolution.');
    return normalizeRecordingQuality(value);
  }
  if(key==='mediaTreatment') {
    if(!videoTreatmentModes.some(option=>option.value===value))
      throw new RangeError('Choose a supported Video media treatment.');
    return normalizeVideoTreatment(value);
  }
  if(key==='autoCrossfadeSeconds') {
    if(typeof value!=='number'||!Number.isFinite(value))
      throw new TypeError('Video fade duration must be a finite number.');
    return normalizeAutoCrossfadeSeconds(value);
  }
  throw new RangeError('Unknown operational Video setting.');
}
/** Runtime owner must enforce lifecycle guards BEFORE calling this setter.
 * Recording quality intentionally cannot bypass its mixer's pending/active
 * capture guard. This helper has no recording handle or resource ownership. */
export function setVideoSetting(video,key,value) {
  const normalized=normalizedSetting(key,value);
  const descriptor=writableSetting(video,key);
  // Define an own scalar instead of invoking an inherited setter.
  Object.defineProperty(video,key,{value:normalized,writable:true,
    configurable:descriptor?.configurable??true,enumerable:descriptor?.enumerable??true});
  return normalized;
}
function writableSetting(video,key) {
  if(!video||typeof video!=='object'||Array.isArray(video))
    throw new TypeError('Video settings need a mutable record.');
  const descriptor=Object.getOwnPropertyDescriptor(video,key);
  if(descriptor&&(!('value' in descriptor)||descriptor.writable===false))
    throw new TypeError('Video setting must be writable scalar data.');
  if(!descriptor&&!Object.isExtensible(video))throw new TypeError('Video settings record is not extensible.');
  return descriptor;
}
export function videoSetupField(name) {return fieldsByName.get(name)||null;}
export function videoSetupValue(video,name) {
  const field=videoSetupField(name);
  if(!field)throw new RangeError('Unknown shared Video Setup field.');
  const value=normalizeVideoSettings(video)[field.key];
  return field.key==='autoCrossfadeSeconds'?(10-value)*100/9.75:value;
}
function setupSetting(name,value) {
  const field=videoSetupField(name);
  if(!field)throw new RangeError('Unknown shared Video Setup field.');
  if(field.key==='autoCrossfadeSeconds') {
    if(typeof value!=='number'||!Number.isFinite(value))
      throw new TypeError('Video fade speed must be a finite number.');
    value=10-Math.max(0,Math.min(100,value))*9.75/100;
  }
  return {key:field.key,value:normalizedSetting(field.key,value)};
}
function commitSetup(video,patch,setRecordingQuality) {
  // Validate the complete patch before any guarded call or state mutation.
  const prepared=Object.entries(patch).map(([key,value])=>[key,normalizedSetting(key,value)]);
  for(const [key]of prepared)writableSetting(video,key);
  if(prepared.some(([key])=>key==='recordingQuality')) {
    if(typeof setRecordingQuality!=='function')
      throw new TypeError('Video recording quality requires its guarded mixer setter.');
    const quality=prepared.find(([key])=>key==='recordingQuality')[1];
    setRecordingQuality(quality); // may refuse pending/active capture, with no partial reset
  }
  for(const [key,value]of prepared)if(key!=='recordingQuality')setVideoSetting(video,key,value);
  return normalizeVideoSettings(video);
}
export function applyVideoSetupSetting(video,name,value,{setRecordingQuality}={}) {
  const setting=setupSetting(name,value);
  return commitSetup(video,{[setting.key]:setting.value},setRecordingQuality);
}
export function resetVideoSetupSettings(video,{setRecordingQuality}={}) {
  return commitSetup(video,videoSettingDefaults,setRecordingQuality);
}
