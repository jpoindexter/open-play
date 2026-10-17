import { recordingQualityOptions, normalizeRecordingQuality } from './video-recording.js';
import { videoTreatmentModes, normalizeVideoTreatment } from './video-treatment.js';
import { createVideoMediaControls } from './video-media-controls.js';
import { createVideoKaraokeControls } from './video-karaoke-controls.js';
import { videoEffectCatalog } from './video-effects-catalog.js';
import { videoTransitionCatalog } from './video-transitions.js';
import { videoOverlayAnimations, normalizeVideoOverlay, videoOverlayPresetMetadata, restoreVideoOverlayPreset } from './video-overlays.js';

const targets = ['left', 'right', 'master'];
const title = value => value[0].toUpperCase() + value.slice(1);
const presetsKey = 'openplay-video-overlay-presets-v1';
const clone = value => JSON.parse(JSON.stringify(value));
const safeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const effectByName = new Map(videoEffectCatalog.map(effect => [effect.name, effect]));
export function createVideoEffectSpec(name = videoEffectCatalog[0].name) {
  const effect = effectByName.get(name);
  if (!effect) throw new RangeError('Unknown Video FX: ' + name);
  return {name, ...clone(effect.default)};
}
export function createVideoOverlaySpec(kind = 'text', id = globalThis.crypto?.randomUUID?.() || `overlay-${Date.now()}-${Math.random().toString(36).slice(2)}`) {
  const {image: _image, ...spec} = normalizeVideoOverlay({kind, on:false});
  return {...spec, id, name:kind === 'image' ? 'Image overlay' : 'Text overlay', imageRef:kind === 'image' ? id : null};
}
/** Scalar-only preset policy; image bytes and decoded browser objects never enter storage. */
export function videoControlsPreset(spec) {
  return videoOverlayPresetMetadata(spec);
}

/** Controls edit public mixer specs in place. The mixer owns scheduling, decoded
 * assets, analysis and GPU resources; this helper owns only UI and local metadata. */
export function createVideoControls({state, videoMixer, notify = () => {}, persist = () => {}, dialog, refresh = () => {}, download, importKaraoke, esc = safeHTML}) {
  const v = state.video;
  const karaokeControls = createVideoKaraokeControls({state, videoMixer, notify, dialog, importKaraoke});
  const mediaControls = createVideoMediaControls({state, videoMixer, notify, dialog, persist});
  const loadedImages = new Set();
  const imageRequests = new Map();
  function ensure() {
    v.fx ||= {}; v.overlays ||= {};
    for (const target of targets) {
      v.fx[target] ||= [];
      for (let slot=0; slot<2; slot++) {
        const existing = v.fx[target][slot];
        if (!existing || !effectByName.has(existing.name)) v.fx[target][slot] = createVideoEffectSpec();
        else existing.params ||= clone(effectByName.get(existing.name).default.params);
      }
      v.fx[target].length = 2;
      if (!Array.isArray(v.overlays[target])) v.overlays[target] = [];
    }
    if (!videoTransitionCatalog.some(entry => entry.name === v.transition)) v.transition = 'Crossfade';
    v.width ||= 640; v.height ||= 360; v.mediaTreatment = normalizeVideoTreatment(v.mediaTreatment);
  }
  const changed = () => persist();
  const option = (value, label, selected) => `<option value="${esc(value)}" ${value === selected ? 'selected' : ''}>${esc(label)}</option>`;
  const targetOptions = selected => targets.map(target => option(target, title(target), selected)).join('');
  const checked = value => value ? 'checked' : '';
  const report = error => notify(error?.message || String(error));
  const run = operation => async event => { try { await operation(event); } catch (error) { report(error); } };
  function markup() {
    ensure();
    return `<div class="video-previews">${[0,1].map(index => `<div><canvas id="video-preview-${index}" width="320" height="180" style="width:100%" aria-label="${index ? 'Right' : 'Left'} video preview"></canvas><label>${index ? 'Right' : 'Left'} local video<input type="file" accept="video/*" data-video-file="${index}"></label><button data-video-play="${index}">Play / pause ${index ? 'right' : 'left'}</button><p id="video-status-${index}" class="muted">No media loaded</p></div>`).join('')}<div><canvas id="video-master" width="${v.width}" height="${v.height}" style="width:100%;background:#111" aria-label="Video mix output"></canvas><button id="video-fullscreen">Fullscreen output</button></div></div>
      <div class="panel-controls"><label>Transition<select id="video-transition">${videoTransitionCatalog.map(entry => option(entry.name, entry.name + (entry.candidate ? ' · candidate, unverified' : entry.baseline ? ' · Open Play baseline' : ' · reference menu unverified'), v.transition)).join('')}</select></label><label>Video mix<input id="video-cross" type="range" min="-1" max="1" step=".01" value="${Number(v.cross) || 0}"></label><label><input id="video-auto" type="checkbox" ${checked(v.auto)}> Automatic mix</label><label><input id="video-link" type="checkbox" ${checked(v.linked)}> Link audio decks 1/2</label><label><input id="video-audio-fx-link" type="checkbox" ${checked(v.audioFXLink)}> Link audio Echo / Distortion</label><label>Media treatment<select id="video-treatment">${videoTreatmentModes.map(mode => option(mode.value,mode.label,v.mediaTreatment)).join('')}</select></label><button id="video-fx">Channel / master FX</button><button id="video-overlay">Text / image overlays</button><label>Output resolution<select id="video-resolution">${[[640,360],[1280,720],[1920,1080]].map(([w,h]) => option(`${w}x${h}`, `${w} × ${h}`, `${v.width}x${v.height}`)).join('')}</select></label><button id="video-reset">Reset frame history</button><button id="video-karaoke">Karaoke pair</button><button id="video-media">Media Crate / transitions</button></div>
      <div class="panel-controls"><label>Recording resolution<select id="video-record-quality">${recordingQualityOptions.map(optionSpec => option(optionSpec.value,optionSpec.label,normalizeRecordingQuality(v.recordingQuality))).join('')}</select></label><button id="video-record">${videoMixer.recording ? 'Stop video capture' : 'Record video mix'}</button><button id="video-download" ${videoMixer.result ? '' : 'disabled'}>Download video mix</button><span id="video-record-state" role="status">${videoMixer.recording ? 'Recording' : 'Not recording'}</span></div><p id="video-pipeline-state" class="muted" role="status">Waiting for the next rendered frame.</p><p class="muted">Independent pipeline: source → two channel FX → channel overlays → transition → master overlays → two master FX. Optional Echo/Distortion audio links run before channel FX and after the transition on master. Media treatment changes ordinary-video geometry; CDG keeps its separate crop policy. All algorithms, ranges and routing order are Open Play designs; reference visual parity and exact menus remain unverified. Local media stays in this browser. Video-source audio is muted; capture uses the browser audio master. Resolution is selectable; capture cadence and native output parity are not established by the size selector.</p>`;
  }
  function bind(root = document) {
    ensure();
    const $ = selector => root.querySelector(selector);
    videoMixer.bind($('#video-master'));
    root.querySelectorAll('[data-video-file]').forEach(input => { input.onchange = run(async () => {
      const file = input.files?.[0]; if (!file) return;
      input.disabled = true;
      try { await videoMixer.load(Number(input.dataset.videoFile), file); }
      finally { input.disabled = false; input.value = ''; }
    }); });
    root.querySelectorAll('[data-video-play]').forEach(button => { button.onclick = run(() => videoMixer.play(Number(button.dataset.videoPlay))); });
    $('#video-transition').onchange = event => { v.transition = event.target.value; changed(); };
    $('#video-cross').oninput = event => { v.cross = Number(event.target.value); changed(); };
    for (const [id,key] of [['auto','auto'],['link','linked']]) $('#video-'+id).onchange = event => { v[key] = event.target.checked; syncMix(); changed(); };
    $('#video-audio-fx-link').onchange = event => { v.audioFXLink = event.target.checked; changed(); };
    $('#video-treatment').onchange = event => { v.mediaTreatment = normalizeVideoTreatment(event.target.value); changed(); };
    function syncMix() { $('#video-cross').disabled = !!(v.linked || v.auto); $('#video-auto').disabled = !!v.linked; }
    syncMix();
    $('#video-resolution').disabled = !!videoMixer.recording;
    $('#video-resolution').onchange = run(async event => {
      const select = event.target, old = `${v.width}x${v.height}`;
      const [width,height] = select.value.split('x').map(Number);
      select.disabled = true;
      try { await videoMixer.setResolution(width,height); changed(); refresh(); }
      catch (error) { select.value = old; throw error; }
      finally { if (select.isConnected) select.disabled = !!videoMixer.recording; }
    });
    $('#video-record-quality').disabled = !!videoMixer.recording;
    $('#video-record-quality').onchange = run(event => {
      const select = event.target, old = normalizeRecordingQuality(v.recordingQuality);
      try { videoMixer.setRecordingQuality(select.value); changed(); }
      catch (error) { select.value = old; throw error; }
    });
    $('#video-fullscreen').onclick = run(async () => {
      const canvas = $('#video-master');
      if (!canvas.requestFullscreen) throw new Error('Fullscreen is unavailable in this browser.');
      await canvas.requestFullscreen();
    });
    $('#video-reset').onclick = run(async () => { await videoMixer.reset(); notify('Video frame history reset.'); });
    $('#video-record').onclick = run(async () => {
      const button = $('#video-record'); button.disabled = true;
      $('#video-record-quality').disabled = true; $('#video-resolution').disabled = true;
      try { if (videoMixer.recording) await videoMixer.stop(); else await videoMixer.record(); }
      finally {
        // #panel may have been replaced while capture start/stop awaited. Update
        // current controls only; completion still belongs to the mixer session.
        const currentButton = $('#video-record');
        if (currentButton) { currentButton.disabled = false; currentButton.textContent = videoMixer.recording ? 'Stop video capture' : 'Record video mix'; }
        for (const id of ['#video-resolution','#video-record-quality']) {
          const select = $(id); if (select) select.disabled = !!videoMixer.recording;
        }
        const downloadButton = $('#video-download'); if (downloadButton) downloadButton.disabled = !videoMixer.result;
      }
    });
    $('#video-download').onclick = () => {
      const blob = videoMixer.result;
      if (blob) download('open-play-video-mix.' + (blob.type.includes('mp4') ? 'mp4' : 'webm'),blob);
    };
    $('#video-fx').onclick = () => effectsDialog();
    $('#video-overlay').onclick = () => overlaysDialog();
    $('#video-karaoke').onclick = () => karaokeControls.open();
    $('#video-media').onclick = () => mediaControls.open();
  }
  function effectsDialog() {
    dialog('Video FX · independent controls', `<p>Two ordered slots per target; slot 1 feeds slot 2. All 55 resource names have independently designed behavior and parameters. Candidate reference registration and every reference visual match remain unverified.</p><label>FX target<select id="video-fx-target">${targetOptions('left')}</select></label><div id="video-fx-slots"></div>`, () => {
      const targetSelect = document.querySelector('#video-fx-target'), host = document.querySelector('#video-fx-slots');
      function render() {
        const target = targetSelect.value;
        host.innerHTML = v.fx[target].map((spec,slot) => {
          const effect = effectByName.get(spec.name);
          return `<fieldset data-fx-slot="${slot}"><legend>${title(target)} slot ${slot+1}${slot ? ' · after slot 1' : ''}</legend><div class="form-grid"><label><input type="checkbox" data-fx-key="on" ${checked(spec.on)}> Enabled</label><label>Effect<select data-fx-key="name">${videoEffectCatalog.map(entry => option(entry.name, entry.name + (entry.candidateOnly ? ' · candidate, unverified' : ''), spec.name)).join('')}</select></label>${effect.independentParameters.map(parameter => {
            const value = parameter.name === 'value' ? spec.value : spec.params[parameter.name] ?? parameter.default;
            const label = parameter.name === 'value' ? 'Amount (0 = bypass)' : parameter.name.replace(/([A-Z])/g,' $1');
            if (parameter.name === 'captureToken') return `<button type="button" data-fx-capture>Capture a new frame</button><span role="status">Capture identity ${esc(value)}</span>`;
            return `<label>${esc(label)}${parameter.options ? `<select data-fx-param="${esc(parameter.name)}">${parameter.options.map(item => option(item,item,value)).join('')}</select>` : `<input type="number" data-fx-param="${esc(parameter.name)}" min="${parameter.min}" max="${parameter.max}" step="${parameter.step || 'any'}" value="${esc(value)}">`}${parameter.unit ? `<small>${esc(parameter.unit)}</small>` : ''}</label>`;
          }).join('')}</div><p class="muted">${esc(effect.contract)}</p></fieldset>`;
        }).join('');
      }
      targetSelect.onchange = render;
      host.onchange = event => {
        const input = event.target, field = input.closest('[data-fx-slot]'); if (!field) return;
        const target = targetSelect.value, slot = Number(field.dataset.fxSlot), spec = v.fx[target][slot];
        if (input.dataset.fxKey === 'name') { v.fx[target][slot] = {...createVideoEffectSpec(input.value),on:spec.on}; render(); host.querySelector(`[data-fx-slot="${slot}"] [data-fx-key="name"]`)?.focus(); }
        else if (input.dataset.fxKey === 'on') spec.on = input.checked;
        else if (input.dataset.fxParam) {
          if (!input.checkValidity()) { input.reportValidity(); return; }
          const parameter = effectByName.get(spec.name).independentParameters.find(item => item.name === input.dataset.fxParam);
          const value = parameter.options ? input.value : Number(input.value);
          if (!parameter.options && (!input.value.trim() || !Number.isFinite(value))) return;
          if (parameter.name === 'value') spec.value = value; else spec.params[parameter.name] = value;
        }
        changed();
      };
      host.oninput = event => { if (event.target.dataset.fxParam && event.target.type === 'number') host.onchange(event); };
      host.onclick = event => {
        if (!event.target.closest('[data-fx-capture]')) return;
        const slot = Number(event.target.closest('[data-fx-slot]').dataset.fxSlot);
        const spec = v.fx[targetSelect.value][slot];
        spec.params.captureToken = (Number(spec.params.captureToken) || 0) + 1;
        changed(); render(); host.querySelector(`[data-fx-slot="${slot}"] [data-fx-capture]`)?.focus();
      };
      render();
    });
  }
  function readPresets() {
    try { const saved = JSON.parse(localStorage.getItem(presetsKey) || '[]'); return Array.isArray(saved) ? saved.filter(item => typeof item.name === 'string' && item.metadata?.version === 1) : []; }
    catch { notify('Saved overlay presets could not be read. Current overlays are unchanged.'); return []; }
  }
  function overlaysDialog() {
    dialog('Text / image overlays', `<p>Overlays start off. Array order is back to front. Text/font/color, alignment, on/off, saved presets and animation families follow public documentation; placement, numeric mappings and this three-target routing are independent.</p><label>Overlay target<select id="video-overlay-target">${targetOptions('master')}</select></label><div class="form-actions"><button id="video-add-text">Add text</button><button id="video-add-image">Add image</button></div><label>Edit overlay<select id="video-overlay-list"></select></label><div id="video-overlay-editor"></div>`, () => {
      const $ = selector => document.querySelector(selector);
      const targetSelect = $('#video-overlay-target'), list = $('#video-overlay-list'), host = $('#video-overlay-editor');
      let selected = '', presets = readPresets();
      const current = () => v.overlays[targetSelect.value].find(spec => spec.id === selected);
      function render() {
        const specs = v.overlays[targetSelect.value];
        if (!specs.some(spec => spec.id === selected)) selected = specs[0]?.id || '';
        list.innerHTML = specs.length ? specs.map((spec,index) => option(spec.id, `${index+1}. ${spec.name || title(spec.kind)}${spec.on ? ' · ON' : ' · off'}`, selected)).join('') : '<option value="">No overlays · add text or image</option>';
        list.disabled = !specs.length;
        const spec = current();
        if (!spec) { host.innerHTML = '<p class="muted">Add an overlay to configure it. Nothing is drawn until Enabled is checked.</p>'; return; }
        const animation = videoOverlayAnimations.find(item => item.id === spec.animation) || videoOverlayAnimations[0];
        const numeric = (key,label,min,max,step='any') => `<label>${label}<input type="number" data-overlay-key="${key}" min="${min}" max="${max}" step="${step}" value="${esc(spec[key])}"></label>`;
        host.innerHTML = `<fieldset><legend>${title(targetSelect.value)} ${esc(spec.kind)} overlay</legend><div class="form-grid"><label><input type="checkbox" data-overlay-key="on" ${checked(spec.on)}> Enabled</label><label>Overlay name<input data-overlay-key="name" maxlength="256" value="${esc(spec.name)}"></label>${spec.kind === 'text' ? `<label>Text<textarea data-overlay-key="text" maxlength="10000">${esc(spec.text)}</textarea></label><label>Font family<input data-overlay-key="fontFamily" maxlength="128" value="${esc(spec.fontFamily)}"></label><label>Text color<input type="color" data-overlay-key="color" value="${/^#[\da-f]{6}$/i.test(spec.color) ? spec.color : '#ffffff'}"></label>${numeric('fontSize','Font size (pixels)',4,512)}` : `<label>Reimport / choose image<input type="file" id="video-overlay-image" accept="image/png,image/jpeg,image/webp,image/gif"></label><p id="video-overlay-asset" role="status">${loadedImages.has(`${targetSelect.value}/${spec.imageRef}`) ? 'Image decoded in this session.' : 'Image bytes are not saved. Import the original image before enabling this overlay.'}</p>`}<label>Alignment<select data-overlay-key="align">${['left','center','right'].map(item => option(item,title(item),spec.align)).join('')}</select></label>${numeric('opacity','Opacity (0–1)',0,1)}${numeric('x','Horizontal anchor (0–1)',0,1)}${numeric('y','Vertical center (0–1)',0,1)}${numeric('scale','Scale',.05,4)}<label>Animation<select data-overlay-key="animation">${videoOverlayAnimations.map(item => option(item.id,item.name,spec.animation)).join('')}</select></label>${numeric('speed','Animation speed / intensity (0–4)',0,4)}${animation.options.length ? `<label>Documented ${animation.family === 'scroll' ? 'speed' : 'intensity'} labels<select id="video-overlay-speed-label"><option value="">Custom numeric value</option>${animation.options.map(label => option(label,label,'')).join('')}</select></label>` : ''}</div><p class="muted">BPM/Bass Zoom require a left/right target with real audio analysis; master reactive zoom is unavailable. Reduced Motion keeps static placement and disables automatic overlay motion.</p><div class="form-actions"><button id="video-overlay-down">Move earlier</button><button id="video-overlay-up">Move later</button><button id="video-overlay-remove">Remove overlay</button></div></fieldset><fieldset><legend>Local metadata presets</legend><label>Preset name<input id="video-overlay-preset-name" maxlength="128" value="${esc(spec.name)}"></label><button id="video-overlay-preset-save">Save / update preset</button><label>Saved preset<select id="video-overlay-preset-list">${presets.map((preset,index) => option(String(index),preset.name,'')).join('') || '<option value="">No saved presets</option>'}</select></label><button id="video-overlay-preset-load" ${presets.length ? '' : 'disabled'}>Reload into this overlay</button><p class="muted">Presets store editable scalar metadata only. Images require reimport after reload; no image bytes, file handles or URLs are stored.</p><p id="video-overlay-preset-status" role="status"></p></fieldset>`;
        const index = specs.indexOf(spec); $('#video-overlay-down').disabled = index === 0; $('#video-overlay-up').disabled = index === specs.length-1;
      }
      targetSelect.onchange = () => { selected = ''; render(); };
      list.onchange = () => { selected = list.value; render(); };
      for (const kind of ['text','image']) $('#video-add-'+kind).onclick = () => {
        const spec = createVideoOverlaySpec(kind); v.overlays[targetSelect.value].push(spec); selected = spec.id; changed(); render();
      };
      host.oninput = event => {
        const input = event.target, key = input.dataset.overlayKey, spec = current();
        if (!key || !spec) return;
        if (!input.checkValidity()) return;
        const value = input.type === 'checkbox' ? input.checked : input.type === 'number' ? Number(input.value) : input.value;
        if (input.type === 'number' && (!input.value.trim() || !Number.isFinite(value))) return;
        spec[key] = value;
        if (key === 'fontFamily') spec.fontFamily = normalizeVideoOverlay(spec).fontFamily;
        changed();
      };
      host.onchange = run(async event => {
        const input = event.target, spec = current(); if (!spec) return;
        if (input.id === 'video-overlay-image') {
          const file = input.files?.[0]; if (!file) return;
          const target = targetSelect.value, id = spec.id, key = `${target}/${id}`, request = {};
          imageRequests.set(key,request); input.disabled = true;
          try {
            await videoMixer.setOverlayImage(target,id,file);
            if (imageRequests.get(key) !== request) return;
            if (!v.overlays[target].includes(spec)) { videoMixer.clearOverlayImage?.(target,id); return; }
            spec.imageRef = id; loadedImages.add(`${target}/${id}`); changed();
            if (current() === spec) $('#video-overlay-asset').textContent = 'Image decoded in this session.';
          } finally { input.disabled = false; input.value = ''; }
        } else if (input.id === 'video-overlay-speed-label' && input.value) {
          spec.speed = normalizeVideoOverlay({...spec,speed:input.value}).speed; changed(); render(); $('#video-overlay-speed-label')?.focus();
        } else if (input.dataset.overlayKey === 'animation') { render(); host.querySelector('[data-overlay-key="animation"]')?.focus(); }
        else if (input.dataset.overlayKey && !input.checkValidity()) input.reportValidity();
      });
      host.onclick = run(async event => {
        const button = event.target.closest('button'); if (!button) return;
        const spec = current(); if (!spec) return;
        const target = targetSelect.value, specs = v.overlays[target], index = specs.indexOf(spec);
        if (button.id === 'video-overlay-remove') { imageRequests.delete(`${target}/${spec.id}`); videoMixer.clearOverlayImage?.(target,spec.imageRef || spec.id); loadedImages.delete(`${target}/${spec.imageRef}`); specs.splice(index,1); selected = ''; changed(); render(); (list.disabled ? $('#video-add-text') : list).focus(); }
        else if (button.id === 'video-overlay-down' || button.id === 'video-overlay-up') { const destination = index + (button.id.endsWith('down') ? -1 : 1); if (destination >= 0 && destination < specs.length) { [specs[index],specs[destination]] = [specs[destination],specs[index]]; changed(); render(); } }
        else if (button.id === 'video-overlay-preset-save') {
          const name = $('#video-overlay-preset-name').value.trim(); if (!name) { $('#video-overlay-preset-name').focus(); throw new Error('Enter a name for this overlay preset.'); }
          const preset = {name, metadata:videoControlsPreset(spec)}, next = [...presets];
          const found = next.findIndex(item => item.name === name); if (found >= 0) next[found] = preset; else next.push(preset);
          localStorage.setItem(presetsKey, JSON.stringify(next)); presets = next; render(); $('#video-overlay-preset-status').textContent = `Saved “${name}” metadata locally.`;
        } else if (button.id === 'video-overlay-preset-load') {
          const preset = presets[Number($('#video-overlay-preset-list').value)]; if (!preset) return;
          const restored = restoreVideoOverlayPreset(preset.metadata);
          imageRequests.delete(`${target}/${spec.id}`);
          videoMixer.clearOverlayImage?.(target,spec.imageRef || spec.id); loadedImages.delete(`${target}/${spec.imageRef}`);
          specs[index] = {...restored,id:spec.id,imageRef:restored.kind === 'image' ? spec.id : null,on:restored.kind === 'image' ? false : restored.on};
          selected = spec.id; changed(); render(); $('#video-overlay-preset-status').textContent = restored.kind === 'image' ? 'Metadata restored. Reimport the original image, then enable this overlay.' : 'Metadata restored. Edit any field to change the active overlay.';
        }
      });
      render();
    });
  }
  return {markup, bind};
}
