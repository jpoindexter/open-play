# Current desktop test: Open Play Playback Test 0.1.12

Launch **Start Open Play Current Test.command** or **Start Open Play Playback Test.command**. Window title: **Open Play Playback Test 0.1.12 — controller mixing test**. The app is open with After Hours and Glass Transit loaded at their beginnings, both stopped. Source2708ac1; full Serato parity remains open. This is the existing interface in Electron, with new playback-controller mappings, not a public release.

The connected Hercules starter preset is already installed (64 assignments, exact input bound). Its audio output is selected: master1/2, headphone cue3/4, Cue Mix0%, digital Cue Volume10% (unity). Hardware speaker/headphone volume knobs still need physical observation. The code saves the preset and requests MIDI on reload; restart behavior has not been retested. Output selection deliberately requires an explicit selection workflow: Devices → Refresh → named Hercules → Use selected output → Four channels → Apply channels. Never assume a restored device ID/socket route. This build uses a stable dedicated Playback Test profile; earlier profiles/apps are intact.

**First action when Jason returns:** press the left Hercules Play button once. Confirm that deck1 starts and RCA speakers play. Stop with that same button. Then proceed one action at a time: right Play; channel faders; crossfader; gain/EQ/filter; headphone CUE; tempo pickup and jog phase nudge; Sync with both decks playing. Keep headphones/speakers attached for those checks. We will record observed results rather than assuming a successful MIDI log proves audible behavior. No capture window starts while Jason is away.

| Physical control | Starter action | Current proof |
| --- | --- | --- |
| Browser / Load A,B | Library selection / selected-track load | Code + historical browser-only hardware evidence; current physical check pending |
| Play A,B / Cue | Play-pause / held cue audition-release | New native explicitly synthetic Play + code hold-release checks; physical pending |
| Gain, Low/Mid/High, Filter, channel faders | Actual mixer audio nodes | Native explicitly synthetic deck1 level0→0.79; other controls policy checks only |
| Crossfader | Existing master crossfade | Mapping installed; current physical action pending |
| Tempo A,B | Paired14-bit, selected software range; waits for pickup after Sync/software changes | Targeted policy check; physical direction/range/pickup pending |
| Jog rim/surface rotation | Relative10ms phase nudge | Policy check only; **not touch scratch or smooth speed-bend acceptance** |
| Sync / Shift-Sync | Existing Simple/Smart action / disengage | Native paused synthetic deck2 command126→124 BPM; audible phase and physical input pending |
| Headphone CUE A,B | Pre-fader cue selection | Actual route configured; current physical isolation pending |
| Loop, In/Out, Shift-In/Out | Loop toggle/bounds, half/double | Mapping/code path; physical pending |
| Hot-cue pads in default cue message bank | Existing hot-cue hold/release | Mapping/code path; pad-mode switching/modifiers incomplete |
| FX depth/beat knobs / On | Per-unit existing depth/beat; On toggles first slot | Policy check only; independent starter behavior, not Serato default parity |

The preset uses address facts from an authored MK2 community mapping; no controller script was copied. Existing manual assignments are kept. MIDI editor direction can be inverted per assignment if physical observation shows it necessary. Remaining full-map gaps include touch scratch, pad modes, further modifiers, LEDs/beatmatch guides, reconnect/hotplug, exact reference behavior and hardware latency. Master/headphone analog behavior must be observed, not invented from absent MIDI.

Executed on this package: normal main-app controller enumeration/preset install, explicitly synthetic bound MIDI fader + Play + Sync dispatch, two decks playing/nonzero master meter, then stopped/reset. No new musical audio-phase recording, physical confirmation or real MP3 import was performed. [Scoped observations](desktop-0.1.12-playback-observation.json), [package receipt](desktop-0.1.12-playback-package.json), [changed policy checks](playback-midi-policy-results.json).

Original app/default launcher and all prior tests remain available. Warp0.1.11 guide: TRY_WARP_DESKTOP_0.1.11.md. No requirement/full feature flag was promoted; the full independent Claude audit remains unlaunched. Extra features are deferred in priority while basic mixing is tested, not removed from scope.
