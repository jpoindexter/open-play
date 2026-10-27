# Flat-black palette — 27 October 2026

User request: make the interface flat black while keeping color accents.

## Change

The existing DTCG token source owns black canvas, near-black panels and fields, quiet dividers, and visible control edges. Existing layout adapters and Astryx fields now consume those roles. Knob/cap bevels and the Compact platter's decorative outer shadow were removed; functional cap stripes, centered ticks, focus outlines and detent accents remain. This is a user-directed adaptation, not a claim that these values were extracted from rekordbox.

No new stylesheet, runtime module, dependency or desktop bundle was added. Layout geometry, typography, control behavior, audio code, six layout options and waveform spectrum tokens are unchanged. Existing all-style migration debt remains UI-DS-01.

## Executed verification

- Existing exporter resolved 213 tokens and checked missing aliases/cycles.
- Baseline comparison retained accent/spectrum tokens and every existing non-color token record. Token contrast pairs: body 14.75:1, secondary 8.52:1, control edge 4.4:1, focus 7.92:1 and selected text 5.58:1. These pairs do not certify every rendered state.
- Actual browser rekordbox two/four-deck Compact, Traktor-flat two-deck Compact, Settings and selector menu retained visible controls and five viewport library previews. Generated demo tracks stayed stopped; native music/session was untouched.
- Final reload showed black canvas, near-black decks/mixer/library, retained deck/status accents and waveform previews. Day-mode Settings remained readable; its hover exposed a dark fill, corrected through the existing day token map, then observed as light background/dark text. Dark mode restored afterward.
- Whitespace/diff check passed. No broad DSP suite, repeat soak, or listening test was run for a palette change.

## Delivery boundary

Source preview: http://127.0.0.1:63341/prototype/workspace-preview.html (one intentional browser tab and loopback server). Screenshots and raw DOM evidence remain ignored under local-evidence/flat-black-2026-10-27. No Downloads files or app copies were created.

Native 0.1.76 remains the running candidate; this palette and CORE-FIX-29 source repair are ahead of it. No native visual acceptance, all-six-layout state matrix, or full accessibility certification is claimed. Controller/headphone/listening gates stay on CORE-LIVE-01. Next: resume software-only core/beta blockers without repeating accepted clean checks.
