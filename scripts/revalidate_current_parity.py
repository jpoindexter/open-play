"""Recheck evidence identities and candidate accounting, never award behavior parity."""
import collections
import datetime
import hashlib
import json
import struct
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/research/PARITY_CURRENT_REVALIDATION_20261017.json'

def read(path):
    return json.loads((ROOT / path).read_text())

def sha(path):
    with (ROOT / path).open('rb') as handle:
        return hashlib.file_digest(handle, 'sha256').hexdigest()

def verify(items):
    result = []
    for item in items:
        actual = sha(item['path'])
        assert actual == item['sha256'], f"Identity drift: {item['path']}"
        result.append({'path': item['path'], 'sha256': actual})
    return result

audit = read('docs/research/CURRENT_PARITY_AUDIT_20261017.json')
match = read('docs/research/CURRENT_FEATURE_MATCH_20261017.json')
candidate = read('docs/prototype/desktop-0.1.6-candidate.json')
sources = read('docs/research/PARITY_CURRENT_REVALIDATION_SOURCES_20261017.json')
rea = read('docs/research/PARITY_CURRENT_REVALIDATION_REA_20261017.json')
features = audit['features']
assert len(features) == len({f['feature_id'] for f in features}) == 110
requirements = [r for f in features for r in f['requirement_evidence']]
assert len(requirements) == len({r['id'] for r in requirements}) == 522
assert all(f['full_feature_parity_verified'] is False for f in features)
assert all(f['model_routing']['codex'] and f['model_routing']['claude_code'] for f in features)
assert all(r['canonical_reference_parity_verified'] is not True for r in requirements)
assert len(match['release_checks']) == 26
assert all(c['open_play_full_parity_verified'] is False for c in match['release_checks'])
assert match['scope']['beta_deltas_separate'] == 9
assert sum(c['macos_parity_obligation'] for c in match['release_checks']) == 24
verified = {
    'audit_snapshots': verify(audit['source_and_document_snapshots']),
    'feature_check_inputs': verify(match['input_hashes']),
    'native_candidate_sources': verify(candidate['source_hashes']),
    'native_candidate_evidence': verify(candidate['evidence']),
}
assert sha(candidate['ASAR_path']) == candidate['ASAR_sha256']
assert sha('PROJECT_PROMPT.md') == '699d5f1556d148800fda22362be86b6f4acdcaac06dca0f5801b025af1291c8e'
prompt = (ROOT / 'PROJECT_PROMPT.md').read_bytes()
assert len(prompt) == 20996
assert (ROOT / 'handoffs/codex-to-claude-completeness-audit.md').read_bytes().endswith(prompt)
# current.md is a rolling re-entry packet; the full audit handoff owns the prompt suffix.
assert b'PROJECT_PROMPT.md' in (ROOT / 'handoffs/current.md').read_bytes()

# Compare actual ASAR payload bytes with current source, not names in a manifest.
with (ROOT / candidate['ASAR_path']).open('rb') as archive:
    size, header_size, pickle_size, json_size = struct.unpack('<4I', archive.read(16))
    assert size == 4 and 0 < json_size <= pickle_size <= header_size
    header = json.loads(archive.read(json_size))
    def entries(node, prefix=''):
        for name, item in node.get('files', {}).items():
            path = prefix + name
            if 'files' in item:
                yield from entries(item, path + '/')
            else:
                yield path, item
    packaged = []
    for path, item in entries(header):
        if not path.startswith('assets/prototype/'):
            continue
        assert not item.get('unpacked') and 'offset' in item
        archive.seek(8 + header_size + int(item['offset']))
        data = archive.read(item['size'])
        assert len(data) == item['size']
        relative = path.removeprefix('assets/')
        digest = hashlib.sha256(data).hexdigest()
        assert sha(relative) == digest, relative
        packaged.append({'path': path, 'source_path': relative, 'sha256': digest})
assert len(packaged) == candidate['prototype_files_compared'] == 222
current = {str(p.relative_to(ROOT)) for p in (ROOT / 'prototype').rglob('*') if p.is_file()}
assert current == {p['source_path'] for p in packaged}
assert rea['reference_plist']['normalized_result']['bundle']['version'] == '4.0.10.213'
assert rea['open_play_selected_static_analysis']['subject']['digest']['sha256'] == candidate['ASAR_sha256']

flags = collections.Counter('unset' if r['canonical_reference_parity_verified'] is None else str(r['canonical_reference_parity_verified']).lower() for r in requirements)
report = {
    'checked_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'git_head': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
    'outcome': 'ACCOUNTING_CHECKS_PASS_FULL_PARITY_NOT_ESTABLISHED',
    'full_parity_verified': False,
    'new_behavior_passes_awarded': 0,
    'checker_initial_attempt': 'Stopped on an incorrect test assumption that rolling current.md ends with the original prompt. Actual contract: full completeness-audit handoff owns the byte-exact suffix; current.md references it. Checker corrected; no product/handoff bytes changed to satisfy the initial assertion.',
    'reference': {'installed': '4.0.10.213', 'production': '4.0.10', 'REA_identity': rea['reference_plist']['evidence_id']},
    'current_desktop': {'version': candidate['version'], 'ASAR_sha256': candidate['ASAR_sha256'], 'source_commit': candidate['implementation_source_commit'], 'packaged_current_source_matches': len(packaged)},
    'counts': {'feature_groups': len(features), 'unique_requirements': len(requirements), 'classifications': dict(collections.Counter(f['classification'] for f in features)), 'full_requirement_flags': dict(flags), 'separate_beta_deltas': 9, 'provisional_release_checks': 26, 'macos_release_checks': 24, 'windows_reference_checks': 2},
    'verified_identities': verified,
    'packaged_current_source': packaged,
    'full_manual_semantic_review_complete': read('docs/research/manual-feature-crosswalk.json')['semantic_review_complete'],
    'current_source_observations': [
        {'path': 'prototype/app.js', 'line': 816, 'behavior': 'Sync adjusts rate; phase and takeover explicitly simulated.', 'proof': 'CODE_PATH_NOT_NEW_RUNTIME_TEST'},
        {'path': 'prototype/panels.js', 'line': 1371, 'behavior': 'Link only mutates joined/tempo/peers fixture state.', 'proof': 'CODE_PATH_NOT_NEW_NETWORK_TEST'},
        {'path': 'prototype/panels.js', 'line': 1778, 'behavior': 'Provider catalog entries and connection/access states are fabricated fixtures.', 'proof': 'CODE_PATH_NOT_PROVIDER_EXECUTION'},
        {'path': 'prototype/engine.js', 'line': 80, 'behavior': 'MediaStream destination receives master output; actual saved captures exist, but reference pre-master contract remains open.', 'proof': 'CODE_PATH_PLUS_HISTORICAL_SCOPED_RECORDINGS'},
    ],
    'this_unit_executed': ['Official six-page reference refresh', 'REA installed plist and selected actual0.1.6 ASAR syntax analysis', 'All named source/evidence hashes and actual222file ASAR/source comparisons', 'Current main-app title/paused state/Vertical controls read via native UI; no playback or settings changed'],
    'not_executed': ['All522 requirement runtime paths', 'All168 manual article semantic reviews', 'New Serato reference audio/UI behavior comparisons', 'Physical hardware controls or sound routing', 'Provider or Link sessions', 'FX/stem/keylock audio quality reruns', 'Full Claude completeness audit'],
    'failure_preservation': ['Native006+2left pitch error1.046193Hz remains greater than fixed1Hz criterion; cause unknown', 'SCNet reconstruction3.025% greater than3%; other source SI-SDR-1.01dB remains', 'Cursor cohorts retain original validity and acceptance outcomes; no repair/regrading'],
    'source_refresh': sources,
    'feature_rows': [{'id': f['feature_id'], 'title': f['title'], 'classification': f['classification'], 'requirements': f['requirements'], 'positive_evidence_boundary': f['positive_evidence_boundary'], 'remaining_gap': f['remaining_gap'], 'model_routing': f['model_routing'], 'full_feature_parity_verified': False} for f in features],
    'limits': ['A successful evidence checker is not a successful parity test.', 'REA selected3sources and left740files outside semantic analysis. No-match trace does not establish absence.', 'Current source matches packaging, but prior behavior stays scoped to its recorded candidate, inputs and environment.', 'No percentage completion inferred; full inventory discovery and semantic review remain unfinished.'],
}
OUT.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({k: report[k] for k in ['outcome', 'counts', 'current_desktop', 'new_behavior_passes_awarded']}, indent=2))
