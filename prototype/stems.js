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
  if (!response.ok) {const error=new Error(value.error || 'Local separation service unavailable.');error.status=response.status;throw error;}
  return value;
}
export function createStemPreparation(engine, decks, {onChange = () => {}} = {}) {
  const active = new Map();
  const clearing = new Set();
  async function cancel(track) {
    const job = active.get(track.id);
    if (!job) return;
    if (job.activationCommitted) return false;
    job.cancelled = true;
    job.controller.abort();
    if (job.id && !job.committing) await request(`/api/stems/${job.id}`, {method:'DELETE', headers});
  }
  function subscribe(job, update) {
    if (typeof update !== 'function') return;
    job.subscribers.add(update);
    if (job.message !== undefined) notify(update, job.message);
  }
  function notify(update, message) {
    // A detached view's callback must not fail shared preparation.
    try { update(message); } catch {}
  }
  function prepare(track, update = () => {}, backend = "scnet") {
    if(clearing.has(track.id))return Promise.reject(new Error('Prepared files are moving to Trash. Wait before preparing again.'));
    const existing = active.get(track.id);
    if (existing) {
      if (existing.backend !== backend)
        return Promise.reject(new Error(`This track is already being prepared with ${existing.backend}. Cancel it before choosing ${backend}.`));
      subscribe(existing, update);
      return existing.promise;
    }
    if (track.provider || track.missing)
      return Promise.reject(new Error('Choose an available local file.'));
    const job = {cancelled:false, id:null, backend, controller:new AbortController(), subscribers:new Set()};
    active.set(track.id, job);
    subscribe(job, update);
    // Publish the shared promise before progress callbacks can re-enter prepare.
    job.promise = Promise.resolve().then(() => run(track, job));
    return job.promise;
  }
  async function run(track, job) {
    const status = message => {
      track.stemState = job.message = message;
      for (const update of [...job.subscribers]) notify(update, message);
    };
    const cancelled = () => { if (job.cancelled) throw new DOMException('Preparation cancelled. Original audio is preserved.', 'AbortError'); };
    try {
      cancelled();
      status('Decoding local audio…');
      cancelled();
      const audio = await engine.buffer(track); cancelled();
      if (audio.duration > 600) throw new Error('Prototype preparation currently accepts tracks up to 10 minutes.');
      status('Sending decoded audio to the local worker…');
      cancelled();
      const body = encodeWav(audio); cancelled();
      let result = await request(`/api/stems?model=${encodeURIComponent(job.backend)}`, {method:'POST', headers, body});
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
        cancelled();
        if (!response.ok) throw new Error(`Could not load ${name} audio.`);
        const bytes = await response.arrayBuffer(); cancelled();
        buffers.push(await engine.ctx.decodeAudioData(bytes)); cancelled();
      }
      cancelled();
      job.committing = true;
      status('Activating separated audio…');
      await engine.attachStems(track, buffers, decks, {
        signal:job.controller.signal,
        onCommitted:()=>{job.activationCommitted=true;status('Finishing audio handover…');},
      });
      track.stemModel = result.model;
      track.stemBackend = job.backend;
      track.stemJob = result.id;
      onChange(track);
      status(`Ready · ${result.model} · four real audio sources`);
      return result;
    } catch (error) {
      status(error.name === 'AbortError' ? 'Cancelled · original audio preserved' : `Failed · ${error.message}`);
      throw error;
    } finally {
      if (active.get(track.id) === job) active.delete(track.id);
      job.subscribers.clear();
    }
  }
  async function clearFiles(track) {
    if (active.has(track.id)) throw new Error('Cancel preparation before moving prepared files to Trash.');
    if(clearing.has(track.id))throw new Error('Prepared files are already moving to Trash.');
    if (!/^[a-f0-9]{32}$/.test(track.stemJob || '')) throw new Error('No saved preparation job is associated with this track. Prepare it first.');
    const ident=track.stemJob;
    clearing.add(track.id);
    try{
    const result=await request(`/api/stems/${ident}/cache`, {method:'DELETE', headers});
    if(result.id!==ident||result.state!=='trashed')throw new Error('The prepared files were not confirmed in Trash.');
    if(track.stemJob===ident)delete track.stemJob;
    track.inStemCrate=false;
    track.stemState=engine.stemBuffers.has(track.id)?'Prepared files moved to Trash · loaded Stems remain available':'Prepared files moved to Trash · prepare again to regenerate';
    onChange(track);
    return result;
    }finally{clearing.delete(track.id);}
  }
  async function removeFromCrate(track){
    if(clearing.has(track.id))throw new Error('Prepared files are already being removed.');
    clearing.add(track.id);
    const ids=new Set(),job=active.get(track.id);if(track.stemJob)ids.add(track.stemJob);
    const result={removed:false,trashed:[],missing:[]};
    try{
      if(job){
        if(!job.committing)await cancel(track);
        try{await job.promise;}catch(error){if(error.name!=='AbortError')throw error;}
        if(job.id)ids.add(job.id);
      }
      if(track.stemJob)ids.add(track.stemJob);
      for(const ident of ids){
        if(!/^[a-f0-9]{32}$/.test(ident))throw new Error('Invalid saved preparation reference.');
        try{
          const value=await request(`/api/stems/${ident}/cache`,{method:'DELETE',headers});
          if(value.id!==ident||value.state!=='trashed')throw new Error('Prepared files were not confirmed in Trash.');
          result.trashed.push(ident);
        }catch(error){if(error.status===404)result.missing.push(ident);else throw error;}
      }
      delete track.stemJob;track.inStemCrate=false;result.removed=true;
      track.stemState=result.missing.length?'Removed from Stems crate · saved job unavailable; original track retained':ids.size?'Removed from Stems crate · prepared files moved to Trash; loaded audio retained':'Removed from Stems crate · original track retained';
      onChange(track);return result;
    }finally{clearing.delete(track.id);}
  }
  return {prepare, cancel, clearFiles, removeFromCrate, active, clearing};
}
