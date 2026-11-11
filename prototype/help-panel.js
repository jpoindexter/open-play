export function showHelp({dialog,$,helpKeys,coverage,stems,system}) {
    dialog(
      "Help & keyboard controls",
      `<div class="help-grid">${helpKeys.map(([name, key]) => `<div><span>${name}</span><kbd>${key}</kbd></div>`).join("")}</div><div class="note-box">Temporary deck Cue: while paused, press to set the cue at the current position; hold to audition, release to return paused. Hold Cue and press Play to continue after release. Mixer headphone CUE selects a deck for the separate headphone bus; configure its output in Devices. Computer stereo alone does not provide independent headphone monitoring.</div><div class="note-box">Shortcuts listed here are implemented prototype bindings. The full reference shortcut inventory includes unresolved right-deck loop-key conflicts and Play expansion differences. Browser-reserved shortcuts and Escape behavior differ from the native app.</div><div class="panel-controls"><button id="help-coverage">Coverage report</button><button id="help-stems">Stems preparation</button><button id="help-system">Diagnostics / services</button><button id="help-manual">Open Play manual ↗</button><label>Search Open Play manual <input id="help-search" type="search"></label><button id="help-go">Search ↗</button></div><p class="muted">The illustrated manual opens online in your browser. These keyboard controls remain available offline.</p><p class="muted">Control descriptions use native browser tooltips. Context menu / right-click a track for metadata and missing-file fixtures; right-click a cue to rename or edit it.</p>`,
      () => {
        $("#help-coverage").onclick = coverage;
        $("#help-stems").onclick = stems;
        $("#help-system").onclick = system;
        $("#help-manual").onclick = () => window.open("https://open-play-help.vercel.app/", "_blank", "noopener,noreferrer");
        $("#help-go").onclick = () =>
          window.open(
            "https://open-play-help.vercel.app/?q=" +
              encodeURIComponent($("#help-search").value.trim()),
            "_blank",
            "noopener,noreferrer",
          );
        $("#help-search").onkeydown = event => {
          if (event.key === "Enter") { event.preventDefault(); $("#help-go").click(); }
        };
      },
    );
  }
