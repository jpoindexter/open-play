import {createDeckTapTempo} from './deck-tap-tempo.js';
import {createInstantDouble} from './instant-double.js';
import {createManualLoops} from './manual-loops.js';
import {createLoopPads} from './loop-pads.js';
import {createJogBend} from './jog-bend.js';
import {createCensorHolds} from './censor.js';
import { synchronizeSimple } from './sync.js';
import { createSmartSync, hasBeatgrid, beatPosition } from './smart-sync.js';
import {createBeatgrid} from './beatgrid.js';
import {currentDeckBPM} from './deck-tempo.js';
import {createLocalAudioLibrary} from "./local-audio-library.js";
import { createStemPreparation } from "./stems.js";
import { createStemWaveformModel, paintStemOverview, paintStemDetail, paintOriginalOverview, paintOriginalDetail } from "./stem-waveform.js";
import { normalizeFXTempoSettings } from "./fx-tempo.js";
import { createStemSlipControls } from "./stem-slip-ui.js";
import {createDeckScratchControls, deckScratchUIPolicy} from "./deck-scratch-ui.js";
import {createScratchInputDebug} from "./scratch-input-debug.js";
import { snapshotVideoState, restoreVideoState } from "./video-state.js";
import { createPitchPlay, pitchRanges, parseMusicalKey, shiftedKey, keyLabel, planKeySync } from "./pitchplay.js";
import { analyzeBuffer } from "./analysis.js";
import { createSlicer } from "./slicer.js";
import { createCueHolds } from "./holds.js";
import { createFlipAutomation } from "./flip.js";
import { crateMembers, descendantIds } from "./library.js";
import { AudioEngine } from "./engine.js";
import {
  demoTracks,
  colors,
  providers,
  defaultSettings,
  newDeck,
} from "./fixtures.js";
import { features, requirements, fxCatalog } from "./inventory.js";
import { createPanels } from "./panels.js";
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
export const esc = (x) =>
  String(x ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const clone = (x) => JSON.parse(JSON.stringify(x));
let saved = {};
try {
  saved = JSON.parse(localStorage.getItem("openplay-review-v1") || "{}");
} catch {}
const engine = new AudioEngine();
const stemWaveforms = Array.from({length:4}, () => createStemWaveformModel());
const overviewWaveViews = [];
const state = {
  tracks: clone(demoTracks),
  crates: saved.crates || [
    { id: "warm", name: "Warm up", tracks: ["demo-2", "demo-4", "demo-6"] },
    { id: "night", name: "Night shift", tracks: ["demo-0", "demo-1"] },
    { id: "peak", name: "Peak time", tracks: ["demo-3", "demo-5"] },
    { id: "close", name: "Closing", tracks: ["demo-7"] },
  ],
  settings: { ...defaultSettings(), ...saved.settings },
  selected: "demo-0",
  crate: "all",
  search: "",
  sort: "title",
  sortDir: 1,
  grid: false,
  columns: ["title", "artist", "bpm", "key", "plays", "album", "duration"],
  decks: Array.from({ length: 4 }, (_, i) => newDeck(i)),
  deckCount: 2,
  focus: 0,
  panel: null,
  quantize: true,
  autoplay: false,
  prepare: saved.prepare || [],
  history: saved.history || [],
  layout: "Vertical",
  analysis: false,
  analysisStatus: "Ready",
  analysisSettings: {
    onImport: true,
    analyzeKey: true,
    analyzeTempo: true,
    minBpm: 50,
    maxBpm: 220,
    maxSeconds: 180,
    ...saved.analysisSettings,
  },
  localTags: saved.localTags || {},
  fx: Array.from({ length: 2 }, () =>
    ["LPF", "Delay", "Reverb"].map((name) => ({
      name,
      on: false,
      depth: 50,
      beat: "1/2",
      params: {},
    })),
  ),
  fxTempo: normalizeFXTempoSettings(saved.fxTempo, 2),
  fxFavorites: [],
  fxPresets: [],
  bank: 0,
  samples: Array.from({ length: 4 }, () =>
    Array.from({ length: 8 }, () => ({
      track: null,
      mode: "Trigger",
      gain: 80,
      playing: false,
    })),
  ),
  scratchBank: 0,
  scratch: Array.from({ length: 4 }, () =>
    Array.from({ length: 8 }, () => ({
      track: null,
      start: "Start",
      keylock: false,
      repeat: false,
    })),
  ),
  flip: {
    armed: false,
    events: [],
    on: false,
    loop: false,
    saved: [],
    name: "Untitled Flip",
  },
  device: {
    connected: true,
    mode: "INT",
    noise: 20,
    signal: 90,
    feedback: true,
  },
  mappings: saved.mappings || [],
  midiLog: [],
  providerState: {},
  video: restoreVideoState(saved.video),
  link: { joined: false, tempo: 124, peers: 0 },
  sessionSaved: false,
};

const localAudio=createLocalAudioLibrary();
state.localAudio={error:null,restoreError:null,saveError:null,restored:0};
function localAudioWarning(){state.localAudio.error=state.localAudio.restoreError||state.localAudio.saveError;return state.localAudio.error;}
async function restoreLocalAudio(){
  const records=await localAudio.list();let invalid=false,added=0;
  for(const record of records){
    if(!/^local-[a-f0-9]{64}$/.test(record.id||'')||record.contentHash!==record.id.slice(6)||typeof record.filename!=='string'||!Number.isFinite(record.duration)||record.duration<=0){invalid=true;continue;}
    if(trackById(record.id))continue;
    const track={...record,...state.localTags[record.contentHash],id:record.id,contentHash:record.contentHash,file:null,storage:'saved',readFile:()=>localAudio.file(record.id)};
    state.tracks.push(track);added++;
  }
  state.localAudio.restoreError=invalid?'Some saved entries are invalid. Re-import their original files; stored audio has not been deleted.':null;
  state.localAudio.restored+=added;localAudioWarning();return added;
}
try{await restoreLocalAudio();}catch(error){state.localAudio.restoreError=error.message;localAudioWarning();}

const smartSync = createSmartSync({engine,state});
const stemPreparation = createStemPreparation(engine, state.decks);
const stemSlipControls = createStemSlipControls({engine,state,prepare:ensurePreparedStems,render:renderDecks,notify});
const scratchInputDebug = createScratchInputDebug();
const deckScratchControls = createDeckScratchControls({engine,state,notify,onEvent:scratchInputDebug?.onEvent});
// Browser audio activation is still required. A trusted interaction resumes
// prepared, silent transports; it never creates a playback voice.
const resumePreparedAudio = () => {if (engine.ctx?.state === 'suspended') void engine.ctx.resume().catch(error => notify(error.message));};
document.addEventListener('pointerdown',resumePreparedAudio,{capture:true});
document.addEventListener('keydown',resumePreparedAudio,{capture:true});
if (saved.tags)
  for (const t of state.tracks) Object.assign(t, saved.tags[t.id] || {});
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const time = (v) => {
  v = Math.max(0, Number(v) || 0);
  return `${Math.floor(v / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(v % 60)
    .toString()
    .padStart(2, "0")}.${Math.floor((v % 1) * 10)}`;
};
let noticeTimer;
function notify(message) {
  $("#notice").textContent = message;
  $("#notice").classList.add("visible");
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(
    () => $("#notice").classList.remove("visible"),
    3500,
  );
}
const metadataFields = [
  "title",
  "artist",
  "album",
  "bpm",
  "key",
  "rating",
  "comment",
  "color",
  "cues",
  "savedLoops",
  "grid",
  "gridMarkers",
  "gridWarpMarkers",
  "locked",
  "flips",
  "sampleGain",
  "analysisResult",
  "metadataSources",
  "analysisGainDb",
  "metadataRevision",
];
function trackMetadata(t) {
  return Object.fromEntries(metadataFields.map((k) => [k, t[k]]));
}
function persist() {
  for (const t of state.tracks)
    if (t.contentHash) state.localTags[t.contentHash] = trackMetadata(t);
  try {
    localStorage.setItem(
      "openplay-review-v1",
      JSON.stringify({
        analysisSettings: state.analysisSettings,
        video: snapshotVideoState(state.video),
        fxTempo: normalizeFXTempoSettings(state.fxTempo, 2),
        localTags: state.localTags,
        mappings: state.mappings,
        settings: state.settings,
        crates: state.crates,
        prepare: state.prepare,
        history: state.history,
        tags: Object.fromEntries(
          state.tracks
            .filter((t) => t.demo)
            .map((t) => [t.id, trackMetadata(t)]),
        ),
      }),
    );
    state.sessionSaved = true;
  } catch {
    notify(
      "Browser storage unavailable. Export a library backup to preserve changes.",
    );
  }
}
function dialog(title, html, setup) {
  $("#modal-title").textContent = title;
  $("#modal-body").innerHTML = html;
  if (!$("#modal").open) $("#modal").showModal();
  setup?.($("#modal-body"));
}
$("#modal-close").onclick = () => $("#modal").close();
function trackById(id) {
  return state.tracks.find((t) => t.id === id);
}
function filtered() {
  let a = state.tracks.filter((t) => !t.provider);
  if (state.crate === "prepare")
    a = a.filter((t) => state.prepare.includes(t.id));
  else if (state.crate === "stems")
    a = a.filter((t) => engine.stemBuffers.has(t.id) || stemPreparation.active.has(t.id));
  else if (state.crate === "history")
    a = a.filter((t) => state.history.some((h) => h.id === t.id));
  else {
    const c = state.crates.find((c) => c.id === state.crate);
    if (c)
      a = crateMembers(
        c,
        a,
        state.crates,
        !!state.settings["Include Subcrate Tracks"],
      );
  }
  const q = state.search.toLowerCase();
  a = a.filter((t) =>
    [t.title, t.artist, t.album, t.key, t.comment].some((s) =>
      String(s || "")
        .toLowerCase()
        .includes(q),
    ),
  );
  return a.sort((a, b) => {
    const x = a[state.sort],
      y = b[state.sort];
    return (
      (typeof x === "number"
        ? x - y
        : String(x || "").localeCompare(String(y || ""))) * state.sortDir
    );
  });
}
function selectCrate(id){
  state.crate=id;state.search="";$("#search").value="";renderCrates();renderTracks();
}
function renderCrates() {
  const q = $("#crate-search").value.toLowerCase(),
    seen = new Set();
  const row = (c, depth = 0, favorite = false) =>
    `<div class="crate-row" style="padding-left:${depth * 13}px"><button class="crate-fold" data-fold="${esc(c.id)}" aria-label="${c.collapsed ? "Expand" : "Collapse"} ${esc(c.name)}">${state.crates.some((x) => x.parent === c.id) ? (c.collapsed ? "▸" : "▾") : "·"}</button><button data-crate="${esc(c.id)}" draggable="true" class="${state.crate === c.id ? "active" : ""}"><span class="crate-icon" style="color:${/^#[0-9a-f]{6}$/i.test(c.color || "") ? c.color : "#f2ad56"}">${favorite ? "★" : c.smart ? "◇" : "▰"}</span>${esc(c.name)}</button></div>`;
  const tree = (parent = "", depth = 0) =>
    state.crates
      .filter((c) => (c.parent || "") === parent)
      .map((c) => {
        if (seen.has(c.id)) return "";
        seen.add(c.id);
        const match = !q || c.name.toLowerCase().includes(q);
        return (
          (match ? row(c, depth) : "") +
          (!c.collapsed || q ? tree(c.id, depth + 1) : "")
        );
      })
      .join("");
  const favorites = state.crates.filter(
    (c) => c.favorite && (!q || c.name.toLowerCase().includes(q)),
  );
  $("#crates").innerHTML =
    [
      ["all", "✳", "All music"],
      ["itunes", "♫", "iTunes / local"],
      ["stems", "≋", "Prepared stems"],
      ["prepare", "◷", "Prepare"],
    ]
      .map(
        ([id, icon, name]) =>
          `<button data-crate="${id}" class="${state.crate === id ? "active" : ""}"><span class="crate-icon">${icon}</span>${name}</button>`,
      )
      .join("") +
    (favorites.length
      ? '<div class="crate-section">FAVORITES</div>' +
        favorites.map((c) => row(c, 0, true)).join("")
      : "") +
    '<div class="crate-section">CRATES</div>' +
    tree() +
    (state.settings["Show Streaming Services"]
      ? '<div class="crate-section">STREAMING · SIMULATION</div>' +
        Object.keys(providers)
          .map(
            (p) =>
              `<button data-provider="${p}"><span class="crate-icon">○</span>${p}</button>`,
          )
          .join("")
      : "");
  $$("[data-fold]").forEach(
    (b) =>
      (b.onclick = () => {
        const c = state.crates.find((c) => c.id === b.dataset.fold);
        c.collapsed = !c.collapsed;
        persist();
        renderCrates();
      }),
  );
}
function renderTracks() {
  const a = filtered();
  $("#tracks").innerHTML = state.grid
    ? `<div class="art-grid">${a.map((t) => `<button class="art-card ${state.selected === t.id ? "active" : ""}" data-track="${t.id}" draggable="true"><div class="art-cover" style="--art:${t.color}">◉</div><strong>${esc(t.title)}</strong><small>${esc(t.artist)} · ${t.bpm || "—"} BPM</small></button>`).join("")}</div>`
    : `<table><thead><tr><th style="width:28px"><button title="File status">◉</button></th>${state.columns.map((c) => `<th><button data-sort="${c}">${{ duration: "LENGTH", title: "SONG" }[c] || c.toUpperCase()} ${state.sort === c ? (state.sortDir === 1 ? "▴" : "▾") : ""}</button></th>`).join("")}</tr></thead><tbody>${a.map((t) => `<tr tabindex="0" draggable="true" data-track="${t.id}" class="${t.id === state.selected ? "selected" : ""}" aria-selected="${t.id === state.selected}"><td class="${t.missing ? "problem" : ""}" title="${t.missing ? "Missing file" : t.locked ? "Beatgrid locked" : "Local audio"}">${t.missing ? "⚠" : t.locked ? "▣" : "♫"}</td>${state.columns.map((c) => `<td title="${esc(analysisFieldHint(t, c))}" class="${c === "key" ? "key" : ""}">${esc(c === "duration" ? time(t.duration) : c === "rating" ? "★".repeat(t.rating) : c === "bpm" ? t.bpm || "—" : (t[c] ?? "—"))}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  if (!a.length)
    $("#tracks").innerHTML =
      '<div class="empty">No tracks here.<br><br>Import local audio, add tracks to this crate, or clear the search.</div>';
  $("#library-summary").textContent =
    `${a.length} tracks · ${time(a.reduce((n, t) => n + t.duration, 0))} · ${state.crates.find((c) => c.id === state.crate)?.name || state.crate}`;
}
function loopModeMarkup(d){
 if(d.tab!=="Loops")return "";
 const mode=d.loopPadMode||'saved';
 return `<nav class="loop-line" aria-label="Deck ${d.index+1} loop mode">${[['saved','Saved loops'],['auto','Auto Loop'],['roll','Loop Roll']].map(([value,label])=>`<button data-action="loopMode" data-deck="${d.index}" data-mode="${value}" aria-pressed="${mode===value}">${label}</button>`).join('')}${mode!=='saved'?`<button data-action="loopRangeDown" data-deck="${d.index}" aria-label="Smaller loop pad range deck ${d.index+1}">Range −</button><button data-action="loopRangeUp" data-deck="${d.index}" aria-label="Larger loop pad range deck ${d.index+1}">Range +</button>`:''}</nav>`;
}
function deckBPM(d){return currentDeckBPM(d,engine,{smartSync:state.settings['Sync Mode']==='Smart Sync',targetBPM:smartSync.captureTempo()});}
function shownDeckBPM(d){const bpm=deckBPM(d);return bpm===null?'—':bpm.toFixed(1);}
function padMarkup(d) {
  const t = d.track,
    loopControls=d.tab==="Loops"&&(d.loopPadMode||"saved")!=="saved"?loopPads.describe(d):null,
    labels =
      d.tab === "Stems"
        ? [
            "Vocal",
            "Melody",
            "Bass",
            "Drums",
            "Vocal echo",
            "Instrumental echo",
            "Instrumental braker",
            "Drum echo",
          ]
        : d.tab === "Loops"
          ? loopControls?.map(p=>p.label)||Array.from(
              { length: 8 },
              (_, i) => t?.savedLoops[i]?.name || `Loop ${i + 1}`,
            )
          : d.tab === "Pitch"
            ? pitchRanges[d.pitchRangeMode || "Middle"].map(n => n > 0 ? `+${n}` : String(n))
            : d.tab === "Slicer"
              ? Array.from({ length: 8 }, (_, i) => `Slice ${i + 1}`)
              : Array.from({ length: 8 }, (_, i) => t?.cues[i]?.name || "+");
  return labels
    .map(
      (label, i) =>
        `<button class="pad ${d.tab === "Cues" && t?.cues[i] ? "set" : ""} ${(d.tab === "Stems" && (i < 4 ? d.stems[i] : d.stemFX?.[i - 4])) || (loopControls && d.loopPadMode==='auto' && loopControls[i].active) || (loopControls && d.loopPadMode==='roll' && !loopControls[i].jump && loopPads.rolling(d,i)) ? "active" : ""}" data-deck="${d.index}" data-action="pad" data-pad="${i}" ${loopControls?`aria-label="Deck ${d.index+1} ${loopControls[i].jump?'':d.loopPadMode==='roll'?'Loop Roll ':'Auto Loop '}${esc(label)}" aria-pressed="${!loopControls[i].jump && (d.loopPadMode==='roll'?loopPads.rolling(d,i):loopControls[i].active)}"`:""} style="--pad:${d.tab === "Pitch" && pitchRanges[d.pitchRangeMode || "Middle"][i] === 0 ? "#ffffff" : colors[i]}" title="${d.tab === "Cues" ? "Click set/trigger; Shift-click delete; right-click edit" : "Audio performance control"}">${esc(label)}<small>${d.tab === "Cues" && t?.cues[i] ? time(t.cues[i].position) : d.tab === "Stems" ? (engine.stemBuffers.has(t?.id) ? "AUDIO" : stemPreparation.active.has(t?.id) ? "PREPARING" : "ANALYZE") : loopControls ? loopControls[i].detail : d.tab === "Pitch" ? `CUE ${(d.pitchCue || 0) + 1}` : i + 1}</small></button>`,
    )
    .join("");
}
let renderedSyncMode = state.settings["Sync Mode"];
function syncControls(d) {
  const mode = state.settings["Sync Mode"];
  if (mode === "Off") return "";
  const smart = mode === "Smart Sync", status = smart ? d.syncState || "off" : d.sync ? "beat" : "off";
  const role = d.sync ? (d.syncRole === "primary" ? "Primary" : "Secondary") : "Not synced";
  return `<button data-action="syncOff" data-deck="${d.index}" aria-label="Disengage sync on deck ${d.index + 1}" title="Disengage sync; keep the current software tempo" ${d.sync || status === "relative" ? "" : "disabled"}>OFF</button><button data-action="sync" data-deck="${d.index}" data-sync-state="${status}" aria-label="Sync deck ${d.index + 1}" aria-pressed="${!!d.sync}" title="${smart && !hasBeatgrid(d.track) ? "Add or analyze a beatgrid first" : role + "; press again to re-sync"}" ${smart && !hasBeatgrid(d.track) ? "disabled" : ""} class="${d.sync ? "active" : ""}">SYNC</button>`;
}
function smartSyncIndicator(d) {
  if (state.settings["Sync Mode"] !== "Smart Sync") return "";
  return `<div class="beat-position" data-beat-position="${d.index}" aria-label="Deck ${d.index + 1} beat position"><span data-smart-status="${d.index}">${hasBeatgrid(d.track) ? d.syncState || "off" : "No beatgrid"}</span><span class="beat-dots" aria-hidden="true">${[0,1,2,3].map(n => `<i data-beat="${n}"></i>`).join("")}</span></div>`;
}
function renderDecks() {
  const quantizeStates=state.decks.slice(0,state.deckCount).map(deckQuantize);
  $('#quantize').setAttribute('aria-pressed',quantizeStates.every(Boolean)?'true':quantizeStates.every(x=>!x)?'false':'mixed');
  const syncMode = state.settings["Sync Mode"];
  if (syncMode !== renderedSyncMode) {
    smartSync.reset();
    renderedSyncMode = syncMode;
  }

  smartSync.reconcile();
  document.body.className = `${document.body.classList.contains("day") ? "day " : ""}layout-${state.layout}${state.deckCount === 4 ? " four-decks" : ""}`;
  $("#decks").innerHTML = state.decks
    .slice(0, state.deckCount)
    .map((d) => {
      const t = d.track;
      if (d.keySync && d.keySyncTag !== t?.key) d.keySync = false;
      const displayedKey = parseMusicalKey(t?.key) ? keyLabel(shiftedKey(parseMusicalKey(t.key), d.keyShift || 0)) : t?.key || "—";
      return `<article class="deck ${state.focus === d.index ? "focused" : ""}" style="--accent:${colors[d.index]}" data-drop-deck="${d.index}" data-focus="${d.index}"><div class="deck-head"><span class="deck-number">${d.index + 1}</span><div class="deck-title"><strong>${esc(t?.title || "Drag song here")}</strong><small>${esc(t?.artist || "Select a library track and Load")}${t ? " · " + time(t.duration) : ""}</small></div><span class="deck-key">${esc(displayedKey)}${d.keyShift ? ` (${d.keyShift > 0 ? "+" : ""}${d.keyShift})` : ""}</span><button data-action="load" data-deck="${d.index}">Load</button><button data-action="eject" data-deck="${d.index}" aria-label="Eject deck ${d.index + 1}">⏏</button></div><div class="deck-body"><div><nav class="deck-tabs" aria-label="Deck ${d.index + 1} performance modes">${["Cues", "Loops", "Stems", "Pitch", "Slicer"].map((tab) => `<button data-action="tab" data-deck="${d.index}" data-tab="${tab}" class="${d.tab === tab ? "active" : ""}">${tab}</button>`).join("")}</nav>${loopModeMarkup(d)}<div class="pads">${padMarkup(d)}</div>${d.tab === "Stems" ? `<div class="loop-line"><button data-action="stemPrepare" data-deck="${d.index}">Preparation</button><small role="status" data-stem-status="${d.index}">${esc(t?.stemState || "Stems will prepare locally on first use.")}</small></div>${stemSlipControls.markup(d)}` : ""}${d.tab === "Pitch" ? `<div class="loop-line"><label>Pitch range<select data-pitch-range="${d.index}" aria-label="Deck ${d.index + 1} Pitch Play range">${["Down", "Middle", "Up"].map(range => `<option ${range === (d.pitchRangeMode || "Middle") ? "selected" : ""}>${range}</option>`).join("")}</select></label><small>Shift-pad selects cue · hold to audition</small></div>` : ""}${d.tab === "Slicer" ? `<div class="loop-line"><label>Domain<select data-slice-domain="${d.index}" aria-label="Deck ${d.index + 1} slicer domain">${[2, 4, 8, 16, 32, 64].map((v) => `<option ${v === (d.slicerDomain || 8) ? "selected" : ""}>${v}</option>`).join("")}</select></label><label>Quantize<select data-slice-quant="${d.index}" aria-label="Deck ${d.index + 1} slice quantize">${[0.125, 0.25, 0.5, 1].map((v) => `<option ${v === (d.sliceQuant || 1) ? "selected" : ""}>${v}</option>`).join("")}</select></label><button data-action="slicerLoop" data-deck="${d.index}" class="${d.slicerLoop ? "active" : ""}">Slicer loop</button></div>` : ""}<div class="loop-line"><button data-action="loopHalf" data-deck="${d.index}">½</button><button data-action="loop" data-deck="${d.index}" class="${d.loop ? "active" : ""}">Loop ${d.loopLength}</button><button data-action="loopDouble" data-deck="${d.index}">×2</button><button data-action="loopIn" data-deck="${d.index}" aria-pressed="${d.loopEdit === "in"}" class="${d.loopEdit === "in" ? "active" : ""}" title="Set Loop In; press again during a loop to edit with jog">IN</button><button data-action="loopOut" data-deck="${d.index}" aria-pressed="${d.loopEdit === "out"}" class="${d.loopEdit === "out" ? "active" : ""}" title="Set Loop Out; press again during a loop to edit with jog">OUT</button><button data-action="loopSave" data-deck="${d.index}" aria-label="Save loop to slot ${(d.loopSlot || 0)+1} on deck ${d.index+1}">Save ${(d.loopSlot || 0)+1}</button></div><div class="loop-line"><button data-action="jumpBack" data-deck="${d.index}">← ${d.loopLength}</button><button data-action="roll" data-deck="${d.index}">Hold roll</button><button data-action="jumpForward" data-deck="${d.index}">${d.loopLength} →</button><button data-action="grid" data-deck="${d.index}">Edit grid</button></div></div><div class="deck-disc"><div class="transport">${syncControls(d)}<button data-action="cue" data-deck="${d.index}" title="Temporary cue">▮◀</button><button data-action="play" data-deck="${d.index}" aria-label="Play or pause deck ${d.index + 1}" class="${d.playing ? "active" : ""}">${d.playing ? "❚❚" : "▶"}</button></div>${smartSyncIndicator(d)}<div class="platter" id="platter-${d.index}" data-deck-scratch="${d.index}" tabindex="0" role="button" aria-label="Scratch deck ${d.index + 1}" aria-describedby="scratch-help-${d.index}" aria-busy="false"><strong>${shownDeckBPM(d)}</strong><small>BPM · ${((d.rate - 1) * 100).toFixed(1)}%</small><time id="time-${d.index}">${time(engine.position(d))}</time><small id="remain-${d.index}">−${time((t?.duration || 0) - engine.position(d))}</small></div><small class="scratch-status" role="status" data-deck-scratch-status="${d.index}">${esc(d.scratchWarmState === "preparing" ? "Preparing scratch…" : d.scratchWarmState === "error" ? "Scratch unavailable" : "Drag platter to scratch")}</small><span class="sr-only" id="scratch-help-${d.index}">${esc(deckScratchUIPolicy.keyboard)}</span></div><label class="tempo-control" title="Tempo; enable key lock to preserve pitch">±${d.pitchRange}%<input type="range" min="${-d.pitchRange}" max="${d.pitchRange}" step=".1" value="${(d.rate - 1) * 100}" data-tempo="${d.index}" aria-label="Deck ${d.index + 1} tempo"></label></div><div class="deck-foot"><select data-mode="${d.index}" aria-label="Deck ${d.index + 1} mode">${["INT", "REL", "ABS", "THRU", "WIR"].map((m) => `<option ${d.mode === m ? "selected" : ""}>${m}</option>`).join("")}</select>${[
        ["quantize", "Q"],
        ["keylock", "Key lock"],
        ["slip", "Slip"],
        ["reverse", "Reverse"],
        ["repeat", "Repeat"],
      ]
        .map(
          ([key, label]) =>
            `<button data-action="${key}" data-deck="${d.index}" class="${(key==='quantize'?deckQuantize(d):d[key]) ? "active" : ""}" aria-label="${key==='quantize'?`Quantize deck ${d.index+1}`:label}" aria-pressed="${!!(key==='quantize'?deckQuantize(d):d[key])}">${label}</button>`,
        )
        .join(
          "",
        )}<button data-action="censor" data-deck="${d.index}" aria-pressed="${!!d.censor}" class="${d.censor ? "active" : ""}" ${d.mode === "ABS" || !t || !d.playing ? "disabled" : ""} title="Hold for reverse; release resumes the forward timeline">Censor</button><button data-action="keyDown" data-deck="${d.index}" title="Shift key down one semitone; prototype limit±24">Key −</button><button data-action="keyUp" data-deck="${d.index}" title="Shift key up one semitone; prototype limit±24">Key +</button><button data-action="keySync" data-deck="${d.index}" class="${d.keySync ? "active" : ""}">Key Sync</button><button data-action="keyReset" data-deck="${d.index}">Reset key</button><button data-action="range" data-deck="${d.index}">±${d.pitchRange}</button><button data-action="double" data-deck="${d.index}">Double</button><span class="spacer"></span><small class="muted">${d.processing ? "PROCESSING PITCH…" : d.mode === "INT" ? "LOCAL AUDIO" : "DEVICE SIMULATION"}</small></div><div class="wave-wrap" data-seek="${d.index}" tabindex="0" role="slider" aria-label="Deck ${d.index + 1} play position" aria-valuemin="0" aria-valuemax="${t?.duration || 48}" aria-valuenow="${engine.position(d)}"><canvas id="wave-${d.index}" width="900" height="100"></canvas><span class="playhead" id="head-${d.index}"></span><span class="wave-label" data-wave-scope="${d.index}" aria-live="polite">${t?.analyzed ? "Decoded waveform" : "Generated overview fixture"} · ${t?.bpm || "—"} BPM</span></div></article>`;
    })
    .join("");
  if (state.layout === "Vertical")
    $("#decks").insertAdjacentHTML(
      "beforeend",
      `<section class="detail-waves" aria-label="Scrolling waveforms"><canvas id="detail-wave" width="320" height="330"></canvas><span>SOURCE WAVEFORMS · ±2s · pre-FX</span></section>`,
    );
  drawWaves();
  renderMixer();
  stemSlipControls.restoreFocus();
}
function waveformView(d) {
  const stemState = engine.stemStates.get(d.index);
  return stemWaveforms[d.index].select({
    original: d.track && engine.buffers.get(d.track.id),
    stems: d.track && engine.stemBuffers.get(d.track.id),
    enabled:d.stems, stemFX:d.stemFX,
    stemSlip:engine.voices.get(d.index)?.stemSlipTransport ? 'active' : d.stemSlip,
    exitActive:stemState?.track === d.track && (stemState.modes.some(Boolean) || stemState.effects.some(Boolean)),
  });
}
function drawWaves() {
  for (const d of state.decks.slice(0, state.deckCount)) {
    const c = $(`#wave-${d.index}`);
    if (!c) continue;
    const ctx = c.getContext("2d"),
      w = c.width,
      h = c.height;
    ctx.clearRect(0, 0, w, h);
    const view = waveformView(d);
    overviewWaveViews[d.index] = view;
    if (!d.track) continue;
    const scope = $(`[data-wave-scope="${d.index}"]`);
    if (scope) scope.textContent = `${view.label} · ${d.track.bpm || "—"} BPM`;
    c.setAttribute('aria-label', `Deck ${d.index+1}: ${view.label}`);
    c.title = view.label;
    const buf = engine.buffers.get(d.track.id);
    if (view.kind === 'stems') {
      paintStemOverview(ctx, view.profile, {width:w,height:h,color:colors[d.index]});
    } else if (view.kind !== 'pending' && buf) {
      paintOriginalOverview(ctx, buf, {width:w,height:h,color:colors[d.index]});
    } else if (view.kind !== 'pending') for (let x=0;x<w;x+=3) {
      const amp=.1+.6*Math.abs(Math.sin(x*.19+d.index)*Math.sin(x*.034));
      ctx.fillStyle=x%15<6?colors[d.index]:"#408498";
      ctx.fillRect(x,h/2-amp*h/2,2,amp*h);
    }
    const grid = createBeatgrid(d.track);
    for (const line of grid?.lines(0,d.track.duration) || []) {
      const x = line.time / d.track.duration * w;
      ctx.fillStyle = line.downbeat ? "#ffffff70" : "#ffffff35";
      ctx.fillRect(x, 0, 1, h);
    }
    for(const marker of d.track.gridWarpMarkers || []) {ctx.fillStyle="#ef795d";ctx.fillRect(marker.time/d.track.duration*w,0,2,h);}
    for (let i = 0; i < d.track.cues.length; i++) {
      const q = d.track.cues[i];
      if (q) {
        ctx.fillStyle = colors[i % 8];
        ctx.fillRect((q.position / d.track.duration) * w, 0, 3, h);
      }
    }
    if (d.loop) {
      ctx.fillStyle = "#ffffff22";
      ctx.fillRect(
        (d.loopIn / d.track.duration) * w,
        0,
        ((d.loopOut - d.loopIn) / d.track.duration) * w,
        h,
      );
    }
  }
}
function drawDetailWave() {
  const canvas = $("#detail-wave");
  if (!canvas) return;
  const c = canvas.getContext("2d"),
    w = canvas.width,
    h = canvas.height,
    n = state.deckCount,
    col = w / n;
  c.clearRect(0, 0, w, h);
  for (const d of state.decks.slice(0, n)) {
    const x0 = d.index * col,
      mid = x0 + col / 2,
      p = engine.position(d),
      t = d.track,
      buf = t && engine.buffers.get(t.id);
    c.fillStyle = "#070a0c";
    c.fillRect(x0, 0, col - 1, h);
    if (!t) continue;
    const grid = createBeatgrid(t);
    const view = waveformView(d);
    if (view.kind === 'stems') {
      paintStemDetail(c, view.profile, {x:x0,width:col,height:h,position:p,color:colors[d.index]});
    } else if (view.kind !== 'pending' && buf) {
      paintOriginalDetail(c,buf,{x:x0,width:col,height:h,position:p,color:colors[d.index]});
    }
    for (const line of grid?.lines(p-2,p+2) || []) {
      const y=((line.time-p)/4+.5)*h;
      c.fillStyle=line.downbeat?"#ffffff70":"#ffffff20";c.fillRect(x0,y,col,1);
      if(line.downbeat){c.fillStyle="#aeb5ba";c.font="9px Arial";c.fillText(String(line.bar),x0+3,y-3);}
    }
    for(const marker of t.gridWarpMarkers || []) {const y=((marker.time-p)/4+.5)*h;if(y>=0&&y<h){c.fillStyle="#ef795d";c.fillRect(x0,y,col,2);}}
    for (const [i, q] of t.cues.entries()) {
      if (!q) continue;
      const y = ((q.position - p) / 4 + 0.5) * h;
      if (y >= 0 && y < h) {
        c.fillStyle = colors[i % 8];
        c.fillRect(x0, y, col, 2);
        c.fillText(String(i + 1), x0 + col - 12, y - 3);
      }
    }
  }
  c.fillStyle = "#fff";
  c.fillRect(0, h / 2, w, 1);
}
function renderMixer() {
  $("#mixer").innerHTML =
    state.decks
      .slice(0, state.deckCount)
      .map(
        (d) =>
          `<div class="channel-strip" style="--accent:${colors[d.index]}"><strong>${d.index + 1}</strong>${["trim", "high", "mid", "low", "filter"].map((k) => `<label class="knob-group">${k === "trim" ? "GAIN" : k.toUpperCase()}<input aria-label="Deck ${d.index + 1} ${k}" type="range" data-mix="${d.index}:${k}" min="${k === "trim" ? 0 : k === "filter" ? -1 : -24}" max="${k === "trim" ? 2 : k === "filter" ? 1 : 6}" step="${["trim", "filter"].includes(k) ? ".01" : ".5"}" value="${d[k] ?? (k === "trim" ? 1 : 0)}"></label>`).join("")}<label class="fader-group">LEVEL<input type="range" min="0" max="1" step=".01" value="${d.level ?? 0.8}" data-mix="${d.index}:level" aria-label="Deck ${d.index + 1} level"></label><button data-action="pfl" data-deck="${d.index}" class="${d.pfl ? "active" : ""}" title="Select deck for headphone cue">CUE ◇</button></div>`,
      )
      .join("") +
    `<label class="crossfader">A — CROSSFADER — B<input id="crossfader" type="range" min="-1" max="1" step=".01" value="${engine.cross}" aria-label="Crossfader"></label>`;
}
async function ensurePreparedStems(track) {
  if (engine.stemBuffers.has(track.id)) return;
  try {
    await stemPreparation.prepare(track, () => {
      renderDecks();
      renderTracks();
    }, stemPreparation.active.get(track.id)?.backend || "scnet");
  } finally {
    renderDecks();
    renderTracks();
  }
}
const deckLoadRequests = new WeakMap();
const faderStarts=new Map();
async function faderStart(d,value,previous,deviceId=''){
  if(!d.track)return;
  if(value===0){
    const active=faderStarts.get(d.index);
    if(active)active.wanted=false;
    if(!d.playing&&!d.processing&&!active){d.cue=engine.position(d);renderDecks();return;}
    engine.pause(d);await engine.seek(d,d.cue);renderDecks();return;
  }
  if(previous>0)return;
  const owner={track:d.track,deviceId,wanted:true,token:null};faderStarts.set(d.index,owner);
  const seeking=engine.seek(d,d.cue);owner.token=engine.startTokens.get(d.index);await seeking;
  if(faderStarts.get(d.index)!==owner||!owner.wanted||d.track!==owner.track||engine.startTokens.get(d.index)!==owner.token||d.playing||d.processing)return;
  const starting=engine.start(d);owner.token=engine.startTokens.get(d.index);await starting;renderDecks();
}
function resetFaderStartInput(deviceId){
  for(const [index,owner]of faderStarts)if(deviceId===undefined||owner.deviceId===deviceId){
    faderStarts.delete(index);owner.wanted=false;const d=state.decks[index];
    if(d.track===owner.track&&d.processing&&engine.startTokens.get(index)===owner.token)engine.pause(d);
  }
}

async function stemPad(d, pad) {
  if (!Number.isInteger(pad) || pad < 0 || pad > 7) throw new RangeError("Unknown Stem pad.");
  if (!d.track) return notify("Load a track first.");
  const requestedTrack=d.track, loadRequest=deckLoadRequests.get(d);
  if (!engine.stemBuffers.has(requestedTrack.id)) {
    notify("Preparing Stems locally; the requested control will apply when ready.");
    await ensurePreparedStems(requestedTrack);
    if (d.track !== requestedTrack || deckLoadRequests.get(d) !== loadRequest) return;
  }
  if (pad < 4) d.stems[pad] = !d.stems[pad];
  else d.stemFX[pad-4] = !d.stemFX[pad-4];
  engine.updateStems(d);
  renderDecks();
}

async function load(index, id = state.selected, options = {}) {
  const d = state.decks[index],
    t = trackById(id);
  if (!t) return notify("Select a track first.");
  if(!options.skipDouble && state.settings["Instant Doubles"]){
    const paired=state.decks[index^1],source=paired?.track===t?paired:state.decks.find(other=>other!==d&&other.track===t);
    if(source)return instantDouble(index,source);
  }
  if (d.playing && state.settings["Lock Playing Deck"])
    return notify("Playing deck locked. Pause it before replacement.");
  const syncBefore = {engaged:!!d.sync, role:d.syncRole, bpm:(d.track?.bpm || 0)*d.rate};
  const request = (deckLoadRequests.get(d) || 0) + 1;
  deckLoadRequests.set(d, request);
  faderStarts.delete(d.index);
  const old = d.track ? { id: d.track.id, position: engine.position(d) } : null;
  deckScratchControls.cancelDeck(d);
  pitchPlay.cancelDeck(d);
  loopPads.cancelDeck(d);
  manualLoops.cancelDeck(d);
  stemSlipControls.cancelDeck(d);
  engine.pause(d);
  engine.clearDeckScratchCache(d.index);
  if (["vocal","instrumental"].includes(d.stemSlip)) await engine.setStemSlip(d,"off");
  if (state.decks[index] !== d || deckLoadRequests.get(d) !== request) return;
  if (d.playing && state.settings["Lock Playing Deck"])
    return notify("Playing deck locked. Pause it before replacement.");
  d.previous = old;
  d.track = t;
  d.videoLoadGeneration = (d.videoLoadGeneration || 0) + 1;
  if (state.flip.deck === index) flipAutomation.stop();
  d.slicerLoop = false;
  d.slip = false;
  d.slipOrigin = null;
  d.stemSlip = "off";
  d.stemSlipPhase = "idle";
  d.reverse = false;
  d.cue = 0;
  d.position =
    options.position ??
    (state.settings["Play from First Cue Point"]
      ? t.cues.find(Boolean)?.position || 0
      : 0);
  d.loop = false;
  d.tab = "Cues";
  d.pitchRangeMode = "Middle";
  d.pitchCue = 0;
  d.keyShift = 0;
  d.keySync = false;
  d.keySyncTag = null;
  d.stems = [true, true, true, true];
  d.stemFX = [false, false, false, false];
  if (!state.settings["Maintain Sync on Track Load"]) d.sync = false;
  smartSync.loaded(d,syncBefore);
  if (state.settings["Turn off FX"])
    state.fx[index % 2].forEach((f) => (f.on = false));
  engine.configureFX(
    state.fx,
    state.fxRoutes || [],
    state.decks.map((deck) => (deck.track?.bpm || 120) * deck.rate),
    state.fxTempo,
  );
  state.focus = index;
  renderDecks();
  let decoded=false;
  try {
    await engine.buffer(t);
    decoded=true;
    if (d.track === t && deckLoadRequests.get(d) === request)
      void engine.preloadDeckScratch(d).catch(error => {if (error.name !== 'AbortError' && d.track === t) notify(error.message);});
    if (!t.analyzed && !t.provider && !t.missing) void enqueueAnalysis([t]);
    if (state.settings["Analyze Stems"] && !t.provider && !t.missing)
      void ensurePreparedStems(t).catch(error => notify(error.message));
    drawWaves();
  } catch (e) {
    notify(e.message);
  }
  renderTracks();
  return decoded && d.track===t && deckLoadRequests.get(d)===request;
}
const deckKeyShiftRequests = new WeakMap();
function keyShiftIntent(index) {
  const d=state.decks[index],request=deckKeyShiftRequests.get(d);
  return request && request.track===d.track?request.semitones:d.keyShift||0;
}
async function setDeckKeyShift(index, semitones) {
  if (!Number.isInteger(semitones) || Math.abs(semitones) > 24)
    throw new RangeError("The browser pitch renderer supports±24 semitones.");
  const d = state.decks[index];
  if (!d) throw new RangeError("Unknown deck.");
  deckScratchControls.cancelDeck(d);
  pitchPlay.cancelDeck(d);
  loopPads.cancelDeck(d);
  manualLoops.cancelDeck(d);
  d.keySync = false;
  const request={track:d.track,semitones};
  deckKeyShiftRequests.set(d,request);
  try {
    await engine.setPitch(d, { keylock: true, semitones });
    if (deckKeyShiftRequests.get(d)===request && d.track===request.track) {
      persist();renderDecks();
    }
  } finally {
    if (deckKeyShiftRequests.get(d)===request) deckKeyShiftRequests.delete(d);
  }
}
async function play(d) {
  if (pitchPlay.latch(d) || cueHolds.latch(d)) {
    renderDecks();
    return;
  }
  if (d.playing || d.processing) {
    stemSlipControls.cancelDeck(d);
    engine.pause(d);
    smartSync.paused(d);
  }
  else {
    try {
      if (!await smartSync.start(d)) await engine.start(d);
      smartSync.played(d);
      d.track.plays++;
      state.history.push({
        id: d.track.id,
        title: d.track.title,
        time: new Date().toISOString(),
        deck: d.index + 1,
      });
      if (!state.settings["Retain Tracks in Prepare"])
        state.prepare = state.prepare.filter((id) => id !== d.track.id);
    } catch (e) {
      return notify(e.message);
    }
  }
  persist();
  renderDecks();
  renderTracks();
}
function deckQuantize(d){return typeof d.quantize==='boolean'?d.quantize:state.quantize;}
function quantized(d, p) {
  if (!deckQuantize(d) || !d.track?.bpm) return p;
  const value = parseFloat(state.settings["Quantize Value"]) || 1;
  const interval = state.settings["Quantize Value"].includes("/")
    ? 1 / Number(state.settings["Quantize Value"].split("/")[1].split(" ")[0])
    : value;
  const beat = (60 / d.track.bpm) * interval;
  const grid=createBeatgrid(d.track);
  return grid ? grid.timeAt(Math.round(grid.beatAt(p)/interval)*interval) : Math.round(p/beat)*beat;
}
async function deckAction(action, index, el, event = {}) {
  const d = state.decks[index];
  state.focus = index;
  if (action === "load") return load(index);
  if (action === "previous") {
    if(!d.previous)return notify('No previous track on this deck.');
    const previous={...d.previous};return load(index,previous.id,{position:previous.position});
  }
  if(action==='quantize'){d.quantize=!deckQuantize(d);return renderDecks();}
  if (action === "tab") {
    d.tab = el.dataset.tab;
    return renderDecks();
  }
  if(action==='loopMode'){d.loopPadMode=el.dataset.mode;renderDecks();document.querySelector(`[data-action="loopMode"][data-deck="${index}"][data-mode="${d.loopPadMode}"]`)?.focus();return;}
  if(action==='loopRangeDown'||action==='loopRangeUp'){loopPads.range(d,action==='loopRangeDown'?-1:1);document.querySelector(`[data-action="${action}"][data-deck="${index}"]`)?.focus();return;}
  if(action==='roll')return; // Momentary pointer/keyboard lifecycle owns this button.
  if (action === "eject") {
    const request = (deckLoadRequests.get(d) || 0) + 1;
    deckLoadRequests.set(d, request);
    faderStarts.delete(d.index);
    deckScratchControls.cancelDeck(d);
    pitchPlay.cancelDeck(d);
  loopPads.cancelDeck(d);
  manualLoops.cancelDeck(d);
    stemSlipControls.cancelDeck(d);
    d.keySync = false;
    engine.pause(d);
    engine.clearDeckScratchCache(d.index);
    if (["vocal","instrumental"].includes(d.stemSlip)) await engine.setStemSlip(d,"off");
    if (state.decks[index] !== d || deckLoadRequests.get(d) !== request) return;
    d.previous = d.track ? { id: d.track.id, position: d.position } : null;
    d.track = null;
    smartSync.reconcile();
    d.position = 0;
    return renderDecks();
  }
  if (action === "double") return instantDouble(index);
  if (!d.track) return notify("Load a track first.");
  const pos = engine.position(d),
    beat = 60 / (d.track.bpm || 120);
  if (action === "play") return play(d);
  if(action==='stutter'){
    const track=d.track,wasPlaying=d.playing;
    const seeking=engine.seek(d,d.cue),token=engine.startTokens.get(index);await seeking;
    if(!wasPlaying&&d.track===track&&!d.playing&&!d.processing&&engine.startTokens.get(index)===token)await play(d);
    return renderDecks();
  }
  if (action === "stemPrepare") {
    state.selected = d.track.id;
    panels.open("stems");
    return;
  }
  if (action === "slicerLoop") return slicer.domainLoop(d, !d.slicerLoop);
  if (action === "pad") {
    const n = Number(el.dataset.pad);
    if (d.tab === "Cues") {
      if (event.shiftKey) d.track.cues[n] = null;
      else if (d.track.cues[n]) {
        await engine.seek(d, d.track.cues[n].position);
        flipAutomation.record(d, {
          kind: "cue",
          cue: n,
          position: d.track.cues[n].position,
        });
      } else
        d.track.cues[n] = {
          position: quantized(d, pos),
          name: `Cue ${n + 1}`,
          color: colors[n],
        };
      persist();
    } else if (d.tab === "Loops") {
      const mode=d.loopPadMode||'saved';
      if(mode==='auto'||(mode==='roll'&&loopPads.describe(d)[n].jump))return loopPads.press(d,mode,n).pending;
      if(mode==='roll')return; // Hold handlers own momentary pads.
      d.loopSlot=n;
      const l = d.track.savedLoops[n];
      if (l) {
        await engine.setLoop(d, true, l.start, l.end);
        await engine.seek(d, l.start);
      } else {
        d.track.savedLoops[n] = {
          start: pos,
          end: Math.min(d.track.duration, pos + beat * d.loopLength),
          name: `Loop ${n + 1}`,
        };
        persist();
      }
    } else if (d.tab === "Stems") {
      return stemPad(d, n);
    } else if (d.tab === "Pitch") {
      // Pointer and keyboard hold handlers own Pitch Play; click cannot retrigger.
      return;
    } else {
      d.slice = n;
      notify(
        `Slice ${n + 1} selected · domain simulation; audio is unchanged.`,
      );
    }
    renderDecks();
    return;
  }
  if (action === "cue") {
    if (d.playing) {
      engine.pause(d);
      await engine.seek(d, d.cue);
    } else d.cue = quantized(d, pos);
  }
  if (action === "loop") {
    const start = quantized(d, pos),
      end = Math.min(d.track.duration, start + beat * d.loopLength);
    const ending = d.loop;
    if (!ending) engine.beginSlip(d, "loop");
    await engine.setLoop(
      d,
      !d.loop,
      d.loop ? d.loopIn : start,
      d.loop ? d.loopOut : end,
    );
    if (ending) await engine.endSlip(d, "loop");
  }
  if (action === "loopHalf" || action === "loopDouble") {
    d.loopLength = clamp(
      d.loopLength * (action === "loopHalf" ? 0.5 : 2),
      1 / 32,
      128,
    );
    if (d.loop)
      await engine.setLoop(
        d,
        true,
        d.loopIn,
        Math.min(d.track.duration, d.loopIn + beat * d.loopLength),
      );
  }
  if (action === "loopIn") return manualLoops.command(d,"in");
  if (action === "loopOut") return manualLoops.command(d,"out");
  if (action === "loopSave") return manualLoops.command(d,"save");
  if (action === "jumpBack" || action === "jumpForward") {
    const grid=createBeatgrid(d.track), beats=d.loopLength*(action==="jumpBack"?-1:1);
    await engine.seek(d,grid?grid.timeAt(grid.beatAt(pos)+beats):pos+beat*beats);
  }
  if (action === "syncOff" || (action === "sync" && event.shiftKey)) {
    if (state.settings["Sync Mode"] === "Smart Sync") smartSync.disengage(d);
    else {d.sync = false; d.syncRole = null;}
  } else if (action === "sync") {
    if (state.settings["Sync Mode"] === "Off") return;
    if (state.settings["Sync Mode"] === "Smart Sync") {
      await smartSync.press(d);
    } else {
      const paired = state.decks[index ^ 1];
      const other = paired?.track ? paired : state.decks.find(o => o !== d && o.track);
      if (!other) return notify("Load a track on the opposite deck first.");
      const result = await synchronizeSimple({engine, deck: d, leader: other, snapToGrid: !!state.settings["Snap to Beatgrid"]});
      d.sync = true; d.syncRole = "secondary";
      other.sync = true; other.syncRole = "primary";
      notify(result.kind === "tempo" ? `Tempo matched to deck ${other.index + 1}.` : `Tempo and ${result.kind === "grid" ? "beatgrid" : "transients"} matched to deck ${other.index + 1}.`);
    }
  }
  if (action === "reverse") {
    const reverse = !d.reverse;
    if (reverse) engine.beginSlip(d, "reverse");
    await engine.setReverse(d, reverse);
    flipAutomation.record(d, { kind: "reverse", reverse });
    if (!reverse) await engine.endSlip(d, "reverse");
  }
  if (action === "slip") {
    if (["vocal","instrumental"].includes(d.stemSlip)) await engine.setStemSlip(d,"off");
    d.slip = !d.slip;
    if (!d.slip) await engine.endSlip(d);
  }
  if (["keyDown", "keyUp", "keyReset"].includes(action)) {
    const semitones = action === "keyReset" ? 0 : keyShiftIntent(index) + (action === "keyUp" ? 1 : -1);
    if (Math.abs(semitones) > 24) return notify("The browser pitch renderer supports±24 semitones.");
    await setDeckKeyShift(index,semitones);
  }
  if (action === "keySync") {
    if (d.keySync) d.keySync = false;
    else {
      const match = planKeySync(d,state.decks.slice(0,state.deckCount));
      if (!match.ok) return notify(match.reason);
      deckScratchControls.cancelDeck(d);
      pitchPlay.cancelDeck(d);
  loopPads.cancelDeck(d);
  manualLoops.cancelDeck(d);
      await engine.setPitch(d,{keylock:true,semitones:match.semitones});
      d.keySync = true; d.keySyncTag = d.track.key;
      notify(`Key Sync: ${match.key} · ${match.semitones >= 0 ? "+" : ""}${match.semitones} semitones · compatible with deck${match.targets.length > 1 ? "s" : ""} ${match.targets.map(i=>i+1).join(", ")}.`);
    }
  }
  if (action === "keylock") { d.keySync = false; await engine.setPitch(d, { keylock: !d.keylock }); }
  if (action === "repeat") d.repeat = !d.repeat;
  if (action === "pfl") {
    engine.setPFL(d.index,!d.pfl);d.pfl=!d.pfl;
    notify(d.pfl?'Deck selected for cue. Use Devices to route the headphone bus.':'Deck removed from cue.');
  }
  if (action === "range") d.pitchRange = { 8: 16, 16: 50, 50: 8 }[d.pitchRange];
  if (action === "grid") return panels.grid(d);
  renderDecks();
}
let importTail=Promise.resolve();
function importFiles(files){
  const snapshot=Array.from(files),job=importTail.catch(()=>{}).then(()=>importLocalFiles(snapshot));
  importTail=job;return job;
}
async function saveLocalAudio(track,file,bytes){
  try{await localAudio.save(track,file,bytes);track.storage='saved';delete track.storageError;return true;}
  catch(error){track.storage='session';track.storageError=error.message;state.localAudio.saveError=error.message;localAudioWarning();return false;}
}
async function retryLocalAudio(){
  try{await restoreLocalAudio();}catch(error){state.localAudio.restoreError=error.message;localAudioWarning();}
  let savedCount=0;
  for(const track of state.tracks.filter(t=>t.contentHash&&t.storage!=='saved'&&t.file)){
    try{if(await saveLocalAudio(track,track.file,await track.file.arrayBuffer()))savedCount++;}
    catch(error){track.storageError=error.message;state.localAudio.saveError=error.message;localAudioWarning();}
  }
  if(!state.tracks.some(t=>t.storage==='session'))state.localAudio.saveError=null;
  localAudioWarning();
  renderTracks();persist();return savedCount;
}
async function importLocalFiles(files) {
  let n = 0, savedCount=0;
  const imported = [];
  for (const file of files) {
    if (!file.size) continue;
    const track = {
      id: "local-" + crypto.randomUUID(),
      title: file.name.replace(/\.[^.]+$/, ""),
      artist: "Local file",
      album: "Imported",
      bpm: 0,
      key: "—",
      duration: 0,
      type: file.name.split(".").pop().toUpperCase(),
      rating: 0,
      plays: 0,
      color: colors[n % 8],
      file,
      cues: [],
      savedLoops: [],
      comment: "Local audio. Analysis estimates remain editable.",
      grid: null,
      gridMarkers: [],
    };
    try {
      const bytes = await file.arrayBuffer();
      track.contentHash = Array.from(
        new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
        (x) => x.toString(16).padStart(2, "0"),
      ).join("");
      track.id = "local-" + track.contentHash;
      const existing = trackById(track.id);
      if (existing) {
        existing.file = file;
        existing.missing = false;
        state.selected = existing.id;
        await engine.buffer(existing);
        if(await saveLocalAudio(existing,file,bytes))savedCount++;
        imported.push(existing);
        n++;
        continue;
      }
      Object.assign(track, state.localTags[track.contentHash] || {});
      await engine.buffer(track);
      track.analyzed = true;
      if(await saveLocalAudio(track,file,bytes))savedCount++;
      state.tracks.push(track);
      imported.push(track);
      state.selected = track.id;
      n++;
    } catch {
      notify(
        `Cannot decode ${file.name}. Browser format support differs from native Serato.`,
      );
    }
  }
  renderTracks();
  notify(
    `${n} local audio file${n === 1 ? "" : "s"} imported; ${savedCount} saved locally.${n>savedCount?` ${n-savedCount} session-only: open Files to retry saving.`:" Audio will return after restart."}`,
  );
  persist();
  if (state.analysisSettings.onImport) void enqueueAnalysis(imported);
  return imported;
}
const analysisQueue = [];
let analysisController = null;
function analysisFieldHint(t, field) {
  const r = t.analysisResult;
  if (!["bpm", "key"].includes(field)) return "";
  const estimate = field === "bpm" ? r?.tempo : r?.keyEstimate;
  const source =
    t.metadataSources?.[field] ||
    (t.demo ? "generation annotation" : "existing / manual");
  return `${source}${estimate ? ` · measured ${estimate.value ?? "unknown"} · heuristic confidence ${Math.round(100 * estimate.confidence)}%${estimate.reason ? ` · ${estimate.reason}` : ""}` : " · not measured"}`;
}
function updateAnalysisStatus(message) {
  state.analysisStatus = message;
  const node = $("#analysis-status");
  if (node) node.textContent = message;
  $("#analyze").textContent = state.analysis ? "Cancel analysis" : "Analyze";
  $("#analyze").title = message;
  document.dispatchEvent(new CustomEvent("openplay-analysis-update"));
}
function cancelAnalysis() {
  analysisQueue.length = 0;
  analysisController?.abort();
  updateAnalysisStatus(
    "Cancellation requested; completed results are preserved.",
  );
}
async function enqueueAnalysis(tracks, replacements = {}) {
  const settings = { ...state.analysisSettings };
  for (const track of tracks)
    if (!analysisQueue.some((job) => job.track === track))
      analysisQueue.push({
        track,
        settings,
        replaceKey: !!replacements.replaceKey,
        replaceTempo: !!replacements.replaceTempo,
      });
  if (state.analysis || !analysisQueue.length) return;
  state.analysis = true;
  let completed = 0,
    failed = 0,
    cancelled = false;
  while (analysisQueue.length) {
    const {
      track: t,
      settings: opts,
      replaceKey,
      replaceTempo,
    } = analysisQueue.shift();
    const controller = new AbortController();
    analysisController = controller;
    const snapshot = {
      bpm: t.bpm,
      key: t.key,
      grid: t.grid,
      revision: t.metadataRevision || 0,
    };
    try {
      updateAnalysisStatus(
        `Decoding ${t.title} · ${analysisQueue.length} queued`,
      );
      const buffer = await engine.buffer(t);
      if (controller.signal.aborted)
        throw new DOMException("Cancelled", "AbortError");
      const result = await analyzeBuffer(buffer, {
        ...opts,
        analyzeKey: !t.locked && opts.analyzeKey !== false,
        analyzeTempo: !t.locked && opts.analyzeTempo !== false,
        signal: controller.signal,
        onProgress: (value) =>
          updateAnalysisStatus(
            `Analyzing ${t.title} · ${Math.round(value * 100)}% · ${analysisQueue.length} queued`,
          ),
      });
      t.analyzed = true;
      delete t.analysisError;
      t.analysisResult = { ...result, measuredAt: new Date().toISOString() };
      t.metadataSources ??= {};
      // Re-check live values after asynchronous work so edits made during a job win.
      if (
        (t.metadataRevision || 0) === snapshot.revision &&
        !t.locked &&
        t.bpm === snapshot.bpm &&
        t.grid === snapshot.grid &&
        ((!t.bpm && t.metadataSources.bpm !== "manual") || replaceTempo)
      ) {
        if (result.bpm !== null) {
          t.bpm = Math.round(result.bpm * 100) / 100;
          t.grid = result.grid?.firstBeat ?? null;
          t.gridMarkers = [];
          t.gridWarpMarkers = [];
          t.metadataSources.bpm = "measured estimate";
          t.metadataSources.grid = "measured pulse phase; downbeat unverified";
        }
      }
      if (
        (t.metadataRevision || 0) === snapshot.revision &&
        !t.locked &&
        t.key === snapshot.key &&
        (((!t.key || t.key === "—") && t.metadataSources.key !== "manual") ||
          replaceKey) &&
        result.key !== null
      ) {
        t.key = result.key;
        t.metadataSources.key = "measured estimate";
      }
      completed++;
      persist();
      renderTracks();
      renderDecks();
      updateAnalysisStatus(
        `${t.title}: BPM ${result.bpm ? result.bpm.toFixed(2) : "unknown"}, key ${result.key || "unknown"}`,
      );
    } catch (error) {
      if (error.name === "AbortError") {
        cancelled = true;
        // cancelAnalysis cleared the old pending jobs. Anything now queued was
        // requested after cancellation and must be drained by this same runner.
        continue;
      }
      failed++;
      t.analysisError = error.message;
      updateAnalysisStatus(`Analysis failed for ${t.title}: ${error.message}`);
    }
  }
  analysisController = null;
  state.analysis = false;
  updateAnalysisStatus(
    `${cancelled ? "Cancelled" : "Finished"}: ${completed} measured, ${failed} failed. Existing/manual metadata and locked grids preserved unless replacement was requested.`,
  );
  drawWaves();
  notify(state.analysisStatus);
}
function analyze(replacements = {}) {
  if (state.analysis) return cancelAnalysis();
  const scope = $("#analysis-scope").value;
  const list =
    scope === "All tracks"
      ? state.tracks
      : scope === "Current crate"
        ? filtered()
        : [trackById(state.selected)].filter(Boolean);
  return enqueueAnalysis(list, replacements);
}

function download(name, content, type = "application/json") {
  const blob =
      content instanceof Blob ? content : new Blob([content], { type }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
let resetting = false;
function reset() {
  resetting = true;
  engine.silence();
  localStorage.removeItem("openplay-review-v1");
  location.reload();
}
const deckTapTempo=createDeckTapTempo({engine,persist,render:()=>{renderDecks();renderTracks();},notify});
const instantDouble=createInstantDouble({state,engine,load,render:renderDecks,notify});
const jogBend=createJogBend({engine,onError:error=>notify(error.message)});
const api = {
  state,
  engine,
  $,
  $$,
  esc,
  clone,
  colors,
  features,
  requirements,
  fxCatalog,
  providers,
  time,
  notify,
  dialog,
  persist,
  renderCrates,
  renderTracks,
  renderDecks,
  drawWaves,
  load,
  play,
  deckAction,
  instantDouble,
  jogBend,
  faderStart,
  resetFaderStartInput,
  tapTempo:deckTapTempo.tap,
  deckTapTempo,
  selectCrate,
  setDeckKeyShift,
  keyShiftIntent,
  trackById,
  filtered,
  download,
  reset,
  importFiles,
  retryLocalAudio,
  analyze,
  enqueueAnalysis,
  cancelAnalysis,
  stemPreparation,
  ensurePreparedStems,
  stemPad,
  analysisFieldHint,
};
const flipAutomation = createFlipAutomation({
  state,
  engine,
  notify,
  persist,
  renderDecks,
});
api.flipAutomation = flipAutomation;
const cueHolds = createCueHolds({
  engine,
  state,
  quantized,
  record: flipAutomation.record,
  persist,
  render: renderDecks,
  notify,
});
api.cueHolds = cueHolds;
const censorHolds=createCensorHolds({engine,onChange:(d,active)=>{
  document.querySelectorAll(`[data-action="censor"][data-deck="${d.index}"]`).forEach(button=>{button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
},onError:error=>notify(error.message)});
engine.onCensorEnd=censorHolds.forget;
api.censorHolds=censorHolds;
const manualLoops=createManualLoops({state,engine,quantized,persist,render:renderDecks,notify});
api.manualLoops=manualLoops;
function renderLoopDecks(){
 const el=document.activeElement,focus=el?.dataset,restore=focus?.deck!==undefined&&['roll','pad'].includes(focus.action)?{deck:focus.deck,action:focus.action,pad:focus.pad}:null;
 renderDecks();
 if(restore)document.querySelector(`[data-deck="${restore.deck}"][data-action="${restore.action}"]${restore.pad===undefined?'':`[data-pad="${restore.pad}"]`}`)?.focus({preventScroll:true});
}
const loopPads=createLoopPads({state,engine,render:renderLoopDecks,notify});
function loopHoldTarget(el){
 if(!el||el.dataset.deck===undefined)return null;
 const d=state.decks[Number(el.dataset.deck)];
 if(!d?.track)return null;
 if(el.dataset.action==='roll')return{d,pad:0,options:{length:d.loopLength,ignoreBeatJump:true}};
 if(el.dataset.action==='pad'&&d.tab==='Loops'&&d.loopPadMode==='roll'&&!loopPads.describe(d)[Number(el.dataset.pad)].jump)return{d,pad:Number(el.dataset.pad),options:{}};
 return null;
}
const loopOperation=p=>void p.catch(error=>notify(error.message));
api.loopPads=loopPads;
const slicer = createSlicer({ engine, render: renderDecks, notify });
const pitchPlay = createPitchPlay({engine,render:renderDecks,persist,notify,quantized});
api.pitchPlay=pitchPlay;
const panels = createPanels(api);
document.addEventListener("click", async (e) => {
  const el = e.target.closest("button,[data-track],[data-focus]");
  if (!el) return;
  try {
    if (el.dataset.panel) {
      panels.open(el.dataset.panel);
      return;
    }
    if (el.dataset.action) {
      const d = state.decks[Number(el.dataset.deck)];
      if (
        el.dataset.action === "censor" ||
        el.dataset.action === "cue" ||
        (el.dataset.action === "pad" && ["Cues", "Slicer", "Pitch"].includes(d.tab))
      )
        return;
      await deckAction(el.dataset.action, Number(el.dataset.deck), el, e);
      return;
    }
    if (el.dataset.crate) {selectCrate(el.dataset.crate);return;}
    if (el.dataset.provider) {
      panels.provider(el.dataset.provider);
      return;
    }
    if (el.dataset.sort) {
      state.sortDir = state.sort === el.dataset.sort ? -state.sortDir : 1;
      state.sort = el.dataset.sort;
      renderTracks();
      return;
    }
    if (el.dataset.track) {
      state.selected = el.dataset.track;
      $$("[data-track]").forEach((r) => {
        const selected = r.dataset.track === state.selected;
        r.classList.toggle("selected", selected);
        r.setAttribute("aria-selected", String(selected));
      });
      return;
    }
    if (el.dataset.focus) {
      state.focus = Number(el.dataset.focus);
      $$(".deck").forEach((d) =>
        d.classList.toggle("focused", Number(d.dataset.focus) === state.focus),
      );
    }
  } catch (err) {
    notify(err.message);
  }
});
$("#tracks").addEventListener("dblclick", (e) => {
  const r = e.target.closest("[data-track]");
  if (r) load(state.focus, r.dataset.track);
});
document.addEventListener("contextmenu", (e) => {
  const r = e.target.closest("[data-track]"),
    c = e.target.closest("[data-crate]"),
    p = e.target.closest("[data-action=pad]");
  if (r || c || p) e.preventDefault();
  if (r) panels.trackDetails(trackById(r.dataset.track));
  else if (c) panels.crateDetails(c.dataset.crate);
  else if (p) {
    const deck = state.decks[Number(p.dataset.deck)];
    if (deck.tab === "Pitch") notify("Pitch Play selects cues with Shift-pad. Edit or delete cues in Cues mode.");
    else panels.editPad(deck, Number(p.dataset.pad));
  }
});
document.addEventListener("input", (e) => {
  if (e.target.dataset.tempo !== undefined) {
    const d = state.decks[Number(e.target.dataset.tempo)];
    engine
      .setRate(d, 1 + Number(e.target.value) / 100)
      .catch((error) => notify(error.message));
    $(`#platter-${d.index} small`).textContent = `BPM · ${((d.rate - 1) * 100).toFixed(1)}%`;
    $(`#platter-${d.index} strong`).textContent = shownDeckBPM(d);
  }
  if (e.target.dataset.mix) {
    const [i, k] = e.target.dataset.mix.split(":");
    state.decks[i][k] = Number(e.target.value);
    engine.mix(Number(i), k, e.target.value);
  }
  if (e.target.id === "crossfader") engine.setCross(Number(e.target.value));
});
document.addEventListener("change", (e) => {
  if (e.target.dataset.pitchRange !== undefined) {
    const d = state.decks[Number(e.target.dataset.pitchRange)];
    if (pitchRanges[e.target.value]) d.pitchRangeMode = e.target.value;
    renderDecks();
  }
  if (e.target.dataset.sliceDomain !== undefined) {
    const d = state.decks[Number(e.target.dataset.sliceDomain)];
    d.slicerDomain = Number(e.target.value);
    if (d.slicerLoop) slicer.domainLoop(d, true);
  }
  if (e.target.dataset.sliceQuant !== undefined)
    state.decks[Number(e.target.dataset.sliceQuant)].sliceQuant = Number(
      e.target.value,
    );
  if (e.target.dataset.mode !== undefined) {
    const d = state.decks[Number(e.target.dataset.mode)];
    d.mode = e.target.value;
    notify(
      "Device modes are simulated. Browser audio remains in internal playback.",
    );
    renderDecks();
  }
});
document.addEventListener("click", (e) => {
  const r = e.target.closest("[data-seek]");
  if (!r) return;
  const d = state.decks[Number(r.dataset.seek)];
  if (!d.track) return;
  if (
    d.playing &&
    state.settings["Disable Needle Search During Playback"] &&
    !e.shiftKey
  )
    return notify("Needle search protected; hold Shift to override.");
  engine.seek(
    d,
    ((e.clientX - r.getBoundingClientRect().left) / r.clientWidth) *
      d.track.duration,
  );
});
document.addEventListener('pointerdown', e=>{
  const button=e.target.closest('[data-action="censor"]');if(!button||button.disabled||e.button!==0)return;
  e.preventDefault();void censorHolds.press(`pointer:${e.pointerId}`,state.decks[Number(button.dataset.deck)]);
});
document.addEventListener('pointerup',e=>void censorHolds.release(`pointer:${e.pointerId}`));
document.addEventListener('pointercancel',e=>void censorHolds.release(`pointer:${e.pointerId}`));
window.addEventListener('blur',()=>void censorHolds.releaseAll());
document.addEventListener('visibilitychange',()=>{if(document.hidden)void censorHolds.releaseAll();});
document.addEventListener("pointerdown", (e) => {
  const el = e.target.closest('[data-action="cue"],[data-action="pad"]');
  if (!el || e.button !== 0) return;
  const d = state.decks[Number(el.dataset.deck)];
  if (el.dataset.action === "pad" && d.tab === "Pitch") {
    e.preventDefault();
    void pitchPlay.press("pointer:" + e.pointerId,d,Number(el.dataset.pad),e.shiftKey);
    return;
  }
  if (el.dataset.action === "pad" && d.tab === "Slicer") {
    e.preventDefault();
    void slicer.press("pointer:" + e.pointerId, d, Number(el.dataset.pad));
    return;
  }
  if (el.dataset.action === "pad" && d.tab !== "Cues") return;
  e.preventDefault();
  void cueHolds.press(
    "pointer:" + e.pointerId,
    d,
    el.dataset.action === "pad" ? Number(el.dataset.pad) : null,
    e.shiftKey,
  );
});
document.addEventListener(
  "pointerup",
  (e) => void cueHolds.release("pointer:" + e.pointerId),
);
document.addEventListener(
  "pointercancel",
  (e) => void cueHolds.release("pointer:" + e.pointerId, {immediate:true}),
);
window.addEventListener("blur", () => cueHolds.releaseAll({immediate:true}));
window.addEventListener("blur", slicer.releaseAll);
window.addEventListener("blur", pitchPlay.releaseAll);
document.addEventListener("pointerup", e => void pitchPlay.release("pointer:" + e.pointerId));
document.addEventListener("pointercancel", e => void pitchPlay.release("pointer:" + e.pointerId));
document.addEventListener(
  "pointerup",
  (e) => void slicer.release("pointer:" + e.pointerId),
);
document.addEventListener(
  "pointercancel",
  (e) => void slicer.release("pointer:" + e.pointerId),
);
document.addEventListener("pointerdown",e=>{
 const el=e.target.closest('[data-action="roll"],[data-action="pad"]'),target=loopHoldTarget(el);
 if(e.button!==0||!target)return;
 e.preventDefault();el.focus();
 try{loopOperation(loopPads.hold('pointer:'+e.pointerId,target.d,target.pad,target.options));}catch(error){notify(error.message);}
});
document.addEventListener('pointerup',e=>loopOperation(loopPads.release('pointer:'+e.pointerId)));
document.addEventListener('pointercancel',e=>loopOperation(loopPads.release('pointer:'+e.pointerId)));
window.addEventListener('blur',()=>loopOperation(loopPads.releaseAll()));
document.addEventListener("dragstart", (e) => {
  const t = e.target.closest("[data-track]");
  if (t) {
    e.dataTransfer.setData("text/plain", t.dataset.track);
    e.dataTransfer.effectAllowed = "copyMove";
  }
  const c = e.target.closest("[data-crate]");
  if (c) {
    e.dataTransfer.setData("application/x-openplay-crate", c.dataset.crate);
    e.dataTransfer.effectAllowed = "move";
  }
});
function allowLibraryDrop(e) {
  if (
    e.target.closest(
      "[data-drop-deck],[data-crate],#tracks,[data-sample-drop],[data-scratch-drop]",
    )
  ) {
    e.preventDefault();
    e.dataTransfer.dropEffect = [...e.dataTransfer.types].includes("application/x-openplay-crate") ? "move" : "copy";
  }
}
// Accept as soon as a pointer enters, including a fast release before the next
// throttled dragover event.
document.addEventListener("dragenter", allowLibraryDrop);
document.addEventListener("dragover", allowLibraryDrop);
document.addEventListener("drop", (e) => {
  const deck = e.target.closest("[data-drop-deck]"),
    crate = e.target.closest("[data-crate]");
  if (deck || crate || e.target.closest("#tracks")) {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
      importFiles(e.dataTransfer.files);
      return;
    }
    const moved = e.dataTransfer.getData("application/x-openplay-crate");
    if (moved && crate) {
      const c = state.crates.find((x) => x.id === moved);
      if (c && !descendantIds(state.crates, c.id).has(crate.dataset.crate)) {
        c.parent = crate.dataset.crate;
        persist();
        renderCrates();
        renderTracks();
      } else notify("A crate cannot be its own descendant.");
      return;
    }
    const id = e.dataTransfer.getData("text/plain");
    if (deck) load(Number(deck.dataset.dropDeck), id);
    if (crate) {
      if (crate.dataset.crate === "stems" && trackById(id)) {
        void ensurePreparedStems(trackById(id)).catch(error => notify(error.message));
        renderTracks();
        return;
      }
      const c = state.crates.find((c) => c.id === crate.dataset.crate);
      if (c && !c.smart && trackById(id)) {
        if (!c.tracks.includes(id)) c.tracks.push(id);
        persist();
        renderTracks();
        notify(`Added to ${c.name}`);
      }
    }
  }
});
$("#search").oninput = (e) => {
  state.search = e.target.value;
  renderTracks();
};
$("#crate-search").oninput = renderCrates;
$("#layout").onchange = (e) => {
  state.layout = e.target.value;
  renderDecks();
};
$("#deck-count").onchange = (e) => {
  state.deckCount = Number(e.target.value);
  state.focus = Math.min(state.focus, state.deckCount - 1);
  if (state.deckCount === 2)
    state.decks.slice(2).forEach((d) => {engine.pause(d);engine.clearDeckScratchCache(d.index);});
  renderDecks();
};
$("#day").onclick = () => document.body.classList.toggle("day");
$("#quantize").onclick = (e) => {
  state.quantize=!state.decks.slice(0,state.deckCount).every(deckQuantize);
  for(const d of state.decks)d.quantize=state.quantize;
  renderDecks();
};
$("#autoplay").onclick = (e) => {
  state.autoplay = !state.autoplay;
  e.currentTarget.setAttribute("aria-pressed", state.autoplay);
};
$("#art-grid").onclick = (e) => {
  state.grid = !state.grid;
  e.currentTarget.setAttribute("aria-pressed", state.grid);
  renderTracks();
};
$("#new-crate").onclick = () => panels.newCrate(false);
$("#new-smart").onclick = () => panels.newCrate(true);
$("#import").onclick = () => $("#audio-files").click();
$("#audio-files").onchange = (e) => importFiles(e.target.files);
$("#analyze").onclick = () => analyze();
$("#columns").onclick = () => panels.columns();
$("#library-tools").onclick = () => panels.libraryTools();
document.addEventListener("keydown", async (e) => {
  const tag = e.target.tagName;
  if([' ','Enter'].includes(e.key)&&e.target.dataset.action==='censor'){
    e.preventDefault();if(!e.repeat)void censorHolds.press(`button:${e.code||e.key}`,state.decks[Number(e.target.dataset.deck)]);return;
  }
  const loopTarget=[' ','Enter'].includes(e.key)?loopHoldTarget(e.target):null;
  if(loopTarget){e.preventDefault();if(!e.repeat){try{loopOperation(loopPads.hold('button:'+e.key,loopTarget.d,loopTarget.pad,loopTarget.options));}catch(error){notify(error.message);}}return;}
  if([' ','Enter'].includes(e.key)&&e.target.dataset.deck!==undefined&&(['loopMode','loopRangeDown','loopRangeUp'].includes(e.target.dataset.action)||(e.target.dataset.action==='pad'&&state.decks[Number(e.target.dataset.deck)].tab==='Loops'))){
    e.preventDefault();if(!e.repeat){try{await deckAction(e.target.dataset.action,Number(e.target.dataset.deck),e.target,e);}catch(error){notify(error.message);}}return;
  }
  if ([" ", "Enter"].includes(e.key) && e.target.dataset.action === "pad" && state.decks[Number(e.target.dataset.deck)].tab === "Pitch") {
    e.preventDefault();
    if (!e.repeat) void pitchPlay.press("button:" + e.key,state.decks[Number(e.target.dataset.deck)],Number(e.target.dataset.pad),e.shiftKey);
    return;
  }
  if (
    [" ", "Enter"].includes(e.key) &&
    e.target.dataset.action === "pad" &&
    state.decks[Number(e.target.dataset.deck)].tab === "Slicer"
  ) {
    e.preventDefault();
    if (!e.repeat)
      void slicer.press(
        "button:" + e.key,
        state.decks[Number(e.target.dataset.deck)],
        Number(e.target.dataset.pad),
      );
    return;
  }
  if (
    [" ", "Enter"].includes(e.key) &&
    e.target.dataset.deck !== undefined &&
    (e.target.dataset.action === "cue" ||
      (e.target.dataset.action === "pad" &&
        state.decks[Number(e.target.dataset.deck)].tab === "Cues"))
  ) {
    e.preventDefault();
    if (!e.repeat)
      void cueHolds.press(
        "button:" + e.key,
        state.decks[Number(e.target.dataset.deck)],
        e.target.dataset.action === "pad" ? Number(e.target.dataset.pad) : null,
        e.shiftKey,
      );
    return;
  }
  if (["INPUT", "TEXTAREA", "SELECT"].includes(tag) || $("#modal").open) return;
  if (e.key === "\\") {
    e.preventDefault();
    flipAutomation.arm();
    if (state.panel === "flip") panels.refresh();
    return;
  }
  const k = e.key.toLowerCase(),
    mod = e.metaKey || e.ctrlKey;
  if (mod && k === "f") {
    e.preventDefault();
    $("#search").focus();
    return;
  }
  if (mod && k === "p") {
    e.preventDefault();
    if (!state.prepare.includes(state.selected))
      state.prepare.push(state.selected);
    notify("Added to Prepare.");
    return;
  }
  if (mod && k === "z") {
    e.preventDefault();
    const d = state.decks[state.focus];
    if (d.previous)
      load(d.index, d.previous.id, { position: d.previous.position });
    return;
  }
  if (e.shiftKey && ["ArrowLeft", "ArrowRight"].includes(e.key)) {
    e.preventDefault();
    return load(e.key === "ArrowLeft" ? 0 : 1);
  }
  if (["ArrowUp", "ArrowDown"].includes(e.key)) {
    e.preventDefault();
    const a = filtered(),
      i = a.findIndex((t) => t.id === state.selected),
      j = clamp(i + (e.key === "ArrowUp" ? -1 : 1), 0, a.length - 1);
    if (a[j]) {
      state.selected = a[j].id;
      renderTracks();
      $(`[data-track="${state.selected}"]`)?.scrollIntoView({
        block: "nearest",
      });
    }
    return;
  }
  if (
    e.target.dataset.seek !== undefined &&
    ["ArrowLeft", "ArrowRight"].includes(e.key)
  ) {
    e.preventDefault();
    const d = state.decks[Number(e.target.dataset.seek)];
    engine.seek(d, engine.position(d) + (e.key === "ArrowLeft" ? -1 : 1));
    return;
  }
  if (
    state.settings["Playback Keys Use Shift"] &&
    !e.shiftKey &&
    !e.getModifierState("CapsLock")
  )
    return;
  if (!mod&&!e.altKey&&["w","s","q","a","f5","f10"].includes(k)) {
    e.preventDefault();
    if(e.repeat)return;
    const index=["w","q","f5"].includes(k)?0:1;
    try{await deckAction(k==='w'||k==='s'?'play':k==='q'||k==='a'?'reverse':'keylock',index,{},e);}
    catch(error){notify(error.message);}
    return;
  }
  if(!mod&&!e.altKey&&['u','j'].includes(k)){
    e.preventDefault();if(!e.repeat)void censorHolds.press(`key:${e.code||k}`,state.decks[k==='u'?0:1]);return;
  }
  if(!mod&&!e.altKey&&['t','y','g','h'].includes(k)){
    e.preventDefault();
    if(!e.repeat)void jogBend.hold(state.decks[k==='t'||k==='y'?0:1],`keyboard:${e.code||k}`,k==='t'||k==='g'?-1:1).catch(error=>notify(error.message));
    return;
  }
  if (/^[0-9]$/.test(k)) {
    const n = (Number(k) + 9) % 10,
      d = state.decks[n < 5 ? 0 : 1];
    d.tab = "Cues";
    e.preventDefault();
    if (!e.repeat) await cueHolds.press("key:" + k, d, n % 5, e.shiftKey);
  }
  if ((k === "i" || k === "k") && !e.repeat) {
    e.preventDefault();
    await cueHolds.press("key:" + k, state.decks[k === "i" ? 0 : 1]);
  }
  if (k === "o" || k === "p")
    await deckAction(k === "o" ? "loopIn" : "loopOut", 0, {}, e);
  const n = "zxcvbnm,".indexOf(k);
  if (n >= 0 && k.length === 1 && !mod) {
    e.preventDefault();
    if (!e.repeat)
      panels.sampleAction(n, e.altKey ? "stop" : "play", "keyboard");
  }
});
document.addEventListener("keyup", (e) => {
  void censorHolds.release(`key:${e.code||e.key.toLowerCase()}`);
  void censorHolds.release(`button:${e.code||e.key}`);
  void jogBend.releaseHold(`keyboard:${e.code||e.key.toLowerCase()}`).catch(error=>notify(error.message));
  loopOperation(loopPads.release("button:"+e.key));
  void pitchPlay.release("button:" + e.key);
  void cueHolds.release("key:" + e.key.toLowerCase());
  void cueHolds.release("button:" + e.key);
  void slicer.release("button:" + e.key);
  const n = "zxcvbnm,".indexOf(e.key.toLowerCase());
  if (e.key.length === 1 && n >= 0) panels.releaseSampleHolds(n, "keyboard");
});
window.addEventListener('blur',()=>void jogBend.releaseHolds().catch(error=>notify(error.message)));
document.addEventListener('visibilitychange',()=>{if(document.hidden)void jogBend.releaseHolds().catch(error=>notify(error.message));});
engine.onSampleEnd = (key) => {
  const slot = state.samples[Math.floor(key / 8)]?.[key % 8];
  if (slot) slot.playing = false;
  if (state.panel === "sampler") panels.refresh();
};
engine.onEnd = async (d) => {
  smartSync.paused(d);
  if (d.repeat) {
    d.position = d.reverse ? d.track.duration : 0;
    if (!await smartSync.start(d)) await engine.start(d);
    smartSync.played(d);
  } else if (state.autoplay) {
    const a = filtered(),
      i = a.findIndex((t) => t.id === d.track.id);
    if (a[i + 1]) {
      await load(d.index, a[i + 1].id);
      await play(d);
    }
  }
  renderDecks();
};
function tick() {
  for (const d of state.decks.slice(0, state.deckCount)) {
    if (d.keySync && d.keySyncTag !== d.track?.key) {
      d.keySync = false;
      document.querySelector(`[data-action="keySync"][data-deck="${d.index}"]`)?.classList.remove("active");
    }
    const playButton = document.querySelector(`[data-action="play"][data-deck="${d.index}"]`);
    if (playButton) {playButton.classList.toggle('active', !!d.playing); const label = d.playing ? '❚❚' : '▶'; if (playButton.textContent !== label) playButton.textContent = label;}
    const syncButton = document.querySelector(`[data-action="sync"][data-deck="${d.index}"]`);
    const beatIndicator = document.querySelector(`[data-beat-position="${d.index}"]`);
    if (beatIndicator) {
      const status = hasBeatgrid(d.track) ? d.syncState || "off" : "No beatgrid";
      const label = beatIndicator.querySelector('[data-smart-status]');
      if (label.textContent !== status) label.textContent = status;
      beatIndicator.dataset.state = status;
      const phase = beatPosition(d.track,engine.position(d)), beat = phase === null ? -1 : Math.floor(phase);
      beatIndicator.setAttribute('aria-label',`Deck ${d.index+1}: ${status}${beat>=0 ? ", beat "+(beat+1)+" of 4" : ""}`);
      beatIndicator.querySelectorAll('[data-beat]').forEach(dot => dot.classList.toggle('lit',Number(dot.dataset.beat)===beat));
      if (syncButton) {syncButton.dataset.syncState=status;syncButton.classList.toggle('active',!!d.sync);syncButton.setAttribute('aria-pressed',String(!!d.sync));}
    }
    const tempoSlider = document.querySelector(`[data-tempo="${d.index}"]`);
    if (tempoSlider && document.activeElement !== tempoSlider) {
      const percent = (d.rate - 1) * 100;
      if (Math.abs(Number(tempoSlider.value) - percent) > .001) tempoSlider.value = String(percent);
    }
    const bpmText = document.querySelector(`#platter-${d.index} strong`);
    const tempoText = document.querySelector(`#platter-${d.index} small`);
    const shownBPM = shownDeckBPM(d);
    if (bpmText && bpmText.textContent !== shownBPM) bpmText.textContent = shownBPM;
    const shownPercent = `BPM · ${((d.rate - 1) * 100).toFixed(1)}%${state.settings["Sync Mode"] === "Smart Sync" && d.syncState === "relative" ? " · REL" : ""}`;
    if (tempoText && tempoText.textContent !== shownPercent) tempoText.textContent = shownPercent;
    const p = engine.position(d),
      t = $(`#time-${d.index}`);
    if (t) t.textContent = time(p);
    const rem = $(`#remain-${d.index}`);
    if (rem) rem.textContent = "−" + time((d.track?.duration || 0) - p);
    const head = $(`#head-${d.index}`);
    if (head) head.style.left = `${(p / (d.track?.duration || 48)) * 100}%`;
    const scratchStatus = document.querySelector(`[data-deck-scratch-status="${d.index}"]`);
    if (scratchStatus && scratchStatus.dataset.warmState !== (d.scratchWarmState || 'empty')) {
      scratchStatus.dataset.warmState = d.scratchWarmState || 'empty';
      if (!engine.deckScratchRequests.has(d.index)) scratchStatus.textContent = d.scratchWarmState === 'preparing' ? 'Preparing scratch…' : d.scratchWarmState === 'error' ? 'Scratch unavailable' : 'Drag platter to scratch';
    }
    const platter = $(`#platter-${d.index}`);
    if (platter && !state.settings["Reduced Motion"])
      platter.style.setProperty("--rotation", `${p * (state.settings["Virtual Deck Speed"] === "33 RPM" ? 198 : 270)}deg`);
  }
  $("#master-meter").value = engine.meter();
  $("#audio-status").textContent =
    `${state.decks.filter((d) => d.playing).length} decks playing · ${engine.ctx?.sampleRate || "—"} Hz audio engine · outputs in Devices`;
  engine.updateFXBPMs(state.decks.map(deck => deckBPM(deck)??120));
  // Selection checks are O(4); only selection/async completion redraws overviews.
  if (state.decks.slice(0,state.deckCount).some(d => waveformView(d) !== overviewWaveViews[d.index])) drawWaves();
  drawDetailWave();
  flipAutomation.tick();
  panels.tick();
  stemSlipControls.tick();
  deckScratchControls.tick();
  requestAnimationFrame(tick);
}
renderCrates();
renderTracks();
renderDecks();
load(0, "demo-0");
load(1, "demo-1");
requestAnimationFrame(tick);
window.addEventListener("beforeunload", () => {
  if (!resetting) persist();
  deckScratchControls.dispose();
  engine.silence();
  stemWaveforms.forEach(model => model.dispose());
  localAudio.close();
});
// Exposed only for reproducible review diagnostics; acceptance tests exercise visible controls.
window.openPlay = {
  state,
  engine,
  version: "prototype-review-1",
  inventory: { features: features.length, requirements: requirements.length },
  exportDiagnostics: () => ({
    version: "prototype-review-1",
    decks: state.decks.map((d) => ({
      track: d.track?.id,
      playing: d.playing,
      position: engine.position(d),
    })),
    audioState: engine.ctx?.state,
    native: false,
  }),
};

engine.onProcessing = (d) => {
  const status = document.querySelector(
    `[data-drop-deck="${d.index}"] .deck-foot small`,
  );
  if (status)
    status.textContent = d.processing ? "PROCESSING PITCH…" : "LOCAL AUDIO";
};

let syncTempoQueue=null;
engine.onRateRequest = async (deck,rate) => {
  if(!['Simple Sync','Smart Sync'].includes(state.settings['Sync Mode'])||!deck.sync)return engine.setRate(deck,rate,{syncInternal:true});
  const request={deck,track:deck.track,rate};
  if(syncTempoQueue){syncTempoQueue.wanted=request;return syncTempoQueue.promise;}
  const queue={wanted:request,promise:null};syncTempoQueue=queue;
  queue.promise=Promise.resolve().then(async()=>{
    while(queue.wanted){
      const next=queue.wanted;queue.wanted=null;
      if(next.deck.track!==next.track||!next.deck.sync)continue;
      const priorTempo=smartSync.captureTempo(),smart=state.settings['Sync Mode']==='Smart Sync';
      try{
        const bpm=smart?smartSync.tempo(next.deck,next.rate):next.track.bpm*next.rate;
        if(!Number.isFinite(bpm)||bpm<=0)throw Error('Set a valid BPM before changing synced tempo.');
        const changes=state.decks.filter(d=>d.sync&&d.track).map(d=>({deck:d,rate:bpm/d.track.bpm}));
        if(changes.some(x=>!Number.isFinite(x.rate)||x.rate<.25||x.rate>4))throw Error('Matched tempo is outside a synced deck transport range.');
        await engine.setSyncedRates(changes);
      }catch(error){if(smart)smartSync.restoreTempo(priorTempo);throw error;}
    }
  }).finally(()=>{if(syncTempoQueue===queue)syncTempoQueue=null;});
  return queue.promise;
};
engine.onManualPosition = d => smartSync.manipulated(d);
engine.onGridTimeline = (d,options) => smartSync.timeline(d,options);
engine.onValidateTransport = (d,changes) => smartSync.validate(d,changes);
engine.onGridWillChange = track => smartSync.captureGrid(track);
engine.onGridChanged = (track,before) => smartSync.edited(track,before);
engine.onError = (error) => notify(error.message);

// Static HTML must not accept changes before its event handlers are installed.
// Otherwise a fast first interaction changes a select without updating app state.
document.querySelectorAll("[data-startup-inert]").forEach(element => {
  element.inert = false;
  element.removeAttribute("data-startup-inert");
});
document.body.dataset.ready = "true";
if(state.localAudio.error)notify(state.localAudio.error);
