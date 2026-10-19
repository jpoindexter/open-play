# Three workspace options — preview196

Open [the interactive preview](http://127.0.0.1:8848/prototype/layout-preview.html). It fits the desktop composition into the available browser pane; **Open full size** opens the direct player entry. The top switch selects Serato style, Traktor style or Hybrid. Hybrid starts selected. The existing source preview server on8848 is reused; no new service or desktop build.

## What to compare

- **Serato style:** the current Open Play horizontal layout, shared RGB close-up timelines, familiar circular deck displays and horizontal mixer. Preview toolbar only is simplified; the existing production entry stays unchanged.
- **Traktor style:** left/right compact deck readouts and individual close-ups, a central vertical mixer with outer gain/filter and inner three-band EQ, channel faders/headphone Cue and crossfader; library below. Native Traktor Pro3 version3.11.1 17 Mixer layout was visually inspected. This is an independently styled adaptation, not a pixel-identical skin.
- **Hybrid:** shared RGB timing/beat-comparison lanes above a physical deck–mixer–deck arrangement. Compact track/BPM/time readouts, visible Cue/Play/Sync, hotcues/loops, and fewer advanced controls competing with the core mix. Core controls remain the existing production nodes.

The hybrid uses Fauconnier and Turner's Analogy and Blending method: preserve the shared source clock and beat comparison, borrow the physical mixer relationship, then remove duplicated close-ups and oversized platters. Design canon: progressive disclosure, single source of truth, cognitive-load reduction and scoped CSS composition. Accessibility: the layout choices are native buttons with pressed state and keyboard activation; existing accessible range/transport controls remain. Dials retain their existing range-input semantics; this preview does not implement a new rotary interaction. No full accessibility certification is claimed.

## Preservation and implementation

New files only: prototype/layout-preview.html (fitted review host), workspace-preview.html (separate player entry), layout-preview.css and layout-preview.js. The module imports the existing app.js once. Layout switches change presentation and move the actual scrub surfaces, keeping one player and the original handlers. Traktor's individual close-up canvases are read-only crops of the existing renderer, not another analysis/transport. Shared Serato/Hybrid lanes retain the original renderer. No user music, vendor code/assets, credentials, native audio path or MIDI map is copied/replaced.

REA was attempted as requested, but its prior Hopper provider reported incomplete closure; that session was left intact. The installed Traktor visible interface supplied the layout reference. Do not describe the fallback as successful binary extraction.

## Focused executed checks

Both saved real MP3s loaded through normal library controls, one per deck. Set both20s. With deck1level0 and filter0.01, start deck1 and switch Serato→Traktor→Hybrid: its source timer advances20.495→20.797→21.105, deck2 remains20.000, both titles and mixer values persist, exactly one crossfader/two Play controls remain. This is muted browser state/transport evidence, not acoustic/native/hardware acceptance. Stop deck1 and restore its level0.8/filter0; both tracks finish paused20s.

Actual1440px screenshots and DOM geometry inspected for all3views: Serato has shared waveform/parallel decks/horizontal mixer; Traktor deck–vertical mixer–deck with individual close-ups; Hybrid shared waves over deck–mixer–deck. No document horizontal overflow at that size. The fitted browser-pane view was also inspected. The actual native27ASAR hash remains a4d7135432916a3fb0467d008cd6c97ffb293b4ec63aeeba2e36bff50b60afcb; production UI/engine/MIDI files have no diff.

A fresh-load check retained a frame observer console error and initial locator click failure; keyboard Enter then selected all3layouts and the player reported ready. No clean-console claim. These prototype/tool observations do not expand into a repeated DSP/hardware matrix. Screenshots, raw DOM and song evidence stay under ignored local-evidence/workspace-layout-preview-196/. The sanitized JSON records the results and limits.

## Gate

This is a requested layout review, not a new native candidate or a completed core milestone. Keep desktop0.1.27, existing source/profile/272maps and previous builds. Do not apply the alternate layouts to the main app or package another desktop build until Jason approves a direction. Practical manual/Sync musical mixing, headphone/master blend and physical-control acceptance remain the core goal. Advanced features remain later.
