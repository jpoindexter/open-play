// Same-origin loopback preparation. Audio never leaves this computer.
export function encodeWav(buffer) {
  const channels = buffer.numberOfChannels, bytes = buffer.length * channels * 4;
  if (bytes + 44 > 128 * 1024 * 1024) throw new Error('Decoded audio exceeds the 128 MiB local preparation limit.');
  const result = new ArrayBuffer(44 + bytes), view = new DataView(result);
  const text = (at, value) => [...value].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  text(0, 'RIFF'); view.setUint32(4, 36 + bytes, true); text(8, 'WAVE'); text(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 3, true); view.setUint16(22, channels, true);
  view.setUint32(24, buffer.sampleRate, true); view.setUint32(28, buffer.sampleRate * channels * 4, true);
  view.setUint16(32, channels * 4, true); view.setUint16(34, 32, true); text(36, 'data'); view.setUint32(40, bytes, true);
  const arrays = Array.from({length: channels}, (_, c) => buffer.getChannelData(c));
  for (let i = 0, at = 44; i < buffer.length; i++) for (let c = 0; c < channels; c++, at += 4) view.setFloat32(at, arrays[c][i], true);
  return result;
}
const headers = {'X-Open-Play': 'local-prototype', 'Content-Type': 'audio/wav'};
async function request(url, options) {
  const response = await fetch(url, options);
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || 'Local separation service unavailable.');
  return value;
}
export function createStemPreparation(engine, decks) {
  const active = new Map();
  async function cancel(track) {
    const job = active.get(track.id);
    if (!job) return;
    if (job.committing) throw new Error('Audio activation is finishing. Use Restore full mix afterward.');
    job.cancelled = true;
    if (job.id) await request(`/api/stems/${job.id}`, {method:'DELETE', headers});
  }
  async function prepare(track, update = () => {}, backend = "scnet") {
    if (active.has(track.id)) throw new Error('This track is already being prepared.');
    if (track.provider || track.missing) throw new Error('Choose an available local file.');
    const job = {cancelled:false, id:null}; active.set(track.id, job);
    const status = message => { track.stemState = message; update(message); };
    const cancelled = () => { if (job.cancelled) throw new DOMException('Preparation cancelled. Original audio is preserved.', 'AbortError'); };
    try {
      status('Decoding local audio…');
      const audio = await engine.buffer(track); cancelled();
      if (audio.duration > 600) throw new Error('Prototype preparation currently accepts tracks up to 10 minutes.');
      status('Sending decoded audio to the local worker…');
      let result = await request(`/api/stems?model=${encodeURIComponent(backend)}`, {method:'POST', headers, body:encodeWav(audio)});
      job.id = result.id;
      if (job.cancelled) { await cancel(track); cancelled(); }
      while (result.state !== 'complete') {
        cancelled();
        if (result.state === 'failed' || result.state === 'cancelled') throw new Error(result.error || 'Preparation cancelled.');
        status(`${result.stage.replaceAll('_', ' ')} · ${Math.round(result.progress * 100)}%`);
        await new Promise(resolve => setTimeout(resolve, 500)); cancelled();
        result = await request(`/api/stems/${job.id}`);
      }
      status('Loading four separated audio channels…');
      const order = ['vocals','other','bass','drums'];
      const buffers = [];
      for (const name of order) {
        cancelled();
        const stem = result.stems.find(s => s.name === name);
        if (!stem) throw new Error(`Missing ${name} output.`);
        const response = await fetch(stem.url);
        if (!response.ok) throw new Error(`Could not load ${name} audio.`);
        buffers.push(await engine.ctx.decodeAudioData(await response.arrayBuffer()));
      }
      cancelled();
      job.committing = true;
      status('Activating separated audio…');
      await engine.attachStems(track, buffers, decks);
      track.stemModel = result.model;
      status(`Ready · ${result.model} · four real audio sources`);
      return result;
    } catch (error) {
      status(error.name === 'AbortError' ? 'Cancelled · original audio preserved' : `Failed · ${error.message}`);
      throw error;
    } finally { active.delete(track.id); }
  }
  return {prepare, cancel, active};
}
