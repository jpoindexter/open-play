# Hercules Inpulse 300 MK2: next passive capture diagnostic

2026-10-17. Exact target: **Hercules DJControl Inpulse 300 MK2**, historically enumerated USB VID `0x06f8`, PID `0xb12f`. This document adds a diagnostic plan; it does not establish successful physical input capture. No controller messages, mapping installation, driver changes, Serato shutdown or cable changes were performed for this review.

## What the earlier evidence proves

| Evidence | Established | Not established |
|---|---|---|
| `local-evidence/midi-endpoints.json` | A CoreMIDI source and destination named `DJControl Inpulse 300 Mk2`, with Guillemot manufacturer/model strings | Endpoint UniqueID, parent entity/device, offline/protocol state, USB endpoint address, connection lifetime |
| `local-evidence/midi-passive-capture.json` | The prior 70-second observer reported zero packet records and zero output commands | Whether its callback was invoked with no usable packets; whether the selected endpoint changed/disappeared; independent correlation timestamps |
| Both isolated receiver reports | Exact `b01001b0107f` delivery through an owned temporary destination, and separately an owned virtual source/input-port connection | Delivery from this physical controller or which transport Serato consumes |
| Jason's confirmations | He turned the knob during capture; the same knob moves Serato's highlighted selection | Captured MIDI bytes, current connection state, exact OS/USB path |
| Earlier IORegistry inspection summarized in [HARDWARE_HERCULES.md](HARDWARE_HERCULES.md) | MIDIServer and a Serato device user client coexisted | Exclusive access, direct USB/HID use, or any endpoint address/protocol inferred from those clients |

The old observer reads every packet from its selected source; it does **not** filter for a particular knob address. Consequently, a different MIDI channel or Shift layer could explain a wrong mapping, but cannot by itself explain zero packets. Its successful self-tests materially weaken a completely broken parser/callback hypothesis. They do not validate the source's identity/lifetime during the physical movement window.

A fresh read-only `ioreg` attempt in this review returned a USB plane without `idVendor` properties and no usable exact-device descriptor tree. An archived-class query returned no data. These incomplete observations establish neither current connection nor disconnection. Refresh a usable inventory before any future physical trial.

## Public primary-source findings and boundaries

1. [Serato's exact-model Lite guide](https://support.serato.com/hc/en-us/articles/10327860913423-Hercules-DJControl-Inpulse-300-MK2-Quickstart-Guide-Lite) documents macOS class compliance. That supports using the existing OS driver; it does not prove simultaneous delivery to every client. No driver installation is justified by the zero capture alone.
2. [Hercules' exact-model page](https://support.hercules.com/en/product/djcontrolinpulse300mk2-en/) identifies the MK2 and links its guides. Its long shared release-note history contains material about other models/Windows; those sections must not be treated as this Mac's current requirements.
3. The [Hercules Official response](https://community.hercules.com/community/archives/djcontrol-inpulse-300-mk2-traktor-pro-3-mapping/) says original 300 and MK2 send the same MIDI commands, while the discussion shows control-layout differences. The assertion supports protocol comparison, not installing an older complete mapping as verified MK2 support.
4. Current Mixxx `res/controllers` lists the original-named 300 mapping, not a separate MK2-named preset. There is, however, **explicit MK2 test evidence**: DJ Phatso reported testing both models in [Mixxx PR14057](https://github.com/mixxxdj/mixxx/pull/14057), merged February 2025. [Issue16345](https://github.com/mixxxdj/mixxx/issues/16345) later points to that result and attributes one reported mapping error to mixed mapping files. Neither is a macOS concurrent-Serato capture test.
5. The current [Mixxx mapping source](https://github.com/mixxxdj/mixxx/blob/main/res/controllers/Hercules_DJControl_Inpulse_300.midi.xml) uses browser rotation `B0/01`, alternate `B3/01`. Current script Git blob SHA observed through GitHub's contents API: `380fcdf5de3a47d11c43d02f7e1398871325867c`; XML blob SHA `c1c0a58cdd6299909a593b5bfba005e28de6c09f`. These are source-defined candidates, not this unit's captured bytes. The previously inspected exact-MK2 community mapping agrees on those addresses but has unresolved licensing/provenance; no code was adopted.
6. Both the [Mixxx original script](https://github.com/mixxxdj/mixxx/blob/main/res/controllers/Hercules-DJControl-Inpulse-300-script.js) and the exact-MK2 community script comment that an initialization message requests current knob/fader values. That is not proof of a required input-enabling handshake, nor evidence that sending it would resolve this discrepancy. **The next diagnostic sends no such command.**
7. [Hercules KB1841](https://support.hercules.com/en/kb/1841-en/) explicitly includes the MK2 in its control-panel MIDI test and requires DJ software to be closed. That is a separate controlled test with different preconditions, not a reason to close Serato or install anything during this passive investigation.

**USB endpoint boundary:** historical VID/PID and CoreMIDI endpoint names are established. USB interface numbers, endpoint addresses/directions, alternate settings and Serato's active transfer path have not been verified here. Do not invent `0x81`, a HID report ID, SysEx sequence or initialization handshake from another Hercules model.

## Ranked explanations to test

These are hypotheses, not findings of root cause. No public primary source reviewed documents the exact combination “Serato knob movement, concurrent CoreMIDI observer receives zero” on Jason's unit.

1. **Source identity/lifetime or delivery-selection mismatch.** The old capture binds one display-name match once, before creating its client, and records no notifications or stable identity fields. A stale/offline/replaced source can be tested without changing the controller. Historical enumeration of only one source makes a simple name collision less persuasive, but does not establish 70 seconds of endpoint continuity.
2. **Physical receive-path difference while Serato is active.** Serato could receive control data through a different device path while CoreMIDI receives none. Existing user-client observations make that plausible, not proven. There is no verified exclusive-access or HID claim. Passive all-source capture can narrow it but cannot identify Serato's private path.
3. **Hardware-specific receive/parser boundary.** The working virtual-source self-test does not cover different packet sizes, multiple packets, timestamps, callback contexts or device protocol conversion. Count callbacks before parsing and record parser errors separately. Only after that should a hardware-format hypothesis outrank missing source delivery.

## Smallest next diagnostic that can disconfirm them

Proposed new diagnostic: `scripts/observe_midi_all_sources.py`. Preserve `observe_midi.py` unchanged. Implementation and self-tests are distinct from running a physical movement capture.

- Use primary Apple CoreMIDI headers/docs to verify reference widths, callback signatures, packed packet layout and iteration. Never assume “Python self-test passed” proves the hardware ABI/path.
- Create one passive input client/port and connect **all current sources**, each with a stable per-connection refCon. Log endpoint reference and UniqueID, names, entity/device references and UniqueIDs, offline state, available protocol property, connection OSStatus and enumeration time. No destinations are selected for output.
- Subscribe to CoreMIDI setup/object/property notifications. Log, re-enumerate and connect genuinely new source identities; never silently relabel a packet from a replaced endpoint. Keep a record of unsuccessful property lookups instead of substituting zeros as facts.
- Increment a per-source callback counter **before** packet parsing. Separately log packet count, bytes, parser exceptions, source tags, host packet timestamp and local monotonic/UTC receipt time. Bound retained events/bytes and report every truncation so overflow cannot look like silence.
- Run the same ABI/parser self-test in an isolated owned virtual path, then dispose it. That proves a local diagnostic path only. A physical test must remain a separate, deliberately started mode.
- Ask Jason for a **fresh, agreed movement window** only when the new observer is ready. Do not assume yesterday's confirmation applies to a new recording. Keep Serato open: short rest, several slow knob turns each way, then rest; Jason confirms whether its selection moved during that same window. Avoid transport/load buttons that could start audio or overwrite a deck.

| New result | What it would disconfirm or change |
|---|---|
| Knob-correlated packets appear on the exact hardware source | Disconfirms “no CoreMIDI hardware input in the current shared session”; inspect raw bytes before mapping |
| Packets correlate on another endpoint/UID | Supports source selection/routing mismatch; do not rename it to the hardware without entity/device evidence |
| Notifications replace/offline the originally selected source | Supports the lifetime hypothesis; inspect reconnection statuses and the new UID's delivery |
| Callback count rises, but packet/byte parsing fails | Narrows the failure to the diagnostic's parsing/protocol boundary; fix that before hardware conclusions |
| All callbacks remain zero, connections succeed, identities remain stable, no diagnostic limit/error occurs, isolated self-test passes, Jason confirms movement and Serato response in the same window | Weakens display-name/parser explanations; leaves shared physical delivery versus another Serato device path unresolved |
| No contemporaneous physical confirmation or no usable endpoint inventory | Inconclusive. Do not label the controller unsupported or broken |

A later manufacturer-only test may help distinguish shared-session behavior, but requires its own reviewed preconditions. This plan authorizes no USB reads/writes beyond OS-level passive MIDI delivery, no lighting commands, no driver installation and no automatic app shutdown.

## Implemented observer and independently checked ABI

The new [observer](../../scripts/observe_midi_all_sources.py) has three explicit modes. With no mode it exits through argument validation; it never starts recording by default. Existing `observe_midi.py`, `check_midi_receiver.py` and their historical reports are unchanged.

Apple's installed primary SDK sources were read directly:

- `/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk/System/Library/Frameworks/CoreMIDI.framework/Headers/MIDIServices.h`: `MIDIObjectRef` is `UInt32`; all relevant endpoint/client/port/entity/device references derive from it. `MIDITimeStamp` is `UInt64`. The packet structures are packed to four bytes; the list's first packet begins at byte 4, packet length at byte 8 and data at byte 10. The header's `MIDIPacketNext` aligns `data + length` to four bytes on ARM, while Intel leaves that position unaligned. Notification header fields occupy eight bytes; add/remove child reference and type are at offsets 16/20. Callback declarations and API argument types are checked against those declarations rather than inferred from disassembly.
- `/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk/usr/include/MacTypes.h`: `ItemCount` is `unsigned long`, rather than assuming a 32-bit count.
- Public API references: [MIDIPacket](https://developer.apple.com/documentation/coremidi/midipacket), [MIDIPacketList](https://developer.apple.com/documentation/coremidi/midipacketlist), [MIDIPacketNext](https://developer.apple.com/documentation/coremidi/midipacketnext(_:)), [MIDIInputPortCreate](https://developer.apple.com/documentation/coremidi/midiinputportcreate(_:_:_:_:_:)). The local SDK declarations are the checked evidence; JavaScript documentation shells alone were not treated as read API specifications.

Every observer mode first runs `clang -fsyntax-only` with C static assertions and compatible function-pointer assignments against the selected Apple SDK. It creates no executable or MIDI client during that check. The native packet builder plus virtual-source test separately exercises actual callback delivery and variable-length iteration. Neither can establish delivery from the controller.

The capture mode creates its input client before source enumeration, reads endpoint/entity/device properties with their OSStatus, connects all sources up to an explicit 1,024-source/history safety boundary, and re-enumerates every 0.5 seconds or on notifications. Each successful connection gets a separate token; it never tags by display name. Removal notifications force a new token even if reference/UID are reused. A changed UID on the same reference disconnects the stale binding before reconnecting. Failed connections remain visible without automatic retry storms; they can be reconsidered after removal/reappearance. Property lookup failures are stored as unavailable values, never fabricated zero identities.

Per-source counters distinguish callbacks, declared packet count, successfully decoded packets/bytes, parser errors and omitted raw bytes/records. Counts increment before parsing. Raw MIDI data is capped at 2 MiB total, 4,096 bytes per event and 20,000 event records. Notifications cap at 2,048, property changes at 4,096, scan records at 256 and manual markers at 256, with omission counts. Work caps at 4,096 packets / 256 KiB per callback; a parser-budget rejection is an explicit error, not a zero-message finding. Over-large source/history counts stop with a recorded error. No native UMP callback is implemented: available endpoint protocol metadata is recorded, but legacy MIDI1 conversion/delivery remains a separate hardware boundary.

Reports use new timestamp/random filenames beneath ignored `local-evidence/`; old evidence is never overwritten. The report records local monotonic/UTC receipt time, raw host packet timestamps, input source token, setup notifications, connection statuses and cleanup results. It does not claim to know which physical action occurred. JSON remains bounded by the stated record, byte and string-size limits; long/unrepresentable property strings are flagged.

## Usage and executed checks

Run from the repository with macOS Python 3 and Apple Command Line Tools:

```sh
# No client and no capture: compile assertions against the installed SDK.
python3 scripts/observe_midi_all_sources.py --abi-check

# Owned temporary virtual source ONLY; no physical sources are enumerated.
python3 scripts/observe_midi_all_sources.py --self-test
```

The self-test's virtual source is briefly visible to other CoreMIDI clients. It publishes only on that owned source; it creates no output port and sends nothing to a hardware destination. It disposes the owned source, input port and client. This is authorized diagnostic tooling, not a native-app build.

Executed on this Mac (`arm64`): Apple SDK assertions passed; all **11** native-builder/property/parser/controlled lifecycle subchecks passed; one real virtual-source callback delivered four packets of lengths **1, 3, 6, 300** (310 bytes) with zero parser errors. Disconnect, owned endpoint disposal, port disposal and client disposal each returned OSStatus 0. Owned-source property reads returned an actual signed UID and protocol ID 1; missing manufacturer/model/offline properties retained their `-10835` OSStatus with `null` values. Six invalid CLI cases (no mode, NaN/infinite/out-of-range duration and oversized note) were rejected before client creation; Python AST syntax validation passed. Latest raw result:

`local-evidence/midi-all-sources-self-test-20261017T074436-b73834b0.json`

Earlier raw self-tests are preserved. The additional owned-property case initially failed in `midi-all-sources-self-test-20261017T074414-c90fb562.json` because its assertion incorrectly demanded success OSStatus for a virtual source's nonexistent parent entity. The actual result was `kMIDIObjectNotFound` (`-10842`) and `null`. Apple's header explicitly says virtual endpoints have no owning entity and defines that status; the corrected test accepts either a successful null query or that explicit absent-object status, while retaining the exact returned status. No physical-delivery threshold or byte expectation was changed.

The controlled collaborator checks cover all-source connection/token accounting, removal with reference/UID reuse, initial property snapshot retention, explicit connection failure, raw byte/event limits, unknown source tokens and changed-UID reconnection ordering. Those are **fake lifecycle tests**, not real hardware notification/replug/identity proof. The native-builder case and owned-source callback are the executed CoreMIDI paths. The negative malformed-list fixture proves a callback can be counted even when the parser rejects it; it does not make arbitrary invalid native pointers safe. CoreMIDI's callback ABI supplies no buffer length, so decoding relies on trusted OS-owned storage and the checked ABI.

**Not run:** the following physical mode. Parent must first arrange a fresh movement window with Jason. Keep Serato open. At `READY`, rest 10 seconds, rotate only the browser knob slowly both directions for 20 seconds, then rest for the remainder; confirm afterward whether Serato selection moved during that same interval. Enter adds an optional timestamp marker, not a movement assertion.

```sh
python3 scripts/observe_midi_all_sources.py --capture 45 --note 'Fresh agreed MK2 browser-knob window: rest 0-10s, turn 10-30s, rest 30-45s; Serato remains open'
```

Capture durations must be finite, 1–120 seconds; operator notes cap at 512 characters. A capture report with `error`, nonzero `connect_status`, unavailable identity fields, parser errors, or omitted records must retain those limits in its interpretation. `physical_movement_confirmed` deliberately stays `null`; append Jason's contemporaneous confirmation to the research record afterward rather than manufacture it in the observer.

## Status and re-entry

Completed here: existing scripts/raw reports inspected, exact-model manufacturer and Mixxx primary sources checked, incomplete current OS inventory recorded, observer implemented, primary Apple ABI compile check and isolated/controlled tests executed. **Not performed:** physical capture, physical hardware movement, hardware MIDI/USB output, manufacturer test or device reconfiguration.

Next: parent coordinates one fresh physical movement window, deliberately starts the capture, checks the exact source UID/connection statuses and correlates raw input with Jason's confirmation. Full controller mapping, audio routes, LED feedback, jog encoding and latency remain unverified.

Skills applied: use, adversarial-verify. The conducting-research skill was inspected and discarded because its branding/identity workflow does not apply to this hardware task.
