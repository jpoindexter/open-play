# Shared typography and icons

One font stack, a role-based type ramp and one standard icon family. No font downloads, icon fonts or new package dependencies.

## Ownership

`prototype/typography.css` owns product font family, size, weight, leading and standard icon sizing. Removed 347 competing font declarations from the runtime adapters, then consolidated weight/leading/tracking. Geometry remains in the existing adapters during their separate migration. No font-size-zero exceptions remain; Cue/key text and accessible level labels are actual DOM content. Deck numbers consistently identify decks 1–4; waveform/mixer letters remain A–D.

The canonical DTCG source owns the values and generates CSS plus canvas typography. The existing detail renderer consumes generated caption/micro fonts, so the beat ruler no longer declares its own Arial sizes. Typography uses rem values without shrinking the document root. Library Text Size remains a user preference; video-overlay typography is user-authored media data, not application chrome.

| Role | Size at default root | Use |
| --- | --- | --- |
| Body / standard control | 12px | Astryx controls, header, library |
| Caption / DJ control | 11px | Deck commands, key/time, mixer labels |
| Micro | 10px | Dense utility/status text, waveform annotations |
| Compact title | 14px | Track name in Compact |
| Track title | 16px | Expanded track name |
| Heading / time emphasis | 20px | Dialog heading, large time |
| BPM | 26px | Platter BPM |

This preserves the explicitly requested dense DJ workspace. It is not a claim that 10–12px text meets every accessibility need; zoom/reflow and larger-text acceptance remain open. Standard targets keep their existing dimensions rather than shrinking with icon glyphs.

## Icon contract

Lucide is already installed. Standard and navigation icons share a 24-unit source grid, 16×16 logical-pixel display box and canonical stroke weight/currentColor. Astryx standard components retain their keyboard and accessible-name behavior. Static library/crate/status/eject/overflow icons are generated from the same Lucide package by `prototype/ui/build.mjs`; original buttons, draggable crate nodes and handlers remain in place. Custom DJ rotary scales, waveform paths, transport symbols and artwork are not standard SVG icons and retain their own component geometry.

## Executed proof

- Actual 1280×900 four-deck Horizontal Compact: sampled deck/header/library/mixer text resolves to one font stack; all visible Lucide/standard icons report 16×16. Four Cue labels render CUE at11px; key shift buttons render a single sign with deck-specific accessible names. 32 cues, four decks and lazy library previews remain; zero Play active.
- Actual two-deck Vertical Compact: same font stack and icon dimensions; two Cue labels,16 pads and12 decoded library previews observed. No Play/Sync invoked.
- Actual Astryx bundle build and its component assertions pass. Existing remount check1/1 passes. Token alias/cycle export and typography ownership guard pass; changed JS parses and whitespace check passes.
- Guard: `node scripts/check_typography.mjs` follows the runtime import graph and rejects font/leading/tracking declarations outside the shared owner. Vendor/generated CSS is handled separately. It does not certify color/geometry ownership, accessibility or complete all-style unification.

The broader [unification plan](UNIFICATION_PLAN_2026-10-25.md) remains active on UI-DS-01. This slice is source/browser only; private desktop0.1.58 predates it.
