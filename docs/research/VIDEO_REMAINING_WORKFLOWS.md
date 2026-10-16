# Remaining Video workflows

Research snapshot: **2026-10-16**. This is an implementation contract, not executed feature acceptance. Fresh official Serato pages and primary format/code sources were read. No native application, shared browser, decoder, third-party executable or remote record was controlled. The installed 4.0.10 target comes from prior local evidence; its runtime behavior was not re-observed here.

The accompanying [JSON](VIDEO_REMAINING_WORKFLOWS.json) records source status, packet fields, compatibility conflicts, 23 proposed acceptance cases and per-feature model routing. No implementation was added.

## What official Serato sources establish

| Workflow | Documented behavior | Version/proof limit |
|---|---|---|
| MP3+G karaoke | Separate `.cdg` visuals and `.mp3` audio; unzip first, import both, see one karaoke library item; Video is needed for visuals. | The [official karaoke guide](https://serato.com/latest/blog/18236/learn-karaoke-support) is dated August 4, 2022 but describes DJ 1.7.4. [Current format support](https://support.serato.com/hc/en-us/articles/202305724-Serato-Video-supported-formats-and-codecs) lists MP3+G. Pair matching and 4.0.10 rendering remain unknown. |
| Media Crate | When enabled, supplies visuals for audio without associated video. The [2014 guide](https://serato.com/latest/blog/17141/pro-tips-use-the-media-crate) describes playing a selected visual alongside the loaded audio and Random/Next selection. | Historical official guidance, not current native observation. Both blog pages returned HTTP 200 via direct HTTP read after the web reader timed out. |
| Media controls | On/Off controls fallback loading; Random changes selection; Next forces selection. A special `Media...` crate is documented. | [ITCH 2.2.2 notes](https://serato.com/itch/downloads/2.2.2/releasenotes), September 25, 2012. Current persistence, end-of-clip policy, wrap, repeat avoidance and empty/error handling are unspecified. |
| Automatic transitions | Enabled audio/video track loads choose a transition; sequential selection unless Random is enabled; Next forces another selection. | Independently documented in [Scratch Live 2.4.3 notes](https://serato.com/scratchlive/downloads/2.4.3/releasenotes). This concerns selection, not continuous crossfader motion. |
| Audio/video FX coupling | Audio echo can produce visual echo; audio distortion can distort the image. | [Current expansion page](https://serato.com/dj/pro/expansions). It does not give a current effect map, transfer functions, assignment/tail rules or processing order. |

The [4.0 library status page](https://support.serato.com/hc/en-us/articles/234766088-Library-Status-Icons) still identifies karaoke items and a Video license requirement. The [2020 streaming guide](https://the-drop.serato.com/how-to/using-serato-video-for-live-streaming/) also describes random crate visuals and explicit track associations. These corroborate feature existence, not exact 4.0.10 behavior.

No inspected source establishes whether fallback video completion loops, holds its last frame or advances to another clip; whether selecting fallback causes a second automatic-transition event; or whether Random excludes the current item. These need a declared independent policy or reference observation. Do not infer end-of-clip autoplay from track-load fallback. The existing ordinary DJ library Autoplay feature is a separate concept.

## CD+G format: useful facts, with source boundaries

Jim Bumgardner's [CD+G Revealed](https://jbum.com/cdg_revealed.html) is an informal 1995 explanation, explicitly based on recollection. It is not the retrieved Philips/Sony normative standard. The raw stream uses 24-byte packets: command at 0, instruction at 1, parity at 2–3 and 20–23, data at 4–19. Mask command/instruction with `0x3f`; command `9` identifies graphics. Non-graphics packets still occupy timeline positions.

The pinned [FFmpeg demuxer](https://raw.githubusercontent.com/FFmpeg/FFmpeg/0b19c65afeed73ce7498ae7faa8fe95530b8a6ab/libavformat/cdg.c) establishes 300 packet positions per second, with packet index as timestamp units. This implies 7,200 raw bytes/second and a complete-stream duration of `completePackets/300`. This is command timing, not a required display refresh rate. Never remove timing packets when constructing the timeline.

Preserve a **300 × 216 index buffer**, with 16 palette entries. Each tile is 6 × 12; row is `d2 & 31`, column is `d3 & 63`, and bit 5 of each of the 12 row bytes is the leftmost pixel. XOR acts on palette indices, so retain indices even when two entries have identical RGB. These packet/tile facts are described by [CD+G Revealed](https://jbum.com/cdg_revealed.html).

| Instruction | Data and state effect | Primary corroboration |
|---|---|---|
| 1 Memory Preset | `d0 & 15` fills the index buffer; `d1 & 15` records redundancy/repeat. Ignoring nonzero repeats is an optional reliable-stream optimization. | [CD+G Revealed](https://jbum.com/cdg_revealed.html) |
| 2 Border Preset | Color `d0 & 15`; outer 6-pixel left/right and 12-pixel top/bottom bands. | [VLC decoder](https://raw.githubusercontent.com/videolan/vlc/master/modules/codec/cdg.c) |
| 6 / 38 Tile Normal / XOR | Colors `d0 & 15`, `d1 & 15`; replace indices or XOR them with the selected color index. Reject rows outside 0–17 and columns outside 0–49. | [Pinned FFmpeg decoder](https://raw.githubusercontent.com/FFmpeg/FFmpeg/0b19c65afeed73ce7498ae7faa8fe95530b8a6ab/libavcodec/cdgraphics.c) |
| 20 / 24 Scroll Preset / Copy | `d0` supplies fill color. H/V command bits 4–5: 0 none, 1 right 6/down 12, 2 left 6/up 12. Preset fills uncovered pixels; Copy wraps them. Low H 3 bits and V 4 bits provide persistent fine offsets, valid 0–5 and 0–11. | [VLC decoder](https://raw.githubusercontent.com/videolan/vlc/master/modules/codec/cdg.c) |
| 30 / 31 CLUT Low / High | Eight entries per command, lower/upper palette half. Two masked six-bit bytes form a 12-bit RGB value; expand each nibble by 17. Existing pixels must recolor when their index's palette entry changes. | [Pinned browser renderer](https://raw.githubusercontent.com/bhj/cdgraphics/494ae6be27e14b2351a6bf4a15320c085f888f50/src/cdgraphics.ts) |
| 28 Transparency | Compatibility conflict below; choose an explicit supported profile. | Primary implementations disagree. |

### Preserve these compatibility disagreements

**Crop:** informal safe-area prose mentions 294 × 204, whereas the explicit rectangle `[6,12,294,204)` has size **288 × 192**. [PyKaraoke's decoder](https://raw.githubusercontent.com/kelvinlawson/pykaraoke/master/_pycdgAux.c) and VLC use 288 × 192 visible output within full storage. Keep full storage; an optional crop is an explicit presentation policy. Do not allocate a 294 × 204 framebuffer or discard border tiles needed for scrolling. CDGFix's [technical page](https://www.cdgfix.com/help/3.x/Technical_information/The_CDG_graphics_format.htm) also contains inconsistent dimensional arithmetic; its prose is not a substitute for bounds checks.

**Transparency:** the pinned browser implementation uses `d0 & 15` as one fully transparent palette index. Current FFmpeg instead reads 16 six-bit alpha values using `255 - ((d[i] & 63) << 2)`; that observed mapping leaves alpha 3 at the maximum input. The inspected VLC decoder does not implement instruction 28. Therefore FFmpeg is not a universal transparency oracle, and Serato's choice remains unknown. Start with an explicit `index` profile; an optional `alpha-table` profile needs separate fixtures. Do not heuristically guess a profile from arbitrary payload bytes or make background keying automatic.

**Channels and parity:** [CDGFix](https://www.cdgfix.com/help/3.x/Technical_information/The_CDG_graphics_format.htm) documents 16 selectable tile channels; examined general decoders commonly ignore channel selection. All-channel playback is a defensible first scope, with selective channel decoding explicitly open. Exact channel-bit mapping has not been independently established here. No parity correction implementation was selected; preserving packet alignment and validating bounds does not prove error correction.

## Proposed independent browser implementation

Keep parsing independent from Canvas: `createCDGDecoder(bytes, {transparency: 'index'})` returns `renderAt(seconds, {crop:false})`, `reset()`, `dispose()` and diagnostics. Full state comprises indices, CLUT, transparency, fine offsets, packet cursor and asset ownership. These are original architectural choices, not Serato API claims.

Use the engine's original audio-track position. Define the boundary explicitly: packet `k` has timestamp `k/300`; at time `t ≥ 0`, process through packet `floor(t*300)` inclusive, clamped to complete packets. Thus packet 0 applies at time 0. Pause freezes time; seeks, reverse and loops require reset/replay or a complete checkpoint plus replay. A byte-offset jump alone cannot reconstruct the preceding palette/graphics. Rendering may occur once per display frame after all due packets are decoded.

The first decoder should apply valid Memory Preset repeats, initialize to declared opaque black/index 0, skip unknown commands without collapsing their time, skip an entire invalid tile, diagnose trailing 1–23 bytes, clamp invalid fine offsets to 5/11, and treat reserved scroll direction 3 as no coarse movement. These are explicit recovery policies. They are not parity repair or universal damaged-disc compatibility. Beyond graphics EOF, retain the last frame while audio authority determines playback end.

Use explicit local audio/CDG pair selection first. Matching basenames may assist selection but must be labeled an independent convenience; the retrieved official source does not specify filename/case/Unicode ambiguity handling. ZIP decompression is not a first-slice prerequisite because the official import guide requests unzipping. Asset loads require deck/asset generations so a late decode cannot overwrite a newer track; eject/reset must clear prior graphics. Metadata persistence cannot restore missing file bytes.

For Media Crate, retain an ordered local list plus enabled/random/cursor state, distinct from transition enabled/random/selected state and automatic fader motion. Explicit associated video wins. Treat an external track load and its fallback selection as one logical transaction so one load selects one transition; this deduplication is a proposed policy. Keep current valid media until replacement commits; stale generations lose ownership. Empty/corrupt candidates need visible outcomes. Choose and disclose loop/hold/advance behavior rather than claiming a documented autoplay policy.

For audio/video FX coupling, create an opt-in semantic bridge from audio FX identity, enable state, target assignments, amount and beat timing to dedicated visual processors. Start with independently specified Echo and Distortion links only. FFT/bass-reactive rendering is a separate input path; measured bands do not tell which audio effect is enabled. Preserve normal video slots and audio output when the bridge is off. Link disable/switch/load/seek/pause/stop and Reduced Motion need explicit history/tail policies before implementation; do not claim all 59 audio FX have recovered visual mappings. The prior local hidden AUDIO_LINKED list remains inventory evidence, not that mapping.

## Acceptance before claiming each feature

All **23 cases are proposed, not executed**; details are in the JSON.

- CDG-01–12: packet-boundary timing including no-ops; both CLUT halves and recoloring; asymmetric edge tiles; reversible XOR with duplicate RGB entries; full/border presets; every coarse scroll direction plus fill/wrap and fine offsets; index transparency and optional alpha-table separately; pause/rate/seek/reverse/loop against fresh replay; malformed streams; cancellation/disposal; explicit pair import; actual Canvas pipeline/capture with audible and visual markers.
- MEDIA-01–06: fallback eligibility versus association; sequential/seeded-random/Next; actual playback and audio isolation; declared clip-end policy; competing loads/decode errors/resource release; one transition selection per logical load without conflating fader motion.
- LINK-01–05: static/silent-spectrum semantic FX activation versus bass-only reactive fixtures; target isolation and parameter changes; lifecycle/tails/cancellation; link-off noninterference; Reduced Motion. Use pixels and audio markers, not selected labels, to establish behavior.

Use original synthetic CDG packets and original generated audio. Do not bundle commercial lyrics, karaoke tracks or vendor graphics. Any external media needs separate rights/provenance.

## Source code and licenses

FFmpeg was pinned at **`0b19c65afeed73ce7498ae7faa8fe95530b8a6ab`**; exact decoder/demux paths are linked above. Their headers state LGPL 2.1 or later. The project's [license explanation](https://ffmpeg.org/legal.html) distinguishes optional GPL components; no FFmpeg package or code reuse is approved by this report. PyKaraoke and VLC decoder headers also state LGPL 2.1 or later.

The browser comparator was pinned at **`494ae6be27e14b2351a6bf4a15320c085f888f50`**. Its [LICENSE](https://raw.githubusercontent.com/bhj/cdgraphics/494ae6be27e14b2351a6bf4a15320c085f888f50/LICENSE) contains MIT wording and notices, while its package/README say ISC. Resolve that discrepancy before importing code. It is evidence of an implementation, not automatically a correctness oracle. Mixxx's [karaoke issue](https://github.com/mixxxdj/mixxx/issues/6875) is a feature request; no Mixxx CDG decoder was established. Do not assume one exists or copy GPL code as a format specification.

Recommended first slice: an original packet interpreter from the factual contract, with no external decoder code/assets copied. This is an implementation recommendation, not a patent or licensing clearance.

## Preserve existing per-feature LLM routing

These recommendations preserve [the feature registry](../delivery/feature-registry.json); availability was not freshly checked against a host or Claude CLI. Verify exact IDs at invocation. Claude is optional and was not invoked here.

| Work unit | Codex | Claude Code alternative | Registry basis |
|---|---|---|---|
| CDG interpreter, transport sync, cancellation/checkpoints | `gpt-6.1-sol`, `xhigh` | `claude-opus-5`, `high` | VID-001 |
| Media Crate selector, metadata and UI | `gpt-6.1-sol`, `high` | `claude-sonnet-5`, `medium` | VID-002; use VID-001 depth for difficult cross-module load ownership |
| Audio/video FX link controls and explicit mappings | `gpt-6.1-sol`, `high` | `claude-sonnet-5`, `medium` | VID-002; transport/tail concurrency review may warrant VID-001 routing |

After two materially different failed approaches, obtain missing evidence before escalating one tier. A stronger model does not replace actual browser synchronization or installed-version reference evidence.
