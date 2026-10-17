"""Read-only product checks reused without overwriting any prior receipt."""
import datetime
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
checker = ROOT / 'scripts/revalidate_current_parity.py'
source = checker.read_text()
assert source.count('\nreport = {') == 1
# Only the original read/assert prefix; none of its report-writing body runs.
namespace = {'__file__': str(checker), '__name__': 'preservation_only'}
exec(compile(source.split('\nreport = {', 1)[0], str(checker), 'exec'), namespace)
report = {
 'checked_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'scope': 'Hash/count/actual ASAR payload preservation; not new product behavior or live reference verification.',
 'checker_prefix_source_sha256': hashlib.sha256(source.encode()).hexdigest(),
 'production_changed': False, 'new_behavior_passes_awarded': 0, 'full_parity_verified': False,
 'source_and_evidence_identities': namespace['verified'],
 'current_native': namespace['candidate'],
 'actual_packaged_current_sources': namespace['packaged'],
 'scope_counts': {'feature_groups': len(namespace['features']), 'requirements': len(namespace['requirements']), 'beta_deltas_separate': 9, 'release_checks_separate': 26, 'macos_release_obligations': 24},
 'requirement_flags': dict(namespace['flags']),
 'original_prompt': {'bytes': len(namespace['prompt']), 'sha256': hashlib.sha256(namespace['prompt']).hexdigest(), 'full_handoff_suffix_exact': True},
 'reference_scope': 'Historical saved REA/reference identities rehashed; no fresh vendor or UI behavior claim.',
 'experimental_evidence': 'New separately served engine/counter candidates have their own whole reports, plans, frozen source snapshots, raw and independent reviews. No test result transfers to installed0.1.6.',
}
out = ROOT / 'docs/research/SOUNDTOUCH_ENGINE_PRODUCT_PRESERVATION_20261017.json'
with out.open('x') as handle: json.dump(report, handle, indent=2); handle.write('\n')
print(json.dumps({'scope': report['scope_counts'], 'flags': report['requirement_flags'], 'actual_ASAR_source_matches': len(namespace['packaged']), 'original_prompt_bytes': len(namespace['prompt'])}, indent=2))
