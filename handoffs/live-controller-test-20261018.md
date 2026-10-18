# Active boundary: Jason is ready for physical Hercules testing

18October2026. Jason explicitly returned to the connected controller and asked to test MIDI now. Prioritize this live test over the pending Stems phase investigation. Existing prototype/local desktop approval remains valid; no new build or native-engine rewrite is authorized by this readiness message.

## Current physical test

Actual Open Play Playback Test0.1.23 was raised through native app control. Fresh Devices observation: named DJControl Inpulse300Mk2 selected; four-channel output, master1/2, cue3/4, CueMix0%, CueVolume10%, no muted status. Closed dialog. Fresh actual main observation: zero decks playing, both00:00.0, Master−12dB. Deck1AfterHours124BPM; deck2GlassTransit126BPM. No app Play was pressed by Codex.

Pending human question: press the LEFT physical Hercules Play once; report whether deck1timer moves and RCA speakers play. Three choices: timer+sound, timer/no sound, no timer. This has no capture deadline. Observe current app after the response and record native UI and human acoustics separately. Then ask for the same physical Play to stop; continue one control/action at a time toward load/play/cue/manual beatmatch/Sync/faders/EQ/jogs/pads. Do not treat one button as all-control acceptance. Do not restart the app, switch build, overwrite mappings or run a broad matrix before diagnosing any actual failure.

## Suspended DSP investigation; exact re-entry

Authoritative main/origin checkpointfd467137045ac1c9f0d06b57c57f9a940ca8549f. Plan137 production/browser change and pass/failure receipts are committed. Prepared native23 remains frozen and contains neither plan135/136LPF nor137Stems activation changes.

Uncommitted plan138diagnostics: `experiments/stem_activation_phase.mjs`, `scripts/inspect_stem_activation_phase.py`, `docs/prototype/stem-activation-phase-isolation-results.json`, `stem-activation-phase-repeatability-results.json`, and `handoffs/stem-activation-phase-fable-20261018.md`. No plan138production change. Exact-WASM serial data under ignored`local-evidence/stem-activation-phase-138/`; cold/late and2/10channel changes alter phase; duplicate same-start instances are byte-identical. This evidence is not a browser fix or full parity acceptance.

Authorized fresh Claude Code Fable5.1High consultation is open in the Claude app, session title`Stem activation phase diagnosis`. Native handle`fableConsultApp` and CLI PID56808 were observed live; latest expanded diagnostic tool has actual completed output. A follow-up asked it to finish the bounded recommendation without more tests. Expected sole report:`docs/research/claude-fable/stem-activation-phase-20261018.md`. Do not restart solely because that file is absent; re-check the same actual session/process. This consultation is separate from the full independent Claude audit, which remains unlaunched. Preserve source/package/profile/raw recordings and main8768service. No production edits were delegated.

After the live controller test, inspect that exact report/session, independently check its evidence, and implement the next justified phase/ownership correction. Maintain full110featuregroups/522requirements/9beta deltas/26releasechecks/55extendedFX/Stems-keylock objective, original prompt/exact full-Claude suffix, model-effort routing and honest acceptance flags. Full goal remains active and unachieved.

## First physical result

Jason confirmed leftPlay once starts timer and RCA sound, then confirmed a second leftPlay press paused it. Actual native observation is0playing/deck1position8.052s/deck2zero/Master−12. Scoped receipt docs/prototype/controller-physical-20261018-results.json. Next right physical Play/pause. This is user-reported acoustics plus actual paused UI, not measured microphone/socket or all-control acceptance.

RightPlay/pause user-confirmed with RCA sound. Actual fresh bothpaused positions left9.187/right2.076. Left moved since earlier8.052sample; no cross-control inferred yet because intervening earlier actions were not observed. Pending fresh isolation: RIGHTPlay once, leaveplaying, report onlydeck2/both/neither. Current baseline is9.187/2.076.

## Current checkpoint: right fader and cue

Fresh isolated rightPlay was human-confirmed and native-observed: only deck2 running, left9.187unchanged/right11.748. Jason reported speaker silence with right fader down. First native level stayed0.8 and source near fadeout, so not accepted from that observation. Prepared steady early loop8–10s using real GUI seek/Loop/Play. Explicit centre-right fader up/down sweep reached native MIDI CCch3/0 paired32; after closing MIDI editor, actual main level0/deck2playing observed. Exported272mapping profile before diagnosis; no mappings or production code changed. Backup raw under ignored local-evidence/controller-physical-20261018. Pending human action: RIGHT channel headphoneCUE once, fader staysdown; report headphonesplay/speakerssilent. No fixed capture deadline.

Fable report now exists at docs/research/claude-fable/stem-activation-phase-20261018.md; read without changing app focus. It proposes preserving the original processor at attach and deferring cross-instance transfer to first partial-pad action, explicitly leaving a once-only dip there. This is a recommendation, not implemented/accepted full continuity. Its final desktop stopped claim is stale relative to this live physical test; actual app is running deck2. Keep physical testing first.

Right physical headphoneCUE now human-confirmed headphonesplay/speakerssilent, actual rightlevel0/deck2running. Current pending: raise same right faderhalfway, RCA soundreturnwhiledeck2runs. Cue constantAXlabeldoesnotexpose selectedstate; no socketmeasurement.

Right faderreturn human-confirmed speakersplay/deck2running. Actual screenshot shows faderthumbraised and rightCUEblue; AXrangevalue0 is stale despite visible result. Pending RIGHTlongTEMPOmoveoffcentre→BPM126/audiblespeedresponse. No mappings/code/package changes.

Phase-review update: independent absolute-audio-time fits retain157.01939/−62.08805degree phase changes with amplitude ratios1.000311/1.000173. Fable deferred-transfer recommendation explicitly shifts the dip to first partial Stem-pad action and is not accepted as a parity fix. See docs/prototype/STEM_ACTIVATION_PHASE_REVIEW.md and stem-activation-absolute-phase-results.json. No production/native change; physical tempo question remains pending.
