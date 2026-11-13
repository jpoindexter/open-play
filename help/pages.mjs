export const version = '0.1.89';
export const updated = '13 November 2026';
export const groups = [
  ['Start here', [
    ['index', 'Open Play manual', 'Learn the workspace, mix two tracks and find a control.'],
    ['first-mix', 'Your first mix', 'Import two songs and make a manual transition.'],
    ['installation', 'Install and update', 'Private builds, safe upgrades and supported systems.'],
    ['workspace', 'Workspace and layouts', 'Decks, mixer, waveforms, library and Settings.']
  ]],
  ['Mixing', [
    ['decks', 'Deck controls', 'Transport, tempo, jog, Key Lock and Reverse.'],
    ['sync', 'Beatmatching and Sync', 'Manual matching, Simple Sync, Smart Sync and MASTER.'],
    ['waveforms', 'Waveforms and beatgrids', 'Read the NOW line and correct a drifting grid.'],
    ['mixer', 'Mixer and headphones', 'Gain, EQ, filter, faders, cue mix and output routing.'],
    ['cues-loops', 'Cues and loops', 'Temporary Cue, hot cues, loop controls and performance pads.'],
    ['recording', 'Record a mix', 'Capture, stop and download your master output.']
  ]],
  ['Your library', [
    ['library', 'Import and organize', 'Files, crates, Prepare, History and waveform previews.'],
    ['analysis', 'Analysis and metadata', 'BPM, key, gain, confidence and track details.'],
    ['backup', 'Save, back up and recover', 'Local audio, metadata backups and safe recovery.']
  ]],
  ['Reference and help', [
    ['settings', 'Settings reference', 'Layouts, audio, mixer preferences and advanced settings.'],
    ['keyboard', 'Keyboard shortcuts', 'Current A/B bindings and keyboard interaction.'],
    ['midi', 'MIDI and controllers', 'Select input, learn mappings and understand device limits.'],
    ['advanced', 'Advanced features', 'Effects, Sampler, Stems, Flip, video and simulated services.'],
    ['troubleshooting', 'Troubleshooting', 'No sound, timing offsets, pops, stalls and missing media.'],
    ['known-issues', 'Beta status and limitations', 'What remains unverified and how to report a problem.'],
    ['contributing', 'Source and contributions', 'Fork the MIT source, contribute improvements and open pull requests.'],
    ['glossary', 'DJ glossary', 'BPM, downbeat, phase, cue, pitch, gain and clipping.']
  ]]
];
export const pages = groups.flatMap(([group, entries]) => entries.map(([slug, title, description]) => ({slug, title, description, group})));
export const href = slug => slug === 'index' ? '/' : `/${slug}/`;
