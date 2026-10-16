// Beat-domain slicing over decoded local audio; device timing and LEDs are separate acceptance.
export function createSlicer({ engine, render, notify }) {
  const held = new Map();
  function bounds(d) {
    const beat = 60 / (d.track?.bpm || 120),
      length = (d.slicerDomain || 8) * beat,
      p = engine.position(d),
      grid = d.track?.grid || 0;
    return {
      beat,
      length,
      start: Math.max(0, grid + Math.floor((p - grid) / length) * length),
    };
  }
  async function press(key, d, index) {
    if (!d.track || held.has(key)) return;
    engine.init();
    const b = bounds(d),
      position = engine.position(d);
    const start = b.start + (index * b.length) / 8,
      end = Math.min(d.track.duration, start + b.beat * (d.sliceQuant || 1));
    if (start >= d.track.duration)
      return notify("This slice is beyond the end of the track.");
    const h = {
      d,
      track: d.track,
      position,
      time: engine.ctx.currentTime,
      playing: d.playing,
      loop: d.loop,
      loopIn: d.loopIn,
      loopOut: d.loopOut,
      released: false,
      rate: d.rate,
    };
    held.set(key, h);
    d.slice = index;
    await engine.setLoop(d, true, start, end);
    await engine.seek(d, start);
    if (!h.released && !d.playing) await engine.start(d);
    if (h.released && !h.playing) engine.pause(d);
  }
  async function release(key) {
    const h = held.get(key);
    if (!h) return;
    held.delete(key);
    h.released = true;
    const d = h.d;
    if (d.track !== h.track) return;
    await engine.setLoop(d, h.loop, h.loopIn, h.loopOut);
    const position =
      h.position + (h.playing ? (engine.ctx.currentTime - h.time) * h.rate : 0);
    if (!h.playing) engine.pause(d);
    await engine.seek(d, position);
    d.slice = null;
    render();
  }
  function releaseAll() {
    for (const key of held.keys()) void release(key);
  }
  async function domainLoop(d, on) {
    if (!d.track) return;
    d.slicerLoop = on;
    const b = bounds(d);
    await engine.setLoop(
      d,
      on,
      b.start,
      Math.min(d.track.duration, b.start + b.length),
    );
    render();
  }
  return { press, release, releaseAll, domainLoop, bounds };
}
