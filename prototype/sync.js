// Independent Simple Sync: match tempo and the nearest audible transient pair.
// Smart Sync's beat/bar/warp state machine remains a separate, unaccepted path.
const transientCache = new WeakMap();
const cancelled = () => new DOMException('Sync preparation superseded.', 'AbortError');
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const positive = value => Number.isFinite(value) && value > 0;

export async function transientTimes(buffer, valid = () => true) {
  if (transientCache.has(buffer)) return transientCache.get(buffer);
  const sampleRate = buffer.sampleRate, hop = 64, size = 128;
  const channels = Array.from({length: buffer.numberOfChannels}, (_, c) => buffer.getChannelData(c));
  const flux = []; let previous = 0, maximum = 0;
  for (let start = 0; start + size <= buffer.length; start += hop) {
    let power = 0;
    for (const data of channels) for (let n = start; n < start + size; n++) power += data[n] * data[n];
    const energy = Math.sqrt(power / (size * channels.length));
    const change = Math.max(0, energy - previous); previous = energy;
    flux.push(change); maximum = Math.max(maximum, change);
    if (start % 32768 === 0) { if (!valid()) throw cancelled(); await tick(); }
  }
  if (!valid()) throw cancelled();
  const times = [], threshold = Math.max(1e-6, maximum * .18);
  for (let n = 1; n < flux.length - 1; n++) {
    if (flux[n] < threshold || flux[n] < flux[n - 1] || flux[n] <= flux[n + 1]) continue;
    const time = (n * hop + size / 2) / sampleRate;
    if (!times.length || time - times.at(-1) >= .12) times.push(time);
  }
  const result = Object.freeze(times); transientCache.set(buffer, result); return result;
}
function neighbours(times, position) {
  let lo = 0, hi = times.length;
  while (lo < hi) { const mid = (lo + hi) >>> 1; if (times[mid] < position) lo = mid + 1; else hi = mid; }
  return times.slice(Math.max(0, lo - 2), Math.min(times.length, lo + 2));
}
function gridTimes(track, position) {
  if (!positive(track.bpm) || !Number.isFinite(track.grid)) throw new Error('Add a beatgrid before using Snap to Beatgrid.');
  const beat = 60 / track.bpm, at = Math.floor((position - track.grid) / beat);
  return Array.from({length: 5}, (_, i) => track.grid + (at + i - 1) * beat).filter(t => t >= 0 && t <= track.duration);
}
export function alignedPosition({ownTimes, leaderTimes, ownPosition, leaderPosition, ownRate, leaderRate, duration}) {
  if (![ownPosition, leaderPosition, duration].every(Number.isFinite) || !positive(ownRate) || !positive(leaderRate)) throw new TypeError('Invalid sync clock.');
  const leader = neighbours(leaderTimes, leaderPosition).sort((a, b) => Math.abs(a - leaderPosition) - Math.abs(b - leaderPosition))[0];
  if (leader === undefined) throw new Error('No transient found in the primary track.');
  const delay = (leader - leaderPosition) / leaderRate;
  const candidates = neighbours(ownTimes, ownPosition).map(time => ({time, position: time - delay * ownRate})).filter(x => x.position >= 0 && x.position < duration);
  candidates.sort((a, b) => Math.abs(a.position - ownPosition) - Math.abs(b.position - ownPosition));
  if (!candidates.length) throw new Error('No transient can be aligned within this track.');
  return {position: candidates[0].position, ownTransient: candidates[0].time, leaderTransient: leader};
}
export async function synchronizeSimple({engine, deck, leader, snapToGrid = false}) {
  const ownTrack = deck.track, leaderTrack = leader?.track;
  if (!ownTrack || !leaderTrack || deck === leader) throw new Error('Load a track on the opposite deck first.');
  if (!positive(ownTrack.bpm) || !positive(leaderTrack.bpm)) throw new Error('Set or analyze both track BPM values before using Sync.');
  if (deck.reverse || leader.reverse || deck.loop || leader.loop || (deck.stemSlip || 'off') !== 'off' || (leader.stemSlip || 'off') !== 'off') throw new Error('This Sync path currently requires forward decks without a loop or Stem Slip.');
  const valid = () => deck.track === ownTrack && leader.track === leaderTrack;
  const leaderRate = engine.audibleRate(leader), rate = leaderTrack.bpm * leaderRate / ownTrack.bpm;
  if (!positive(rate) || rate < .25 || rate > 4) throw new Error('The matched tempo is outside the current transport range.');
  const wasPlaying = deck.playing, leaderPlaying = leader.playing;
  if (!wasPlaying || !leaderPlaying) {
    await engine.setRate(deck, rate, {syncInternal: true});
    if (!valid()) throw cancelled();
    return {kind: 'tempo', rate, leader: leader.index};
  }
  const [ownBuffer, leaderBuffer] = await Promise.all([engine.buffer(ownTrack), engine.buffer(leaderTrack)]);
  const [ownTimes, leaderTimes] = snapToGrid ? [null, null] : await Promise.all([transientTimes(ownBuffer, valid), transientTimes(leaderBuffer, valid)]);
  if (!valid() || !deck.playing || !leader.playing) throw cancelled();
  if (!snapToGrid && (!ownTimes.length || !leaderTimes.length)) throw new Error('No usable transients found. Use tracks with clear beats or enable Snap to Beatgrid.');
  const priorVoice = engine.voices.get(deck.index), priorClock = engine.voiceClock(deck, priorVoice);
  let alignment;
  const result = await engine.synchronize(deck, {rate, priorClock, positionAt: when => {
    if (!valid() || !leader.playing || Math.abs(engine.voiceRateAt(leader, engine.voices.get(leader.index), when) - leaderRate) > 1e-7) throw cancelled();
    const leaderPosition = engine.voiceClock(leader, engine.voices.get(leader.index))(when), ownPosition = priorClock(when);
    alignment = alignedPosition({ownTimes: snapToGrid ? gridTimes(ownTrack, ownPosition) : ownTimes, leaderTimes: snapToGrid ? gridTimes(leaderTrack, leaderPosition) : leaderTimes, ownPosition, leaderPosition, ownRate: rate, leaderRate, duration: ownTrack.duration});
    return alignment.position;
  }});
  return {...result, kind: snapToGrid ? 'grid' : 'transient', leader: leader.index, alignment};
}
