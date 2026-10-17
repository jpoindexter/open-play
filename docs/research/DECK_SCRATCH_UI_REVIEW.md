# Ordinary platter UI controller

2026-10-17. **19/19 controlled Node interaction checks executed; syntax checked. Actual browser/AudioEngine/PCM integration remains for parent acceptance.** This unit creates no native application and does not establish hardware/DVS or Serato scratch-response parity.

## Scope and integration API

Owned new files only:

- `prototype/deck-scratch-ui.js`
- `scripts/test_deck_scratch_ui.mjs`
- This review.

No `app.js`, `engine.js`, kernel/worklet or shared styles were edited by this scoped agent. Parent owns their wiring and real audio acceptance.

```js
import {createDeckScratchControls,deckScratchUIPolicy} from './deck-scratch-ui.js';
const scratchControls=createDeckScratchControls({engine,state,notify});
// Existing app animation tick:
scratchControls.tick();
// Parent deck load/eject/stop paths can explicitly retire the UI owner:
await scratchControls.cancelDeck(deck);
// App teardown:
await scratchControls.dispose();
```

The factory also accepts controlled `root`, `windowTarget`, `now`, `requestFrame` and `cancelFrame` collaborators. `diagnostics()` returns only the active UI owner/mode/readiness/position/RPM/update status; it is session diagnostic state, never persistence. The controller calls only `engine.position`, `beginDeckScratch(deck,owner)`, `updateDeckScratch(deck,{position,velocity},owner)` and `endDeckScratch(deck,owner,{cancel})`. It never loads a source or calls seek per move.

Parent markup contract: existing `.platter` gets `data-deck-scratch="index"`, a keyboard focus stop, suitable role and an `aria-describedby` help element. Give it `touch-action:none` **before** touch starts and a visible focus indicator. Put a per-deck status element outside or beside it at `[data-deck-scratch-status="index"]`, with a polite status role. Exported `deckScratchUIPolicy.keyboard` supplies the exact independent help text. Busy state is set on the platter only while this controller is preparing scratch; phase/status writes occur only when changed, not on every pointer/animation update.

## Declared independent interaction policy

Pointer primary-button movement is delegated from the document. Modifiers, composing events, existing prevented events and interactive child controls are ignored. A gesture captures its pointer, focuses only the clicked platter at initiation and gets a unique owner string. No asynchronous completion restores/steals focus or changes `state.focus`.

The initial angle uses the actual bounding rectangle. Clockwise angular delta is positive original-source time; counterclockwise is negative. Deltas are unwrapped to the shortest signed arc across ±π. An unobserved turn larger than half a revolution between events cannot be reconstructed. A central dead zone of 15% of the platter radius ignores center starts; entering it holds the current position at zero velocity and resets the angular anchor, so re-entry cannot jump the source head.

The exact existing `state.settings['Virtual Deck Speed']` value selects 33 or 45 RPM, snapshotted per gesture. Missing/invalid values use the existing 45 RPM default. Movement maps to original seconds by `deltaRadians / (2π) × 60/RPM`. Velocity uses actual movement in original seconds divided by the monotonic event interval, with a 1 ms minimum interval, bounded to the existing transport's ±16 policy. Source position clamps to zero and the known finite track duration without accumulating an out-of-range hidden cursor. These are independent policies, not a recovered vendor platter curve or a claim that the 33 label means 33⅓ RPM.

While the **platter itself is focused**, hold Left/Right to audition/scratch at −1/+1 original second per second. Space or Enter holds the platter stationary at velocity zero. Keyup normally releases; Escape cancels; keyboard focus loss cancels. Repeats and a second simultaneous scratch key do not create another owner. These keys are consumed in document capture phase only when handled for a focused platter, so the app's existing bubble-phase library/transport keys cannot also act. Modified and unrelated keys remain available. An animation-frame gap exceeding the existing transport's 120 ms watchdog cancels keyboard scratch instead of synthesizing a large resumed movement. No decorative animation is added, and this essential input clock does not override Reduced Motion preferences.

Different deck pointer owners can coexist. Changing focus between pointer-touched decks does not cancel the other pointer; keyboard owners still cancel on focus loss. Window blur, document hiding, pointer cancel/lost capture, explicit deck cancellation and disposal retire their owners. `tick()` detects track replacement or detached platter markup. **DOM replacement intentionally cancels**: capture/focus is not transferred to a new element/geometry. Parent should keep platter nodes stable during a gesture or treat a full rerender as cancellation; ordinary text/rotation updates do not detach them.

## Async ownership and release

`beginDeckScratch` is invoked directly from the original input handler, preserving the engine's user-gesture opportunity. It registers its owner synchronously before preparation awaits. Until its truthy acknowledgement, only the latest desired position/velocity is retained. A false/null engine result ends the UI gesture without claiming active scratch.

Release/cancel before preparation resolves calls `endDeckScratch` **immediately**, without waiting for begin. Late fulfillment checks the UI owner, current deck/track and connected element again; a stale fulfillment repeats idempotent retirement with the old owner and emits no move. It cannot claim a new owner. Engine internal track/start/load-generation guards remain mandatory; the controller does not replace them.

For an active owner, normal updates are coalesced while an acknowledgement is in flight. Normal release posts one final unsent desired position before End; cancel/pending preparation emits no extra motion. Parent's current `updateDeckScratch` posts `transport.command('scratch',…)` before its first await, preserving this movement→End ordering. That is a **source seam checked here**, not executed actual-engine/audio proof. The controlled test observes call order, final target and no queued replay after release.

No UI work is resurrected by an old acknowledgement. Errors clear busy/capture state, retire the owner and expose the real current error. Engine release semantics remain authoritative: ordinary versus Slip backing-clock return, playing versus paused audition, loops, keylock recovery and gain/stem routing are not reimplemented by the UI controller.

## Executed checks and exact source checkpoint

```sh
node scripts/test_deck_scratch_ui.mjs
node --check prototype/deck-scratch-ui.js
```

19/19 checks passed: both RPM conversions and per-gesture snapshot; ±π unwrap; center/dead-zone re-entry; ±16 velocity and source bounds; latest pending move; release before readiness; cancel/new same-pointer owners; in-flight coalescing/final release ordering; two-deck pointer isolation; modifier/input/unrelated-control preservation; focused keyboard hold/repeat/keyup; Space/Escape/focus loss; blur/hidden/detach/track replacement without focus theft; backward/stalled keyboard clock and preparation failure; disposal/listener cleanup; explicit engine refusal; movement failure; leftward audition/invalid geometry/capture failure; Enter stationary-hold alias.

These execute the actual controller against controlled event targets, element geometry/capture methods, monotonic clock/animation frames and engine acknowledgement promises. They do **not** execute native browser pointer capture/focus/default behavior, real AudioEngine source replacement, raw PCM, gain/history preservation or physical controls. A passing count must retain that boundary.

```text
a22ea57e1fd4df5a4e32f37ba3bdcb9bfb8e77384859b1d24cc79e4dbc821515  prototype/deck-scratch-ui.js
24cf8f80994eff3ecc838fa542757da432078b4dca837113f76bad3ec29892e3  scripts/test_deck_scratch_ui.mjs
```

## Parent actual acceptance required

1. Load a known decoded local fixture; drag the actual platter through both directions and ±π with real pointer capture. Verify original-source position, nonzero signed traversal and held-zero output through the actual AudioEngine graph, while another deck remains unchanged. Repeat paused and playing; inspect actual release behavior rather than only labels.
2. Select 33 RPM and 45 RPM and compare a known quarter-turn source movement (15/33 and 15/45 seconds). Change the setting mid-gesture and verify current scale stays stable; a new gesture uses the new setting.
3. Test release/cancel while actual module/source preparation is pending, then load/eject/stop or reuse the same pointer on a new track. Verify no late old source or position commits. Actual pending ownership must be tested through the engine, not inferred from these controller mocks.
4. Focus the real platter with Tab; test Left/Right audition, Space/Enter hold, keyup, Escape and focus/window loss. Verify library focus, modifier shortcuts, other inputs and ordinary key handlers do not also fire. Check visible focus and accessible help/status with actual assistive technology; ARIA attributes alone are not screen-reader acceptance.
5. Exercise center entry/re-entry, lost capture, full platter rerender and detached node cancellation. Verify a normal position/time/rotation tick preserves the node and ongoing capture. Parent can intentionally cancel before a full redraw; do not silently transfer to new markup.
6. With current original/stem gains and FX routes, scratch and release without duplicate summing or lost gains/history. Keylock bypass/recovery and ordinary Slip backing return need actual engine/PCM verification. No musical/high-speed/vendor listening-quality claim follows from raw gesture math.

Source is frozen for parent integration and browser acceptance. Native application development remains gated by explicit prototype approval.

Skills applied: use, dec-accessibility, dec-motion-animation, dec-software-principles, dec-quality-testing.
