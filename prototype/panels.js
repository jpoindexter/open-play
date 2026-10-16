import { createVideoMixer } from "./video.js";
import { createMIDI, mappedValue } from "./midi.js";
import { implementedEffects } from "./effects.js";
import {
  ruleFields,
  ruleOperators,
  smartMatches,
  descendantIds,
} from "./library.js";
import { settingsSchema, helpKeys } from "./fixtures.js";
export function createPanels(a) {
  const {
    state: s,
    engine,
    $,
    $$,
    esc,
    colors,
    notify,
    dialog,
    persist,
    time,
    trackById,
    load,
    renderTracks,
    renderCrates,
    renderDecks,
    download,
  } = a;
  let activeSettings = "DJ Preferences",
    activeProvider = "Spotify",
    videoPhase = 0,
    learn = false;
  const badge = (text = "SIMULATION", real = false) =>
    `<span class="badge ${real ? "real" : ""}">${text}</span>`;
  const head = (name, label, real = false) =>
    `<div class="panel-head"><h2>${name}</h2>${badge(label, real)}<button id="close-panel" aria-label="Close performance panel">×</button></div>`;
  const options = (values, selected) =>
    values
      .map(
        (v) => `<option ${v === selected ? "selected" : ""}>${esc(v)}</option>`,
      )
      .join("");
  function bindPanel() {
    const close = $("#close-panel");
    if (close)
      close.onclick = () => {
        $("#panel").hidden = true;
        s.panel = null;
        $$("[data-panel]").forEach((b) => b.classList.remove("active"));
      };
  }
  function open(name) {
    if (
      [
        "settings",
        "audio",
        "hardware",
        "midi",
        "help",
        "coverage",
        "providers",
        "system",
        "analysis",
        "library",
        "mixer",
        "decks",
        "stems",
      ].includes(name)
    ) {
      if (name === "settings") return settings();
      if (name === "audio") return settings("Audio");
      if (name === "hardware") return hardware();
      if (name === "midi") return midi();
      if (name === "help") return help();
      if (name === "coverage") return coverage();
      if (name === "providers") return provider(activeProvider);
      if (name === "system") return system();
      if (name === "library") return libraryTools();
      if (name === "analysis") return analysis();
      if (name === "mixer") return settings("Mixer");
      if (name === "decks") {
        document
          .querySelector("#performance")
          .scrollIntoView({ block: "start" });
        return;
      }
      if (name === "stems") {
        s.decks[s.focus].tab = "Stems";
        renderDecks();
        return stems();
      }
    }
    if (s.panel === name && !$("#panel").hidden) {
      $("#panel").hidden = true;
      s.panel = null;
      return;
    }
    s.panel = name;
    $("#panel").hidden = false;
    ({
      fx,
      sampler,
      scratch,
      flip,
      video,
      recording,
      link,
      files,
      prepare,
      history,
    })[name]?.();
    bindPanel();
    $$("[data-panel]").forEach((b) =>
      b.classList.toggle("active", b.dataset.panel === name),
    );
  }
  function refresh() {
    if (s.panel)
      ({
        fx,
        sampler,
        scratch,
        flip,
        video,
        recording,
        link,
        files,
        prepare,
        history,
      })[s.panel]?.();
    bindPanel();
  }
  function newCrate(smart) {
    crateEditor(
      {
        name: smart ? "Smart collection" : "New crate",
        smart,
        tracks: [],
        match: "all",
        live: true,
        rules: [{ field: "bpm", operator: "at least", value: "124" }],
      },
      true,
    );
  }
  function crateDetails(id) {
    const c = s.crates.find((c) => c.id === id);
    if (c) crateEditor(c, false);
  }
  function crateEditor(original, creating) {
    const draft = a.clone(original);
    draft.rules ??= [
      {
        field: draft.field || "bpm",
        operator: "at least",
        value: draft.value || "124",
      },
    ];
    const excluded = creating ? new Set() : descendantIds(s.crates, draft.id);
    dialog(
      creating
        ? "New " + (draft.smart ? "smart crate" : "crate")
        : "Crate settings",
      `<form id="crate-form"><div class="form-grid"><label>Name<input name="name" required value="${esc(draft.name)}"></label><label>Parent crate<select name="parent"><option value="">Top level</option>${s.crates
        .filter((c) => !excluded.has(c.id))
        .map(
          (c) =>
            `<option value="${c.id}" ${draft.parent === c.id ? "selected" : ""}>${esc(c.name)}</option>`,
        )
        .join(
          "",
        )}</select></label><label>Color<input name="color" type="color" value="${draft.color || "#f2ad56"}"></label><label><span>Favorite</span><input name="favorite" type="checkbox" ${draft.favorite ? "checked" : ""}></label></div>${draft.smart ? `<div class="panel-controls"><label>Match <select name="match">${options(["all", "any"], draft.match || "all")}</select> rules</label><label><input name="live" type="checkbox" ${draft.live !== false ? "checked" : ""}> Live update</label><button id="add-rule" type="button">Add rule</button></div><div id="smart-rules"></div>` : ""}<p class="muted">Crates reference tracks. Removing a crate never deletes source music. Smart subcrates do not contribute to parent membership.</p><div class="form-actions">${creating ? "" : `<button type="button" id="crate-up">Move up</button><button type="button" id="crate-down">Move down</button>${draft.smart ? '<button type="button" id="crate-refresh">Refresh membership</button>' : ""}<button type="button" id="crate-delete">Remove crate</button>`}<button type="button" id="crate-cancel">Cancel</button><button type="submit">${creating ? "Create crate" : "Save crate"}</button></div></form>`,
      (body) => {
        const drawRules = () => {
          if (!draft.smart) return;
          $("#smart-rules").innerHTML = draft.rules
            .map(
              (r, i) =>
                `<div class="rule-row"><select aria-label="Rule ${i + 1} field" data-rule="${i}" data-key="field">${Object.entries(
                  ruleFields,
                )
                  .map(
                    ([k, v]) =>
                      `<option value="${k}" ${k === r.field ? "selected" : ""}>${v}</option>`,
                  )
                  .join(
                    "",
                  )}</select><select aria-label="Rule ${i + 1} operator" data-rule="${i}" data-key="operator">${options(ruleOperators, r.operator)}</select><input aria-label="Rule ${i + 1} value" data-rule="${i}" data-key="value" value="${esc(r.value)}"><button type="button" data-remove-rule="${i}" aria-label="Remove rule ${i + 1}">×</button></div>`,
            )
            .join("");
          $$("[data-rule]").forEach(
            (el) =>
              (el.oninput = el.onchange =
                () =>
                  (draft.rules[el.dataset.rule][el.dataset.key] = el.value)),
          );
          $$("[data-remove-rule]").forEach(
            (el) =>
              (el.onclick = () => {
                draft.rules.splice(Number(el.dataset.removeRule), 1);
                drawRules();
              }),
          );
        };
        drawRules();
        if (draft.smart)
          $("#add-rule").onclick = () => {
            draft.rules.push({
              field: "artist",
              operator: "contains",
              value: "",
            });
            drawRules();
          };
        const save = () => {
          body
            .querySelectorAll("[data-rule]")
            .forEach(
              (el) => (draft.rules[el.dataset.rule][el.dataset.key] = el.value),
            );
          const f = new FormData(body.querySelector("form"));
          draft.name = String(f.get("name")).trim();
          if (!draft.name) return false;
          draft.parent = f.get("parent");
          draft.color = f.get("color");
          draft.favorite = f.has("favorite");
          if (draft.smart) {
            if (!draft.rules.length) {
              notify("Add at least one rule.");
              return false;
            }
            draft.match = f.get("match");
            draft.live = f.has("live");
            draft.cached = s.tracks
              .filter((t) => smartMatches(draft, t))
              .map((t) => t.id);
          }
          if (creating) {
            draft.id = crypto.randomUUID();
            draft.created = new Date().toISOString();
            s.crates.push(draft);
          } else Object.assign(original, draft);
          s.crate = draft.id;
          persist();
          renderCrates();
          renderTracks();
          return true;
        };
        body.querySelector("form").onsubmit = (e) => {
          e.preventDefault();
          if (save()) $("#modal").close();
        };
        $("#crate-cancel").onclick = () => $("#modal").close();
        if (!creating) {
          $("#crate-delete").onclick = () => {
            for (const c of s.crates)
              if (c.parent === original.id) c.parent = original.parent || "";
            s.crates = s.crates.filter((c) => c.id !== original.id);
            s.crate = "all";
            persist();
            renderCrates();
            renderTracks();
            $("#modal").close();
          };
          for (const [id, offset] of [
            ["up", -1],
            ["down", 1],
          ])
            $("#crate-" + id).onclick = () => {
              const siblings = s.crates.filter(
                  (c) => (c.parent || "") === (original.parent || ""),
                ),
                other = siblings[siblings.indexOf(original) + offset];
              if (other) {
                const x = s.crates.indexOf(original),
                  y = s.crates.indexOf(other);
                [s.crates[x], s.crates[y]] = [s.crates[y], s.crates[x]];
                persist();
                renderCrates();
              }
            };
          if (draft.smart)
            $("#crate-refresh").onclick = () => {
              if (save()) {
                notify("Smart crate membership refreshed.");
                $("#modal").close();
              }
            };
        }
      },
    );
  }
  function trackDetails(t) {
    if (!t) return;
    dialog(
      "Track details",
      `<form id="track-form"><div class="form-grid">${[
        ["title", "Title"],
        ["artist", "Artist"],
        ["album", "Album"],
        ["bpm", "BPM"],
        ["key", "Key"],
        ["comment", "Comment"],
      ]
        .map(
          ([k, l]) =>
            `<label>${l}<input name="${k}" value="${esc(t[k])}" ${k === "bpm" ? 'type="number" min="1" max="999" step=".01"' : ""}></label>`,
        )
        .join(
          "",
        )}<label>Rating<select name="rating">${[0, 1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${t.rating === n ? "selected" : ""}>${n ? "★".repeat(n) : "Unrated"}</option>`).join("")}</select></label><label>Color<input type="color" name="color" value="${t.color}"></label><label><span>Protect beatgrid</span><input type="checkbox" name="locked" ${t.locked ? "checked" : ""}></label></div><p class="muted">Edits apply to prototype state. Original audio tags are never rewritten. Demo annotations are not measured key/BPM analysis.</p><div class="form-actions"><button type="button" id="mark-missing">${t.missing ? "Clear missing simulation" : "Simulate missing file"}</button><button type="button" id="add-prepare">Add to Prepare</button><button type="submit">Save details</button></div></form>`,
      (body) => {
        body.querySelector("form").onsubmit = (e) => {
          e.preventDefault();
          const f = new FormData(e.target);
          for (const k of [
            "title",
            "artist",
            "album",
            "key",
            "comment",
            "color",
          ])
            t[k] = f.get(k);
          t.bpm = Number(f.get("bpm")) || 0;
          t.rating = Number(f.get("rating"));
          t.locked = f.has("locked");
          persist();
          renderTracks();
          renderDecks();
          $("#modal").close();
        };
        $("#mark-missing").onclick = () => {
          t.missing = !t.missing;
          renderTracks();
          $("#modal").close();
        };
        $("#add-prepare").onclick = () => {
          if (!s.prepare.includes(t.id)) s.prepare.push(t.id);
          notify("Added to Prepare");
        };
      },
    );
  }
  function editPad(d, n) {
    if (d.tab !== "Cues" || !d.track?.cues[n]) return;
    const c = d.track.cues[n];
    dialog(
      "Cue point",
      `<form><div class="form-grid"><label>Name<input name="name" value="${esc(c.name)}"></label><label>Position (seconds)<input type="number" step=".01" min="0" max="${d.track.duration}" name="position" value="${c.position}"></label></div><div class="form-actions"><button id="delete-cue" type="button">Delete cue</button><button>Save cue</button></div></form>`,
      (body) => {
        body.querySelector("form").onsubmit = (e) => {
          e.preventDefault();
          const f = new FormData(e.target);
          c.name = f.get("name");
          c.position = Number(f.get("position"));
          persist();
          renderDecks();
          $("#modal").close();
        };
        $("#delete-cue").onclick = () => {
          d.track.cues[n] = null;
          persist();
          renderDecks();
          $("#modal").close();
        };
      },
    );
  }
  function columns() {
    dialog(
      "Library columns",
      `<div class="settings-grid">${["title", "artist", "bpm", "key", "plays", "album", "duration", "rating", "comment", "type"].map((c) => `<label class="setting">${c}<input type="checkbox" data-column="${c}" ${s.columns.includes(c) ? "checked" : ""}></label>`).join("")}</div>`,
      (body) => {
        body.onchange = (e) => {
          const c = e.target.dataset.column;
          if (!c) return;
          if (e.target.checked) s.columns.push(c);
          else s.columns = s.columns.filter((x) => x !== c);
          renderTracks();
        };
      },
    );
  }
  function libraryTools() {
    dialog(
      "Library tools",
      `<div class="panel-controls"><button id="export-library">Export prototype backup</button><label>Restore backup <input type="file" id="restore-library" accept="application/json"></label><button id="find-duplicates">Find duplicate names</button><button id="rescan">Re-scan file info</button><button id="relocate">Relocate missing</button></div><div id="library-tool-result" class="note-box">Local source files are never copied, moved, deleted or rewritten. Native volume watching, filesystem relocation and Serato database interoperability remain explicit native work.</div><div class="panel-controls"><button id="import-ratings">Import rating fixture</button><button id="prepare-selected">Prepare selected</button><button id="reset-demo">Reset demo</button></div>`,
      () => {
        $("#export-library").onclick = () =>
          download(
            "open-play-library.json",
            JSON.stringify(
              {
                format: "open-play-prototype-1",
                crates: s.crates,
                settings: s.settings,
                tags: s.tracks.map(({ file, ...t }) => t),
              },
              null,
              2,
            ),
          );
        $("#restore-library").onchange = async (e) => {
          try {
            const data = JSON.parse(await e.target.files[0].text());
            if (
              data.format !== "open-play-prototype-1" ||
              !Array.isArray(data.crates) ||
              !data.crates.every(
                (c) =>
                  typeof c.id === "string" &&
                  typeof c.name === "string" &&
                  Array.isArray(c.tracks),
              )
            )
              throw new Error("Invalid prototype backup.");
            s.crates = data.crates;
            if (data.settings && typeof data.settings === "object") {
              for (const name of Object.keys(s.settings))
                if (name in data.settings)
                  s.settings[name] = data.settings[name];
            }
            for (const tag of data.tags || []) {
              const t = trackById(tag.id);
              if (t)
                Object.assign(
                  t,
                  Object.fromEntries(
                    [
                      "title",
                      "artist",
                      "album",
                      "bpm",
                      "key",
                      "cues",
                      "savedLoops",
                      "rating",
                      "comment",
                      "color",
                    ]
                      .filter((k) => k in tag)
                      .map((k) => [k, tag[k]]),
                  ),
                );
            }
            persist();
            renderCrates();
            renderTracks();
            renderDecks();
            $("#library-tool-result").textContent =
              "Prototype metadata restored. Audio bytes are not stored in backups.";
          } catch (err) {
            $("#library-tool-result").textContent = err.message;
          }
        };
        $("#find-duplicates").onclick = () => {
          const names = s.tracks.map((t) => t.title.toLowerCase()),
            dups = s.tracks.filter(
              (t, i) => names.indexOf(t.title.toLowerCase()) !== i,
            );
          $("#library-tool-result").textContent = dups.length
            ? dups.map((t) => t.title).join(", ")
            : "No duplicate names. Content-hash identity is a native requirement, not tested here.";
        };
        $("#rescan").onclick = () => {
          $("#library-tool-result").textContent =
            `${s.tracks.filter((t) => t.missing).length} missing entries. Filesystem rescan is simulated; re-import original local files for real browser decoding.`;
        };
        $("#relocate").onclick = () => {
          $("#library-tool-result").textContent =
            "Choose a missing entry in Track details, then re-import the original audio. Automatic disk search is unavailable in this browser prototype.";
        };
        $("#import-ratings").onclick = () => {
          const t = trackById(s.selected);
          if (t) t.rating = 4;
          persist();
          renderTracks();
          notify(
            "Applied rating fixture to selected track; no iTunes data was accessed.",
          );
        };
        $("#prepare-selected").onclick = () => {
          if (!s.prepare.includes(s.selected)) s.prepare.push(s.selected);
          notify("Added to Prepare.");
        };
        $("#reset-demo").onclick = () =>
          dialog(
            "Reset prototype?",
            `<p>Remove this prototype's saved settings, crate and cue changes, stop browser audio and reload the original demo. Your source audio and Serato data are unaffected.</p><button id="confirm-reset">Reset prototype</button>`,
            () => {
              $("#confirm-reset").onclick = a.reset;
            },
          );
      },
    );
  }
  function grid(d) {
    if (!d.track) return notify("Load a track first.");
    const t = d.track;
    dialog(
      `Beatgrid · ${t.title}`,
      `<div class="note-box">BPM, offset and markers update the displayed grid. Variable-grid warping and automatic beat detection remain native work.</div><div class="form-grid"><label>BPM<input id="grid-bpm" type="number" min="1" max="999" step=".01" value="${t.bpm || 120}" ${t.locked ? "disabled" : ""}></label><label>Downbeat offset (seconds)<input id="grid-offset" type="number" step=".01" value="${t.grid || 0}" ${t.locked ? "disabled" : ""}></label></div><div class="panel-controls" style="margin-top:12px"><button id="grid-half">½ BPM</button><button id="grid-double">×2 BPM</button><button id="grid-marker">Set marker at playhead</button><button id="grid-clear">Clear markers</button><button id="grid-save">Save grid</button></div><p id="grid-markers" class="muted">Markers: ${(t.gridMarkers || []).map(time).join(", ") || "None"} ${t.locked ? "· LOCKED" : ""}</p>`,
      () => {
        $("#grid-half").onclick = () => {
          if (!t.locked)
            $("#grid-bpm").value = Number($("#grid-bpm").value) / 2;
        };
        $("#grid-double").onclick = () => {
          if (!t.locked)
            $("#grid-bpm").value = Number($("#grid-bpm").value) * 2;
        };
        $("#grid-marker").onclick = () => {
          if (t.locked) return notify("Beatgrid locked.");
          t.gridMarkers ??= [];
          t.gridMarkers.push(engine.position(d));
          $("#grid-markers").textContent =
            "Markers: " + t.gridMarkers.map(time).join(", ");
        };
        $("#grid-clear").onclick = () => {
          if (!t.locked) {
            t.gridMarkers = [];
            $("#grid-markers").textContent = "Markers: None";
          }
        };
        $("#grid-save").onclick = () => {
          if (t.locked) return notify("Beatgrid locked.");
          t.bpm = Math.max(1, Number($("#grid-bpm").value) || 120);
          t.grid = Number($("#grid-offset").value);
          persist();
          renderDecks();
          renderTracks();
          $("#modal").close();
        };
      },
    );
  }
  function settings(tab = activeSettings) {
    activeSettings = tab;
    dialog(
      "Setup",
      `<nav class="settings-tabs">${Object.keys(settingsSchema)
        .map(
          (t) =>
            `<button data-settings-tab="${t}" class="${t === tab ? "active" : ""}">${t}</button>`,
        )
        .join(
          "",
        )}</nav><p class="muted">Preferences persist in this browser. Hardware, DSP, provider and native-format controls are simulated unless the review report says otherwise. No account or paid unlock is required.</p><div class="settings-grid">${settingsSchema[
        tab
      ]
        .map(([name, type, value]) => {
          const v = s.settings[name];
          if (type === "section")
            return `<h3 class="setting-section">${name}</h3>`;
          const input = Array.isArray(type)
            ? `<select data-setting="${esc(name)}">${options(type, v)}</select>`
            : type === "check"
              ? `<input type="checkbox" data-setting="${esc(name)}" ${v ? "checked" : ""}>`
              : `<input type="${type}" data-setting="${esc(name)}" value="${esc(v)}" ${type === "range" ? 'min="0" max="100"' : ""}>`;
          return `<label class="setting"><span>${name}</span>${input}</label>`;
        })
        .join(
          "",
        )}</div><div class="form-actions">${tab === "MIDI" ? '<button id="open-mapping">Mapping editor</button>' : ""}${tab === "CD/Vinyl" ? '<button id="open-calibration">Calibration simulation</button>' : ""}${tab === "Library + Display" ? '<button id="open-providers">Provider settings</button>' : ""}${tab === "Audio" ? '<button id="open-devices">Audio routing simulation</button><button id="song-info">Livestream song info</button>' : ""}${tab === "FX" ? '<button id="open-fx">FX catalog & presets</button>' : ""}<button id="reset-settings">Reset this tab</button><button id="save-settings">Close</button></div>`,
      (body) => {
        body
          .querySelectorAll("[data-settings-tab]")
          .forEach((b) => (b.onclick = () => settings(b.dataset.settingsTab)));
        body.querySelectorAll("[data-setting]").forEach(
          (input) =>
            (input.onchange = () => {
              s.settings[input.dataset.setting] =
                input.type === "checkbox" ? input.checked : input.value;
              persist();
              if (input.dataset.setting === "Library Text Size")
                $("#tracks").style.fontSize =
                  `${10 + Number(input.value) * 0.08}px`;
              if (input.dataset.setting === "Show Streaming Services")
                renderCrates();
              if (input.dataset.setting === "Reduced Motion")
                notify("Reduced motion preference saved.");
            }),
        );
        $("#save-settings").onclick = () => $("#modal").close();
        $("#reset-settings").onclick = () => {
          for (const [name, type, v] of settingsSchema[tab])
            if (type !== "section") s.settings[name] = v;
          persist();
          settings(tab);
        };
        if ($("#open-mapping")) $("#open-mapping").onclick = midi;
        if ($("#open-calibration")) $("#open-calibration").onclick = hardware;
        if ($("#open-providers"))
          $("#open-providers").onclick = () => provider(activeProvider);
        if ($("#open-devices")) $("#open-devices").onclick = hardware;
        if ($("#song-info"))
          $("#song-info").onclick = () =>
            dialog(
              "Livestream song information",
              `<p>Reference account-linked Twitch metadata reporting is inventoried. This prototype displays a local fixture and sends nothing.</p><pre class="log">${esc(s.decks[s.focus].track?.title || "No track")}\n${esc(s.decks[s.focus].track?.artist || "")}</pre>${badge("NO SERVICE CONNECTED")}`,
            );
        if ($("#open-fx"))
          $("#open-fx").onclick = () => {
            $("#modal").close();
            open("fx");
          };
      },
    );
  }
  const effectParams = {
    LPF: [
      ["Resonance", "1.77"],
      ["Slope", "24 dB"],
      ["Min Freq", "200 Hz"],
      ["Max Freq", "20.0 kHz"],
    ],
    Delay: [
      ["Feedback", "40%"],
      ["HPF", "20.0 Hz"],
      ["Drive", "0%"],
      ["Beat Modify", "1"],
    ],
    Reverb: [
      ["Decay", "1.50 s"],
      ["Contour", "0%"],
      ["Width", "100%"],
      ["Mix Mode", "Wet Mix"],
    ],
    "Wah Filter": [
      ["Resonance", "8.00"],
      ["Range", "4.00 octaves"],
      ["LFO Depth", "0%"],
      ["Rate", "2"],
    ],
  };
  function applyFX() {
    engine.configureFX(
      s.fx,
      s.fxRoutes || [],
      s.decks.map((d) => (d.track?.bpm || 120) * d.rate),
    );
  }
  function fx() {
    applyFX();
    const catalog = Object.entries(a.fxCatalog.categories);
    $("#panel").innerHTML =
      head("DJ FX", "4 INDEPENDENT BROWSER PROCESSORS · 55 DSP GAPS", true) +
      `<div class="panel-grid">${s.fx.map((bank, b) => `<div><div class="panel-controls"><strong>FX unit ${b + 1}</strong><label>Assign <select data-fx-route="${b}">${options(["Deck 1", "Deck 2", "Deck 3", "Deck 4", "Sampler", "Master"], s.fxRoutes?.[b] || `Deck ${b + 1}`)}</select></label></div><div class="fx-bank">${bank.map((f, i) => `<div class="fx-slot"><select aria-label="FX unit ${b + 1} slot ${i + 1}" data-fx-select="${b}:${i}">${catalog.map(([category, names]) => `<optgroup label="${category}">${options(names, f.name)}</optgroup>`).join("")}</select><div class="panel-controls"><button data-fx-on="${b}:${i}" ${implementedEffects.includes(f.name) ? "" : 'disabled title="DSP not implemented"'} class="${f.on ? "active" : ""}">ON</button><input type="range" aria-label="Effect depth ${b}:${i}" min="0" max="100" value="${f.depth}" data-fx-depth="${b}:${i}"><button data-fx-params="${b}:${i}">⚙</button><button data-fx-favorite="${b}:${i}" title="Favorite effect">${s.fxFavorites.includes(f.name) ? "★" : "☆"}</button></div><select aria-label="Effect beat timing" data-fx-beat="${b}:${i}">${options(["1/32", "1/16", "1/8", "1/4", "1/2", "1", "2", "4", "8"], f.beat)}</select></div>`).join("")}</div></div>`).join("")}</div><div class="panel-controls" style="margin-top:8px"><button id="save-fx-preset">Save preset</button><select id="fx-presets" aria-label="Effect preset"><option value="">Load preset…</option>${s.fxPresets.map((p, i) => `<option value="${i}">${esc(p.name)}</option>`).join("")}</select><button id="reset-fx">Reset units</button><span class="muted">Channel FX: </span><select id="channel-fx">${options(["Filter", "Dub Echo", "Space", "Noise"], s.channelFX || "Filter")}</select><span class="muted">59 effect names inventoried; 55 parameter schemas still unobserved.</span></div>`;
    $$("[data-fx-select]").forEach(
      (el) =>
        (el.onchange = () => {
          const [b, i] = el.dataset.fxSelect.split(":");
          s.fx[b][i].name = el.value;
          s.fx[b][i].on = false;
          refresh();
        }),
    );
    $$("[data-fx-on]").forEach(
      (el) =>
        (el.onclick = () => {
          const [b, i] = el.dataset.fxOn.split(":");
          s.fx[b][i].on = !s.fx[b][i].on;
          refresh();
        }),
    );
    $$("[data-fx-depth]").forEach(
      (el) =>
        (el.oninput = () => {
          const [b, i] = el.dataset.fxDepth.split(":");
          s.fx[b][i].depth = Number(el.value);
          applyFX();
        }),
    );
    $$("[data-fx-beat]").forEach(
      (el) =>
        (el.onchange = () => {
          const [b, i] = el.dataset.fxBeat.split(":");
          s.fx[b][i].beat = el.value;
          applyFX();
        }),
    );
    $$("[data-fx-route]").forEach(
      (el) =>
        (el.onchange = () => {
          s.fxRoutes ??= [];
          s.fxRoutes[el.dataset.fxRoute] = el.value;
          applyFX();
        }),
    );
    $$("[data-fx-favorite]").forEach(
      (el) =>
        (el.onclick = () => {
          const [b, i] = el.dataset.fxFavorite.split(":"),
            n = s.fx[b][i].name;
          s.fxFavorites = s.fxFavorites.includes(n)
            ? s.fxFavorites.filter((x) => x !== n)
            : [...s.fxFavorites, n];
          refresh();
        }),
    );
    $$("[data-fx-params]").forEach(
      (el) =>
        (el.onclick = () => {
          const [b, i] = el.dataset.fxParams.split(":"),
            f = s.fx[b][i],
            params = effectParams[f.name];
          dialog(
            `${f.name} · advanced parameters`,
            params
              ? `<p class="muted">Labels and initial values were observed in Serato. These now control independent browser DSP with conservative bounds; sonic equivalence is unverified. Editing rebuilds the route and clears effect tails.</p><div class="settings-grid">${params.map(([name, value]) => `<label class="setting">${name}<input data-param="${name}" value="${esc(f.params[name] || value)}"></label>`).join("")}</div><div class="form-actions"><button id="save-effect">Save values</button></div>`
              : `<div class="note-box">${esc(f.name)} exists in the installed catalog. Its specific parameter labels, ranges and transfer function have not been observed. No invented substitute controls are presented as parity.</div><p>Inventory: FX-003. This is an explicit prototype gap for Claude's independent investigation.</p>`,
            (body) => {
              if ($("#save-effect"))
                $("#save-effect").onclick = () => {
                  body
                    .querySelectorAll("[data-param]")
                    .forEach((e) => (f.params[e.dataset.param] = e.value));
                  applyFX();
                  $("#modal").close();
                };
            },
          );
        }),
    );
    $("#save-fx-preset").onclick = () => {
      s.fxPresets.push({
        name: `Preset ${s.fxPresets.length + 1}`,
        fx: a.clone(s.fx),
      });
      refresh();
    };
    $("#fx-presets").onchange = (e) => {
      if (e.target.value !== "") {
        s.fx = a.clone(s.fxPresets[Number(e.target.value)].fx);
        refresh();
      }
    };
    $("#reset-fx").onclick = () => {
      s.fx = s.fx.map(() =>
        ["LPF", "Delay", "Reverb"].map((name) => ({
          name,
          on: false,
          depth: 50,
          beat: "1/2",
          params: {},
        })),
      );
      refresh();
    };
    $("#channel-fx").onchange = (e) => (s.channelFX = e.target.value);
  }
  const pointerSamples = new Map(),
    keyboardSamples = new Map();
  function sampleOptions(slot) {
    const track = trackById(slot.track),
      from = slot.from || "start";
    let start = 0,
      loopStart = 0,
      loopEnd = track?.duration || 0;
    if (from.startsWith("cue:"))
      start = track?.cues[Number(from.split(":")[1])]?.position || 0;
    if (from.startsWith("loop:")) {
      const loop = track?.savedLoops[Number(from.split(":")[1])];
      if (loop) {
        start = loop.start;
        loopStart = loop.start;
        loopEnd = loop.end;
      }
    }
    return {
      start,
      loopStart,
      loopEnd,
      repeat: slot.repeat || slot.mode === "Repeat",
      rate: 1 + (Number(slot.pitch) || 0) / 100,
      gain: slot.muted
        ? 0
        : ((slot.volume ?? 80) / 100) *
          Math.pow(10, (track?.sampleGain || 0) / 20),
    };
  }
  function sampler() {
    const slots = s.samples[s.bank];
    $("#panel").innerHTML =
      head("Sampler", "REAL PLAY / HOLD / REPEAT / PITCH / GAIN", true) +
      `<div class="panel-controls" style="margin-bottom:7px">${["A", "B", "C", "D"].map((b, i) => `<button data-sample-bank="${i}" class="${s.bank === i ? "active" : ""}">${b}</button>`).join("")}<span class="muted">Browser master output · Alt-click stops · advanced keylock/output routing still unavailable.</span></div><div class="sampler-slots">${slots.map((slot, i) => `<div class="sample-slot" data-sample-drop="${i}"><h3>${i + 1} · ${esc(trackById(slot.track)?.title || "Empty slot")}</h3><div class="panel-controls"><button data-sample="${i}:load">Load</button><button data-sample="${i}:play" aria-label="Play sample ${i + 1}" aria-pressed="${!!slot.playing}" class="${slot.playing ? "active" : ""}">▶</button><button data-sample="${i}:stop" aria-label="Stop sample ${i + 1}">■</button><button data-sample="${i}:eject" aria-label="Eject sample ${i + 1}">×</button></div><select data-sample-mode="${i}" aria-label="Slot ${i + 1} play mode">${options(["Trigger", "Hold", "On/Off"], slot.mode === "Repeat" ? "Trigger" : slot.mode)}</select><label class="muted"><input type="checkbox" data-sample-repeat="${i}" ${slot.repeat || slot.mode === "Repeat" ? "checked" : ""}> Repeat</label><button data-sample="${i}:advanced" style="width:100%;margin-top:5px">Advanced</button><small class="sample-status" data-sample-status="${i}">${slot.playing ? "Playing" : "Stopped"}</small></div>`).join("")}</div>`;
    $$("[data-sample-bank]").forEach(
      (b) =>
        (b.onclick = () => {
          s.bank = Number(b.dataset.sampleBank);
          refresh();
        }),
    );
    $$("[data-sample]").forEach((b) => {
      const [i, action] = b.dataset.sample.split(":");
      b.onclick = (e) => {
        if (action === "play" && slots[i].mode === "Hold" && e.detail > 0)
          return;
        sampleAction(Number(i), e.altKey ? "stop" : action);
      };
      if (action === "play") {
        b.onpointerdown = (e) => {
          if (slots[i].mode !== "Hold" || e.altKey) return;
          e.preventDefault();
          pointerSamples.set(Number(i), s.bank * 8 + Number(i));
          sampleAction(Number(i), "play", "pointer");
        };
        b.onkeydown = (e) => {
          if (
            (e.key === " " || e.key === "Enter") &&
            slots[i].mode === "Hold"
          ) {
            e.preventDefault();
            if (!e.repeat) sampleAction(Number(i), "play", "keyboard");
          }
        };
        b.onkeyup = (e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            releaseSampleHolds(Number(i), "keyboard");
          }
        };
      }
    });
    $$("[data-sample-mode]").forEach(
      (el) =>
        (el.onchange = () => {
          slots[el.dataset.sampleMode].mode = el.value;
          sampleAction(Number(el.dataset.sampleMode), "stop");
        }),
    );
    $$("[data-sample-repeat]").forEach(
      (el) =>
        (el.onchange = () => {
          const slot = slots[el.dataset.sampleRepeat];
          slot.repeat = el.checked;
          const voice = engine.samples?.get(
            s.bank * 8 + Number(el.dataset.sampleRepeat),
          );
          if (voice) voice.source.loop = slot.repeat;
        }),
    );
    $$("[data-sample-drop]").forEach(
      (el) =>
        (el.ondrop = (e) => {
          e.preventDefault();
          const id = e.dataTransfer.getData("text/plain");
          if (trackById(id)) {
            const i = Number(el.dataset.sampleDrop);
            engine.stopSample(s.bank * 8 + i);
            slots[i].track = id;
            slots[i].playing = false;
            refresh();
          }
        }),
    );
  }
  function sampleVisuals() {
    for (let i = 0; i < 8; i++) {
      const slot = s.samples[s.bank][i],
        button = $(`[data-sample="${i}:play"]`),
        status = $(`[data-sample-status="${i}"]`);
      if (button) {
        button.classList.toggle("active", slot.playing);
        button.setAttribute("aria-pressed", String(!!slot.playing));
      }
      if (status) status.textContent = slot.playing ? "Playing" : "Stopped";
    }
  }
  function releaseSampleHolds(index = null, source = "pointer") {
    const held = source === "keyboard" ? keyboardSamples : pointerSamples;
    for (const [i, key] of held) {
      if (index !== null && i !== index) continue;
      engine.stopSample(key);
      s.samples[Math.floor(key / 8)][key % 8].playing = false;
      held.delete(i);
    }
    sampleVisuals();
  }
  document.addEventListener("pointerup", () => releaseSampleHolds());
  document.addEventListener("pointercancel", () => releaseSampleHolds());
  window.addEventListener("blur", () => {
    releaseSampleHolds();
    releaseSampleHolds(null, "keyboard");
  });
  async function sampleAction(i, action, source = "click") {
    const slot = s.samples[s.bank][i],
      key = s.bank * 8 + i;
    if (action === "load" || action === "eject" || action === "stop") {
      engine.stopSample(key);
      slot.playing = false;
    }
    if (action === "load") {
      slot.track = s.selected;
      slot.from = "start";
    }
    if (action === "eject") slot.track = null;
    if (action === "play") {
      if (!slot.track) return notify("Load a sample first.");
      if (slot.mode === "On/Off" && slot.playing) {
        engine.stopSample(key);
        slot.playing = false;
      } else {
        if (slot.mode === "Hold" && source === "keyboard")
          keyboardSamples.set(i, key);
        try {
          slot.playing = await engine.sample(
            trackById(slot.track),
            key,
            sampleOptions(slot),
          );
        } catch (e) {
          notify(e.message);
        }
      }
      sampleVisuals();
      return;
    }
    if (action === "advanced") {
      const track = trackById(slot.track);
      if (!track) return notify("Load a sample first.");
      const starts = [
        ["start", "Start"],
        ...track.cues.flatMap((c, i) =>
          c ? [[`cue:${i}`, `${c.name} · ${time(c.position)}`]] : [],
        ),
        ...track.savedLoops.map((l, i) => [
          `loop:${i}`,
          `${l.name} · ${time(l.start)}`,
        ]),
      ];
      dialog(
        `Sampler ${i + 1} · advanced`,
        `<div class="form-grid"><label>Volume<input id="sample-volume" type="range" min="0" max="100" value="${slot.volume ?? 80}"></label><label>Track gain (dB)<input id="sample-gain" type="number" min="-24" max="12" step=".5" value="${track.sampleGain || 0}"></label><label>Pitch (%)<input id="sample-pitch" type="number" min="-50" max="100" step=".1" value="${slot.pitch || 0}"></label><label>Play from<select id="sample-from">${starts.map(([value, name]) => `<option value="${value}" ${value === (slot.from || "start") ? "selected" : ""}>${esc(name)}</option>`).join("")}</select></label><label><span>Mute</span><input id="sample-mute" type="checkbox" ${slot.muted ? "checked" : ""}></label></div><div class="panel-controls"><button id="sample-sync">Match focused deck tempo</button><button id="sample-reset-pitch">Reset pitch</button><button id="sample-apply">Apply</button></div><p class="muted">Gain/volume/pitch/mute affect real audio; Play from applies on the next trigger. Tempo matching changes pitch. Key-preserving stretch, native output buses and file-tag writing remain open.</p>`,
        () => {
          const update = () => {
            slot.volume = Number($("#sample-volume").value);
            slot.pitch = Math.max(
              -50,
              Math.min(100, Number($("#sample-pitch").value) || 0),
            );
            slot.from = $("#sample-from").value;
            slot.muted = $("#sample-mute").checked;
            track.sampleGain = Math.max(
              -24,
              Math.min(12, Number($("#sample-gain").value) || 0),
            );
            engine.updateSample(key, sampleOptions(slot));
            persist();
          };
          for (const id of ["volume", "gain", "pitch", "from", "mute"])
            $("#sample-" + id).oninput = update;
          $("#sample-reset-pitch").onclick = () => {
            $("#sample-pitch").value = 0;
            update();
          };
          $("#sample-sync").onclick = () => {
            const deck = s.decks[s.focus];
            if (!track.bpm || !deck.track?.bpm)
              return notify("Both tracks need BPM values.");
            $("#sample-pitch").value =
              ((deck.track.bpm * deck.rate) / track.bpm - 1) * 100;
            update();
          };
          $("#sample-apply").onclick = () => {
            update();
            $("#modal").close();
          };
        },
      );
      return;
    }
    if (s.panel === "sampler") refresh();
  }
  function scratch() {
    const slots = s.scratch[s.scratchBank];
    $("#panel").innerHTML =
      head("Scratch Banks", "REAL DECK LOAD · CUE SETTINGS") +
      `<div class="panel-controls" style="margin-bottom:7px">${["A", "B", "C", "D"].map((b, i) => `<button data-scratch-bank="${i}" class="${s.scratchBank === i ? "active" : ""}">${b}</button>`).join("")}<span class="muted">Load selected track into a slot. Trigger loads focused deck; Shift-trigger restores previous track.</span></div><div class="sampler-slots">${slots.map((slot, i) => `<div class="sample-slot" data-scratch-drop="${i}"><h3>${i + 1} · ${esc(trackById(slot.track)?.title || "Empty")}</h3><div class="panel-controls"><button data-scratch="${i}:assign">Assign</button><button data-scratch="${i}:trigger">Load deck</button><button data-scratch="${i}:clear">×</button></div><select data-scratch-start="${i}" aria-label="Scratch slot ${i + 1} start">${options(["Start", ...Array.from({ length: 8 }, (_, j) => `Cue ${j + 1}`)], slot.start)}</select><label class="muted"><input type="checkbox" data-scratch-repeat="${i}" ${slot.repeat ? "checked" : ""}> Repeat</label><label class="muted"><input type="checkbox" data-scratch-key="${i}" ${slot.keylock ? "checked" : ""}> Key lock ◇</label></div>`).join("")}</div>`;
    $$("[data-scratch-bank]").forEach(
      (b) =>
        (b.onclick = () => {
          s.scratchBank = Number(b.dataset.scratchBank);
          refresh();
        }),
    );
    $$("[data-scratch]").forEach(
      (b) =>
        (b.onclick = async (e) => {
          const [i, action] = b.dataset.scratch.split(":"),
            slot = slots[i],
            d = s.decks[s.focus];
          if (action === "assign") slot.track = s.selected;
          if (action === "clear") slot.track = null;
          if (action === "trigger") {
            if (e.shiftKey && d.previous) {
              await load(d.index, d.previous.id, {
                position: d.previous.position,
              });
              return;
            }
            if (!slot.track) return notify("Assign a track first.");
            const t = trackById(slot.track),
              cue = Number(slot.start.split(" ")[1]) - 1;
            await load(d.index, t.id, {
              position: slot.start === "Start" ? 0 : t.cues[cue]?.position || 0,
            });
            d.repeat = slot.repeat;
            d.keylock = slot.keylock;
            renderDecks();
          }
          refresh();
        }),
    );
    for (const [key, prop] of [
      ["scratchStart", "start"],
      ["scratchRepeat", "repeat"],
      ["scratchKey", "keylock"],
    ])
      $$(
        `[data-${key.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())}]`,
      ).forEach(
        (el) =>
          (el.onchange = () =>
            (slots[el.dataset[key]][prop] =
              el.type === "checkbox" ? el.checked : el.value)),
      );
    $$("[data-scratch-drop]").forEach(
      (el) =>
        (el.ondrop = (e) => {
          e.preventDefault();
          const id = e.dataTransfer.getData("text/plain");
          if (trackById(id)) {
            slots[el.dataset.scratchDrop].track = id;
            refresh();
          }
        }),
    );
  }
  function flip() {
    const f = s.flip,
      d = s.decks[f.deck ?? s.focus],
      track = d.track,
      saved = track?.flips || [];
    $("#panel").innerHTML =
      head("Flip", "TIMED BROWSER AUDIO AUTOMATION", true) +
      `<div class="panel-controls"><button id="flip-arm" class="${f.armed ? "active" : ""}">${f.armed ? "■ Finish recording" : "● Record"}</button><button id="flip-start">▶ Start</button><button id="flip-on" class="${f.on ? "active" : ""}">On</button><button id="flip-loop" class="${f.loop ? "active" : ""}">Loop</button><button id="flip-save">Save</button><label><input id="flip-snap" type="checkbox" ${f.snap ? "checked" : ""}> Loop Snap</label><input id="flip-name" aria-label="Flip name" value="${esc(f.name)}"><button id="flip-clear">Clear temporary</button></div><p class="muted">Deck ${d.index + 1} · ${esc(track?.title || "No track")} · Cue/reverse actions drive actual playback. Browser timer jitter and native metadata interoperability remain unverified.</p><div id="flip-events" class="log"></div><div class="flip-slots">${Array.from({ length: 6 }, (_, i) => `<div><label>Slot ${i + 1}<input data-flip-name="${i}" aria-label="Flip slot ${i + 1} name" value="${esc(saved[i]?.name || "")}" ${saved[i] ? "" : "disabled"}></label><button data-flip-load="${i}" ${saved[i] ? "" : "disabled"}>Load</button><button data-flip-start="${i}" ${saved[i] ? "" : "disabled"}>Start</button><button data-flip-delete="${i}" ${saved[i] ? "" : "disabled"}>Delete</button></div>`).join("")}</div>`;
    $("#flip-arm").onclick = () => {
      a.flipAutomation.arm();
      refresh();
    };
    $("#flip-start").onclick = () =>
      a.flipAutomation.start(s.decks[f.deck ?? s.focus]);
    $("#flip-on").onclick = () => {
      if (f.on) a.flipAutomation.stop();
      else a.flipAutomation.start(s.decks[f.deck ?? s.focus]);
      refresh();
    };
    $("#flip-loop").onclick = () => {
      f.loop = !f.loop;
      refresh();
    };
    $("#flip-snap").onchange = (e) => (f.snap = e.target.checked);
    $("#flip-name").oninput = (e) => (f.name = e.target.value);
    $("#flip-save").onclick = () => {
      a.flipAutomation.save();
      refresh();
    };
    $("#flip-clear").onclick = () => {
      a.flipAutomation.stop();
      f.events = [];
      f.armed = false;
      delete f.recordStarted;
      refresh();
    };
    $$("[data-flip-name]").forEach(
      (el) =>
        (el.onchange = () => {
          saved[el.dataset.flipName].name = el.value;
          persist();
        }),
    );
    $$("[data-flip-load]").forEach(
      (el) =>
        (el.onclick = () => {
          a.flipAutomation.select(d, Number(el.dataset.flipLoad));
          refresh();
        }),
    );
    $$("[data-flip-start]").forEach(
      (el) =>
        (el.onclick = () => {
          a.flipAutomation.select(d, Number(el.dataset.flipStart));
          a.flipAutomation.start(d);
          refresh();
        }),
    );
    $$("[data-flip-delete]").forEach(
      (el) =>
        (el.onclick = () => {
          saved[el.dataset.flipDelete] = null;
          persist();
          refresh();
        }),
    );
  }
  function stems() {
    const t = trackById(s.selected);
    dialog(
      "Stems preparation",
      `${badge("NO SEPARATION MODEL RUNNING")}<p>Exercise queue, cancellation and failure states. No isolated audio is produced; playing tracks retain their full mix.</p><div class="panel-controls"><button id="stems-queue">Prepare selected</button><button id="stems-cancel">Cancel</button><button id="stems-fail">Simulate model failure</button><button id="stems-clear">Clear cache fixture</button></div><p id="stems-state">${esc(t?.stemState || "Not prepared")}</p><div class="note-box">Provisional evaluation baseline: HTDemucs, compared with licensed SCNet / RoFormer checkpoints. No weights have been run or selected as a measured winner.</div>`,
      () => {
        $("#stems-queue").onclick = () => {
          if (!t) return;
          t.stemState = "Queued (simulation)";
          $("#stems-state").textContent = t.stemState;
          setTimeout(() => {
            if (t.stemState === "Queued (simulation)") {
              t.stemState = "Ready (simulation)";
              if ($("#stems-state"))
                $("#stems-state").textContent = t.stemState;
              renderTracks();
            }
          }, 900);
        };
        $("#stems-cancel").onclick = () => {
          if (t) t.stemState = "Cancelled";
          $("#stems-state").textContent =
            "Cancelled; full mix remains available.";
        };
        $("#stems-fail").onclick = () => {
          if (t) t.stemState = "Failed (simulation)";
          $("#stems-state").textContent =
            "Worker failure fixture; original audio unaffected. Retry preparation or use full mix.";
        };
        $("#stems-clear").onclick = () => {
          if (t) delete t.stemState;
          $("#stems-state").textContent = "No prepared cache";
          renderTracks();
        };
      },
    );
  }
  function recording() {
    $("#panel").innerHTML =
      head("Recording", "REAL BROWSER MASTER CAPTURE", true) +
      `<div class="panel-controls"><button id="record-toggle" class="${engine.recording ? "active" : ""}">${engine.recording ? "■ Stop recording" : "● Start recording"}</button><strong id="record-time">00:00.0</strong><label>Name <input id="record-name" value="${esc(s.recordName || "Open Play session")}"></label><label>Source <select id="record-source">${options(["Master mix", "Mic — simulation", "Aux — simulation"], s.recordSource || "Master mix")}</select></label><span class="muted">Browser codec (WebM/Opus or supported fallback). AIFF/WAV and pre-master routing remain native work.</span></div><div id="record-result" class="muted" style="margin-top:8px">${s.recordBlob ? "Last capture: " + s.recordBlob.size + " bytes. Download available." : "Start recording, play local decks, then stop and download."}</div><div class="panel-controls" style="margin-top:8px"><button id="record-download" ${s.recordBlob ? "" : "disabled"}>Download capture</button><button id="disk-failure">Simulate disk-full recovery</button><button id="record-split">Split fixture</button></div>`;
    $("#record-name").oninput = (e) => (s.recordName = e.target.value);
    $("#record-source").onchange = (e) => {
      s.recordSource = e.target.value;
      if (s.recordSource !== "Master mix")
        notify(
          "External source simulated. Actual browser capture still records the master mix.",
        );
    };
    $("#record-toggle").onclick = async () => {
      try {
        if (engine.recording) s.recordBlob = await engine.recordStop();
        else await engine.recordStart();
        refresh();
      } catch (e) {
        notify(e.message);
      }
    };
    $("#record-download").onclick = () => {
      if (s.recordBlob)
        download(
          (s.recordName || "Open Play session") +
            (s.recordBlob.type.includes("mp4") ? ".mp4" : ".webm"),
          s.recordBlob,
        );
    };
    $("#disk-failure").onclick = () => {
      $("#record-result").textContent =
        "SIMULATED: disk full. Keep existing capture, choose a new destination, then resume. No browser storage failure was induced.";
    };
    $("#record-split").onclick = () => {
      $("#record-result").textContent =
        "SIMULATED: next segment queued. Native automatic split and interruption repair are unimplemented.";
    };
  }
  const videoMixer = createVideoMixer({ state: s, engine, notify });
  function video() {
    const v = s.video;
    $("#panel").innerHTML =
      head("Video", "LOCAL VIDEO DECODE / COMPOSITE / CAPTURE", true) +
      `<div class="video-previews">${[0, 1].map((i) => `<div><canvas id="video-preview-${i}" width="320" height="180" style="width:100%"></canvas><label>${i ? "Right" : "Left"} local video<input type="file" accept="video/*" data-video-file="${i}"></label><button data-video-play="${i}">Play / pause ${i ? "right" : "left"}</button><p id="video-status-${i}" class="muted">No media loaded</p></div>`).join("")}<div><canvas id="video-master" width="640" height="360" style="width:100%;background:#111"></canvas><button id="video-fullscreen">Fullscreen output</button></div></div><div class="panel-controls"><label>Transition<select id="video-transition">${options(["Crossfade", "Wipe — illustrative", "Zoom — illustrative"], v.transition)}</select></label><label>Mix<input id="video-cross" type="range" min="-1" max="1" step=".01" value="${v.cross}"></label><label><input id="video-auto" type="checkbox" ${v.auto ? "checked" : ""}> Auto</label><label><input id="video-link" type="checkbox" ${v.linked ? "checked" : ""}> Link audio</label><button id="video-overlay">Text / image</button><button id="video-fx">Channel / master FX</button><button id="video-output">Output settings</button><button id="video-media">Media Crate / karaoke</button></div><div class="panel-controls"><button id="video-record">${videoMixer.recording ? "Stop video capture" : "Record video mix"}</button><button id="video-download" ${videoMixer.result ? "" : "disabled"}>Download video mix</button><span id="video-record-state">Not recording</span></div><p class="muted">Local files stay in this browser. Link follows decks 1/2 and the audio crossfader; disable it for independent video controls. Source-video audio is muted. Canvas output is 640×360 / 30 fps, not native HD, karaoke or Syphon parity.</p>`;
    videoMixer.bind($("#video-master"));
    $$("[data-video-file]").forEach(
      (input) =>
        (input.onchange = async () => {
          if (!input.files[0]) return;
          try {
            await videoMixer.load(
              Number(input.dataset.videoFile),
              input.files[0],
            );
          } catch (e) {
            notify(e.message);
          }
        }),
    );
    $$("[data-video-play]").forEach(
      (button) =>
        (button.onclick = () =>
          videoMixer
            .play(Number(button.dataset.videoPlay))
            .catch((e) => notify(e.message))),
    );
    $("#video-transition").onchange = (e) => (v.transition = e.target.value);
    $("#video-cross").oninput = (e) => (v.cross = Number(e.target.value));
    $("#video-fullscreen").onclick = () =>
      $("#video-master")
        .requestFullscreen?.()
        .catch((e) => notify(e.message));
    $("#video-record").onclick = async () => {
      try {
        if (videoMixer.recording) await videoMixer.stop();
        else await videoMixer.record();
        $("#video-record").textContent = videoMixer.recording
          ? "Stop video capture"
          : "Record video mix";
        $("#video-download").disabled = !videoMixer.result;
      } catch (e) {
        notify(e.message);
      }
    };
    $("#video-download").onclick = () => {
      const blob = videoMixer.result;
      if (blob)
        download(
          "open-play-video-mix." + (blob.type.includes("mp4") ? "mp4" : "webm"),
          blob,
        );
    };
    for (const k of ["auto", "link"])
      $("#video-" + k).onchange = (e) =>
        (v[k === "link" ? "linked" : k] = e.target.checked);
    $("#video-overlay").onclick = () =>
      dialog(
        "Video overlays",
        `${badge("REAL CANVAS TEXT / IMAGE OVERLAY")}<div class="form-grid"><label>Text<input id="video-text" value="${esc(v.text)}"></label><label>Color<input id="video-color" type="color" value="${v.color}"></label><label>Animation<select id="video-animation">${options(["None", "Scroll", "BPM Zoom", "Bass Zoom"], v.animation)}</select></label><label>Image<input id="video-image" type="file" accept="image/png,image/jpeg,image/webp"></label><label>Alignment<select id="video-align">${options(["Center", "Left", "Right"], v.align || "Center")}</select></label><label>Speed<select id="video-speed">${options(["Slow", "Medium", "Fast"], v.speed || "Medium")}</select></label></div><div class="form-actions"><button id="video-overlay-save">Apply overlay</button></div>`,
        () => {
          $("#video-image").onchange = (e) => {
            if (e.target.files[0]) {
              if (v.image) URL.revokeObjectURL(v.image);
              v.image = URL.createObjectURL(e.target.files[0]);
              videoMixer.setImage(v.image);
            }
          };
          $("#video-overlay-save").onclick = () => {
            v.text = $("#video-text").value;
            v.color = $("#video-color").value;
            v.animation = $("#video-animation").value;
            v.align = $("#video-align").value;
            v.speed = $("#video-speed").value;
            $("#modal").close();
            refresh();
          };
        },
      );
    $("#video-output").onclick = () => settings("Expansion Packs");
    $("#video-fx").onclick = () =>
      dialog(
        "Video FX routing",
        `${badge("PARAMETER / DSP INVENTORY OPEN")}<div class="settings-grid">${["Left channel", "Right channel", "Master slot 1", "Master slot 2"].map((n) => `<label class="setting">${n}<select><option>Off</option><option>Illustrative color shift</option></select></label>`).join("")}</div><p>Two master slots are documented. The exact current Video effect and transition catalogs remain unverified. Illustrative entries are not claimed to be Serato effects. Syphon and audio-linked effect behavior are native requirements.</p>`,
      );
    $("#video-media").onclick = () =>
      dialog(
        "Video media workflows",
        `<div class="note-box">Media Crate fallback, linked audio/video, MP3+G karaoke, HD recording and Syphon output remain in scope. This browser decodes supported local video and records its canvas mix; it does not decode karaoke, route Syphon or implement native HD output.</div><div class="form-grid"><label>Fallback source<select><option>Media Crate — simulated</option><option>Linked video — simulated</option></select></label><label>Karaoke fixture<select><option>Not loaded</option><option>MP3+G loaded — simulated</option><option>Graphics missing — simulated</option></select></label></div><p class="muted">Reference source: Serato DJ Pro expansion pages; format/render support requires exact-version verification.</p>`,
      );
  }
  function link() {
    $("#panel").innerHTML =
      head("Ableton Link", "NETWORK SESSION SIMULATION") +
      `<div class="panel-controls"><button id="link-join" class="${s.link.joined ? "active" : ""}">${s.link.joined ? "Leave session" : "Join session"}</button><label>Tempo <input id="link-tempo" type="number" min="20" max="300" value="${s.link.tempo}"></label><label>Peers <select id="link-peers">${options(["0", "1", "2", "3"], String(s.link.peers))}</select></label><button id="link-drop">Simulate network loss</button><span id="link-state" class="muted">${s.link.joined ? "Joined simulated session" : "No session"} · no network packets sent</span></div>`;
    $("#link-join").onclick = () => {
      s.link.joined = !s.link.joined;
      refresh();
    };
    $("#link-tempo").onchange = (e) => (s.link.tempo = Number(e.target.value));
    $("#link-peers").onchange = (e) => (s.link.peers = Number(e.target.value));
    $("#link-drop").onclick = () => {
      s.link.joined = false;
      s.link.peers = 0;
      refresh();
      notify("Link loss simulated. Local audio continues independently.");
    };
  }
  function files() {
    $("#panel").innerHTML =
      head("Files", "BROWSER IMPORT / FILESYSTEM SIMULATED") +
      `<div class="panel-controls"><button id="files-import">Choose local audio</button><button id="files-rescan">Re-scan / relocate</button><label>Volume state <select id="volume-state">${options(["Connected", "Disconnected", "Read-only"], s.volume || "Connected")}</select></label><button id="files-copy">Copy / move fixture</button><span class="muted">USB storage is distinct from USB audio and MIDI. No filesystem writes are performed.</span></div><p id="files-result" class="muted">Imported files remain local to this browser session. Reload requires re-importing their bytes.</p>`;
    $("#files-import").onclick = () => $("#audio-files").click();
    $("#files-rescan").onclick = libraryTools;
    $("#volume-state").onchange = (e) => {
      s.volume = e.target.value;
      $("#files-result").textContent =
        `External-volume ${s.volume.toLowerCase()} fixture; source files untouched.`;
    };
    $("#files-copy").onclick = () => {
      $("#files-result").textContent =
        "SIMULATED: copying/moving a library entry must preserve media identity and use reversible conflict handling. Native file operations are not implemented.";
    };
  }
  function prepare() {
    $("#panel").innerHTML =
      head("Prepare", "REAL SESSION LIST", true) +
      `<div class="panel-controls"><button id="prepare-add">Add selected</button><button id="prepare-clear">Clear Prepare</button></div><div class="log">${s.prepare.map((id) => `<button data-prepare-load="${id}">${esc(trackById(id)?.title || id)}</button>`).join(" ") || "Prepare is empty. Add a library track before auditioning."}</div>`;
    $("#prepare-add").onclick = () => {
      if (!s.prepare.includes(s.selected)) s.prepare.push(s.selected);
      refresh();
    };
    $("#prepare-clear").onclick = () => {
      s.prepare = [];
      refresh();
    };
    $$("[data-prepare-load]").forEach(
      (b) => (b.onclick = () => load(s.focus, b.dataset.prepareLoad)),
    );
  }
  function history() {
    $("#panel").innerHTML =
      head("History", "REAL BROWSER PLAY HISTORY", true) +
      `<div class="panel-controls"><button id="history-export">Export CSV</button><button id="history-insert">Insert selected track</button><button id="history-clear">New session</button><button id="history-share">Live playlist</button></div><div class="log">${s.history.map((h, i) => `${i + 1}. ${esc(h.title)} · deck ${h.deck} · ${esc(h.time)} ${h.inserted ? "(inserted)" : ""}`).join("<br>") || "No tracks played in this prototype session."}</div>`;
    $("#history-export").onclick = () => {
      const cell = (v) => '"' + String(v).replaceAll('"', '""') + '"';
      download(
        "open-play-history.csv",
        "title,deck,time\n" +
          s.history
            .map((h) => [h.title, h.deck, h.time].map(cell).join(","))
            .join("\n"),
        "text/csv",
      );
    };
    $("#history-insert").onclick = () => {
      const t = trackById(s.selected);
      if (t)
        s.history.push({
          id: t.id,
          title: t.title,
          deck: s.focus + 1,
          time: new Date().toISOString(),
          inserted: true,
        });
      refresh();
    };
    $("#history-clear").onclick = () => {
      s.history = [];
      refresh();
    };
    $("#history-share").onclick = () =>
      dialog(
        "Live playlist",
        `${badge("SHARING SIMULATION")}<p>Publishing requires an optional service and an explicit user action. This prototype has no backend and publishes nothing.</p><label>Session title <input value="Open Play session"></label><p class="muted">Native/service acceptance: explicit opt-in, connection recovery, correct currently playing metadata, privacy and export.</p>`,
      );
  }
  function hardware() {
    const d = s.device;
    dialog(
      "Devices & external control",
      `${badge("ALL DEVICE STATE BELOW IS SIMULATED")}<div class="device-card"><h3>Hercules DJControl Inpulse 300 MK2</h3><p class="muted">Previously observed USB 06f8:b12f · 4 CoreAudio outputs · 44.1 kHz. Browser-knob response was user-confirmed. This page is not a live hardware monitor.</p><div class="panel-controls"><button id="device-connect">${d.connected ? "Simulate disconnect" : "Simulate reconnect"}</button><button id="device-browser">Simulate browser +1</button><button id="device-led">Toggle LED fixture</button><button id="device-midi">Mapping editor</button><span id="device-status">${d.connected ? "Connected fixture" : "Disconnected fixture"}</span></div></div><div class="device-channels"><div class="device-card"><h3>Audio routes</h3><label class="setting">Master<select>${options(["1–2 → RCA", "3–4 → headphones"], "1–2 → RCA")}</select></label><label class="setting">Cue<select>${options(["3–4 → headphones", "1–2 → RCA"], "3–4 → headphones")}</select></label><button id="route-test">Run route fixture</button><p id="route-result" class="muted">Physical headphones/master separation is unverified. No diagnostic tones are sent.</p></div><div class="device-card"><h3>CDJ / turntable / Phase</h3><label class="setting">Transport<select id="external-type">${options(["DVS turntable", "CDJ HID", "CD timecode", "Phase wireless", "USB storage"], d.type || "DVS turntable")}</select></label><label class="setting">Mode<select id="dvs-mode">${options(["INT", "REL", "ABS", "THRU", "WIR"], d.mode)}</select></label><button id="dvs-drop">Signal dropout</button><button id="dvs-changeover">Changeover</button><button id="dvs-internal">Emergency INT</button></div></div><div class="device-card"><h3>Calibration scope · synthetic</h3><canvas class="scope" id="dvs-scope" width="700" height="125"></canvas><div class="panel-controls"><label>Signal <input id="dvs-signal" type="range" min="0" max="100" value="${d.signal}"></label><label>Noise threshold <input id="dvs-noise" type="range" min="0" max="100" value="${d.noise}"></label><button id="dvs-estimate">Estimate fixture</button><span id="dvs-result" class="muted">No timecode input is captured.</span></div></div><p class="muted">HID display feedback, guide LEDs, full jog/touch data, firmware-dependent mappings, hot plug, clock drift and multi-controller arbitration require native/device tests. Existing mapping and firmware remain untouched.</p>`,
      () => {
        $("#device-connect").onclick = () => {
          d.connected = !d.connected;
          hardware();
        };
        $("#device-browser").onclick = () => {
          const list = a.filtered(),
            i = list.findIndex((t) => t.id === s.selected);
          s.selected = list[(i + 1) % list.length]?.id || s.selected;
          renderTracks();
          $("#device-status").textContent =
            "Synthetic browser event moved library selection";
        };
        $("#device-led").onclick = () => {
          d.feedback = !d.feedback;
          $("#device-status").textContent =
            `LED fixture ${d.feedback ? "on" : "off"}; no hardware output sent`;
        };
        $("#device-midi").onclick = midi;
        $("#route-test").onclick = () =>
          ($("#route-result").textContent =
            "Fixture: master → 1/2, cue → 3/4. Physical playback remains UNVERIFIED. Browser sound uses default output.");
        $("#external-type").onchange = (e) => {
          d.type = e.target.value;
          $("#dvs-result").textContent =
            d.type === "USB storage"
              ? "Storage has files; it is not a control or audio interface."
              : `${d.type} route simulated.`;
        };
        $("#dvs-mode").onchange = (e) => (d.mode = e.target.value);
        $("#dvs-drop").onclick = () => {
          d.signal = 0;
          $("#dvs-signal").value = 0;
          drawScope();
          $("#dvs-result").textContent =
            "Signal lost (fixture). Switch to internal control; no physical dropout was tested.";
        };
        $("#dvs-changeover").onclick = () => {
          $("#dvs-result").textContent =
            "Changeover fixture: keep current audio running, switch incoming route, confirm ownership, then hand over. Not physically executed.";
        };
        $("#dvs-internal").onclick = () => {
          d.mode = "INT";
          $("#dvs-mode").value = "INT";
          $("#dvs-result").textContent = "Internal control selected (fixture).";
        };
        $("#dvs-estimate").onclick = () => {
          d.noise = 25;
          $("#dvs-noise").value = 25;
          drawScope();
          $("#dvs-result").textContent =
            "Synthetic threshold estimated at 25%; not a measured signal.";
        };
        $("#dvs-signal").oninput = (e) => {
          d.signal = Number(e.target.value);
          drawScope();
        };
        $("#dvs-noise").oninput = (e) => {
          d.noise = Number(e.target.value);
          drawScope();
        };
        drawScope();
      },
    );
  }
  function drawScope() {
    const canvas = $("#dvs-scope");
    if (!canvas) return;
    const c = canvas.getContext("2d");
    c.clearRect(0, 0, 700, 125);
    c.strokeStyle = "#214333";
    c.beginPath();
    c.moveTo(350, 0);
    c.lineTo(350, 125);
    c.moveTo(0, 62);
    c.lineTo(700, 62);
    c.stroke();
    c.strokeStyle = s.device.signal > s.device.noise ? "#74d99a" : "#d5786e";
    c.beginPath();
    for (let i = 0; i <= 300; i++) {
      const angle = (i / 300) * Math.PI * 2,
        r = (s.device.signal / 100) * 52;
      const x = 350 + Math.cos(angle) * r,
        y = 62 + Math.sin(angle) * r;
      if (i) c.lineTo(x, y);
      else c.moveTo(x, y);
    }
    c.stroke();
  }
  let midiInputs = [],
    midiStatus = "Disconnected",
    learnedType = "CC";
  const midiPairs = new Map();
  async function receiveMIDI(message) {
    s.midiLog.push(
      `${message.synthetic ? "SYNTHETIC" : message.device} · ${message.timestamp.toFixed(1)}ms · ${message.type} ch${message.channel} ${message.number}=${message.value}`,
    );
    s.midiLog = s.midiLog.slice(-100);
    if ($("#midi-log")) $("#midi-log").textContent = s.midiLog.join("\n");
    if (learn && $("#midi-channel")) {
      $("#midi-channel").value = message.channel;
      $("#midi-number").value = message.number;
      $("#midi-type").value = message.type;
      learnedType = message.type;
      learn = false;
      $("#midi-learn").textContent = "Learn next message";
      notify("Message captured. Review the target and add this mapping.");
      return;
    }
    for (const m of s.mappings) {
      const matchesNumber =
        m.encoding === "14-bit absolute" && message.type === "CC"
          ? message.number % 32 === m.number % 32
          : message.number === m.number;
      if (
        m.channel !== message.channel ||
        (m.type || "CC") !== message.type ||
        !matchesNumber
      )
        continue;
      const value = mappedValue(message, m.encoding, midiPairs),
        relative = m.encoding.startsWith("Relative");
      const d = s.decks[m.target.includes("2") ? 1 : 0];
      if (m.target.endsWith("play") && message.pressed) await a.play(d);
      if (m.target.endsWith("cue") && message.pressed)
        await a.deckAction("cue", d.index, {});
      if (m.target === "Crossfader") {
        const x = Math.max(
          -1,
          Math.min(1, relative ? engine.cross + value * 0.02 : value * 2 - 1),
        );
        engine.setCross(x);
        $("#crossfader").value = x;
      }
      if (m.target === "Library browse") {
        const tracks = a.filtered(),
          i = tracks.findIndex((t) => t.id === s.selected),
          step = relative ? Math.sign(value) : message.value > 0 ? 1 : -1;
        s.selected =
          tracks[Math.max(0, Math.min(tracks.length - 1, i + step))]?.id ||
          s.selected;
        renderTracks();
      }
      if (m.target === "Sampler 1") {
        if (message.pressed) await sampleAction(0, "play");
        else if (s.samples[s.bank][0].mode === "Hold") {
          engine.stopSample(s.bank * 8);
          s.samples[s.bank][0].playing = false;
          refresh();
        }
      }
      if (m.target === "FX depth") {
        s.fx[0][0].depth = Math.max(
          0,
          Math.min(100, relative ? s.fx[0][0].depth + value : value * 100),
        );
        applyFX();
      }
    }
  }
  const midiInput = createMIDI({
    onMessage: (m) => receiveMIDI(m).catch((e) => notify(e.message)),
    onState: (inputs) => {
      midiInputs = inputs;
      midiStatus = inputs.length
        ? inputs.map((x) => `${x.name} (${x.state})`).join(", ")
        : "No MIDI inputs connected";
      if ($("#midi-status")) $("#midi-status").textContent = midiStatus;
    },
  });
  function midi() {
    dialog(
      "MIDI mapping editor",
      `${badge("REAL INPUT WHEN SUPPORTED · EXPLICIT TEST INJECTION")}<p id="midi-status">${esc(midiStatus)}</p><div class="panel-controls"><button id="midi-connect">Connect MIDI inputs</button><button id="midi-disconnect">Disconnect input</button></div><p class="muted">Connect requests standard MIDI input only. No SysEx or hardware output is sent. Device names are enumeration evidence; received messages are separate evidence.</p><div class="form-grid"><label>Target<select id="midi-target">${options(["Library browse", "Deck 1 play", "Deck 2 play", "Deck 1 cue", "Deck 2 cue", "Crossfader", "Sampler 1", "FX depth"], "Library browse")}</select></label><label>Encoding<select id="midi-encoding">${options(["7-bit absolute", "14-bit absolute", "Relative two’s complement", "Relative offset"], "7-bit absolute")}</select></label><label>Message<select id="midi-type">${options(["CC", "Note", "Pitch bend"], learnedType)}</select></label><label>Channel<input id="midi-channel" type="number" min="1" max="16" value="1"></label><label>Controller / note<input id="midi-number" type="number" min="0" max="127" value="1"></label></div><div class="panel-controls"><button id="midi-learn">Learn next message</button><button id="midi-send">Inject synthetic CC</button><button id="midi-add">Add mapping</button><button id="midi-export">Export mapping</button><button id="midi-reset">Clear prototype mappings</button></div><div id="midi-mappings" class="log">${s.mappings.map((m, i) => `${i + 1}. ${esc(m.type || "CC")} ch${m.channel} / ${m.number} → ${esc(m.target)} · ${esc(m.encoding)}`).join("<br>") || "No mappings"}</div><div id="midi-log" class="log">${s.midiLog.map(esc).join("<br>") || "No messages received"}</div><p class="muted">Mappings control real browser actions. LED feedback, soft takeover, device-specific encodings and hardware round-trip latency remain unverified. This is Open Play JSON, not Serato MIDI XML.</p>`,
      () => {
        $("#midi-connect").onclick = async () => {
          try {
            midiStatus = "Requesting MIDI input access…";
            $("#midi-status").textContent = midiStatus;
            await midiInput.connect();
          } catch (e) {
            midiStatus = e.message;
            $("#midi-status").textContent = midiStatus;
          }
        };
        $("#midi-disconnect").onclick = () => midiInput.disconnect();
        $("#midi-learn").onclick = () => {
          learn = !learn;
          $("#midi-learn").textContent = learn
            ? "Waiting for next message…"
            : "Learn next message";
        };
        $("#midi-send").onclick = () =>
          receiveMIDI({
            type: "CC",
            channel: 1,
            number: 1,
            value: 1,
            pressed: true,
            timestamp: performance.now(),
            synthetic: true,
          });
        $("#midi-add").onclick = () => {
          s.mappings.push({
            target: $("#midi-target").value,
            encoding: $("#midi-encoding").value,
            type: $("#midi-type").value,
            channel: Number($("#midi-channel").value),
            number: Number($("#midi-number").value),
          });
          persist();
          midi();
        };
        $("#midi-export").onclick = () =>
          download(
            "open-play-mapping.json",
            JSON.stringify(
              {
                format: "open-play-midi-v1",
                physicalCompatibilityVerified: false,
                mappings: s.mappings,
              },
              null,
              2,
            ),
          );
        $("#midi-reset").onclick = () => {
          s.mappings = [];
          s.midiLog = [];
          persist();
          midi();
        };
      },
    );
  }
  function provider(name) {
    activeProvider = name;
    const p = a.providers[name],
      ps = (s.providerState[name] ??= {
        status: "Signed out",
        playlist: [],
        cached: [],
        quality: p.quality,
      });
    dialog(
      `${name} streaming`,
      `${badge("PROVIDER SIMULATION · NO LOGIN OR NETWORK")}<nav class="settings-tabs">${Object.keys(
        a.providers,
      )
        .map(
          (n) =>
            `<button data-provider-tab="${n}" class="${n === name ? "active" : ""}">${n}</button>`,
        )
        .join(
          "",
        )}</nav><div class="device-card"><h3>${name} · ${esc(ps.status)}</h3><p>${esc(p.subscription)} · ${esc(p.quality)}</p><p class="muted">${esc(p.note)}</p><div class="panel-controls"><button id="provider-connect">${ps.status === "Connected fixture" ? "Simulate sign out" : "Simulate connect"}</button><button id="provider-expired">Expired entitlement</button><button id="provider-network">Network loss</button><button id="provider-region">Region unavailable</button>${name === "Beatsource" ? '<button id="provider-migrate">Migration fixture</button>' : ""}</div></div><div class="stats"><span><strong>${p.offline ? "Locker" : "Online only"}</strong>Offline</span><span><strong>${p.stems === true ? "Supported" : p.stems === false ? "Unavailable" : "Unverified"}</strong>Stems</span><span><strong>Unavailable</strong>Recording</span><span><strong>${p.decks || "Unverified"}</strong>Simultaneous decks</span></div><div class="panel-controls"><label>Search <input id="provider-search" placeholder="Find fixture tracks"></label><button id="provider-refresh">Refresh playlist</button><button id="provider-create">Create playlist fixture</button></div><div id="provider-results"></div><div class="note-box">These are fabricated catalog entries for interaction review, not tracks from ${name}. Local audio stays available through every provider failure. No subscription is purchased or bypassed.</div>`,
      (body) => {
        body
          .querySelectorAll("[data-provider-tab]")
          .forEach((b) => (b.onclick = () => provider(b.dataset.providerTab)));
        const results = () => {
          const q = $("#provider-search").value.toLowerCase();
          $("#provider-results").innerHTML = [
            "Catalog fixture A",
            "Catalog fixture B",
            "Catalog fixture C",
          ]
            .filter((x) => x.toLowerCase().includes(q))
            .map(
              (title, i) =>
                `<div class="setting"><span>${title}</span><span><button data-provider-add="${i}">${ps.playlist.includes(i) ? "In playlist" : "Add to playlist"}</button> <button data-provider-cache="${i}" ${p.offline ? "" : "disabled"}>${ps.cached.includes(i) ? "Cached fixture" : "Cache fixture"}</button></span></div>`,
            )
            .join("");
          body.querySelectorAll("[data-provider-add]").forEach(
            (b) =>
              (b.onclick = () => {
                const i = Number(b.dataset.providerAdd);
                if (!ps.playlist.includes(i)) ps.playlist.push(i);
                else ps.playlist = ps.playlist.filter((x) => x !== i);
                results();
              }),
          );
          body.querySelectorAll("[data-provider-cache]").forEach(
            (b) =>
              (b.onclick = () => {
                if (ps.status !== "Connected fixture")
                  return notify("Connect the provider fixture first.");
                const i = Number(b.dataset.providerCache);
                if (!ps.cached.includes(i)) ps.cached.push(i);
                results();
              }),
          );
        };
        $("#provider-search").oninput = results;
        $("#provider-connect").onclick = () => {
          ps.status =
            ps.status === "Connected fixture"
              ? "Signed out"
              : "Connected fixture";
          provider(name);
        };
        for (const [id, status] of [
          ["expired", "Subscription expired fixture"],
          ["network", "Offline fixture"],
          ["region", "Region unavailable fixture"],
        ])
          $("#provider-" + id).onclick = () => {
            ps.status = status;
            provider(name);
          };
        if ($("#provider-migrate"))
          $("#provider-migrate").onclick = () => {
            ps.status = "Migration pending fixture";
            provider(name);
          };
        $("#provider-refresh").onclick = () => {
          results();
          notify("Fixture playlist refreshed; no remote request made.");
        };
        $("#provider-create").onclick = () => {
          ps.playlistName = `Practice playlist ${ps.playlistName ? 2 : 1}`;
          notify(ps.playlistName + " created in simulation.");
        };
        results();
      },
    );
  }
  function analysis() {
    dialog(
      "Analysis and caches",
      `<div class="note-box">Browser audio decoding and waveform drawing run locally. BPM/key values on demo tracks are known generation annotations, not model outputs. Imported-track tempo/key must be entered manually. Gain estimation and automatic/variable beatgrids are not implemented.</div><div class="panel-controls"><button id="analysis-run">Analyze selected waveform</button><button id="analysis-stems">Stems queue fixture</button><button id="analysis-clear">Clear waveform cache</button></div><div class="settings-grid"><label class="setting">Analyze on import<input type="checkbox" checked></label><label class="setting">BPM range<select>${options(["70–140", "98–195", "140–280"], "70–140")}</select></label><label class="setting">Reanalyze key<input type="checkbox"></label><label class="setting">Reanalyze BPM / grid<input type="checkbox"></label></div><p class="muted">Analysis options above are reference-state fixtures. Protected beatgrids are skipped by the browser waveform queue.</p>`,
      () => {
        $("#analysis-run").onclick = () => {
          $("#modal").close();
          $("#analyze").click();
        };
        $("#analysis-stems").onclick = stems;
        $("#analysis-clear").onclick = () => {
          engine.buffers.clear();
          notify(
            "Browser waveform cache cleared; playing sources retain their loaded audio.",
          );
        };
      },
    );
  }
  function help() {
    dialog(
      "Help & keyboard controls",
      `<div class="help-grid">${helpKeys.map(([name, key]) => `<div><span>${name}</span><kbd>${key}</kbd></div>`).join("")}</div><div class="note-box">Shortcuts listed here are implemented prototype bindings. The full reference shortcut inventory includes unresolved right-deck loop-key conflicts and Play expansion differences. Browser-reserved shortcuts and Escape behavior differ from the native app.</div><div class="panel-controls"><button id="help-coverage">Coverage report</button><button id="help-stems">Stems preparation</button><button id="help-system">Diagnostics / services</button><label>Search official help <input id="help-search"></label><button id="help-go">Search</button></div><p class="muted">Control descriptions use native browser tooltips. Context menu / right-click a track for metadata and missing-file fixtures; right-click a cue to rename or edit it.</p>`,
      () => {
        $("#help-coverage").onclick = coverage;
        $("#help-stems").onclick = stems;
        $("#help-system").onclick = system;
        $("#help-go").onclick = () =>
          window.open(
            "https://support.serato.com/hc/en-us/search?query=" +
              encodeURIComponent($("#help-search").value),
            "_blank",
            "noopener",
          );
      },
    );
  }
  const routeNotes = {
    library:
      "Real local import, selection, search, sort, metadata fixtures, crates, multi-rule smart crates, nested membership, collapse, favorites and backups. Native tags, filesystem import and interoperability remain gaps.",
    history:
      "Real in-session play history, Prepare and CSV export. Live publication, persistent session editing and exact reference rules remain gaps.",
    analysis:
      "Real browser decoding/overview. Automatic BPM/key/gain, variable grids and model analysis remain gaps.",
    decks:
      "Real local play/pause/seek, rate, cues, loops, beat jump and instant-double positioning. Reverse, Slip restoration, cue-hold and slicer now drive actual browser audio. DVS, keylock/Pitch Play, full Smart Sync and exact reference edge states remain gaps.",
    mixer:
      "Real gain, EQ/filter, channel level and linear crossfade. Headphone routing, external mixing, exact power curves and native meters remain unverified.",
    fx: "Four independent browser DSP processors with measured output and deck/sampler/master assignment. Other 55 names remain inventoried with DSP enable disabled; their schemas and all sonic-equivalence claims remain unresolved.",
    sampler:
      "Real Trigger/Hold/OnOff, repeat, pitch/gain/mute and cue/loop start on browser master. Key-preserving stretch, shared file gain semantics and native output routing remain gaps; see functional report for executed subsets.",
    stems:
      "Interactive mute/effect and prepare/cancel/failure fixtures. No separation model or isolated audio.",
    scratch:
      "Real slot assignment, deck load, cue start and previous-track return. Hardware pads/LED and keylock remain simulated.",
    flip: "Timed cue/reverse automation drives real browser playback; six per-track saves and load/rename/delete controls. Native metadata, Censor, exact On behavior and timing parity remain open.",
    recording:
      "Real browser master stream capture/download. Native AIFF/WAV, pre-master/external inputs, auto-split and recovery are simulated or gaps.",
    audio:
      "Settings/route/recovery fixtures. Real output is the browser default device; no multi-output or latency proof.",
    hardware:
      "Device and DVS/CDJ/Phase states are explicit simulations. No actual hardware controls or diagnostics are sent.",
    midi: "Real Web MIDI connection path, learn/mapping and timestamped messages; synthetic injection is explicitly marked. Actual access timed out in this browser. No physical input/output, feedback or interoperability proof.",
    video:
      "Local video decode, two-source Canvas compositor, text/image overlays, audio-linked transport and actual video/master capture. Full codecs, karaoke, HD, Syphon and exact effect/transition catalogs remain gaps.",
    link: "Join/leave/tempo/peer/loss state simulation; no Link networking.",
    providers:
      "Six provider-specific interactive access/playlist/cache/failure fixtures. No provider credentials, catalog or streaming integration.",
    settings:
      "Eight settings tabs with persisted values and conditional actions. Some settings affect prototype behavior; native processing controls are explicit fixtures. Exact layout/conditional-state parity remains open.",
    help: "Implemented shortcut list, contextual titles, official search and diagnostics. Native accessibility/screen-reader equivalence untested.",
    system:
      "Research, provenance and lifecycle diagnostics with explicit native gaps. No installer, updater or native build exists.",
  };
  function coverage() {
    dialog(
      "Coverage & evidence",
      `<div class="stats"><span><strong>${a.features.length}</strong>Feature groups accounted for</span><span><strong>${a.requirements.length}</strong>Research requirements</span><span><strong>59</strong>Named DJ effects</span><span><strong>Not verified</strong>1:1 parity</span></div><div class="note-box">Full scope remains the target. This review prototype combines real browser interactions, explicit simulations and known gaps. A route or feature title does not mean its native acceptance passed. Open each entry for its boundary and source-linked requirements.</div><div class="coverage-filter"><input id="coverage-search" aria-label="Search feature coverage" placeholder="Search feature, ID, requirement or behavior"><select id="coverage-domain" aria-label="Feature domain"><option value="">All domains</option>${[...new Set(a.features.map((f) => f.route))].map((r) => `<option>${r}</option>`).join("")}</select><button id="coverage-export">Export manifest</button></div><div id="coverage-list"></div>`,
      () => {
        const render = () => {
          const q = $("#coverage-search").value.toLowerCase(),
            domain = $("#coverage-domain").value;
          $("#coverage-list").innerHTML = a.features
            .filter(
              (f) =>
                (!domain || f.route === domain) &&
                `${f.id} ${f.title} ${a.requirements
                  .filter((r) => r.feature_id === f.id)
                  .map((r) => r.id + " " + r.expected)
                  .join(" ")}`
                  .toLowerCase()
                  .includes(q),
            )
            .map((f) => {
              const reqs = a.requirements.filter((r) => r.feature_id === f.id);
              return `<details class="coverage-row"><summary><span class="muted">${f.id}</span><strong>${esc(f.title)}</strong>${badge("PARITY OPEN")}</summary><div class="coverage-detail"><p>${esc(routeNotes[f.route])}</p><p><strong>Native acceptance:</strong> ${esc(f.acceptance)}</p><p><strong>Models:</strong> Codex ${esc(f.routing.codex.model)} / ${esc(f.routing.codex.effort)} · Claude Code ${esc(f.routing.claude_code.model)} / ${esc(f.routing.claude_code.effort)}. Recommendations, not execution; revalidate availability.</p><button data-coverage-route="${f.route}">Open ${f.route} review surface</button><div class="requirements"><table><thead><tr><th>Requirement</th><th>Expected behavior</th><th>Reference evidence</th></tr></thead><tbody>${reqs.map((r) => `<tr><td>${r.id}<br>${esc(r.trigger)}</td><td>${esc(r.expected)}</td><td><a href="${esc(r.source_url.startsWith("http") ? r.source_url : "../docs/research/" + r.source_url)}" target="_blank" rel="noopener">${esc(r.evidence)}</a></td></tr>`).join("") || '<tr><td colspan="3">Detailed extraction remains open. The feature-level acceptance above is retained; this is not a coverage pass.</td></tr>'}</tbody></table></div></div></details>`;
            })
            .join("");
          $$("[data-coverage-route]").forEach(
            (b) =>
              (b.onclick = () => {
                $("#modal").close();
                open(b.dataset.coverageRoute);
              }),
          );
        };
        $("#coverage-search").oninput = render;
        $("#coverage-domain").onchange = render;
        $("#coverage-export").onclick = () =>
          download(
            "open-play-coverage.json",
            JSON.stringify(
              {
                reference: "4.0.10.213",
                nativeApproved: false,
                fullParityVerified: false,
                features: a.features.map((f) => ({
                  id: f.id,
                  title: f.title,
                  route: f.route,
                  boundary: routeNotes[f.route],
                  requirements: f.requirement_ids,
                })),
                requirements: a.requirements,
              },
              null,
              2,
            ),
          );
        render();
      },
    );
  }
  function system() {
    dialog(
      "System, services & evidence",
      `<div class="device-card"><h3>Open Play · browser review candidate</h3><p>Independent HTML/CSS/JavaScript implementation. No native application has been built. No hosted backend, account, telemetry, model download or artificial local feature paywall is required.</p><div class="panel-controls"><button id="diagnostics-export">Export diagnostics</button><button id="diagnostics-offline">Check local state</button><button id="system-backup">Library backup</button></div><pre id="diagnostic-result" class="log">Audio context: ${engine.ctx?.state || "not created"}\nBrowser sample rate: ${engine.ctx?.sampleRate || "unknown"}\nDecoded buffers: ${engine.buffers.size}\nPrototype persistence: ${s.sessionSaved ? "saved this session" : "not yet saved this session"}\nNative build: NOT STARTED\nHardware proof: NOT ESTABLISHED</pre></div><div class="note-box">Installer/update/rollback, full crash recovery, long-session stability, multi-device drift, extension isolation and reproducible native builds remain acceptance work. Browser file access is session-scoped; imported audio bytes are not persisted. No source Serato binaries, artwork, models or code are shipped here.</div><p><a href="../FULL_BUILD_PLAN.md" target="_blank">Build plan</a> · <a href="../docs/research/SOURCE_CONFLICTS.md" target="_blank">Source conflicts</a> · <a href="../docs/research/HISTORICAL_GATING.md" target="_blank">Historical gating</a> · <a href="../docs/decisions/001-foundation-and-models.md" target="_blank">Foundation / model decision</a></p>`,
      () => {
        $("#diagnostics-export").onclick = () =>
          download(
            "open-play-diagnostics.json",
            JSON.stringify(window.openPlay.exportDiagnostics(), null, 2),
          );
        $("#diagnostics-offline").onclick = () => {
          $("#diagnostic-result").textContent +=
            "\nLocal controls do not call external APIs. Actual offline reload/playback must be tested separately; this button is not that test.";
        };
        $("#system-backup").onclick = libraryTools;
      },
    );
  }
  function tick() {
    if (s.panel === "flip" && $("#flip-events")) {
      const f = s.flip;
      $("#flip-events").textContent =
        (f.on ? "PLAYING · " : f.armed ? "RECORDING ARMED · " : "STOPPED · ") +
        f.events.length +
        " events · " +
        time(f.duration || 0) +
        "\n" +
        f.events
          .map(
            (e) =>
              time(e.offset || 0) +
              " " +
              (e.kind === "reverse"
                ? e.reverse
                  ? "Reverse"
                  : "Forward"
                : "Cue " + (e.cue + 1) + " → " + time(e.position)),
          )
          .join("\n");
      $("#flip-on").classList.toggle("active", !!f.on);
    }

    if ($("#record-time") && engine.recording)
      $("#record-time").textContent = time(
        engine.ctx.currentTime - engine.recordStarted,
      );
    if (s.panel === "video") videoMixer.tick();
  }

  return {
    open,
    refresh,
    grid,
    newCrate,
    crateDetails,
    trackDetails,
    editPad,
    columns,
    libraryTools,
    provider,
    sampleAction,
    releaseSampleHolds,
    tick,
  };
}
