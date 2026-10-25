# rekordbox interface extraction 208

**25 October update:** The current MCP connection now opens the same installed binary and successfully captures 2Deck Horizontal (279 nodes). The historical Hopper/MCP blockage below does not describe today's connection. Fresh design-system extraction, limits and application: [rekordbox reference](../design-system/REKORDBOX_REFERENCE_2026-10-25.md). The saved Vertical evidence below remains historical evidence for the same executable, not fresh operation.

19 October 2026. Installed rekordbox 7.2.19.0342, Performance mode. This is an interface reference for the existing HTML prototype. No Open Play native build, DSP, controller mapping or vendor app modification.

## REA now captures the running app

The first standalone `observe-native-ui` execution failed with `target-limit`: the running executable is 301,587,792 bytes, above REA's 268,435,456-byte identity-check budget. At the user's explicit request, patched **only** the guard and corresponding message in REA 6.5.0 `bridge/native/ReaNativeUI.swift` from 256 to 512 MiB. The executable realpath, full SHA-256, launch identity, selected-window owner, layer, geometry and OS permission checks remain intact. Screenshot/AX output budgets are unchanged. Original helper backup, patch, before/after hashes and failed/successful envelopes are retained privately. The minimal reproducible patch is `tools/patches/rea-6.5.0-native-ui-512mib.patch`.

The actual formerly failing command was rerun against the same PID 43674, window 156167 and executable. **Executed:** Two Deck Vertical, 294 nodes; Four Deck Vertical, 500 nodes. Both returned success, no reported gaps and `truncated:false`, with 1512×949 selected-window PNGs. Full JSON envelopes include authenticated target and screenshot digests. See `REA_INTERFACE_EXTRACTION_208.json` for evidence IDs and counts. This establishes successful REA capture of those two states, not all app screens or behaviors.

The old **MCP connection remains a separate unresolved problem**: `open_binary` still returns `cleanup_incomplete` from the October 18 Hopper session. Its recorded PID 67308 is no longer live. REA's current session reports no target open. The cleanup acknowledgement and retained `/tmp/rea-wWEcrQ` were not forged, erased or bypassed. Computer control of the Codex app is unavailable, so the live MCP connection could not be reconnected through its UI here. Fresh standalone REA processes are verified and usable now. Reconnect REA before claiming that persistent MCP session repaired. No unrelated REA servers, Hopper documents or Ghidra sessions were killed.

## Static extraction through REA

`inspect-artifact` succeeded: **10,266 content nodes, 12,369 occurrences**, including **2,460 skin occurrences**, container-entry coverage complete within its inventory contract. Occurrences include nested copies and containers; this is not a count of unique features. The report preserves hashes, exact paths and explicit unexplored format-specific branches. It inventories files; it does not prove rendering or behavior.

`decode-interface-builder` succeeded: three NIB archives, 75 graph nodes, seven edges. Two archives belong to the nested Electron helper menu; one is the Recent Files menu template. Two document hierarchies are incomplete. These archives **do not supply the main deck/mixer layout**. Runtime-generated geometry, constraints and undocumented private fields remain unknown. No NIB/action selector is treated as proof of a working implementation.

Private raw evidence: `local-evidence/rekordbox-rea-interface-208/`. No vendor source, skin images or audio assets are copied into the prototype or committed as implementation assets.

## Visible interface inventory

REA screenshots directly establish the visible arrangement. REA's node schema contains role/title/value/action/path/child count but omits help text, descriptions and per-control bounds. Native CUA AX captures supplement these omissions and are separately saved as `native-*.ax.txt`; their tooltips are declarative UI descriptions, not tested DSP behavior. Four layout screens were saved through CUA: 2/4 Deck × Horizontal/Vertical. Only the two Vertical states above are REA runtime captures.

| Area | Observed composition and controls | Limits / Open Play implication |
|---|---|---|
| Global toolbar | Performance selector; 2/4 layout selector; FX, sampler, mixer and recording visibility; Link; master output; Preferences | Panel buttons observed. No all-panel workflow claim. |
| Deck header | Artwork, title, artist, original BPM, key, elapsed/remaining time, key sync, beat sync, sync multiplier, Master, semitone down/up and reset | Key analysis and sync algorithms are not verified by labels. Preserve actual Open Play metadata; track missing multiplier/master semantics. |
| Track overview | Full-length waveform directly below each header; empty deck overview is black | Main time-detail waveform and overview are separate regions. |
| Vertical detail | Narrow shared center above mixer, red playhead indicators, beat ruler, bar count, zoom in/reset/out, deck navigation | Screenshot shape observed; rendering algorithm and hidden overlay states unknown. |
| Cue banks | In 4V, A–D / E–H two columns; mode selector beneath. AX also exposes I–P on some banks behind scrolling | Open Play's eight cues are not 16-cue parity. Do not silently add unimplemented cue labels. |
| Loop controls | Narrow block beside cues: beat length, halve/double, AU/MA | Keep loop controls grouped; avoid stretched full-width loop bands. Native manual-loop behavior not exercised. |
| Transport | INT selector with CUE above Play, beside platter; right deck grouping mirrored | Reuse original bound controls. Do not turn this into an accordion. |
| Jog/BPM | Circular platter, BPM, tempo percentage/range, Slip/Q/MT adjacent | Loaded and empty states visible. Hardware scratching is outside this capture. |
| Mixer 4V | Four equal-width channel columns in one row, TRIM/HIGH/MID/LOW vertically stacked, CUE then fader | Native compact screenshot has no extra always-visible Filter row. Existing optional Open Play filter remains a separately controlled feature. |
| Mixer 2V | Two mirrored channels with trim/fader toward outside and EQ toward center | Two-deck layout is not simply a squashed four-strip row. |
| EQ labels | Native AX reports HIGH/MID/LOW as kill switches; TRIM label switches trim/auto gain | Not equivalent to rotary input labels. Track source semantics separately. No DSP acceptance from tooltips. |
| Shared bottom bar | Headphone MIX and LEVEL left of central crossfader; channel assignments on both sides | Crossfader centered in full workspace, outside deck panels. |
| Browser | Collection tree, list slots, Preview waveforms, artwork, title, artist, album, genre, BPM, rating, time, key, search, browser-mode tools | Library content is screenshot-observed; custom collection rows are largely absent from selected AX inventory. Thumbnail presence does not prove audition/seek. |
| View menu | Browse, split screen, My Tag, Related Tracks, Track Suggestion, information, vertical/horizontal sub-browser, Automix | Observed menu entries only; not exercised feature parity. Keep later work behind core DJ priority. |

## Measured layout reference

From the **actual REA Four Deck Vertical** PNG, 1512×949, measured approximately ±2 screen pixels: left deck region x0–629, center x629–883 (254px, about 16.8% width), right decks x883–1512. Toolbar ends y57. Top decks end y264; lower decks end y474. Thus each four-deck row is about 208px. Each header is about50px; overview44px; cue/loop/jog band about112px. Mixer begins y239 and spans to y474. Shared monitor/crossfader bar y474–517, then library. These are visual measurements from this window, not recovered native layout constants or responsive rules.

Two Deck Vertical uses a taller control area and one-column cue bank; Four Deck Vertical compresses that bank into two columns. This confirms why density needs a layout change, not merely shrinking blank container heights. The reference regions are flat and divider-based. `REKORDBOX_INTERFACE_TOKENS_208.json` contains sampled primitive colors, inferred semantic aliases and confidence labels. Exact font family, hidden states and native layout source remain unknown.

## Prototype status and remaining boundary

HTML207 already replaces the rejected stretched loop band with actual two-column cue controls, narrow loop block, stacked CUE/Play and mirrored jog/options. Its documented browser checks remain valid for the tested paths; this extraction does not grant visual approval or native/full parity. The Full/Loops → user chooses Compact branch has not been executed and remains an explicit follow-up. Do not infer all-mode state coverage from the Cues checks. No further HTML implementation change is made as part of this tool-limit repair.

Trello REF-RB-01 holds extraction and remaining evidence gaps; UI-RB-06 holds Compact correction/approval. Core DJ remains the active implementation priority. Model recommendations retained: Codex gpt-6.1-sol/high; Claude Code Sonnet 5/high for independent evidence audit, subject to actual availability. Do not launch additional agents or native builds from this report.
