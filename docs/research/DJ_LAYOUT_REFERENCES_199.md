# Layout references199 — research before HTML refinement

19 October2026. User rejected Deck tools accordions and wasted space, explicitly asked for web research including Traktor Pro4, then supplied VirtualDJ and the DJ.Studio comparison article. Jason subsequently chose rekordbox as the primary reference and explicitly requested a separate rekordbox-style version. Preserve Hybrid, Serato and Traktor alternatives. HTML only; no native build.

## Primary reference: rekordbox7

Installed application located at `/Applications/rekordbox 7/rekordbox.app`. Its Info.plist reports **7.2.19.0342**, bundle `com.pioneerdj.rekordboxdj`. Native Export/2 PLAYER screen observed. This is not proof of Performance-mode runtime behavior: its selector did not respond to automated clicks/setValue. A brief keyboard-triggered demo playback was paused afterward. No login, subscription or installation was performed.

Official Performance reference: https://cdn.rekordbox.com/files/20260409151936/rekordbox7.214_manual_EN.pdf — printed pages121–126,141–143,172. The PDF describes rekordbox7.0 or later; it is not the installed7.2.19 build's exact screenshot. Web PDF screenshots failed; locally rendered printed page122 was visually inspected instead. Private source/render: `local-evidence/layout-reference-199/`. No vendor screenshot or artwork is shipped in the prototype.

The Performance diagram shows full-width stacked detailed waveforms above track-information/overview strips; cue-pad and jog areas flank a narrow mixer. The manual identifies time, BPM, key, semitone shift, Key Sync and Beat Sync in track information. Its layout controls provide horizontal/vertical,2/4deck and Browse choices. Export's Dual Player is a different preparation workflow, not evidence for a live Performance layout.

The separate HTML interpretation uses our existing RGB renderer, actual time/BPM values, actual scratch platter, actual cue pads and original mixer inputs. Jason rejected the first beveled/raised interpretation. His correction is flat like Serato: solid black/gray surfaces, borderless rectangular controls, thin dividers, flat dials/fader caps and a single thin jog outline. Blue marks active states; no vendor branding/assets are copied. It is a layout prototype, not a claim of exact visual or functional rekordbox parity. Full/Compact and paired vertical-over-mixer are independent adaptations.

## Sources read

- Traktor Pro4 product links the current online manual: https://www.native-instruments.com/products/traktor-pro
- Current manual, deck sizes and double-click header switching: https://docs.native-instruments.com/online-guides/traktor-pro-manual/en/setting-up-traktor
- Current manual, Advanced panel and Mixer: https://docs.native-instruments.com/online-guides/traktor-pro-manual/en/traktor-overview
- Serato display modes: https://support.serato.com/hc/en-us/articles/225122768-Display-Modes
- Serato4 overview and labeled screenshot: https://support.serato.com/hc/en-us/articles/14173738028175-Software-Overview-Serato-DJ-Pro-4-0
- VirtualDJ homepage and official manual: https://virtualdj.com/ and https://virtualdj.com/manuals/virtualdj.html
- rekordbox7 overview: https://rekordbox.com/en/feature/overview/
- rekordbox7 official manual: https://cdn.rekordbox.com/files/20260409151936/rekordbox7.214_manual_EN.pdf
- User-supplied comparison: https://dj.studio/blog/best-dj-software

## Verified patterns so far

Traktor's current manual provides Micro, Small, Essential, Full, Advanced, Parallel Slim and Parallel Full. Double-clicking a deck header cycles deck sizes. Its Advanced panel uses MOVE/CUE/GRID pages below loop controls. Some current manual image filenames still say TP3; they must not be passed off as fresh Traktor4 runtime captures. Installed Traktor3 is a separate local reference.

Serato documents separate Vertical/Horizontal/Extended/Stack/Library display modes; Extended and Library reduce deck information to reclaim screen area. Its4overview explicitly identifies track gain, key/key lock, time, transport, loop tab and nudge controls. The previous custom Deck tools accordion was our invention, not an observed vendor component.

DJ.Studio's comparison distinguishes live performance software from its timeline-based mix-production workflow. It is a vendor-authored article, used for discovery/context rather than independent proof of competitor superiority, pricing or feature parity. Live two-deck mixing remains this project's core scope.

## Design decisions versus reference facts

Remove the invented Deck tools accordion. Keep its original gain/utility controls directly accessible in a narrow deck strip. Shorten the center mixer by grouping assignment with the channel header and headphone access with the crossfader. Tighten content-sized deck/mixer rows, measuring actual library space before/after. Paired vertical A/B above the mixer is Jason's requested Hybrid composition, not a claim that any one vendor has that exact layout. Existing player/control bindings remain.

VirtualDJ's official layout manual confirms Starter/Essentials/Pro/Performance, Performance Full/Compact/Small and Above/Below/Vertical wave placement: https://virtualdj.com/manuals/virtualdj/interface/topsection/appcontrols/layout.html . Its official Performance Compact image was visually inspected: https://virtualdj.com/img/298094/73226/performancedefault.png . Browser drag resizing was not verified. Serato4's labeled screenshot and Traktor current-manual Small deck image were visually inspected, plus installed Traktor3 Mixer. These remain secondary references.

Full product parity, native/hardware/musical acceptance and original Extended/Stack/Library view parity remain open. No claim that rekordbox is objectively best or has a verified market-share lead is made.
