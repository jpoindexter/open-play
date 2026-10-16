import {createVideoOverlays, videoOverlayAnimations, videoOverlayPresetMetadata, restoreVideoOverlayPreset} from './video-overlays.js';
const width = 192, height = 128, background = [20, 40, 80, 255];
const make = (w, h, fill) => {
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
  if (fill) { const ctx = canvas.getContext('2d'); ctx.fillStyle = fill; ctx.fillRect(0, 0, w, h); }
  return canvas;
};
const pixel = (frame, x, y) => [...frame.data.subarray((y * width + x) * 4, (y * width + x) * 4 + 4)];
const near = (actual, expected, tolerance = 1) => actual.every((value, i) => Math.abs(value - expected[i]) <= tolerance);
const difference = (a, b) => { let changed = 0; for (let i = 0; i < a.data.length; i++) if (a.data[i] !== b.data[i]) changed++; return changed; };
function coverage(frame, bg = background) {
  let count = 0, minX = width, maxX = -1, minY = height, maxY = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const offset = (y * width + x) * 4;
    if (bg.some((value, c) => Math.abs(frame.data[offset + c] - value) > 2)) {
      count++; minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
  }
  return {count, minX, maxX, minY, maxY, width: count ? maxX - minX + 1 : 0, height: count ? maxY - minY + 1 : 0};
}
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const run = document.querySelector('#run'), summary = document.querySelector('#summary'), resultsNode = document.querySelector('#results');
run.onclick = async () => {
  run.disabled = true; document.body.dataset.result = 'running';
  const renderer = createVideoOverlays({width, height}), results = [];
  document.querySelector('#preview').replaceChildren(renderer.canvas);
  const base = make(width, height, 'rgb(20,40,80)'), logo = make(24, 16, '#ff0000');
  logo.getContext('2d').clearRect(10, 6, 4, 4);
  const decoded = new Image(); decoded.src = logo.toDataURL('image/png');
  const read = canvas => canvas.getContext('2d').getImageData(0, 0, width, height);
  const frame = (overlays = [], context = {}, input = base) => read(renderer.render(input, overlays, context));
  const image = extra => ({kind: 'image', on: true, image: logo, ...extra});
  const text = extra => ({kind: 'text', on: true, text: 'TEST', fontSize: 24, fontFamily: 'monospace', color: '#ff0000', ...extra});
  async function test(name, action) {
    try { results.push({name, passed: true, evidence: await action()}); }
    catch (error) { results.push({name, passed: false, error: error.message, stack: error.stack}); }
    summary.textContent = `${results.filter(result => result.passed).length}/${results.length} passed · ${name}`;
    resultsNode.textContent = JSON.stringify(results, null, 2);
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  try {
    await decoded.decode(); await document.fonts.ready;
    const bypass = frame();
    await test('OFF text/image overlays preserve every base pixel', () => {
      const output = frame([text({on: false}), image({on: false})]);
      const changed = difference(output, bypass); assert(changed === 0, 'OFF changed base pixels.'); return {changed};
    });
    await test('ON decoded PNG changes actual image pixels while transparent hole preserves base', () => {
      const output = frame([image({image: decoded})]);
      const solid = pixel(output, 90, 60), hole = pixel(output, 96, 64);
      assert(near(solid, [255, 0, 0, 255]) && near(hole, background), 'PNG/alpha composition is incorrect.');
      return {solid, hole, bounds: coverage(output)};
    });
    await test('Image opacity0.5 produces the expected source-over pixel blend', () => {
      const actual = pixel(frame([image({opacity: .5})]), 90, 60);
      assert(near(actual, [138, 20, 40, 255]), `Opacity blend is ${actual}.`); return {actual};
    });
    await test('Opacity zero is exact bypass and toggling OFF leaves no prior overlay', () => {
      frame([image()]); const zero = frame([image({opacity: 0})]); const off = frame([image({on: false})]);
      assert(difference(zero, bypass) === 0 && difference(off, bypass) === 0, 'Overlay pixels persisted after bypass.'); return {zeroChanged: difference(zero, bypass), offChanged: difference(off, bypass)};
    });
    await test('Source alpha and overlay opacity multiply without an opaque black matte', () => {
      const translucent = make(8, 8, 'rgba(255,0,0,.5)');
      const transparent = pixel(frame([image({image: translucent, opacity: .5})], {}, null), 96, 64);
      const composite = pixel(frame([image({image: translucent, opacity: .5})]), 96, 64);
      assert(near(transparent, [255, 0, 0, 64], 1) && near(composite, [79, 30, 60, 255], 1), 'Alpha/opacity product was lost.');
      return {transparent, composite};
    });
    await test('Text ON and selected color produce actual red glyph pixels', () => {
      const output = frame([text()]); let red = 0;
      for (let i = 0; i < output.data.length; i += 4) if (output.data[i] > 230 && output.data[i + 1] < 5 && output.data[i + 2] < 5) red++;
      assert(red > 20 && coverage(output).count > 100, 'No colored text glyphs were rendered.'); return {solidRedPixels: red, bounds: coverage(output)};
    });
    await test('Font family changes rendered glyph shapes', () => {
      const mono = frame([text({text: 'WiWiWi', fontFamily: 'monospace'})]);
      const serif = frame([text({text: 'WiWiWi', fontFamily: 'serif'})]);
      const changed = difference(mono, serif); assert(changed > 100, 'Font family did not alter glyph pixels.'); return {changed};
    });
    await test('Font size changes glyph bounds and coverage', () => {
      const small = coverage(frame([text({fontSize: 16})])), large = coverage(frame([text({fontSize: 32})]));
      assert(large.width > small.width * 1.7 && large.count > small.count * 2, 'Font size did not enlarge actual text.'); return {small, large};
    });
    await test('Text alignment moves actual glyph bounds around the configured anchor', () => {
      const positions = ['left', 'center', 'right'].map(align => coverage(frame([text({text: 'MMM', fontSize: 20, align})])));
      assert(positions[0].minX > positions[1].minX && positions[1].minX > positions[2].minX, 'Text alignment did not change placement.');
      assert(Math.abs(positions[0].width - positions[2].width) <= 2, 'Alignment distorted text width.'); return {positions};
    });
    await test('Explicit multiline text renders separate lines and maintains layout', () => {
      const one = coverage(frame([text({text: 'AAA', fontSize: 20})])), two = coverage(frame([text({text: 'AAA\nAAA', fontSize: 20})]));
      assert(two.height > one.height + 15 && two.count > one.count * 1.8, 'Second text line was lost.'); return {one, two};
    });
    await test('Image left/center/right alignment preserves geometry and uses distinct anchors', () => {
      const positions = ['left', 'center', 'right'].map(align => coverage(frame([image({align})])));
      assert(positions[0].minX === 96 && positions[1].minX === 84 && positions[2].minX === 72, 'Image alignment anchors are incorrect.'); return {positions};
    });
    await test('Image position and scale move and resize the actual source', () => {
      const original = coverage(frame([image({x: .25, y: .25})])), scaled = coverage(frame([image({x: .25, y: .25, scale: 2})]));
      assert(original.minX === 36 && original.minY === 24 && scaled.width === original.width * 2 && scaled.height === original.height * 2, 'Image geometry did not follow controls.'); return {original, scaled};
    });
    for (const animation of videoOverlayAnimations.filter(value => value.family === 'scroll')) await test(`${animation.name} moves pixels in its documented direction`, () => {
      const a = coverage(frame([image({animation: animation.id, speed: 1})], {time: 2}));
      const b = coverage(frame([image({animation: animation.id, speed: 1})], {time: 4}));
      const horizontal = animation.direction[0] === 'x', delta = horizontal ? b.minX - a.minX : b.minY - a.minY;
      assert(a.count > 0 && b.count > 0 && delta * (animation.direction[1] === '+' ? 1 : -1) > 10, 'Scroll direction/coverage is wrong.'); return {a, b, delta};
    });
    await test('Scroll speed selection changes actual travel over the same elapsed time', () => {
      const slow = coverage(frame([image({animation: 'scroll-left-right', speed: 'Slow'})], {time: 2}));
      const fast = coverage(frame([image({animation: 'scroll-left-right', speed: 'Fast'})], {time: 2}));
      assert(fast.minX > slow.minX + 40, 'Speed selection did not affect travel.'); return {slow, fast};
    });
    await test('BPM zoom changes coverage at opposite phases of a beat', () => {
      const high = coverage(frame([image({animation: 'bpm-zoom'})], {time: 0, bpm: 120, target: 'left'}));
      const low = coverage(frame([image({animation: 'bpm-zoom'})], {time: .25, bpm: 120, target: 'left'}));
      assert(high.count > low.count * 1.4, 'BPM phase did not change zoom coverage.'); return {high, low};
    });
    await test('BPM input changes real zoom cadence', () => {
      const slow = coverage(frame([image({animation: 'bpm-zoom'})], {time: .5, bpm: 60, target: 'right'}));
      const fast = coverage(frame([image({animation: 'bpm-zoom'})], {time: .5, bpm: 120, target: 'right'}));
      assert(fast.count > slow.count * 1.4, 'BPM did not drive the animation.'); return {slow, fast};
    });
    await test('Measured bass changes real image zoom independently of general level', () => {
      const quiet = coverage(frame([image({animation: 'bass-zoom'})], {bass: 0, level: 1, target: 'left'}));
      const loud = coverage(frame([image({animation: 'bass-zoom'})], {bass: 1, level: 0, target: 'left'}));
      assert(loud.count > quiet.count * 1.7, 'Bass did not change zoom coverage.'); return {quiet, loud};
    });
    await test('Reactive intensity selection changes actual zoom strength', () => {
      const subtle = coverage(frame([image({animation: 'bass-zoom', speed: 'Subtle'})], {bass: 1}));
      const strong = coverage(frame([image({animation: 'bass-zoom', speed: 'Over the Top'})], {bass: 1}));
      assert(strong.count > subtle.count * 2, 'Intensity did not alter zoom strength.'); return {subtle, strong};
    });
    await test('Mid/treble/general level are not falsely substituted for missing bass', () => {
      const a = frame([image({animation: 'bass-zoom'})], {bass: 0, level: 0, mid: 0, treble: 0});
      const b = frame([image({animation: 'bass-zoom'})], {bass: 0, level: 1, mid: 1, treble: 1});
      assert(difference(a, b) === 0, 'Non-bass levels changed Bass Zoom.'); return {changed: difference(a, b)};
    });
    await test('Master placement or explicitly missing audio freezes reactive zoom with a diagnostic', () => {
      const staticFrame = frame([image()]);
      for (const context of [{target: 'master', bpm: 120, bass: 1}, {audioAvailable: false, bpm: 120, bass: 1}]) for (const animation of ['bpm-zoom', 'bass-zoom']) {
        const output = frame([image({animation})], context);
        assert(difference(output, staticFrame) === 0 && renderer.diagnostics().skipped.length > 0, 'Unsupported reactive context animated or lacked a diagnostic.');
      }
      return {contexts: 4};
    });
    await test('Reduced Motion keeps every animation stationary across time and audio changes', () => {
      const still = frame([image()]);
      for (const {id} of videoOverlayAnimations) {
        const a = frame([image({animation: id})], {time: 1, bpm: 60, bass: 0, reducedMotion: true});
        const b = frame([image({animation: id})], {time: 99, bpm: 180, bass: 1, reducedMotion: true});
        assert(difference(a, still) === 0 && difference(b, still) === 0, `Reduced Motion still moved ${id}.`);
      }
      return {animations: videoOverlayAnimations.length};
    });
    await test('Text save/reload/edit preserves pixels and updates the same preset metadata', () => {
      const initial = text({id: 'caption-1', name: 'Caption'}), before = frame([initial]);
      const metadata = JSON.parse(JSON.stringify(videoOverlayPresetMetadata(initial)));
      const restored = restoreVideoOverlayPreset(metadata), after = frame([restored]);
      assert(difference(before, after) === 0, 'Saved text did not restore the same pixels.');
      const edited = videoOverlayPresetMetadata({...restored, text: 'EDIT', color: '#00ff00'});
      const changed = difference(after, frame([restoreVideoOverlayPreset(edited)]));
      assert(edited.id === metadata.id && changed > 100, 'Editing failed to update the existing preset output.'); return {sameId: edited.id, changed};
    });
    await test('Image reload requires a decoded asset; restored PNG pixels match the saved overlay', () => {
      const initial = image({id: 'logo-1', image: decoded, imageRef: 'fixture:logo'}), before = frame([initial]);
      const metadata = JSON.parse(JSON.stringify(videoOverlayPresetMetadata(initial)));
      const missing = frame([restoreVideoOverlayPreset(metadata)]);
      assert(difference(missing, bypass) === 0 && renderer.diagnostics().skipped.length === 1, 'Missing image asset was faked or not diagnosed.');
      const restored = frame([restoreVideoOverlayPreset(metadata, {image: decoded})]);
      assert(difference(before, restored) === 0 && !('image' in metadata), 'Decoded asset reload changed pixels or image objects leaked to metadata.'); return {imageRef: metadata.imageRef, changedAfterReload: difference(before, restored)};
    });
    await test('Invalid/undecoded image is skipped without poisoning a later valid overlay', () => {
      const valid = frame([image()]);
      const output = frame([image({image: {width: 4, height: 4}, opacity: .2}), image()]);
      assert(difference(output, valid) === 0 && renderer.diagnostics().skipped.length === 1 && renderer.diagnostics().rendered === 1, 'Invalid image corrupted subsequent composition.'); return renderer.diagnostics();
    });
    await test('Fully transparent image preserves every base pixel', () => {
      const output = frame([image({image: make(24, 16)})]);
      assert(difference(output, bypass) === 0, 'Transparent image altered the base.'); return {changed: difference(output, bypass)};
    });
    await test('Overlay array order controls actual source-over layer order', () => {
      const blue = image({image: make(24, 16, '#0000ff')});
      const blueTop = pixel(frame([image(), blue]), 90, 60), redTop = pixel(frame([blue, image()]), 90, 60);
      assert(near(blueTop, [0, 0, 255, 255]) && near(redTop, [255, 0, 0, 255]), 'Layer order was not respected.'); return {blueTop, redTop};
    });
    await test('Reset clears output and switching animation/text creates no retained frame state', () => {
      frame([image({animation: 'bass-zoom'})], {bass: 1}); renderer.reset();
      const empty = read(renderer.canvas);
      assert(empty.data.every(value => value === 0), 'Reset retained overlay pixels.');
      const fresh = frame([text({text: 'NEXT'})]);
      const separate = createVideoOverlays({width, height}); const expected = read(separate.render(base, [text({text: 'NEXT'})])); separate.dispose();
      assert(difference(fresh, expected) === 0, 'Prior overlay/animation leaked into a new render.'); return {changed: difference(fresh, expected)};
    });
    await test('Explicit reuse of output as base preserves its pixels before clear', () => {
      const before = frame([image()]), after = read(renderer.render(renderer.canvas, []));
      assert(difference(before, after) === 0, 'In-place base was cleared before copying.'); return {changed: difference(before, after)};
    });
    await test('Dispose releases backing pixels and rejects subsequent rendering', () => {
      const temporary = createVideoOverlays({width, height}); temporary.render(base, [image()]); temporary.dispose(); temporary.dispose();
      let rejected = false; try { temporary.render(base, []); } catch { rejected = true; }
      assert(rejected && temporary.canvas.width === 0 && temporary.canvas.height === 0, 'Disposed renderer remained active.'); return {rejected, width: temporary.canvas.width, height: temporary.canvas.height};
    });
  } catch (error) { results.push({name: 'Harness setup error', passed: false, error: error.message, stack: error.stack}); }
  finally {
    const passed = results.filter(result => result.passed).length;
    summary.textContent = `${passed}/${results.length} video overlay pixel checks passed.`;
    document.body.dataset.result = passed === results.length ? 'passed' : 'failed'; run.disabled = false;
    resultsNode.textContent = JSON.stringify({scope: 'Actual Canvas 2D pixels from original synthetic PNG/canvas/text fixtures. Documented control families with independent geometry/mappings; vendor equivalence and parent UI routing/persistence remain separate gates.', passed, total: results.length, results}, null, 2);
  }
};
