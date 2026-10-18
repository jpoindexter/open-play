# Completed Stems preparation survives service restart

Plan116, 18October2026, source after a005405. Existing Electron0.1.16 bundle/profile/interface/controller state are unchanged. This updates the external loopback preparation service.

## Change

Previously completed jobs were reused only while one StemJobs instance remained alive. Exports remained on disk, but a restarted service discarded its lookup state and performed another inference for an identical upload.

A completed job now receives an atomic, flushed local service-cache.json receipt containing only schema, job ID, content/pipeline hash and backend. Startup rebuilds eligible completed jobs from canonical folders, complete manifest and four fixed source filenames/content hashes. Queued/running/cancelled jobs are never resumed. Metadata supplies no filesystem paths. Linked folders/metadata/exports, malformed/oversized metadata, missing outputs and hash changes do not become restored jobs. Reuse validates the four hashes again. A changed cache becomes failed and a new request gets a new owner; old evidence is preserved.

The existing upload/model/worker/projection content key remains unchanged, so a different inference pipeline gets a distinct identity. No model/weights/normalization/projection/quality default changed. A receipt write failure leaves completed inference usable with an API cache_warning; it does not falsely promise restart reuse. Startup hashes retained outputs, so large caches incur disk work; no startup-time or crash/power-loss guarantee. Legacy job folders without a receipt are retained but not guessed/migrated into trusted current jobs.

## Executed evidence

Focused actual-file/production-method checks use a tiny worker-shaped four-WAV fixture and a fresh interpreter. Identical upload reuses the restored ID without reaching worker startup; tampered source hashes create a new owner and retain old files; malformed, linked and unfinished records are ignored. This is controlled worker evidence, not model inference. Receipt: stem-job-cache-contract-results.json.

Separate actual HTTP workflow starts a temporary18862service, submits the existing6.8s CC BY-NC-SA MUSDB development mixture and executes pinned CPU SCNet-large plus the unchanged mixture projection. All four downloaded Float WAV hashes match the actual worker manifest, and a completion receipt is present. After normal SIGINT/exit, a fresh service process restores the same completed ID. Same upload returns that ID complete; all four downloaded bytes and worker status/log/manifest remain identical. Existing service request/cancellation checks pass10/10; their completed-cache fixture now has real manifest/files rather than an empty fake completion marker.

Actual job c6d2ffa656a94c4e96d99d73dd11eeac. Temporary server processes23128→23161 both exited. The cache POST observation was0.006491s on this one short input; this is not a performance benchmark or general latency claim. SCNet checkpoint SHA719e5abb8ed920305dad546ac3cd6fb0b1e9c3092d14ce21827bfc0423af3070. Source identities/complete observations: [API restart receipt](stem-job-cache-api-restart-results.json), [service checks](stem-service-cache-review-results.json).

Then the normal8768service was observed idle (no stem_worker process), old PID1634/session90132 exited normally, and updated service PID23214/session1199 launched. Existing desktop host18775 proxy→new8768service accepts the same input, restores/reuses the same completed ID, returns all four identical downloads, and leaves worker status/log/manifest unchanged. Scope is actual API/export/cache behavior, not native GUI/audio/physical acceptance. [Live service receipt](stem-job-cache-live-service-results.json). Native0.1.16PID18011/bundle remained unchanged; no routing/mapping/profile action was performed.

Raw audio/logs/receipts/source capsules remain ignored under local-evidence/stem-job-cache-api/restart and the job directory. Reproduce once with python3 scripts/verify_stem_job_cache_restart.py NEW_IGNORED_DIRECTORY; it owns only its temporary18862server and leaves8768alone. It performs one actual inference, not just a mocked cache check.

## Remaining scope

Browser prepared/decode state across application restart, explicit cache clear/eviction/UI, legacy migration, fault/disk-pressure/large-cache performance and all model-quality/native/controller/reference acceptance remain open. Completion receipts cover normal service restart; interrupted jobs require a new request. Full110groups/522requirements plus9beta deltas/26release checks remain unaccepted, original prompt/model routing unchanged. Full independent Claude audit unlaunched. The active main service1199 must remain running for desktop preparation; desktop0.1.16 remains prepared for one physical Play test when the human returns.

Current follow-up plan117: [native Trash/regeneration review](STEM_CLEAR_REVIEW.md). Main service is now25079/session8983; prior1199has exited. Historical restart results above remain tied to plan116.
