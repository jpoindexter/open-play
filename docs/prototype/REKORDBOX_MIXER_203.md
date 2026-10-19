# rekordbox mixer spacing203 — HTML only

19 October2026. Jason supplied native2/4-deck screenshots and a mixer close-up. This correction supersedes201's added FILTER row. User visual acceptance remains pending.

## Reference-driven changes

Only TRIM/HIGH/MID/LOW appear above CUE and the fader in the four-deck mixer. The filter input/value remains in the original player and other layouts; its row is hidden in this HTML style. Four-deck rotary rows increase from24px to34px Full /32px Compact, with22px /20px circles and9px labels. Their pseudo-elements now use border-box sizing so borders no longer extend into the labels. The central four-deck column widens to280px. Two-deck Horizontal uses164px and24px knobs/10px labels. The two-deck Vertical mixer mirrors trim/CUE/fader alongside its EQ column, as shown in the user's first native screenshot. Native-like open rotary rings, TRIM text and plain CUE buttons replace the previous treatment. Crossfader stays centered; waveform preview column remains.

## Executed checks

Actual HTML UI inspected in2Deck Horizontal Full,4Deck Horizontal Full,4Deck Vertical Full/Compact and2Deck Vertical Full. All have exactly four visible rotary labels per channel. DOM text-range and pseudo-element geometry show no knob/label overlap, and visible controls stay inside their channels. No DSP behavior inferred from geometry. Original EQ keyboard change to0.3 survived Mixer Off/On, then restored0. Channel3 fader changed0.80→0.79→0.80; CUE toggled On/Off and restored. Existing source-audio library previews remain rendered. JSON summary: REKORDBOX_MIXER_203.json. Private full receipts and2/4Vertical screenshots: local-evidence/mixer-spacing-203/.

No production player, audio engine, MIDI mappings, renderer, native package or build changes. No repeated audio matrix. Native0.1.27 remains the previous test build; this is an HTML review revision only. Remaining full parity and native approval gates are unchanged.

## Tracking

Reuse UI-RB-04 (latest instruction supersedes the earlier per-channel-filter request), UI-RB-01 for four-deck arrangement, and UI-001 for parent layout tracking. Existing model recommendation: Codex gpt-6.1-sol high; Claude Code Sonnet5 medium; confirm availability before use. Reviewer should compare directly against Jason's screenshots and the live two/four-deck views. No agent execution implied.
