// Independent browser video transport, six-slot GPU pipeline and capture.
import {createVideoPipeline} from './video-pipeline.js';
import {createVideoKaraoke} from './video-karaoke.js';
import {createVideoMediaLibrary, createVideoTransitionSelector} from './video-media.js';
import {videoTransitionCatalog} from './video-transitions.js';
import {drawVideoTreatment, normalizeVideoTreatment} from './video-treatment.js';
import {primeDecodedVideo} from './video-decode.js';
export function createVideoMixer({state, engine, notify}) {
  const v = state.video ||= {};
  Object.assign(v, {width: v.width || 640, height: v.height || 360,
    transition: v.transition || 'Crossfade', cross: v.cross || 0,
    linked: v.linked ?? true, auto: v.auto || false, audioFXLink:v.audioFXLink === true,
    mediaTreatment:normalizeVideoTreatment(v.mediaTreatment),
    fx: v.fx || {left: [], right: [], master: []},
    overlays: v.overlays || {left: [], right: [], master: []}});
  const slots = [null, null], loadTokens = [0, 0], assets = new Map(), imageTokens = new Map();
  const decodedRawIds = [null, null], effectivePresentation = [null,null], presentationGenerations = [0,0];
  const karaoke = createVideoKaraoke({state, engine});
  const media = createVideoMediaLibrary(), transitions = createVideoTransitionSelector(videoTransitionCatalog);
  v.media ||= {enabled:false, random:false}; v.transitionSelection ||= {enabled:false, random:false};
  media.configure(v.media); transitions.configure(v.transitionSelection); transitions.select(v.transition);
  const observedAudio = [null, null], manualKeys = [null, null], desiredMedia = [undefined, undefined], mediaErrors = [null, null];
  let loadSerial = 0;
  let karaokeFrames = [null, null];
  let canvas, pipeline, raw, recorder, captureCanvas, captureSession, startPromise, stopPromise, result = null,
    frameId = 0, lastTime = -Infinity, error = null, lastRenderMs = 0, disposed = false;
  const createRaw = () => [0, 1].map(() => {
    decodedRawIds.fill(null);
    const c = document.createElement('canvas'); c.width = v.width; c.height = v.height; return c;
  });
  function reset(target) {
    if (disposed) throw new Error('Video mixer was disposed.');
    if (error) {pipeline?.dispose(); pipeline = null;} else pipeline?.reset(target);
    error = null; lastTime = -Infinity;
  }
  const audioKey = index => JSON.stringify([state.decks[index]?.track?.id ?? null, state.decks[index]?.videoLoadGeneration || 0]);
  function syncTransitionControl() {
    const select = document.querySelector('#video-transition'); if (select) select.value = v.transition;
  }
  async function load(index, file, selection = {}) {
    if (![0, 1].includes(index)) throw new RangeError('Choose left or right video.');
    if (disposed) throw new Error('Video mixer was disposed.');
    const token = ++loadTokens[index], video = document.createElement('video'), url = URL.createObjectURL(file);
    const startingAudioKey = audioKey(index);
    const priorManual = manualKeys[index];
    const owns = () => !disposed && token === loadTokens[index] && startingAudioKey === audioKey(index) &&
      (!selection.mediaId || (selection.ownerKey === audioKey(index) && desiredMedia[index] === selection.mediaId));
    if (!selection.mediaId) manualKeys[index] = audioKey(index);
    video.muted = true; video.playsInline = true; video.loop = true; video.src = url;
    try {
      await new Promise((resolve, reject) => {
        video.onloadeddata = resolve;
        video.onerror = () => reject(new Error('This browser could not decode this video.'));
        video.load();
      });
      if (!owns()) {video.pause(); URL.revokeObjectURL(url); return null;}
      const firstFrame = await primeDecodedVideo(video, {isCurrent:owns});
      if (!owns()) {
        video.pause(); URL.revokeObjectURL(url); return null;
      }
      const previous = slots[index];
      slots[index] = {video, url, file, name: file.name, assetId: `${index}:${token}`,
        mediaId:selection.mediaId || null, kind:selection.kind || 'manual', firstFrame};
      if (previous) {previous.video.pause(); URL.revokeObjectURL(previous.url);}
      reset(index ? 'right' : 'left');
      mediaErrors[index] = null;
      if (!selection.mediaId) {
        v.transition = transitions.onTrackLoad(`video:${++loadSerial}`); syncTransitionControl();
      }
      return video.duration;
    } catch (e) {
      video.pause(); URL.revokeObjectURL(url);
      if (!owns()) return null;
      if (token === loadTokens[index]) manualKeys[index] = priorManual;
      throw e;
    }
  }
  function selectMedia(index, selection) {
    const asset = selection.asset;
    desiredMedia[index] = asset?.id || null;
    if (!asset) {
      ++loadTokens[index];
      if (slots[index]?.mediaId) { slots[index].video.pause(); URL.revokeObjectURL(slots[index].url); slots[index] = null;
        reset(index ? 'right' : 'left');
      }
      return Promise.resolve(null);
    }
    if (slots[index]?.mediaId === asset.id) {
      ++loadTokens[index]; slots[index].kind = selection.kind; return Promise.resolve(asset.id);
    }
    return load(index, asset.file, {mediaId:asset.id, kind:selection.kind, ownerKey:audioKey(index)})
      .then(duration => duration === null ? null : asset.id);
  }
  function syncAudioSources() {
    if (transitions.current() !== v.transition) transitions.select(v.transition);
    for (let i = 0; i < 2; i++) {
      const key = audioKey(i), changed = observedAudio[i] !== key, track = state.decks[i]?.track;
      if (changed) {
        observedAudio[i] = key; desiredMedia[i] = undefined; mediaErrors[i] = null;
        if (track?.id) {v.transition = transitions.onTrackLoad(`audio:${i}:${++loadSerial}`); syncTransitionControl();}
      }
      if (!track?.id) {if (slots[i]?.mediaId) void selectMedia(i, {asset:null}); continue;}
      if (manualKeys[i] === key || karaoke.diagnostics(i).available) continue;
      const selection = media.resolve(track.id, {advance:changed});
      if ((selection.asset?.id || null) === desiredMedia[i] && !changed) continue;
      void selectMedia(i, selection).catch(e => {
        if (observedAudio[i] !== key) return;
        mediaErrors[i] = e.message; notify(`Media Crate: ${e.message}`);
      });
    }
  }
  function mediaDiagnostics() {
    const selected = transitions.diagnostics();
    return {...media.diagnostics(), assets:media.assets().map(({id,name,warnings}) => ({id,name,warnings})),
      associations:[0,1].map(i => ({deck:i, trackId:state.decks[i]?.track?.id || null,
        assetId:state.decks[i]?.track?.id ? media.association(state.decks[i].track.id) : null})),
      sources:slots.map((item,i) => ({kind:karaokeFrames[i] ? 'karaoke' : item?.kind || 'none', assetId:item?.mediaId || null,error:mediaErrors[i]})),
      transitions:{...selected,selected:selected.current}};
  }
  function addMedia(files) {const added = media.add(files); desiredMedia.fill(undefined); return added.map(({id,name,warnings}) => ({id,name,warnings}));}
  function removeMedia(id) {
    const removed = media.remove(id);
    for (let i = 0; i < 2; i++) if (slots[i]?.mediaId === id) {
      ++loadTokens[i]; manualKeys[i] = null;
    }
    desiredMedia.fill(undefined); return removed;
  }
  function configureMedia(options) {
    const enabled = v.media.enabled;
    v.media = media.configure(options);
    if (enabled !== v.media.enabled) for (let i = 0; i < 2; i++) {
      if (slots[i]?.kind !== 'manual') {++loadTokens[i]; manualKeys[i] = null;}
    }
    desiredMedia.fill(undefined);
  }
  async function nextMedia(index) {
    const track = state.decks[index]?.track; if (!track?.id) throw new Error('Load an audio track first.');
    manualKeys[index] = null;
    return selectMedia(index, media.next(track.id));
  }
  function associateVideo(index) {
    const track = state.decks[index]?.track, item = slots[index];
    if (!track?.id || !item?.file) throw new Error('Load an audio track and a decoded video first.');
    ++loadTokens[index];
    const assetId = item.mediaId || media.add([item.file])[0].id;
    media.associate(track.id, assetId); item.mediaId = assetId; item.kind = 'associated'; manualKeys[index] = null; desiredMedia[index] = assetId;
    return assetId;
  }
  function removeVideoAssociation(index) {
    const id = state.decks[index]?.track?.id; if (!id) throw new Error('Load an audio track first.');
    ++loadTokens[index];
    media.associate(id, null); manualKeys[index] = null; desiredMedia[index] = undefined;
  }
  function configureTransitions(options) {v.transitionSelection = transitions.configure(options);}
  function nextTransition() {v.transition = transitions.next(); syncTransitionControl(); return v.transition;}
  function bind(target) {canvas = target; canvas.width = v.width; canvas.height = v.height;}
  async function play(index) {
    if (disposed) throw new Error('Video mixer was disposed.');
    const item = slots[index];
    if (!item) return notify('Choose a local video for this side first.');
    if (item.video.paused) await item.video.play(); else item.video.pause();
  }
  async function setOverlayImage(target, id, file) {
    if (disposed) throw new Error('Video mixer was disposed.');
    if (!['left', 'right', 'master'].includes(target)) throw new Error('Invalid overlay target.');
    const key = `${target}:${id}`, token = (imageTokens.get(key) || 0) + 1;
    imageTokens.set(key, token);
    const url = URL.createObjectURL(file), image = new Image();
    image.src = url;
    try {await image.decode();} catch {URL.revokeObjectURL(url); throw new Error('The image could not be decoded.');}
    if (disposed || imageTokens.get(key) !== token) {URL.revokeObjectURL(url); return null;}
    const previous = assets.get(key); if (previous) URL.revokeObjectURL(previous.url);
    assets.set(key, {image, url, name: file.name});
    return id;
  }
  function clearOverlayImage(target, id) {
    const key = `${target}:${id}`, previous = assets.get(key);
    imageTokens.set(key, (imageTokens.get(key) || 0) + 1);
    if (previous) URL.revokeObjectURL(previous.url); assets.delete(key);
  }
  function setResolution(width, height) {
    if (disposed) throw new Error('Video mixer was disposed.');
    if (startPromise || stopPromise || recorder?.state === 'recording') throw new Error('Stop video capture before changing output resolution.');
    if (![[640,360],[1280,720],[1920,1080]].some(([w,h]) => w === width && h === height))
      throw new Error('Choose 360p, 720p or 1080p browser output.');
    pipeline?.dispose(); pipeline = null; v.width = width; v.height = height;
    // Preserve actual decoded pixels through an output resize while the source
    // is seeking. The pending treatment commits only with its next valid frame.
    if (raw) raw = raw.map(source => {
      const resized = document.createElement('canvas'); resized.width = width; resized.height = height;
      resized.getContext('2d').drawImage(source,0,0,width,height); return resized;
    });
    if (canvas) {canvas.width = width; canvas.height = height;} error = null; lastTime = -Infinity;
  }
  function drawRaw(index) {
    const c = raw[index], ctx = c.getContext('2d'), item = slots[index];
    const graphics = karaokeFrames[index];
    if (graphics) {
      const source = graphics.canvas, scale = Math.min(c.width/source.width, c.height/source.height);
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(source, (c.width-source.width*scale)/2, (c.height-source.height*scale)/2,
        source.width*scale, source.height*scale);
      decodedRawIds[index] = graphics.assetId; return;
    }
    if (item && (item.video.readyState < 2 || item.video.seeking) && decodedRawIds[index] === item.assetId) return;
    if (item?.video.readyState >= 2 && !item.video.seeking) {
      const mode = normalizeVideoTreatment(v.mediaTreatment);
      const presentation = JSON.stringify([item.assetId,mode,item.video.videoWidth,item.video.videoHeight,c.width,c.height]);
      drawVideoTreatment(ctx,item.video,mode);
      if (effectivePresentation[index] !== presentation) {
        if (effectivePresentation[index] !== null) pipeline?.reset(index ? 'right' : 'left');
        effectivePresentation[index] = presentation; presentationGenerations[index]++;
      }
      decodedRawIds[index] = item.assetId;
    }
    else {
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.fillStyle = index ? '#332127' : '#17323b'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = '#bbb'; ctx.font = `${Math.round(c.width/35)}px sans-serif`;
      ctx.fillText(`Load ${index ? 'right' : 'left'} video`, c.width/40, c.height/10);
    }
  }
  function resolvedOverlays() {
    return Object.fromEntries(['left', 'right', 'master'].map(target => [target,
      (v.overlays[target] || []).map(spec => ({...spec,
        image: assets.get(`${target}:${spec.imageRef || spec.id}`)?.image}))]));
  }
  function diagnostics() {
    return {frames: frameId, error, width: v.width, height: v.height, lastRenderMs,
      mediaTreatment:normalizeVideoTreatment(v.mediaTreatment), presentationGenerations:[...presentationGenerations],
      inputs: slots.map(item => item ? {name: item.name, position: item.video.currentTime,
        duration: item.video.duration, paused: item.video.paused, firstFrame:item.firstFrame,
        readyState:item.video.readyState, seeking:item.video.seeking} : null),
      loadedImages: [...assets.keys()], karaoke: [0, 1].map(i => karaoke.diagnostics(i)), pipeline: pipeline?.diagnostics(),
      recording: recorder?.state === 'recording', captureBytes: result?.size || 0};
  }
  function updateStatus() {
    for (let i = 0; i < 2; i++) {
      const status = document.querySelector(`#video-status-${i}`), item = slots[i];
      const graphics = karaokeFrames[i];
      if (status) status.textContent = (graphics ? `CDG graphics · ${graphics.position.toFixed(2)}s · audio deck ${i+1} clock` : item ? `${item.name} · ${item.video.currentTime.toFixed(1)} / ${item.video.duration.toFixed(1)}s · ${item.video.paused ? 'Paused' : 'Playing'}` : 'No media loaded') + (mediaErrors[i] ? ` · Replacement failed: ${mediaErrors[i]}` : '');
    }
    const status = document.querySelector('#video-pipeline-state');
    if (status) status.textContent = error ? `Video unavailable: ${error}. Reset to retry.` :
      `${v.width}×${v.height} · ${frameId} processed frames · ${lastRenderMs.toFixed(1)} ms CPU submission · independent GPU algorithms; reference equivalence unverified`;
    const rec = document.querySelector('#video-record-state');
    if (rec) rec.textContent = recorder?.state === 'recording' ? 'Recording processed canvas + browser master' :
      result ? `Capture ready: ${result.size} bytes` : 'Not recording';
  }
  function tick(force = false) {
    if (disposed || (!canvas?.isConnected && recorder?.state !== 'recording')) return;
    const now = performance.now();
    const interval = 1000/30, elapsed = now - lastTime;
    if (!force && elapsed < interval) return;
    // Keep the requested cadence phase aligned instead of accumulating rAF jitter.
    lastTime = force || !Number.isFinite(elapsed) ? now : now - (elapsed % interval);
    if (error) return updateStatus();
    const start = performance.now();
    try {
      syncAudioSources();
      pipeline ||= createVideoPipeline({width: v.width, height: v.height}); raw ||= createRaw();
      karaokeFrames = [0, 1].map(i => karaoke.frame(i));
      slots.forEach((item, i) => {
        if (!item) return;
        if (karaokeFrames[i]) {if (!item.video.paused) item.video.pause(); return;}
        // Capture the completed decode before a new seek lowers readyState.
        if (item.video.readyState >= 2) drawRaw(i);
        const d = state.decks[i];
        if (v.linked && !d?.track) {item.video.pause(); return;}
        if ((v.linked || item.kind === 'fallback') && d?.track && Number.isFinite(item.video.duration) && item.video.duration > 0) {
          const position = ((engine.position(d) % item.video.duration) + item.video.duration) % item.video.duration;
          const reverse = d.reverse || d.rate < 0;
          if (!item.video.seeking && Math.abs(item.video.currentTime - position) >
            (reverse || !d.playing ? 1/60 : .25)) item.video.currentTime = position;
          item.video.playbackRate = Math.max(.0625, Math.min(16, Math.abs(d.rate || 1)));
          if (d.playing && !d.reverse && d.rate >= 0 && item.video.paused && !item.playPending) {
            item.playPending = true;
            void item.video.play().catch(e => notify(e.message)).finally(() => item.playPending = false);
          }
          if ((!d.playing || d.reverse || d.rate < 0) && !item.video.paused) item.video.pause();
        }
      });
      raw.forEach((_, i) => drawRaw(i));
      const time = now / 1000, reducedMotion = !!state.settings?.['Reduced Motion'];
      const audioSources = state.decks.filter(d => d?.track).map(d => ({
        id: `${d.index}:${d.track.id}`, playing:!!d.playing, position:engine.position(d),
        rate:d.rate * (d.reverse ? -1 : 1), generation:d.videoLoadGeneration || 0}));
      const audioTransport = sources => ({playing:sources.some(source => source.playing),
        generation:JSON.stringify(sources.map(({id,generation}) => [id,generation])),sources});
      const channels = slots.map((item, i) => ({...(engine.videoAnalysis?.(i) || {audioAvailable:false}),
        audioTransport:audioTransport(audioSources.filter(source => source.id.startsWith(`${i}:`))),
        bpm: (state.decks[i]?.track?.bpm || 120) * Math.abs(state.decks[i]?.rate || 1), rate: (v.linked || item?.kind === 'fallback' || karaokeFrames[i]) && state.decks[i]?.track ?
          (state.decks[i].playing ? state.decks[i].rate * (state.decks[i].reverse ? -1 : 1) : 0) : item?.video.paused ? 0 : item?.video.playbackRate || 0,
        position: (v.linked || item?.kind === 'fallback' || karaokeFrames[i]) && state.decks[i]?.track ? engine.position(state.decks[i]) : item?.video.currentTime || 0,
        upfader: engine.nodes?.[i]?.level ?? 1, assetId: karaokeFrames[i]?.assetId || (item ? `${item.assetId}:presentation:${presentationGenerations[i]}` : `empty:${i}`)}));
      const cross = v.linked ? engine.cross : v.auto && !reducedMotion ? Math.sin(time/2.5) : v.cross;
      const {output, channels: processed} = pipeline.render(raw, {...v, overlays: resolvedOverlays()}, {
        time, frameId: ++frameId, reducedMotion, channels, audioFXLinks:engine.videoFXLinks?.(),
        master: {...(engine.videoAnalysis?.(4) || {audioAvailable:false}), bpm: channels[0].bpm, audioTransport:audioTransport(audioSources)},
        masterAssetId: channels.map(channel => channel.assetId).join('|'),
        amount: (Math.max(-1, Math.min(1, cross)) + 1)/2,
        upfaders: v.linked ? channels.map(c => c.upfader) : [1,1],
      });
      for (const target of new Set([canvas, recorder?.state === 'recording' ? captureCanvas : null])) {
        if (!target) continue; const ctx = target.getContext('2d');
        ctx.clearRect(0,0,target.width,target.height); ctx.drawImage(output,0,0,target.width,target.height);
      }
      processed.forEach((source, i) => {
        const preview = document.querySelector(`#video-preview-${i}`);
        if (preview) {const ctx = preview.getContext('2d'); ctx.clearRect(0,0,preview.width,preview.height);
          ctx.drawImage(source,0,0,preview.width,preview.height);}
      });
      lastRenderMs = performance.now() - start;
    } catch (e) {error = e.message; notify(`Video pipeline: ${error}`);}
    updateStatus();
  }
  function record() {
    if (disposed) return Promise.reject(new Error('Video mixer was disposed.'));
    if (startPromise) return Promise.reject(new Error('Video capture is already starting.'));
    startPromise = (async () => {
      if (stopPromise) await stopPromise;
      if (recorder?.state === 'recording') throw new Error('Video capture is already running.');
      if (!canvas?.captureStream || !window.MediaRecorder) throw new Error('Canvas recording is unsupported by this browser.');
      await engine.resume();
      if (disposed) throw new Error('Video mixer was disposed.');
      tick(true); if (error) throw new Error(error);
      const source = canvas, stream = source.captureStream(30), chunks = [];
      for (const audio of engine.destination.stream.getAudioTracks()) stream.addTrack(audio);
      const mime = ['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm','video/mp4']
        .find(t => MediaRecorder.isTypeSupported(t));
      try {
        const current = new MediaRecorder(stream, mime ? {mimeType:mime} : {});
        current.ondataavailable = e => {if (e.data.size) chunks.push(e.data);};
        current.onerror = e => {error = e.error?.message || 'Video capture failed.'; notify(error);};
        let finish;
        const session = {recorder:current, chunks, stream, stopping:false,
          done: new Promise(resolve => {finish = resolve;})};
        current.onstop = () => {
          const blob = new Blob(chunks, {type:current.mimeType});
          stream.getVideoTracks().forEach(t => t.stop());
          if (captureSession === session) {result = blob; captureCanvas = null; captureSession = null;}
          finish(blob);
        };
        current.start(250);
        recorder = current; captureCanvas = source; captureSession = session;
      } catch (e) {stream.getVideoTracks().forEach(t => t.stop()); throw e;}
    })().finally(() => {startPromise = null;});
    return startPromise;
  }
  function stop() {
    if (startPromise) return startPromise.then(() => stop());
    if (stopPromise) return stopPromise;
    const session = captureSession;
    if (!session) return Promise.resolve(result);
    stopPromise = session.done.finally(() => {stopPromise = null;});
    if (!session.stopping && session.recorder.state !== 'inactive') {
      session.stopping = true;
      session.recorder.stop();
    }
    return stopPromise;
  }
  async function dispose() {
    if (disposed) return; disposed = true;
    // Invalidate pending decodes/start immediately; an outstanding resume may settle later.
    slots.forEach((item,i) => {++loadTokens[i]; if (item) {item.video.pause(); URL.revokeObjectURL(item.url);}});
    for (const {url} of assets.values()) URL.revokeObjectURL(url); assets.clear(); pipeline?.dispose();
    karaoke.dispose();
    media.dispose(); transitions.dispose();
    const session = captureSession;
    if (session) {
      // Disposal owns the existing session, independent of a canceled queued start.
      if (!session.stopping && session.recorder.state !== 'inactive') {
        session.stopping = true; session.recorder.stop();
      }
      await session.done;
    }
  }
  async function loadKaraoke(index, file, trackId, options) {
    const result = await karaoke.load(index, file, trackId, options);
    if (!result) throw new Error('The karaoke request lost ownership of its audio deck.');
    reset(index ? 'right' : 'left'); return result;
  }
  function configureKaraoke(index, options) {karaoke.configure(index, options); reset(index ? 'right' : 'left');}
  function clearKaraoke(index) {karaoke.clear(index); reset(index ? 'right' : 'left');}
  return {load, bind, play, setOverlayImage, clearOverlayImage, setResolution, reset, tick,
    loadKaraoke, configureKaraoke, clearKaraoke, karaokeDiagnostics: index => karaoke.diagnostics(index),
    addMedia, removeMedia, configureMedia, nextMedia, associateVideo, removeVideoAssociation,
    mediaDiagnostics, configureTransitions, nextTransition,
    record, stop, dispose, diagnostics,
    get recording() {return recorder?.state === 'recording';}, get result() {return result;}};
}
