// Browser controls for the independently implemented T10-documented Stem Slip mode.
// Hardware chord mapping and exact vendor transport/mixer policies remain unverified.
export function createStemSlipControls({engine, state, prepare, render, notify}) {
  const gestures = new Map();
  const latestGestures = new Map();
  const requests = new Map();
  const focusRequests = new Map();
  let gestureSequence = 0;
  const armed = d => ['vocal', 'instrumental'].includes(d.stemSlip);
  const idleHint = 'Select a stem, then scratch here or hold a cue. Mode stays armed after release.';
  function refresh(d, root=document) {
    const mode=root.querySelector(`[data-stem-slip-mode="${d.index}"]`);
    if(mode)mode.value=d.stemSlip||'off';
    const scratch=root.querySelector(`[data-stem-slip-scratch="${d.index}"]`);
    if(scratch)scratch.disabled=!armed(d);
    const output=root.querySelector(`[data-stem-slip-live="${d.index}"]`);
    if(output&&!armed(d))output.textContent=idleHint;
  }
  const report = promise => Promise.resolve(promise).catch(error => notify(error.message));
  function markup(d) {
    return `<div class="stem-slip-controls"><label>Stem Slip<select data-stem-slip-mode="${d.index}" aria-label="Deck ${d.index + 1} Stem Slip mode">${[['off','Off'],['vocal','Vocal'],['instrumental','Instrumental']].map(([value,label])=>`<option value="${value}" ${value === (d.stemSlip || 'off') ? 'selected' : ''}>${label}</option>`).join('')}</select></label><label>Slip Release<select data-stem-slip-release="${d.index}" aria-label="Deck ${d.index + 1} Stem Slip release">${[0,.5,1,2,4].map(value=>`<option value="${value}" ${value === (d.stemSlipRelease || 0) ? 'selected' : ''}>${value} ${value === 1 ? 'beat' : 'beats'}</option>`).join('')}</select></label><label class="stem-slip-scratch">Selected stem scratch<input type="range" data-stem-slip-scratch="${d.index}" aria-label="Deck ${d.index + 1} selected stem scratch position" min="0" max="${d.track?.duration || 48}" step="0.001" value="${engine.selectedPosition?.(d) ?? engine.position(d)}" ${armed(d) ? '' : 'disabled'}></label><output data-stem-slip-live="${d.index}" aria-live="off">${d.stemSlipPending ? 'Preparing Stems for Stem Slip…' : armed(d) ? `${d.stemSlip} · ${d.stemSlipPhase || 'idle'}` : idleHint}</output></div>`;
  }
  async function modeChanged(el) {
    const d = state.decks[Number(el.dataset.stemSlipMode)];
    const track = d.track;
    if (!track) return notify('Load a track first.');
    const mode = el.value;
    clearGestureRefs(d);
    const token = (requests.get(d.index) || 0) + 1;
    requests.set(d.index, token);
    const focus = {active:document.activeElement === el};
    focusRequests.set(d.index,focus);
    d.stemSlipPending = mode !== 'off' && !engine.stemBuffers.has(track.id);
    render();
    restoreFocus();
    try {
      if (mode !== 'off' && !engine.stemBuffers.has(track.id)) await prepare(track);
      if (requests.get(d.index) !== token || d.track !== track) return;
      await engine.setStemSlip(d, mode);
    } catch (error) { notify(error.message); }
    finally {
      if (requests.get(d.index) === token) {
        d.stemSlipPending = false; render();
        restoreFocus();
        if (focusRequests.get(d.index) === focus) focusRequests.delete(d.index);
      }
    }
  }
  function restoreFocus() {
    if (document.activeElement !== document.body) return;
    for (const [index,request] of focusRequests) if(request.active)
      document.querySelector(`[data-stem-slip-mode="${index}"]`)?.focus();
  }
  for (const type of ['focusin','pointerdown']) document.addEventListener(type,e=>{
    for(const [index,request] of focusRequests)
      if(e.target.dataset?.stemSlipMode !== String(index)) request.active = false;
  });
  function begin(el, owner) {
    const d = state.decks[Number(el.dataset.stemSlipScratch)];
    if (!d.track || !armed(d) || gestures.has(owner)) return;
    const position = engine.selectedPosition(d);
    const g = {d, el, track:d.track, mode:d.stemSlip, position, time:performance.now(), command:0, engineOwner:`${owner}:${++gestureSequence}`};
    gestures.set(owner, g);
    latestGestures.set(owner,g);
    const current = () => latestGestures.get(owner) === g && d.track === g.track && d.stemSlip === g.mode &&
      (gestures.get(owner) === g || (g.ended === 'normal' && g.releaseEligible && d.playing));
    g.current = current;
    g.ready = Promise.resolve().then(async()=>{
      if (!current()) return;
      const began = await engine.beginStemSlipGesture(d, g.engineOwner);
      if (began && current() && g.command === 0)
        await engine.stemSlipScratch(d, position, 0, g.engineOwner);
    }).catch(error=>{
      if (gestures.get(owner) === g) gestures.delete(owner);
      if (latestGestures.get(owner) === g) latestGestures.delete(owner);
      notify(error.message);
    });
  }
  function move(el) {
    const entry = [...gestures.entries()].reverse().find(([,g]) => g.el === el);
    if (!entry) return;
    const [owner,g] = entry;
    if (g.d.track !== g.track || !armed(g.d)) return;
    const position = Number(el.value), now = performance.now();
    const velocity = (position-g.position) / Math.max(.008,(now-g.time)/1000);
    const command = ++g.command;
    report(g.ready.then(()=>{
      if (g.current() && g.command === command)
        return engine.stemSlipScratch(g.d, position, velocity, g.engineOwner);
    }));
    g.position = position; g.time = now;
  }
  function end(owner, immediate = false) {
    const g = gestures.get(owner);
    if (!g) return;
    gestures.delete(owner);
    g.ended = immediate ? 'cancel' : 'normal';
    g.releaseEligible = !immediate && g.d.playing;
    if (immediate && latestGestures.get(owner) === g) latestGestures.delete(owner);
    if (g.d.track === g.track) report(g.ready.then(()=>engine.endStemSlipGesture(g.d, g.engineOwner, {immediate:immediate || !g.releaseEligible})).finally(()=>{
      if (latestGestures.get(owner) === g) latestGestures.delete(owner);
    }));
  }
  document.addEventListener('change', e => {
    if (e.target.dataset.stemSlipMode !== undefined) void modeChanged(e.target);
    if (e.target.dataset.stemSlipRelease !== undefined) {
      const d = state.decks[Number(e.target.dataset.stemSlipRelease)];
      d.stemSlipRelease = Number(e.target.value);
    }
  });
  document.addEventListener('pointerdown', e => {
    const el = e.target.closest('[data-stem-slip-scratch]');
    if (!el || e.button !== 0 || el.disabled) return;
    el.setPointerCapture(e.pointerId);
    begin(el, `stem-scratch:pointer:${e.pointerId}`);
  });
  document.addEventListener('input', e => {
    if (e.target.dataset.stemSlipScratch !== undefined) move(e.target);
  });
  for (const name of ['pointerup','pointercancel','lostpointercapture'])
    document.addEventListener(name,e=>end(`stem-scratch:pointer:${e.pointerId}`,name !== 'pointerup'));
  const scratchKeys = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','PageUp','PageDown','Home','End'];
  document.addEventListener('keydown',e=>{
    const el = e.target.closest('[data-stem-slip-scratch]');
    if (el && !el.disabled && scratchKeys.includes(e.key)) begin(el,`stem-scratch:key:${el.dataset.stemSlipScratch}:${e.key}`);
  });
  document.addEventListener('keyup',e=>{
    for (const owner of gestures.keys()) if (owner.endsWith(`:${e.key}`)) end(owner);
  });
  window.addEventListener('blur',()=>{
    for(const owner of [...gestures.keys()]) end(owner,true);
    // A configured roll may outlive its pointer/key owner; blur cancels that too.
    for(const d of state.decks) {
      clearGestureRefs(d);
      if(armed(d)) report(engine.endStemSlipGesture(d,null,{immediate:true}));
    }
  });
  function tick() {
    for (const d of state.decks.slice(0,state.deckCount)) {
      const output = document.querySelector(`[data-stem-slip-live="${d.index}"]`);
      if (!output || !armed(d)) continue;
      const selected = engine.selectedPosition(d), canonical = engine.position(d);
      output.textContent = `${d.stemSlip} · ${d.stemSlipPhase || 'idle'} · selected ${selected.toFixed(2)}s · backing ${canonical.toFixed(2)}s`;
      const input = document.querySelector(`[data-stem-slip-scratch="${d.index}"]`);
      if (input && ![...gestures.values()].some(g=>g.el===input)) input.value = selected;
    }
  }
  function cancelDeck(d) {
    requests.set(d.index,(requests.get(d.index)||0)+1);
    focusRequests.delete(d.index);
    d.stemSlipPending = false;
    clearGestureRefs(d);
  }
  function clearGestureRefs(d) {
    for(const [owner,g] of gestures) if(g.d===d) gestures.delete(owner);
    for(const [owner,g] of latestGestures) if(g.d===d) latestGestures.delete(owner);
  }
  return {markup,tick,cancelDeck,restoreFocus,refresh};
}
