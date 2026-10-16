// Original Canvas compositor. Public documentation supplies control families,
// not layout, numeric mappings, current-version menus or vendor algorithms.
const source = 'https://support.serato.com/hc/en-us/articles/202305514-Serato-Video-Text-and-Image-Effects-101';
const controllerSource = 'https://support.serato.com/hc/en-us/articles/10173705065871-Pioneer-DJ-DDJ-SP1-Quickstart-Guide';
const definitions = [
  ['none', 'None', 'static', null],
  ['scroll-left-right', 'Scroll Left-Right', 'scroll', 'x+'],
  ['scroll-right-left', 'Scroll Right-Left', 'scroll', 'x-'],
  ['scroll-top-bottom', 'Scroll Top-Bottom', 'scroll', 'y+'],
  ['scroll-bottom-top', 'Scroll Bottom-Top', 'scroll', 'y-'],
  ['bpm-zoom', 'BPM Zoom', 'bpm', null],
  ['bass-zoom', 'Bass Zoom', 'bass', null],
];
export const videoOverlayAnimations = Object.freeze(definitions.map(([id, name, family, direction]) => Object.freeze({
  id, name, family, direction, documented: id !== 'none', source: id === 'none' ? null : source,
  referenceRuntimeAvailability: 'unverified', referenceEquivalent: false,
  numericMapping: 'independent Open Play policy',
  options: Object.freeze(family === 'scroll' ? ['Slow', 'Medium', 'Fast'] : ['bpm', 'bass'].includes(family) ? ['Subtle', 'Noticeable', 'Over the Top'] : []),
})));
export const videoOverlayPolicy = Object.freeze({
  sources: Object.freeze([source, controllerSource]),
  documented: Object.freeze({textAndImage: true, textFontAndColor: true, alignment: true,
    onOff: true, saveReloadEdit: true, opacity: controllerSource,
    reactiveRestriction: 'Documented reactive zoom requires L/R and an audio overview.'}),
  independent: Object.freeze({positions: 'Caller routes left/right/master; complete vendor placement availability unknown.',
    geometry: 'x/y normalized 0..1; alignment anchors horizontal position, y anchors vertical center. Image uses native size contained without upscaling, then scale.',
    text: 'Multiline wrapping at 90% frame width; generic/browser font availability is caller-owned.',
    rendering: 'Array order, source-over alpha, shared fixed output canvas; caller owns frame scheduling.',
    persistence: 'Save scalar metadata and stable imageRef only; caller reloads/decodes original image before restore.',
    reducedMotion: 'Remove all automatic movement and reactive zoom; retain configured static placement.'}),
  completeAnimationCatalog: 'unknown for installed version', referenceEquivalent: false,
});
export const videoOverlayControls = Object.freeze([
  ['on', 'both', 'official-doc', null], ['text', 'text', 'official-doc', null],
  ['fontFamily', 'text', 'official-doc', null], ['color', 'text', 'official-doc', null],
  ['align', 'both', 'official-doc; independent three-way enum', ['left', 'center', 'right']],
  ['opacity', 'both', 'official-controller-doc; independent normalized range', [0, 1]],
  ['animation', 'both', 'official-doc; current complete menu unknown', null],
  ['speed', 'both', 'official labels; independent numeric speed/intensity mapping', [0, 4]],
  ['fontSize', 'text', 'independent', [4, 512]], ['x', 'both', 'independent', [0, 1]],
  ['y', 'both', 'independent', [0, 1]], ['scale', 'both', 'independent', [.05, 4]],
].map(([key, kind, evidence, range]) => Object.freeze({key, kind, evidence, range: range && Object.freeze(range)})));

const numeric = (value, fallback, low, high) => {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
  return Number.isFinite(parsed) ? Math.max(low, Math.min(high, parsed)) : fallback;
};
const normalizeKey = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const animations = new Map(videoOverlayAnimations.flatMap(animation => [[normalizeKey(animation.id), animation], [normalizeKey(animation.name), animation]]));
const speedLabels = {slow: .5, medium: 1, fast: 2, subtle: .35, noticeable: 1, overthetop: 2};
function color(value) {
  const candidate = typeof value === 'string' ? value.trim() : '';
  return /^(?:#[\da-f]{3,4}|#[\da-f]{6}|#[\da-f]{8}|[a-z]{1,32}|(?:rgb|hsl)a?\([\d\s.,%+/-]+\))$/i.test(candidate) ? candidate : '#ffffff';
}
export function normalizeVideoOverlay(input = {}) {
  if (!input || typeof input !== 'object') input = {};
  const animation = animations.get(normalizeKey(input.animation)) || videoOverlayAnimations[0];
  return {
    kind: input.kind === 'image' ? 'image' : 'text', on: input.on === true,
    text: typeof input.text === 'string' ? input.text.replace(/\r\n?/g, '\n').slice(0, 10000) : '',
    image: input.image || null, color: color(input.color),
    fontFamily: typeof input.fontFamily === 'string' && input.fontFamily.trim() && !/[;{}\n\r]/.test(input.fontFamily)
      ? input.fontFamily.trim().slice(0, 128) : 'sans-serif',
    fontSize: numeric(input.fontSize, 48, 4, 512),
    align: ['left', 'center', 'right'].includes(input.align) ? input.align : 'center',
    opacity: numeric(input.opacity, 1, 0, 1), animation: animation.id,
    speed: speedLabels[normalizeKey(input.speed)] ?? numeric(input.speed, 1, 0, 4),
    x: numeric(input.x, .5, 0, 1), y: numeric(input.y, .5, 0, 1), scale: numeric(input.scale, 1, .05, 4),
  };
}
export function videoOverlayPresetMetadata(spec = {}) {
  const normalized = normalizeVideoOverlay(spec);
  const {image: _image, ...metadata} = normalized;
  if (spec.imageRef != null && (typeof spec.imageRef !== 'string' || spec.imageRef.length > 4096))
    throw new TypeError('Image presets require a stable imageRef of at most 4096 characters; keep image bytes in the caller asset store.');
  return {version: 1, ...metadata, id: typeof spec.id === 'string' ? spec.id.slice(0, 128) : null,
    name: typeof spec.name === 'string' ? spec.name.slice(0, 256) : '', imageRef: spec.imageRef || null};
}
export function restoreVideoOverlayPreset(metadata, {image = null} = {}) {
  if (!metadata || metadata.version !== 1) throw new TypeError('Unsupported video overlay preset version.');
  return {...normalizeVideoOverlay({...metadata, image}), id: metadata.id || null, name: metadata.name || '', imageRef: metadata.imageRef || null};
}

/** Pure layout shared with the real Canvas renderer. Long words are wrapped by
 * Unicode code point, explicit blank lines remain, and no line is stretched. */
export function layoutVideoOverlayText(text, measure, maxWidth) {
  const lines = [];
  for (const paragraph of String(text).split('\n')) {
    if (!paragraph) { lines.push(''); continue; }
    let line = '';
    for (const token of paragraph.split(/(\s+)/u)) {
      if (!token) continue;
      if (line && measure(line + token) > maxWidth) { lines.push(line.trimEnd()); line = ''; }
      if (!line && /^\s+$/u.test(token)) continue;
      for (const character of token) {
        if (line && measure(line + character) > maxWidth) { lines.push(line.trimEnd()); line = ''; }
        line += character;
      }
    }
    lines.push(line.trimEnd());
  }
  return lines;
}

/** Absolute time in seconds; bass is normalized 0..1. No audio is synthesized or
 * inferred from generic level/mid/treble. Caller supplies actual audio features. */
export function videoOverlayMotion(spec, {width, height, contentWidth, contentHeight}, context = {}) {
  const overlay = normalizeVideoOverlay(spec), animation = animations.get(normalizeKey(overlay.animation));
  let zoom = 1, reactiveUnavailable = false;
  const reduced = !!context.reducedMotion, time = numeric(context.time, 0, -1e9, 1e9);
  const reactive = context.target !== 'master' && context.audioAvailable !== false;
  if (!reduced && overlay.speed > 0 && animation.family === 'bpm') {
    const bpm = numeric(context.bpm, 0, 0, 400);
    if (reactive && bpm > 0) zoom += .3 * overlay.speed * (.5 + .5 * Math.cos(2 * Math.PI * time * bpm / 60));
    else reactiveUnavailable = true;
  }
  if (!reduced && overlay.speed > 0 && animation.family === 'bass') {
    const bass = numeric(context.bass, 0, 0, 1);
    if (reactive && Number.isFinite(context.bass)) zoom += .5 * overlay.speed * bass;
    else reactiveUnavailable = true;
  }
  const scale = overlay.scale * zoom, w = contentWidth * scale, h = contentHeight * scale;
  const alignment = {left: 0, center: .5, right: 1}[overlay.align];
  let x = overlay.x * width - w * alignment, y = overlay.y * height - h / 2;
  if (!reduced && overlay.speed > 0 && animation.family === 'scroll') {
    const phase = ((time * overlay.speed / 8) % 1 + 1) % 1;
    if (animation.direction === 'x+') x = -w + (width + w) * phase;
    if (animation.direction === 'x-') x = width - (width + w) * phase;
    if (animation.direction === 'y+') y = -h + (height + h) * phase;
    if (animation.direction === 'y-') y = height - (height + h) * phase;
  }
  return {x, y, width: w, height: h, scale, reactiveUnavailable};
}

function canvas(width, height) {
  const value = typeof document !== 'undefined' ? document.createElement('canvas') :
    typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(width, height) : null;
  if (!value) throw new Error('Video overlays require a browser Canvas 2D implementation.');
  value.width = width; value.height = height; return value;
}
function dimensions(image) {
  if (!image || image.complete === false || (typeof image.readyState === 'number' && image.readyState < 2)) return null;
  const width = image.videoWidth || image.naturalWidth || image.width, height = image.videoHeight || image.naturalHeight || image.height;
  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0 ? {width, height} : null;
}
/** Stateless frame composition. Base and overlays retain straight-alpha Canvas
 * semantics. Missing/invalid assets are skipped with diagnostics, never faked.
 * reset clears pixels; dispose releases backing stores and rejects further use. */
export function createVideoOverlays({width = 640, height = 360} = {}) {
  if (![width, height].every(value => Number.isInteger(value) && value > 0 && value <= 4096))
    throw new RangeError('Video overlay dimensions must be integers from 1 to 4096.');
  const output = canvas(width, height), context = output.getContext('2d', {alpha: true});
  const snapshot = canvas(width, height), snapshotContext = snapshot.getContext('2d', {alpha: true});
  if (!context || !snapshotContext) throw new Error('Canvas 2D is unavailable; no placeholder overlay was substituted.');
  let disposed = false, diagnostics = {rendered: 0, skipped: []};
  const available = () => { if (disposed) throw new Error('Video overlay renderer is disposed.'); };
  return {
    canvas: output,
    diagnostics: () => ({rendered: diagnostics.rendered, skipped: diagnostics.skipped.map(value => ({...value}))}),
    render(baseSource, overlaySpecs = [], renderContext = {}) {
      available(); diagnostics = {rendered: 0, skipped: []};
      if (!Array.isArray(overlaySpecs)) throw new TypeError('Overlay specs must be an array.');
      // Preserve an explicitly reused output before clearing its backing store.
      if (baseSource === output) {
        snapshotContext.clearRect(0, 0, width, height); snapshotContext.drawImage(output, 0, 0); baseSource = snapshot;
      }
      context.resetTransform(); context.globalAlpha = 1; context.globalCompositeOperation = 'source-over'; context.clearRect(0, 0, width, height);
      if (baseSource != null) {
        try { context.drawImage(baseSource, 0, 0, width, height); }
        catch { diagnostics.skipped.push({index: -1, reason: 'Base image is unavailable or undecoded.'}); }
      }
      overlaySpecs.forEach((input, index) => {
        const overlay = normalizeVideoOverlay(input);
        if (!overlay.on || overlay.opacity === 0) return;
        context.save();
        try {
          let size, lines, lineWidths, lineHeight;
          if (overlay.kind === 'image') {
            size = dimensions(overlay.image);
            if (!size) { diagnostics.skipped.push({index, reason: 'Image is unavailable or undecoded.'}); return; }
            const contain = Math.min(1, width / size.width, height / size.height);
            size = {width: size.width * contain, height: size.height * contain};
          } else {
            if (!overlay.text) return;
            context.font = `${overlay.fontSize}px sans-serif`;
            context.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
            const measure = text => context.measureText(text).width;
            lines = layoutVideoOverlayText(overlay.text, measure, width * .9 / overlay.scale);
            lineWidths = lines.map(measure); lineHeight = overlay.fontSize * 1.2;
            size = {width: Math.max(0, ...lineWidths), height: lines.length * lineHeight};
          }
          const motion = videoOverlayMotion(overlay, {width, height, contentWidth: size.width, contentHeight: size.height}, renderContext);
          if (motion.reactiveUnavailable) diagnostics.skipped.push({index, reason: 'Reactive zoom is static: supply L/R audio features; master reactive placement is not documented.'});
          context.globalAlpha = overlay.opacity; context.translate(motion.x, motion.y); context.scale(motion.scale, motion.scale);
          if (overlay.kind === 'image') context.drawImage(overlay.image, 0, 0, size.width, size.height);
          else {
            context.fillStyle = '#ffffff'; context.fillStyle = overlay.color;
            context.textAlign = 'left'; context.textBaseline = 'top';
            const align = {left: 0, center: .5, right: 1}[overlay.align];
            lines.forEach((line, row) => context.fillText(line, (size.width - lineWidths[row]) * align, row * lineHeight));
          }
          diagnostics.rendered++;
        } catch { diagnostics.skipped.push({index, reason: 'Overlay could not be drawn from this image or text.'}); }
        finally { context.restore(); }
      });
      return output;
    },
    reset() { available(); context.clearRect(0, 0, width, height); snapshotContext.clearRect(0, 0, width, height); diagnostics = {rendered: 0, skipped: []}; },
    dispose() { if (disposed) return; disposed = true; output.width = output.height = snapshot.width = snapshot.height = 0; diagnostics = {rendered: 0, skipped: []}; },
  };
}
