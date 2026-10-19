# Compact layout reference observations206

19 October2026. Scope: learn how existing DJ apps reduce deck space, then refine the existing Open Play HTML only. These are visual/state observations, not extracted vendor code or claims of feature parity.

## Actual installed app observations

- rekordbox: current Performance /4Deck Vertical, Mixer On; Demo Track1 paused. Native image3024×1898. Header/overview form shallow bands; compact cue/loop/transport/platter consoles sit immediately beneath. Center waveforms and four mixer strips share the total height independently of the boundary between deck1/3. This independent center division is the main adopted structure. The actual deck section is approximately208logical px per deck at its observed display scale; approximate visual measurement, not an exported layout token. PAD display button AX and coordinate attempts produced no observed state change; a separate collapsed PAD state was not verified.
- Traktor: initial Mixer layout recorded; View→Layouts→Essential executed. Header double-click visibly cycles Essential→Full→Advanced→Micro→Small. Micro removes most deck controls; Small retains shallow track/stripe and a compact transport/loop rail. Screenshots saved for Essential/Micro/Small; restored the original Mixer layout. We adopt the compact transport grouping, not Micro's removal of essential controls. Installed app observations are distinct from the current Traktor4 documentation below.
- Serato: actual disconnected two-deck screen inspected. Shallow track/transport headers, centralized crossfader, horizontal waveform lanes, and library are visible. This is the current offline/disconnected screen; do not call it a verified connected-hardware Stack or Library mode.

Private evidence: local-evidence/compact-decks-206/rekordbox-four-vertical.png, traktor-essential.png, traktor-micro.png, traktor-small.png and serato-disconnected-two-deck.png. Native reference screenshots stay local; do not copy proprietary assets into the implementation.

## Official documentation cross-check

[Traktor4 setup and deck layouts](https://docs.native-instruments.com/online-guides/traktor-pro-manual/en/setting-up-traktor.html) distinguishes deck sizes from application layout presets, including Micro/Small/Essential/Full/Advanced. This distinction prevents treating Essential's hidden mixer as a necessary Compact behavior. [Traktor overview](https://docs.native-instruments.com/online-guides/traktor-pro-manual/en/traktor-overview.html) documents deck-header double-click sizing; the installed app's transition was observed directly.

[Serato Display Modes](https://support.serato.com/hc/en-us/articles/225122768-Display-Modes) describes Extended as minimized virtual-deck information, Library as prioritizing library space, and Stack as simplified deck/cue/loop presentation. It explicitly makes Stack dependent on connected primary hardware. These are documentation-backed references, not current connected-hardware UI proof. No such hardware check is requested for this HTML visual pass.

## Application to Open Play

Content-sized Compact deck rows; original Play/CUE/loop/pitch/key and utilities retained; central mixer independent from shortened decks. Compact is our presentation choice informed by observed structures, not a claim to reproduce a vendor mode pixel for pixel. Default206 heights224px (2H/4H/4V) and240px (2V) accommodate additional existing Open Play controls. Larger explicit waveform settings can increase them. No native integration or advanced-feature work.
