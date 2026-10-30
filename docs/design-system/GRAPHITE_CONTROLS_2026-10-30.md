# Graphite controls applied to the existing app

Jason canceled the separate preview on 30 October and authorized applying the discovered design to the current core DJ app. Reset tag `checkpoint/pre-graphite-preview-2026-10-30` preserves `1d27160`. The isolated preview and unrelated monochrome draft were not merged or deleted.

## Changes

- Existing canonical DTCG tokens supply graphite panels, control material, text states and measured sizing contracts. Astryx standard controls remain; selected chrome uses quiet fill and blue lettering. Play/Cue symbols communicate green/amber state without extra status dots.
- Mixer knobs are 24 CSS px with 36 px rows. Compact transport circles are 36 px, rather than 28 px. Channel caps are 28×14 px with centered tick marks. Native reference dimensions (24 pt knobs, 36 pt Cue/Play) informed these Open Play choices; CSS pixels are not asserted to equal every vendor measurement.
- Original utility and footer nodes occupy one scrollable rail per rekordbox deck. Fixed paddles scroll independently; keyboard focus reveals hidden controls. Latched Reverse/Repeat/Censor/roll summaries remain outside the scroll region. Switching workspaces restores the original footer placement. No replacement transport, event dispatch or audio engine was introduced.
- Shared mixer height accounts for optional filters, borders, row gaps and insets. The actual four-deck Vertical filter-on overflow discovered during this pass was repaired: 298 px mixer, 288/288 px channel client/scroll height. Mirrored two-deck filter-on is 182 px; filters off returns to 160 px.
- Rotary, pitch and Compact geometry were separated from the 360-line rekordbox stylesheet into focused owners. New modules are under 100 lines; the remaining base adapter is 206 lines. Existing larger unrelated files were not broadly refactored.

## Executed evidence

Stopped, separate-origin browser workspace with generated demo audio; no Play/Sync/REC was triggered. Actual 2H/4H Compact, 2V/4V with optional filters, Full view, Settings, alternate Traktor-flat restoration, independent paddles, keyboard reach and EQ keyboard input were exercised. Final 2H has two rails, thirteen original tool buttons per rail, 24 px knob contract, seven materialized library preview images, zero active Play buttons and matching deck client/scroll dimensions. See [receipt](graphite-2026-10-30/browser.json) and [screenshot](graphite-2026-10-30/two-deck.png).

The existing token generator validates 240 aliases/cycles. Typography ownership passed across eighteen imported stylesheets. New module syntax and diff whitespace passed. No broad Node/DSP/soak matrix was rerun.

## Limits and next step

Desktop 0.1.125 packaging/native startup is recorded separately after immutable-source delivery. No new listening, physical controller, exhaustive state-matrix, day-theme certification or public-beta clearance is claimed. Browser automation did not establish double-click reset behavior; the pre-existing handler remains unchanged. Core Sync/pop/loop and hardware gates retain their earlier status.

This is a concrete shared-component batch, not completion of the entire design-system migration. Remaining legacy layout literals and geometry ownership stay on UI-DS-01. Vendor binaries/fonts/artwork and the reference package remain private; source waveforms and library previews use the existing audio renderer, not concept-image crops.
