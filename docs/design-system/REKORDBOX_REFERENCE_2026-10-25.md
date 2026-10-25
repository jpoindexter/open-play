# rekordbox reference → Open Play

Extract observable rules from the installed app, then adapt them to our minimal interface. This is a reference specification, **not access to rekordbox's original design system or source tokens**.

## Evidence and limits

- Installed rekordbox **7.2.19.0342**, arm64, executable SHA256 `07dcecbaf304f777e435539c83c7dcc02e41de1eaf2e0a75e8a9852e4411a244`.
- Fresh REA `observe_native_ui`: Performance / **2Deck Horizontal**, mixer visible, empty decks. Evidence `ev_a845746a8ff8ee3bb086dd0fc3b18542677c35576fe0927987dd986fa6043c37`: 279 accessibility nodes, screenshot 1512×949, SHA256 `e63a8dd3041399f1ee7af86faff5ee40fd8c8e0303a38945a8bcca395f249fff`. Native window bounds were also 1512×949 points; this REA raster uses one pixel per logical point. CUA's separate image was Retina 3024×1898.
- Saved REA **2Deck Vertical / 4Deck Vertical** captures from 19 October use the same executable SHA. Evidence `ev_43b8506c7b2bd575041a58922934a46e0b9557e9b9f007728bb6e7aaa3888d7a` and `ev_032573d76263fa154b5920e46c2154e01a9d8ac934f0b87433a131d689d7f930`. They show loaded/empty states and library previews. They are historical observations, not fresh four-deck operation.
- Fresh REA decoded three NIB archives: helper Electron menus and Recent Files. These **do not define the custom decks**. Summary `ev_435e9b76fd7b1bbae7e6ce334221345b488c63b90f0c5b6e779dfa827e1145de`, parent `ev_5e85fe2ee14cf8d0d442eca3055549c4d383079e58d5fcbbb8a094054468243f`.
- Asset-catalog metadata `ev_6828645c5568eb24cec9f679f9cf3b37978ac29eab238c5beabe6757e7248dbc` lists 15 records, including five colors. Their deck usage is unknown; they are not treated as deck tokens.
- Private export: `local-evidence/rekordbox-design-system-2026-10-25.rea.json` (four records). Screenshots, AX trees and binary assets stay outside Git. No proprietary images, fonts, icons or code are copied into Open Play.
- A later native selector interaction returned `noWindowsAvailable`; no four-deck refresh or unseen state is inferred from that failure. No reference audio was started.

## Foundation extraction

| Rule | Evidence / confidence | Open Play application |
| --- | --- | --- |
| Flat layered neutrals | **Observed** flat-fill modes: toolbar/library base `#0f0f0f`, deck/mixer `#1e1e1e`, small controls `#282828`; saved captures also contain `#353535`. Display RGB samples, not original color-space definitions. | Canonical neutral canvas/panel/control/hover primitives; shared semantic roles. No gradients on standard commands. |
| Two distinct blue roles | **Observed** active toggle blue and muted blue library selection. Fresh selected-row flat sample `#314b67`; blue raster includes `#3571e3`. | Selection uses sampled muted blue; active controls use **adapted** `#2465c7` for readable white labels. Focus keeps a separate visible accent. |
| Light labels, quieter metadata | **Observed** title/BPM hierarchy and shorter uppercase mixer labels. Exact font family, weight and source metrics **missing**. | Existing local/system sans stack, 12px standard body, 11px captions, 16px track title and larger BPM. Do not shrink to the smallest reference labels. |
| Repeated compact rhythm | **Inferred** from repeated alignments: normalize layout spacing to a 4px rhythm with 1px dividers, 2px focus/radius exceptions. Screenshot positions do not establish original spacing tokens. | One canonical spacing scale; rekordbox adapter's existing grid aliases consume semantic scale tokens. |
| Borders communicate structure/state | **Observed** black waveform wells, separators, flat cue rows; some native choices have outlines. Hover/focus behavior **not captured**. | Quiet borderless standard commands; retain selected fills, hover and keyboard focus. Keep intentional transport rings, fader scale and waveform boundaries. |
| Empty decks dim metadata | **Observed** ghosted title/BPM on empty decks. Disabled semantics cannot be inferred from pixels alone. | Retain explicit disabled state and readable names; do not copy barely visible labels. |

## Component and state map

| Component | Observed anatomy/states | Our contract / missing proof |
| --- | --- | --- |
| Header commands | Icon panel toggles; mixer on, FX/recording off; Master knob and output meter. | Actual Astryx icons/toggles, accessible names, 32px standard targets in one 40px row. Settings owns layout/configuration. Hover/focus are our accessible adaptation. |
| Deck header | Artwork/title/artist/key/time; KEY SYNC, BEAT SYNC and MASTER remain attached to their deck. | Keep deck identity, independent controls, original transport/audio bindings and explicit MASTER state. No new Sync behavior in this change. |
| Mixer | TRIM/HIGH/MID/LOW → channel CUE → vertical fader. Two-deck Vertical mirrors trim/fader around EQ; four-deck Vertical uses four parallel strips. | Retain our additional FILTER and all channels. Layout geometry can differ by mode; color/type/state ownership is shared. Never hide features to match a screenshot. |
| Knobs | Simple arc and pointer; trim, EQ, headphones MIX/LEVEL. AX represents rotary controls as sliders with Help/value. | Keep custom rotary inputs, pointer/reset behavior and names. No Astryx replacement of DJ ranges. |
| Faders | Vertical level rails; centered horizontal crossfader with assignments. | Preserve larger custom caps, centered ticks, snaps and keyboard access. Functional range remains linear. |
| Bottom monitoring | Headphone icon + MIX/LEVEL immediately beside the center crossfader/assignments. | Preserve current grouping and custom monitor knobs. Hardware output acceptance remains separate. |
| Waveforms | Separate full-track overview and detailed comparison; vertical comparison above mixer in saved captures. | Keep source-derived RGB, NOW/beat ruler, H/V, zoom and scrubbing; no copying blue/orange reference encoding over our frequency colors. |
| Performance pads | Flat A–H cue rows; loaded/empty states, mode selector and nearby loop controls. | Keep custom cues, all performance modes, visible compact controls and original handlers. |
| Library | Alternating dark rows, narrow labels, Preview column beside identity/metadata, blue selected navigation. | Keep decoded waveform previews, sorting/search/columns and actual loaded state. No synthetic decorative previews. |
| Dialogs/forms | Main-deck NIBs unavailable; current fresh capture does not establish dialog anatomy. | Use actual Astryx components and our tokens. Do not invent a vendor dialog specification. |

## Applied scope and remaining work

Canonical source remains `prototype/design-tokens/serato-core.tokens.json`; the historical filename preserves provenance. Fresh reference evidence is added alongside prior Serato evidence. `scripts/build_performance_tokens.mjs` generates CSS and canvas roles. Standard commands use `active`; library/navigation selection uses `selected`. Components reference semantic roles, never reference-app assets.

This pass migrates repeated neutral/text/active colors and the 4px grid in `rekordbox-preview.css`, plus shared Astryx/header palette roles. It preserves geometry, all six layouts, custom controls and waveform rendering. Status/transport hues, fader geometry and the remaining legacy adapters are explicitly outside this slice; **all-runtime design-system migration is still open on UI-DS-01**. Do not describe this extraction as full visual or behavioral parity.

Verification belongs in [the application review](REKORDBOX_APPLICATION_2026-10-25.md). Native 0.1.58 predates this design slice; it must not be described as containing these new tokens.
