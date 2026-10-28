// Release-safe cue audition and slip restoration. A release may precede decoding.
export function createCueHolds({
  engine,
  state,
  quantized,
  record,
  persist,
  render,
  refresh = render,
  refreshCues = render,
  cancelPendingPlay = () => {},
  notify,
}) {
  const held = new Map();
  let stemGestureSequence = 0;
  const owners = new WeakMap();
  const current = h => owners.get(h.d) === h && h.d.track === h.track;
  function cancelDeck(d) {
    owners.delete(d);
    for (const [key, h] of held) if (h.d === d) held.delete(key);
  }
  const selectedStem = d => ["vocal", "instrumental"].includes(d.stemSlip);
  async function press(key, d, hot = null, remove = false) {
    if (!d.track || held.has(key)) return;
    const position = selectedStem(d) ? engine.selectedPosition(d) : engine.position(d);
    if (hot === null || (!remove && d.track.cues[hot])) cancelPendingPlay(d);
    if (hot !== null) {
      if (remove) {
        d.track.cues[hot] = null;
        persist();
        refreshCues(d.track);
        return;
      }
      if (!d.track.cues[hot]) {
        d.track.cues[hot] = {
          position: quantized(d, position),
          name: `Cue ${hot + 1}`,
        };
        persist();
        refreshCues(d.track);
        return;
      }
    } else if (d.playing && !selectedStem(d)) {
      engine.pause(d);
      await engine.seek(d, d.cue);
      refresh();
      return;
    } else if (!selectedStem(d) && Math.abs(position - d.cue) > 0.04) {
      d.cue = quantized(d, position);
      engine.pause(d);
      await engine.seek(d, d.cue);
      refresh();
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
      stemSlip: selectedStem(d),
      stemSlipOwner: `cue:${key}:${++stemGestureSequence}`,
    };
    owners.set(d, h);
    held.set(key, h);
    if (h.stemSlip) {
      try {
        await engine.beginStemSlipGesture(d, h.stemSlipOwner);
        if (!current(h)) return;
        if (!h.released) await engine.stemSlipCue(d, target, h.stemSlipOwner);
        if (!current(h)) return;
        if (h.released) await engine.endStemSlipGesture(d, h.stemSlipOwner);
        if (!current(h)) return;
        if (hot !== null) record(d, {kind:"cue", cue:hot, position:target});
      } catch (error) { if (held.get(key) === h) held.delete(key); notify(error.message); }
      render();
      return;
    }
    if (hot !== null) {
      engine.beginSlip(d, "cue");
      record(d, { kind: "cue", cue: hot, position: target });
    }
    try {
      await engine.seek(d, target);
      if (!current(h)) return;
      if ((!h.released || h.latched) && !d.playing) await engine.start(d);
      if (!current(h)) return;
      if (h.released && !h.wasPlaying && !h.latched) {
        engine.pause(d);
        d.position = target;
      }
    } catch (e) {
      notify(e.message);
      if (held.get(key) === h) held.delete(key);
    }
  }
  async function release(key, {immediate = false} = {}) {
    const h = held.get(key);
    if (!h) return;
    held.delete(key);
    h.released = true;
    if (!current(h)) return;
    if (h.stemSlip) {
      await engine.endStemSlipGesture(h.d, h.stemSlipOwner, {immediate:immediate || !h.d.playing});
      if (current(h)) render();
      return;
    }
    if (!h.wasPlaying && !h.latched) {
      engine.pause(h.d);
      await engine.seek(h.d, h.target);
    } else if (h.wasPlaying) await engine.endSlip(h.d, "cue");
    if (current(h)) refresh();
  }
  function latch(d) {
    let latched = false;
    for (const h of held.values())
      if (h.d === d && current(h) && !h.released && !h.wasPlaying && !h.stemSlip) {
        h.latched = true;
        latched = true;
      }
    return latched;
  }
  function releaseAll(options) {
    for (const key of held.keys()) void release(key, options);
  }
  return { press, release, releaseAll, latch, cancelDeck };
}
