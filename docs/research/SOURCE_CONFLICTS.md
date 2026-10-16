# Source conflicts and unresolved reference behavior

Updated 2026-10-16. These are specification risks, not confirmed defects in Serato. Source text is evidence of documentation, not proof of installed behavior. Resolve with a disposable media fixture and the exact reference version before asserting parity.

| ID | Conflict or uncertainty | Required resolution |
|---|---|---|
| SC-01 | [Generic Pitch Play](https://support.serato.com/hc/en-us/articles/115003094007-Using-Pitch-Play) puts negative middle-range pitches on the top pad row; the [Inpulse 300 MK2 guide](https://support.serato.com/hc/en-us/articles/10173727435151-Hercules-DJControl-Inpulse-300-MK2-Quickstart-Guide) reverses those rows. | Measure each connected-controller pad with a known cue; retain device-specific mapping and reference version. No raw MIDI mapping is proven yet. |
| SC-02 | The keyboard shortcut overview and manual-loop article disagree on right-deck loop keys; one also overlaps temporary cue. | Record keyboard layout, focus, modifier preference and actual action for each key. Do not implement both conflicting actions. |
| SC-03 | Crate guidance refers to Protect Library, while settings documentation restricts it to 3.3.5 and earlier. | Keep historical behavior separate from 4.0.10 controls. An optional protection feature in Open Play must be labeled an intentional addition. |
| SC-04 | Color Key Display settings include a historical version restriction whose wording may be erroneous. | Preserve original wording in evidence; verify installed setting and version rather than silently correcting it. |
| SC-05 | Overview guidance limits selected streaming services while the installed sidebar shows multiple providers. | Distinguish visible navigation from concurrent authenticated use. Provider login and playback have not been tested. |
| SC-06 | Older Key Shift instructions require disconnected hardware for analysis; current 4.0 analysis documentation permits hardware connection. | Use version-qualified current behavior; do not reproduce obsolete setup hurdles. |
| SC-07 | Sampler availability wording refers to connected hardware, while standalone Play capability needs separate checking. | Test both reference states; avoid treating the licensing state as an algorithmic dependency. |
| SC-08 | THRU descriptions differ on whether digital features remain available. | Test the supported mixer/input route; distinguish deck processing from independent FX and sampler routing. |
| SC-09 | Some legacy controller Flip tables repeat FX labels. | Cross-check the Flip guide and actual controller before accepting those rows as controls. |
| SC-10 | The official linked Video manual PDF returns 404. Output and Control were observed locally; Effects and Info did not respond to automation. | Keep missing settings and rendering behavior open. No generic replacement panel counts as parity. |
| SC-11 | A named mixer power curve does not specify its coefficients. | Measure gain across fader positions before claiming an identical response. |
| SC-12 | Serato T10 quickstart describes temporary isolation/muting and restoration on release; Hercules T10 manual printed38–39 documents a latched chord, separate Slip disable, independent stem transport and vocal-only crossfader control. | Separate button release, scratch release and mode disable; execute initial-state/transport matrix on T10/4.0.10.213. See [evaluation](STEM_SLIP_EVALUATION.md). Not proven on Inpulse300MK2. |
| SC-13 | Loop Roll prose contains an apparent left/right active-deck typo. | Verify four-deck focus routing rather than copying the parenthetical text. |

Main-manual article URLs and local source identifiers are indexed in [the article crosswalk](MANUAL_FEATURE_CROSSWALK.md). The interaction specification retains evidence labels and untested acceptance paths. No conflict is closed merely because its source was indexed.
