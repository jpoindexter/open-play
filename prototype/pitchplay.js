// Independent Pitch Play transport and harmonic-key policy; no vendor DSP code.
// Eight-pad layout follows the connected Hercules300MK2 official guide.
export const pitchRanges = Object.freeze({
  Up: Object.freeze([4, 5, 6, 7, 0, 1, 2, 3]),
  Middle: Object.freeze([0, 1, 2, 3, -4, -3, -2, -1]),
  Down: Object.freeze([-3, -2, -1, 0, -7, -6, -5, -4]),
});
const mod = (n) => ((n % 12) + 12) % 12;
const minorPC = [8, 3, 10, 5, 0, 7, 2, 9, 4, 11, 6, 1],
  majorPC = [11, 6, 1, 8, 3, 10, 5, 0, 7, 2, 9, 4];
export function parseMusicalKey(value) {
  const text = String(value ?? "")
    .trim()
    .replaceAll("♯", "#")
    .replaceAll("♭", "b");
  let match = /^(1[0-2]|[1-9])([AB])$/i.exec(text);
  if (match) {
    const minor = match[2].toUpperCase() === "A";
    return { pc: (minor ? minorPC : majorPC)[Number(match[1]) - 1], minor };
  }
  match = /^(1[0-2]|[1-9])([dm])$/i.exec(text);
  if (match) {
    const minor = match[2].toLowerCase() === "m",
      camelot = (Number(match[1]) + 6) % 12;
    return { pc: (minor ? minorPC : majorPC)[camelot], minor };
  }
  match = /^([A-Ga-g])([#b]?)(?:\s*(minor|min|m|major|maj))?$/.exec(text);
  if (!match) return null;
  const pc = mod(
    { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[match[1].toUpperCase()] +
      (match[2] === "#" ? 1 : match[2] === "b" ? -1 : 0),
  );
  return { pc, minor: ["minor", "min", "m"].includes(match[3]) };
}
export function shiftedKey(key, semitones = 0) {
  return key ? { ...key, pc: mod(key.pc + Math.round(semitones)) } : null;
}
export function keyLabel(key) {
  return key
    ? ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"][
        key.pc
      ] + (key.minor ? "m" : "")
    : "Unknown";
}
function camelot(key) {
  return {
    number: (key.minor ? minorPC : majorPC).indexOf(key.pc),
    minor: key.minor,
  };
}
export function harmonicallyCompatible(left, right) {
  if (!left || !right) return false;
  const a = camelot(left),
    b = camelot(right);
  return (
    a.number === b.number ||
    (a.minor === b.minor && [1, 11].includes(mod(a.number - b.number)))
  );
}
export function planKeySync(deck, decks) {
  const own = parseMusicalKey(deck.track?.key);
  if (!own)
    return {
      ok: false,
      reason: "Analyze or enter a recognized key for this track first.",
    };
  const others = decks.filter(
    (d) => d !== deck && parseMusicalKey(d.track?.key),
  );
  if (!others.length)
    return { ok: false, reason: "Load another track with a recognized key." };
  const synced = others.filter((d) => d.keySync),
    targets = synced.length
      ? synced
      : [others.find((d) => d.playing) || others[0]];
  const keys = [];
  for (const target of targets) {
    const tempoPitch = target.keylock ? 0 : 12 * Math.log2(target.rate || 1);
    if (Math.abs(tempoPitch - Math.round(tempoPitch)) > 0.04)
      return {
        ok: false,
        reason: `Enable Key Lock or reset tempo on reference deck ${target.index + 1}; its current pitch is between semitones.`,
      };
    keys.push(
      shiftedKey(
        parseMusicalKey(target.track.key),
        (target.keyShift || 0) + tempoPitch,
      ),
    );
  }
  const current = deck.keyShift || 0;
  const candidates = Array.from({ length: 49 }, (_, i) => i - 24).filter(
    (shift) =>
      keys.every((key) => harmonicallyCompatible(shiftedKey(own, shift), key)),
  );
  candidates.sort(
    (a, b) =>
      Math.abs(a - current) - Math.abs(b - current) ||
      Math.abs(a) - Math.abs(b) ||
      b - a,
  );
  if (!candidates.length)
    return {
      ok: false,
      reason: "No compatible key exists for every currently key-synced deck.",
    };
  const shift = candidates[0];
  return {
    ok: true,
    semitones: shift,
    key: keyLabel(shiftedKey(own, shift)),
    targets: targets.map((d) => d.index),
    policy:
      "Same Camelot cell, adjacent same-mode cells, or relative major/minor; nearest semitone shift, upward tie.",
  };
}
export function createPitchPlay({
  engine,
  render = () => {},
  persist = () => {},
  notify = () => {},
  quantized = (_d, p) => p,
}) {
  const held = new Map(),
    owners = new Map();
  async function press(key, d, pad, select = false) {
    if (!d.track || held.has(key)) return false;
    if (select) {
      d.pitchCue = pad;
      if (!d.track.cues[pad])
        d.track.cues[pad] = {
          position: quantized(d, engine.position(d)),
          name: `Cue ${pad + 1}`,
        };
      persist();
      render();
      return true;
    }
    const cue = d.track.cues[d.pitchCue || 0];
    if (!cue) {
      notify(
        `Set cue ${(d.pitchCue || 0) + 1} first, or Shift-press a Pitch pad to create/select it.`,
      );
      return false;
    }
    const previous = owners.get(d.index);
    const h = {
      d,
      track: d.track,
      target: cue.position,
      wasPlaying: previous?.wasPlaying ?? (d.playing || d.processing),
      latched: previous?.latched || false,
      released: false,
    };
    if (previous) {
      previous.released = true;
      for (const [k, v] of held) if (v === previous) held.delete(k);
    }
    held.set(key, h);
    owners.set(d.index, h);
    if (!previous && h.wasPlaying) engine.beginSlip(d, "pitch");
    engine.pause(d);
    d.keyShift = pitchRanges[d.pitchRangeMode || "Middle"][pad];
    d.keylock = true;
    d.keySync = false;
    d.position = cue.position;
    try {
      await engine.start(d);
      return owners.get(d.index) === h && !h.released;
    } catch (error) {
      if (owners.get(d.index) === h) {
        held.delete(key);
        owners.delete(d.index);
      }
      notify(error.message);
      return false;
    } finally {
      render();
    }
  }
  async function release(key) {
    const h = held.get(key);
    if (!h) return;
    held.delete(key);
    h.released = true;
    if (owners.get(h.d.index) !== h) return;
    owners.delete(h.d.index);
    if (h.d.track !== h.track) return;
    if (!h.wasPlaying && !h.latched) {
      engine.pause(h.d);
      h.d.position = h.target;
    } else if (h.d.slipOrigin?.reason === "pitch")
      await engine.endSlip(h.d, "pitch");
    render();
  }
  function latch(d) {
    const h = owners.get(d.index);
    if (!h || h.wasPlaying) return false;
    h.latched = true;
    return true;
  }
  function cancelDeck(d) {
    for (const [key, h] of held)
      if (h.d === d) {
        h.released = true;
        held.delete(key);
      }
    owners.delete(d.index);
  }
  function releaseAll() {
    for (const key of [...held.keys()]) void release(key);
  }
  return { press, release, latch, cancelDeck, releaseAll };
}
