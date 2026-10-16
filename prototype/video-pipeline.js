import { createVideoEffects } from './video-effects.js';
import { createVideoTransitions } from './video-transitions.js';
import { createVideoOverlays } from './video-overlays.js';
import { createVideoAudioFX } from './video-audio-fx.js';

export const videoPipelinePolicy = Object.freeze({
  order: 'Raw input → two channel FX → channel overlays → transition → master overlays → two master FX',
  referenceOrder: 'Unverified; this is an independent Open Play routing contract.',
  scheduling: 'Caller supplies one monotonic time/frameId per processed frame; no frame-rate guarantee.',
  semanticLinks: 'Opt-in exact Echo/Distortion links precede ordinary channel slots; master links follow transition and precede master overlays/slots. Independent policy, not recovered reference routing.',
});
export function createVideoPipeline({width = 640, height = 360} = {}) {
  const effects = {}, overlays = {}, links = {};
  let transition, disposed = false, last = null;
  try {
    for (const target of ['left', 'right', 'master']) {
      effects[target] = createVideoEffects({width, height});
      overlays[target] = createVideoOverlays({width, height});
      links[target] = createVideoAudioFX({width, height});
    }
    transition = createVideoTransitions({width, height});
  } catch (error) {
    Object.values(effects).forEach(r => r.dispose()); Object.values(overlays).forEach(r => r.dispose());
    Object.values(links).forEach(r => r.dispose());
    transition?.dispose(); throw error;
  }
  return {
    render(sources, settings = {}, context = {}) {
      if (disposed) throw new Error('Video pipeline was disposed.');
      if (sources.length !== 2) throw new Error('Video pipeline needs two decoded source frames.');
      const shared = {time: context.time, frameId: context.frameId, reducedMotion: context.reducedMotion};
      const linkEnabled = settings.audioFXLink === true && context.audioFXLinks?.available === true;
      const channels = ['left', 'right'].map((target, i) => {
        const c = {...shared, ...context.channels?.[i], target};
        const linked = links[target].render(sources[i], linkEnabled ? context.audioFXLinks[target] || [] : [], c);
        const fx = effects[target].render(linked, settings.fx?.[target] || [],
          {...c, secondarySource: sources[1-i]});
        return overlays[target].render(fx, settings.overlays?.[target] || [], c);
      });
      const mixed = transition.render(channels[0], channels[1], {
        ...shared, name: settings.transition || 'Crossfade', amount: context.amount ?? .5,
        bpm: context.master?.bpm || 120,
        leftLevel: context.channels?.[0]?.level || 0, rightLevel: context.channels?.[1]?.level || 0,
        upfaders: context.upfaders || [1, 1],
      });
      const masterContext = {...shared, ...context.master, target: 'master', assetId: context.masterAssetId};
      const linkedMaster = links.master.render(mixed, linkEnabled ? context.audioFXLinks.master || [] : [], masterContext);
      const overlaid = overlays.master.render(linkedMaster, settings.overlays?.master || [], masterContext);
      const output = effects.master.render(overlaid, settings.fx?.master || [], masterContext);
      last = {channels, output, overlayDiagnostics: Object.fromEntries(
        Object.entries(overlays).map(([key, r]) => [key, r.diagnostics()])),
        audioFXLinks: {enabled: settings.audioFXLink === true, available: context.audioFXLinks?.available === true,
          unsupported: context.audioFXLinks?.unsupported || [], targets: Object.fromEntries(
            Object.entries(links).map(([key, r]) => [key, r.diagnostics()]))}};
      return last;
    },
    reset(target) {
      if (disposed) throw new Error('Video pipeline was disposed.');
      for (const key of target ? [target] : ['left', 'right', 'master']) {
        effects[key]?.reset(); overlays[key]?.reset();
        links[key]?.reset();
      }
      transition.reset(); last = null;
    },
    dispose() {
      if (disposed) return; disposed = true;
      Object.values(effects).forEach(r => r.dispose()); Object.values(overlays).forEach(r => r.dispose());
      Object.values(links).forEach(r => r.dispose());
      transition.dispose(); last = null;
    },
    diagnostics() {return {width, height, disposed, policy: videoPipelinePolicy,
      overlays: last?.overlayDiagnostics || {}, audioFXLinks: last?.audioFXLinks || {enabled:false}};},
  };
}
