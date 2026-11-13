// Timed cue/reverse automation over the browser transport. Browser timer jitter
// remains measurable; this is not a sample-accurate native scheduling claim.
export function createFlipAutomation({
  state,
  engine,
  notify,
  persist,
  renderDecks,
}) {
  let active = null, generation = 0;
  const f = state.flip;
  const current = run => active === run && !run.cancelled &&
    state.decks[run.deck.index] === run.deck && run.deck.track === run.track;
  function finish() {
    if (f.recordStarted !== undefined) {
      const d = state.decks[f.deck],
        beat = 60 / (d.track?.bpm || 120);
      f.duration = Math.max(
        0.05,
        (engine.ctx.currentTime - f.recordStarted) * d.rate,
      );
      if (f.snap)
        f.duration = Math.max(beat, Math.round(f.duration / beat) * beat);
    }
    f.armed = false;
    delete f.recordStarted;
  }
  function arm() {
    engine.init();
    if (f.armed) {
      finish();
      return;
    }
    stop();
    f.events = [];
    f.duration = 0;
    f.armed = true;
    delete f.recordStarted;
  }
  function record(d, event) {
    if (!f.armed) return;
    if (f.recordStarted === undefined) {
      f.recordStarted = engine.ctx.currentTime;
      f.deck = d.index;
      f.trackId = d.track.id;
    }
    if (f.deck !== d.index || f.trackId !== d.track.id) return;
    f.events.push({
      ...event,
      offset: (engine.ctx.currentTime - f.recordStarted) * d.rate,
    });
  }
  function stop() {
    generation++;
    if (active) active.cancelled = true;
    active = null;
    f.on = false;
  }
  async function apply(run, event) {
    if (!current(run)) return;
    if (event.kind === "reverse")
      await engine.setReverse(run.deck, event.reverse);
    else {
      const seeking = engine.seek(run.deck, event.position), token = engine.startTokens.get(run.deck.index);
      await seeking;
      if (!current(run) || engine.startTokens.get(run.deck.index) !== token) return;
      if (!run.deck.playing) await engine.start(run.deck);
    }
  }
  async function start(deck = state.decks[state.focus], spec = f) {
    if (f.armed) finish();
    if (!spec.events?.length)
      return notify("Record a cue or reverse action first.");
    if (spec.trackId && deck.track?.id !== spec.trackId)
      return notify("Load the track that owns this Flip first.");
    stop();
    const request = generation, track = deck.track, token = engine.startTokens.get(deck.index);
    await engine.resume();
    if (generation !== request || state.decks[deck.index] !== deck || deck.track !== track || engine.startTokens.get(deck.index) !== token) return;
    const run = {
      deck,
      track,
      trackId: deck.track.id,
      events: structuredClone(spec.events),
      duration: Math.max(0.05, spec.duration || 1),
      cursor: 0,
      elapsed: 0,
      last: engine.ctx.currentTime,
      cancelled: false,
    };
    active = run;
    f.on = true;
    f.deck = deck.index;
    await apply(run, run.events[0]);
    if (!current(run)) return;
    run.cursor = 1;
    renderDecks(deck);
  }
  function tick() {
    const run = active;
    if (!run) return;
    if (!current(run)) {
      stop();
      return;
    }
    const now = engine.ctx.currentTime;
    const elapsed = now - run.last;
    run.last = now;
    if (!run.deck.playing) return;
    run.elapsed += elapsed * run.deck.rate;
    while (
      run.cursor < run.events.length &&
      run.events[run.cursor].offset <= run.elapsed
    ) {
      void apply(run, run.events[run.cursor++]);
    }
    if (run.elapsed >= run.duration) {
      if (f.loop) {
        run.elapsed %= run.duration;
        run.cursor = 0;
      } else stop();
    }
  }
  function save() {
    if (f.armed) finish();
    const track = state.tracks.find((t) => t.id === f.trackId);
    if (!track || !f.events.length)
      return notify("No recorded actions to save.");
    track.flips ??= [];
    const empty = Array.from({ length: 6 }, (_, i) => i).find(
      (i) => !track.flips[i],
    );
    if (empty === undefined)
      return notify(
        "Six Flip slots are occupied. Delete a slot before saving another.",
      );
    track.flips[empty] = {
      name: f.name,
      trackId: track.id,
      events: structuredClone(f.events),
      duration: f.duration,
      loop: f.loop,
      snap: f.snap,
    };
    persist();
    notify(`Saved Flip ${empty + 1} to this track's prototype metadata.`);
  }
  function select(deck, slot) {
    const spec = deck.track?.flips?.[slot];
    if (!spec) return;
    stop();
    Object.assign(f, structuredClone(spec), {
      deck: deck.index,
      armed: false,
      on: false,
    });
    state.focus = deck.index;
  }
  return { arm, finish, record, start, stop, tick, save, select };
}
