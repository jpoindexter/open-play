import { videoEffectCatalog } from './video-effects-catalog.js';
import { videoTransitionCatalog } from './video-transitions.js';
import { videoOverlayPresetMetadata } from './video-overlays.js';

const targets = ['left', 'right', 'master'];
const effects = new Map(videoEffectCatalog.map(effect => [effect.name, effect]));
const transitions = new Set(videoTransitionCatalog.map(entry => entry.name));
const sizes = [[640,360],[1280,720],[1920,1080]];
const clamp = (value, low, high) => Math.max(low,Math.min(high,value));
// Read own data only: accessors, inherited values and coercion hooks are not
// metadata. No spread/JSON traversal of caller-owned runtime objects is needed.
function own(value, key) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  try { return Object.getOwnPropertyDescriptor(value,key)?.value; } catch { return undefined; }
}
function arrayEntry(value,index) {
  if (!Array.isArray(value)) return undefined;
  try { return Object.getOwnPropertyDescriptor(value,String(index))?.value; } catch { return undefined; }
}
function arrayValues(value) {
  if (!Array.isArray(value)) return [];
  try { return Object.keys(value).filter(key => /^(?:0|[1-9]\d*)$/.test(key) && Number(key) < 4294967295)
    .map(key => arrayEntry(value,key)); } catch { return []; }
}
const finite = (value, fallback) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;
function parameter(value, definition) {
  if (definition.options) return definition.options.includes(value) ? value : definition.default;
  let result = finite(value,definition.default);
  if (Number.isFinite(definition.min)) result = Math.max(definition.min,result);
  if (Number.isFinite(definition.max)) result = Math.min(definition.max,result);
  if (definition.step) {
    const origin = definition.min || 0;
    result = origin + Math.round((result-origin)/definition.step)*definition.step;
    result = clamp(result,definition.min ?? -Infinity,definition.max ?? Infinity);
  }
  return result;
}
function effectSpec(input) {
  const candidate = effects.get(own(input,'name')), definition = candidate || videoEffectCatalog[0];
  const params = own(input,'params'), output = {name:definition.name,on:!!candidate && own(input,'on') === true,value:definition.default.value,params:{}};
  for (const control of definition.independentParameters) {
    const value = control.name === 'value' ? own(input,'value') : own(params,control.name);
    if (control.name === 'value') output.value = parameter(value,control);
    else output.params[control.name] = parameter(value,control);
  }
  return output;
}
const stringFields = ['text','color','fontFamily','align','animation','speed'];
const numberFields = ['fontSize','opacity','x','y','scale','speed'];
function overlaySpec(input,target,index,restore) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const safe = {kind:own(input,'kind') === 'image' ? 'image' : 'text',on:own(input,'on') === true};
  for (const key of stringFields) { const value = own(input,key); if (typeof value === 'string') safe[key] = value; }
  for (const key of numberFields) { const value = own(input,key); if (typeof value === 'number') safe[key] = value; }
  for (const key of ['id','name']) { const value = own(input,key); if (typeof value === 'string') safe[key] = value; }
  const ref = own(input,'imageRef');
  // References identify a session asset; resource URLs and encoded image bytes
  // are not stable identifiers and must not enter persistent metadata.
  if (typeof ref === 'string' && ref.length <= 4096 && !/^(?:blob|data|https?|file|filesystem):/i.test(ref.trim())) safe.imageRef = ref;
  const metadata = videoOverlayPresetMetadata(safe);
  if (!metadata.id) metadata.id = `overlay-${target}-${index}`;
  if (restore && metadata.kind === 'image') metadata.on = false;
  return metadata;
}
function sanitized(value,restore) {
  const width = own(value,'width'), height = own(value,'height');
  const size = sizes.find(([w,h]) => width === w && height === h) || sizes[0];
  const name = own(value,'transition'), fx = own(value,'fx'), overlays = own(value,'overlays');
  const flags = key => ({enabled:own(own(value,key),'enabled') === true, random:own(own(value,key),'random') === true});
  return {version:1,width:size[0],height:size[1],transition:transitions.has(name) ? name : 'Crossfade',
    cross:clamp(finite(own(value,'cross'),0),-1,1),auto:own(value,'auto') === true,
    linked:typeof own(value,'linked') === 'boolean' ? own(value,'linked') : true,
    media:flags('media'),transitionSelection:flags('transitionSelection'),
    fx:Object.fromEntries(targets.map(target => [target,[0,1].map(index => effectSpec(arrayEntry(own(fx,target),index)))])),
    overlays:Object.fromEntries(targets.map(target => [target,arrayValues(own(overlays,target))
      .map((spec,index) => overlaySpec(spec,target,index,restore)).filter(Boolean)]))};
}
/** Pure JSON-safe metadata snapshot. Runtime media, assets, tokens outside
 * declared FX parameters and legacy single-overlay fields are excluded. */
export function snapshotVideoState(value) { return sanitized(value,false); }
/** Restore editable metadata; image layers are OFF until explicit reimport.
 * Unversioned metadata is accepted; unknown future versions use clean defaults. */
export function restoreVideoState(saved) {
  const version = own(saved,'version');
  return sanitized(version !== undefined && version !== 1 ? null : saved,true);
}
