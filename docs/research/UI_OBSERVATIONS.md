# Installed UI observations

Reference: Serato DJ Pro 4.0.10 (4010213) arm64, 16 October 2026. Observation through the native window, not reconstructed from screenshots on the website. Values below are this session's state, **not factory defaults**. Raw screenshots are not committed.

## Setup / DJ Preferences

Jason opened Setup. The tab strip contains DJ Preferences, Audio, CD/Vinyl, Library + Display, Mixer, FX, MIDI and Expansion Packs. The selected panel is a scrollable two-column form. The observed viewport ends partway through Sync Mode; it is not the entire panel.

| Control | Observed state | Planned requirement / reference boundary |
|---|---|---|
| Playback Keys Use Shift | Off | Keyboard safety modifier; alphabetic library navigation when applicable |
| Lock Playing Deck | Off | Reject accidental replacement of playing track when enabled |
| Sort Cues and Loops Chronologically | Off | Reconcile cue/loop ordering and saved order |
| Enable Hot Cues | On | Empty-slot setting through hot-cue keys |
| Track End Warning | Off | Documented last-20-second warning, excluding tracks shorter than one minute |
| Disable Needle Search During Playback | Off | Controller search protection with documented Shift override |
| Show Beat Jump Controls | Off | Show/hide deck beat-jump surface and supported hardware action |
| Quantize Value | 1 Beat | Menu contents not opened; interval applies to documented cue/loop actions |
| Enable Slip Release | Off, period shows 2 Beats | Preserve underlying timeline and selected release interval |
| Use Auto Gain | On, 92 dB | Documentation range 89–98 dB; current value visually observed |
| Braking Start Time / Stop Time | Two dials visible | Values cannot be read from this screenshot; hardware may own adjustment |
| Play from Start | On | Start/downbeat behavior subordinate to cue and instant-double rules |
| Play from First Cue Point | Off | First cue fallback to start; subordinate to instant double |
| Instant Doubles | Off | Same-file position, key lock, sync and loop inheritance |
| Turn off FX | Off | Disable corresponding FX bank on track load |
| Analyze Stems | Off | Analysis on load versus first stem action |
| Virtual Deck Speed | 45 RPM selected; 33 RPM available | This is the observed setting, not a measured physical platter speed |
| Recording Bit Depth | 24 Bit selected; 16 Bit available | Independent output encoding requirement |
| Recording File Format | AIFF selected; WAV available | Both native recording formats retained |
| Sync Mode | Simple Sync selected; Off and Smart Sync visible | Smart Sync description extends below observed viewport |
| Snap to Beatgrid | On | Documented initial sync uses grid instead of transient matching |
| Maintain Sync on Track Load | Off | Preserve sync state on replacement when enabled |

Check For Updates and a partially obscured language area are visible at the bottom. A trial notice overlays the bottom-right area. No account or preference values were changed.

## Interaction capability

The application exposes only a top-level dialog, one unlabeled button and its application menu through the current accessibility interface. A coordinate click on Audio returns `AXError.notImplemented`. A Tab key action succeeds at the transport level but produces no visible focus or panel change. These outcomes do not establish that the app itself lacks keyboard access; they establish the current automation path's limitation.

Jason explicitly authorized navigating all necessary screens. Permission is not the blocker. Jason approved the alternate macOS automation route. System Events click and keyboard navigation produced no visible change; an osascript JavaScript-for-Automation CoreGraphics mouse event then successfully opened Audio. Each subsequent navigation was verified with a fresh native screenshot. The accessibility tree remains sparse, so screenshots remain the evidence for screen contents.

## Remaining screen observations

DJ Preferences below the fold; remaining per-effect parameter ranges and menus; loaded sampler advanced modes; library context menus and smart-crate editor; Flip; video settings; each device-specific control state. All eight Setup tabs have now been opened. Scratch-bank and empty sampler observations are recorded below. Documented behavior can inform the specification but cannot be labeled observed until inspected.


## Other Setup tabs observed

- **Audio:** USB buffer slider labeled 1, 2, 5, 10, 20 ms, currently at 1 ms. This label is not a measured round-trip latency. Use Laptop Speakers off; screen explicitly describes output to the OS default device as well as DJ hardware. Make Audio Available to Other Applications off. Livestream Song Info button links song/artist reporting to Twitch through Serato account linking; no account linked during inspection.
- **CD/Vinyl:** Adjust Loops with Vinyl and Anti-Drift off. Needle Dropping offers Off (selected), Absolute Position and Cue Point. Sticker Lock off, with inactive nearest/forward/backward choices and instant-double lock. Tab visibility alone does not establish that the connected Hercules supports DVS.
- **Library + Display:** iTunes library on; rating-import button; custom crate columns off; center selection off; subcrate tracks on; retain Prepare tracks off. Played color Blue, reset-on-exit off, play count on, text-size slider. Tempo matching, AM mode and EQ-colored waveforms off; performance pad layout on; key notation Camelot. BPM precision one decimal; maximum updates 60/s; Hi-Res on. Usage-data checkbox on, left unchanged. Streaming display on, with Apple Music, Spotify, Beatport, SoundCloud, Beatsource and TIDAL choices; none selected in this viewport. These are offered providers, not verified integrations.
- **Mixer:** EQ Boost 6 dB, output Stereo; Cue Mix dimmed, Cue Volume visible; Master Cue dimmed and Split Cue button visible; upfader curve dimmed; crossfader curve, Linear (selected), Power, Reverse and Disable visible. No audio/mixer setting changed.
- **FX:** empty favorites pane, Use Favorite FX List dimmed, Add/Delete/Rename dimmed without selection; Get More FX button. Scrolling the available list through three overlapping viewports exposed 59 named effects in eight categories, captured in `fx-catalog.json`. Exact per-effect parameters and audible equivalence remain open.
- **MIDI:** DJControl Inpulse 300 Mk2 appears in Serato's device list. Selecting its row reveals Allow Serato Hardware Remapping, currently off. Preset list empty; New/Save/Save As/Delete/Restore Defaults/Load buttons. Enable Output Lighting checked. No remapping, preset reset or outbound diagnostic hardware message performed.
- **Expansion Packs:** list offers Video, Sampler, External Control, Remotes, Vinyl/CDJ Control, Pitch ’n Time DJ, Flip and Play. Video is off; Sampler on. External Control shows empty Active/Available device lists and inactive Activate/Deactivate controls. Remotes displays a discontinuation notice for Remote and Remote Mini. This is direct evidence of a discontinued product notice, not proof of a historical hardware paywall change.


## Advanced FX panel

The gear opens an expanded parameter strip. Selecting an effect's depth knob changes which parameters are shown; clicking its name toggles the effect. The two actions must remain distinct. Three slots per unit and separate beat controls are visible. Save and Reset are visible but were not activated.

| Selected effect | Observed parameters and session values |
|---|---|
| LPF | Resonance 1.77; Slope 24 dB; Min Freq 200 Hz; Max Freq 20.0 kHz |
| Delay | Feedback 40%; HPF 20.0 Hz; Drive 0%; Beat Modify 1 |
| Reverb | Decay 1.50 s; Contour 0%; Width 100%; Mix Mode Wet Mix |

These observations establish labels and current values, not parameter limits, factory defaults, DSP transfer functions or audible equivalence. The complete 59-name catalog is in fx-catalog.json; only three parameter strips have been directly inspected.

## Sampler and Scratch Banks

- Sampler opened with eight empty slots, A–D bank buttons, output selectors 1/2/M (M selected), main volume and mute. Its chevron switches expanded and compact views. The compact strip retains eight slots and current bank. Empty slots do not expose loaded-slot controls, so advanced behavior remains documented rather than observed.
- Scratch Banks opened with A–D banks and eight slots in a four-column, two-row layout. Four factory sample slots in bank A were populated. Each populated slot exposes repeat, key lock, start selector, eject and a small waveform; the empty four slots show a drop target.
- Opening the first scratch slot's start selector showed Start (selected) and Cue 1 for that sample. This is a content-dependent menu, not evidence that only one cue is supported. No sample was triggered, loaded to a deck, ejected or edited during inspection.
- A paused track was present in deck 1 at the later inspection. Its appearance was not caused by a recorded load action in this inspection sequence; no causal hardware claim is made.


## Flip and display modes

- The Flip toolbar icon opens a six-control strip: Record, Start, On, Loop, Save and Loop Snap. In this observed state, Loop Snap is selected; Start/On/Loop/Save are dimmed and Record is available. No recording or track-metadata write was performed.
- The display menu contains Vertical, Horizontal, Extended, Stack and Library. Horizontal, Extended and Stack were selected and visually verified, supplementing the earlier Vertical and Library observations.
- Horizontal places large decks on either side of central horizontal waveforms. Extended places compact decks across the top with wide waveforms underneath. Stack puts compact deck information at the left of each horizontal waveform row. The Flip strip remains between the decks/waveforms and library in these observed configurations.
- The connected two-deck controller does not establish the four-deck layout. Four-deck selection and active-deck switching remain separately documented requirements.

## Video settings inspection

2026-10-16, installed 4.0.10.213 and existing trial. Enable Serato Video was initially off. It was temporarily enabled to inspect settings and then restored to off, with the unchecked checkbox and hidden settings verified in a fresh screenshot. No playback, recording, overlay save, media association or parameter change was performed. Setup was subsequently closed.

Enabling exposed Output, Control, Effects and Info subtabs. Output and Control were inspected. Repeated Effects/Info navigation attempts did not change the displayed tab, including a process-targeted mouse-event attempt; those screens remain unobserved. Do not infer their contents from a historical manual.

| Output control | Observed choices/current value | Boundary |
|---|---|---|
| Window Aspect Ratio | No Constraints (selected), 16:9, 4:3 | Menu opened; no alternative selected |
| Output Quality | Poor, Low, Medium (selected), High, Best | Quality/render cost unmeasured |
| Recording Quality | 360p, 480p (selected), 720p, 1080p | No recording created |
| Arrangement | Normal (Output) (selected), Left-Right, Left-Output-Right | Compositor behavior untested |
| Media Treatment | Preserve (selected), Stretch, Center-Cut, Letterbox | Crop/scale behavior untested |
| V-Sync / Frame Blending | Both unchecked | No frame-rate evaluation |
| Buffer Size | Slider labeled 200Mb, 1Gb, 2Gb | Exact current bytes and slider step unknown |
| Delay Compensation | 0 ms with knob and decrement/increment buttons | Range and processing untested |

Control exposes Auto Crossfade Speed slider, Contour Faders (unchecked), and Cursors Crossfade Video (unchecked). Numeric speed mapping and contour behavior remain unknown.

The official support article 'Using Serato Video in Demo Mode' links to a Video 1.1 PDF at `https://serato.com/downloads/files/95193/Serato%2BVideo%2BUser%2BManual%2B1.1.pdf`; this returned HTTP 404. Its Scratch Live/ITCH installation instructions are historical and must not replace current installed behavior. Current codec support guidance also explicitly warns that support varies by OS and software version: https://support.serato.com/hc/en-us/articles/202305724-Serato-Video-supported-formats-and-codecs.


## Additional FX selector check

Opened the first left-unit effect selector while both decks remained paused, selected the next entry with Down/Return, and observed Wah Filter parameters: Resonance 8.00, Range 4.00 octaves, LFO Depth 0%, Rate 2. These are observed session values, not bounds or defaults. Restored LPF with Up/Return and verified its name and original parameter values. No effect was enabled and no parameter knob was adjusted. Four of 59 advanced parameter strips now have direct observations; 55 remain unobserved.

## Current Video Effects / Info observation — navigation gap closed

2026-10-16, installed4.0.10(4010213)arm64. Opened Setup, temporarily enabled
existing Serato Video, and successfully opened both Effects and Info using the
already-authorized JXA/CoreGraphics input with fresh screenshot verification.
Earlier failed navigation reports remain historical; these two screens are now
observed. No media was loaded, no playback/recording was started, no license/trial
was activated and no Effects/Info option was changed. Video was restored OFF with
uncheckedbox/hiddencontrols verified, then Setup closed.

| Screen | Current observed state | Scope limit |
|---|---|---|
| Effects | Effect Restrictions: No Restrictions | Readout for this session, not successful invocation of every menu entry |
| Effects | Enable Audio Linked Video Effects checked | Existing session selection, not factorydefault or parameter/mapping proof |
| Info | Input resolution/bufferedframes/colourspace Left/Right blank | No Video clip loaded; do not invent values |
| Info | Output Resolution400×400; OutputFPS blank | Observed idle value; no performance/longsession guarantee |
| Info | YUV Handling Default; dropdown also Software Only and RGB Only | Menu opened and Escapeclosed, selectionunchanged; processing untested |
| Info | Enable Debug and Buffer Debug View unchecked | Conditionalruntime/tool behavior untested; no VersionNumber readout visible in this screen |

Raw screenshots stay ignored under `local-evidence/video-reference-20261016/`:
`effects.png`, `info.png`, `yuv-menu.png`, `restored-off.png`. The persisted55effect
cache remains separate file evidence; this readout does not establish every named
effect's actual render behavior or the transition catalog.


## Current Video menus observed — 17 October 2026

After Jason confirmed unlock, all five slot-effect category submenus and the full
transition popup were inspected on installed4.0.10(4010213)arm64 using authorized
JXA navigation and CUA screenshot observations. [Structured observation](VIDEO_CURRENT_MENUS_20261017.json)
records55 FX (15 Audio Reactive,2 Equalizer,22 Lighting,2 Record,14 Transform)
and29 transitions, including exact displayed names. Names match the persisted
effects cache; that cache itself remains an older on-disk artifact.

Grid Pop, Tornado and Water Bar H/V resource names were absent from this observed
transition popup. This does not prove historical removal or universal absence.
Menu observation does not establish effect invocation, algorithms, parameter
ranges, codecs, device restrictions or rendering. No new media/playback/selection
was performed. Video was restoredOFF and Setup closed. Escape unexpectedly
opened Exit confirmation; No retained the app. Window became windowed and exact
prior window-mode restoration was not verified. Raw screenshots remain ignored
under local-evidence/video-menus-20261017/.
