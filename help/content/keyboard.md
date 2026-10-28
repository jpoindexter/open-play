## Current bindings

This table is generated from the app’s current Help bindings. It covers the implemented A/B shortcuts, not complete four-deck/vendor shortcut parity.

<!-- CURRENT_BINDINGS -->

## Focus changes what keys do

Close dialogs and leave text fields before using playback shortcuts. A focused slider/range control uses its own keyboard behavior. Click a deck title or another non-input area before using jog/Cue keys.

When **Playback Keys Use Shift** is enabled, hold Shift or use Caps Lock for playback keys. System/browser-reserved combinations may behave differently from the desktop app. Ctrl is handled as a command modifier where supported, but the table uses the Mac labels shown in Help.

Held actions have a release lifecycle: release the key to end temporary Cue, jog, Censor or a held sample. Do not substitute repeated taps for a held action. Loss of focus should release holds; stop playback explicitly if anything feels stuck.

## Focused control interaction

- Use Tab/Shift + Tab to move between available controls.
- Use Enter/Space on a focused button, subject to that control’s held-action rules.
- Focused overview waveforms support left/right arrows and Home/End for seeking.
- Right-click a track/cue for available editing actions; do not assume every context operation has a global shortcut.

## Coverage limits

Right-deck loop-key conflicts and broader Play/shortcut parity remain unresolved. The visible controls remain the fallback. Function keys can be intercepted by macOS media/system settings; use the visible Key Lock control if F5/F10 is not delivered.

Universal double-click reset for every knob, fader, switch and control is not yet promised. Use documented reset actions and read the value afterward.
