import assert from 'node:assert/strict';
import {videoOverlayAnimations, videoOverlayPolicy, videoOverlayControls, normalizeVideoOverlay,
  videoOverlayPresetMetadata, restoreVideoOverlayPreset, layoutVideoOverlayText,
  videoOverlayMotion, createVideoOverlays} from '../prototype/video-overlays.js';
const checks = [];
function test(name, run) { run(); checks.push({name, passed: true}); }
const size = {width: 200, height: 100, contentWidth: 20, contentHeight: 10};
test('Documented animation families remain separate from static baseline and unknown reference menus', () => {
  assert.equal(videoOverlayAnimations.filter(x => x.documented).length, 6);
  assert.equal(videoOverlayAnimations.filter(x => x.family === 'scroll').length, 4);
  assert(videoOverlayAnimations.every(x => x.referenceEquivalent === false && x.referenceRuntimeAvailability === 'unverified'));
  assert.match(videoOverlayPolicy.documented.reactiveRestriction, /L\/R/);
  assert.match(videoOverlayPolicy.completeAnimationCatalog, /unknown/);
  assert(videoOverlayControls.find(x => x.key === 'opacity').evidence.includes('official-controller-doc'));
});
test('Normalization bounds invalid geometry while preserving literal zero opacity/speed', () => {
  const value = normalizeVideoOverlay({on: true, opacity: 0, speed: 0, scale: Infinity, fontSize: -2, x: -3, y: 9, color: 'url(javascript:bad)', fontFamily: 'bad; font'});
  assert.equal(value.opacity, 0); assert.equal(value.speed, 0); assert.equal(value.scale, 1);
  assert.equal(value.fontSize, 4); assert.equal(value.x, 0); assert.equal(value.y, 1);
  assert.equal(value.color, '#ffffff'); assert.equal(value.fontFamily, 'sans-serif');
  assert.equal(normalizeVideoOverlay().on, false);
});
test('Documented display names map to stable IDs and family-specific speed/intensity labels', () => {
  assert.equal(normalizeVideoOverlay({animation: 'Scroll - Left-Right', speed: 'slow'}).animation, 'scroll-left-right');
  assert(normalizeVideoOverlay({speed: 'Fast'}).speed > normalizeVideoOverlay({speed: 'Slow'}).speed);
  assert(normalizeVideoOverlay({speed: 'Over the Top'}).speed > normalizeVideoOverlay({speed: 'Subtle'}).speed);
});
test('Multiline wrapping preserves paragraphs and splits overlong words without stretching', () => {
  assert.deepEqual(layoutVideoOverlayText('hello world\n\nabcdef', text => text.length, 5), ['hello', 'world', '', 'abcde', 'f']);
});
for (const [animation, axis, direction] of [['scroll-left-right', 'x', 1], ['scroll-right-left', 'x', -1], ['scroll-top-bottom', 'y', 1], ['scroll-bottom-top', 'y', -1]]) test(`${animation} moves in its declared direction`, () => {
  const a = videoOverlayMotion({animation, speed: 1}, size, {time: 2});
  const b = videoOverlayMotion({animation, speed: 1}, size, {time: 4});
  assert((b[axis] - a[axis]) * direction > 0);
  const fixed = axis === 'x' ? 'y' : 'x'; assert.equal(a[fixed], b[fixed]);
});
test('Scroll speed changes actual travel and zero speed remains at static placement', () => {
  const slow = videoOverlayMotion({animation: 'scroll-left-right', speed: 'Slow'}, size, {time: 2});
  const fast = videoOverlayMotion({animation: 'scroll-left-right', speed: 'Fast'}, size, {time: 2});
  assert(fast.x > slow.x);
  assert.deepEqual(videoOverlayMotion({animation: 'scroll-left-right', speed: 0}, size, {time: 100}), videoOverlayMotion({animation: 'none', speed: 0}, size, {time: 100}));
});
test('BPM zoom changes phase with BPM while bass zoom consumes only measured bass', () => {
  const a = videoOverlayMotion({animation: 'bpm-zoom'}, size, {time: .5, bpm: 60});
  const b = videoOverlayMotion({animation: 'bpm-zoom'}, size, {time: .5, bpm: 120});
  assert(b.scale > a.scale);
  const quiet = videoOverlayMotion({animation: 'bass-zoom'}, size, {bass: 0, mid: 1, treble: 1, level: 1});
  const loud = videoOverlayMotion({animation: 'bass-zoom'}, size, {bass: 1, mid: 0, treble: 0, level: 0});
  assert(loud.scale > quiet.scale); assert.equal(quiet.scale, 1);
});
test('Reactive modes freeze with missing audio or on master rather than claim unsupported routing', () => {
  for (const animation of ['bpm-zoom', 'bass-zoom']) {
    for (const context of [{target: 'master', bpm: 120, bass: 1}, {audioAvailable: false, bpm: 120, bass: 1}, {}]) {
      const result = videoOverlayMotion({animation}, size, context);
      assert.equal(result.scale, 1); assert(result.reactiveUnavailable);
    }
  }
});
test('Reduced Motion removes every automatic transform across time and audio levels', () => {
  for (const {id} of videoOverlayAnimations) {
    const a = videoOverlayMotion({animation: id}, size, {time: 1, bpm: 60, bass: 0, reducedMotion: true});
    const b = videoOverlayMotion({animation: id}, size, {time: 99, bpm: 180, bass: 1, reducedMotion: true});
    assert.deepEqual(a, b);
    assert.equal(a.scale, 1); assert.equal(a.x, 90); assert.equal(a.y, 45);
  }
});
test('Image preset metadata round-trips without persisting decoded images or arbitrary objects', () => {
  const image = {notSerializable: true}; image.self = image;
  const metadata = videoOverlayPresetMetadata({kind: 'image', on: true, image, imageRef: 'local:logo-1', id: 'preset-1', name: 'Logo', opacity: .5, unknown: image});
  assert(!('image' in metadata) && !('unknown' in metadata));
  const restored = restoreVideoOverlayPreset(JSON.parse(JSON.stringify(metadata)), {image});
  assert.equal(restored.image, image); assert.equal(restored.imageRef, 'local:logo-1'); assert.equal(restored.opacity, .5);
  const edited = videoOverlayPresetMetadata({...restored, opacity: .8, name: 'Edited'});
  assert.equal(edited.id, 'preset-1'); assert.equal(edited.opacity, .8); assert.equal(edited.name, 'Edited');
});
test('Metadata-only image reload stays unresolved until caller supplies an actual decoded asset', () => {
  const restored = restoreVideoOverlayPreset(videoOverlayPresetMetadata({kind: 'image', on: true, imageRef: 'local:missing'}));
  assert.equal(restored.image, null); assert.equal(restored.on, true);
  assert.throws(() => restoreVideoOverlayPreset({version: 2}), TypeError);
  assert.throws(() => videoOverlayPresetMetadata({kind: 'image', imageRef: 'x'.repeat(4097)}), TypeError);
});
test('Canvas dimensions reject invalid/oversized backing stores before allocation', () => {
  for (const dimensions of [{width: 0}, {height: -1}, {width: 1.5}, {height: 4097}]) assert.throws(() => createVideoOverlays(dimensions), RangeError);
});
console.log(JSON.stringify({scope: 'Executed real normalization, motion/layout and metadata helpers. Actual Canvas pixels and browser lifecycle require the public browser harness.', passed: checks.length, checks}, null, 2));
