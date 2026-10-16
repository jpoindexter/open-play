// Release-safe cue audition and slip restoration. A release may precede decoding.
export function createCueHolds({
  engine,
  state,
  quantized,
  record,
  persist,
  render,
  notify,
}) {
  const held = new Map();
  async function press(key, d, hot = null, remove = false) {
    if (!d.track || held.has(key)) return;
    const position = engine.position(d);
    if (hot !== null) {
      if (remove) {
        d.track.cues[hot] = null;
        persist();
        render();
        return;
      }
      if (!d.track.cues[hot]) {
        d.track.cues[hot] = {
          position: quantized(d, position),
          name: `Cue ${hot + 1}`,
        };
        persist();
        render();
        return;
      }
    } else if (d.playing) {
      engine.pause(d);
      await engine.seek(d, d.cue);
      render();
      return;
    } else if (Math.abs(position - d.cue) > 0.04) {
      d.cue = quantized(d, position);
      await engine.seek(d, d.cue);
      render();
      return;
    }
    engine.init();
    const target = hot === null ? d.cue : d.track.cues[hot].position;
    const h = {
      d,
      track: d.track,
      target,
      wasPlaying: d.playing,
      released: false,
      latched: false,
    };
    held.set(key, h);
    if (hot !== null) {
      engine.beginSlip(d, "cue");
      record(d, { kind: "cue", cue: hot, position: target });
    }
    try {
      await engine.seek(d, target);
      if (!h.released && !d.playing) await engine.start(d);
      if (h.released && !h.wasPlaying && !h.latched) {
        engine.pause(d);
        d.position = target;
      }
    } catch (e) {
      notify(e.message);
      held.delete(key);
    }
  }
  async function release(key) {
    const h = held.get(key);
    if (!h) return;
    held.delete(key);
    h.released = true;
    if (h.d.track !== h.track) return;
    if (!h.wasPlaying && !h.latched) {
      engine.pause(h.d);
      await engine.seek(h.d, h.target);
    } else if (h.wasPlaying) await engine.endSlip(h.d, "cue");
    render();
  }
  function latch(d) {
    let latched = false;
    for (const h of held.values())
      if (h.d === d && !h.wasPlaying) {
        h.latched = true;
        latched = true;
      }
    return latched;
  }
  function releaseAll() {
    for (const key of held.keys()) void release(key);
  }
  return { press, release, releaseAll, latch };
}
