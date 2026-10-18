"""Completed local job receipts; no queued/running job or process is resumed.

Receipts never supply filesystem paths. Only canonical job folders and the four
fixed worker exports are eligible, with complete manifest and content hashes.
"""
import hashlib
import json
import math
import os
from pathlib import Path
import re
import tempfile

NAMES = {'drums', 'bass', 'other', 'vocals'}
IDENT = re.compile(r'[0-9a-f]{32}')
HASH = re.compile(r'[0-9a-f]{64}')
RECEIPT = 'service-cache.json'


def digest(path):
    result = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            result.update(block)
    return result.hexdigest()


def read_record(path, maximum):
    if path.is_symlink() or not path.is_file() or path.stat().st_size > maximum:
        raise ValueError('Invalid cache metadata file')
    return json.loads(path.read_text())


def valid_exports(directory, backend):
    try:
        output = directory / 'output'
        if directory.is_symlink() or output.is_symlink():
            return False
        manifest = read_record(output / 'manifest.json', 65536)
        if manifest.get('state') != 'complete' or manifest.get('backend') != backend:
            return False
        if (not isinstance(manifest.get('frames'), int) or manifest['frames'] <= 0 or
                manifest.get('channels') != 2 or manifest.get('sample_rate') != 44100 or
                not isinstance(manifest.get('duration'), (int, float)) or
                not math.isfinite(manifest['duration']) or manifest['duration'] <= 0 or
                abs(manifest['frames'] / 44100 - manifest['duration']) > 1 / 44100):
            return False
        stems = manifest.get('stems')
        if not isinstance(stems, list) or len(stems) != 4 or {s.get('name') for s in stems} != NAMES:
            return False
        for stem in stems:
            if stem.get('file') != stem['name'] + '.wav' or not HASH.fullmatch(stem.get('sha256', '')):
                return False
            path = output / stem['file']
            if path.is_symlink() or not path.is_file() or digest(path) != stem['sha256']:
                return False
        return True
    except (OSError, ValueError, TypeError, AttributeError, KeyError):
        return False


def save_complete(job):
    if (job['state'] != 'complete' or not IDENT.fullmatch(job['id']) or
            job['directory'].name != job['id'] or not HASH.fullmatch(job['hash']) or
            job['backend'] not in {'scnet', 'spleeter'} or not valid_exports(job['directory'], job['backend'])):
        raise ValueError('Only verified complete four-source jobs can be cached')
    record = {'schema': 1, 'id': job['id'], 'hash': job['hash'], 'backend': job['backend']}
    target = job['directory'] / RECEIPT
    with tempfile.NamedTemporaryFile(mode='w', dir=job['directory'], prefix='.service-cache-', delete=False) as stream:
        temporary = Path(stream.name)
        json.dump(record, stream, indent=2); stream.write('\n'); stream.flush(); os.fsync(stream.fileno())
    os.replace(temporary, target)


def restore_complete(root):
    jobs = {}
    if not root.is_dir() or root.is_symlink():
        return jobs
    for directory in root.iterdir():
        if not IDENT.fullmatch(directory.name) or directory.is_symlink() or not directory.is_dir():
            continue
        try:
            record = read_record(directory / RECEIPT, 4096)
            if (record.get('schema') != 1 or record.get('id') != directory.name or
                    not HASH.fullmatch(record.get('hash', '')) or
                    record.get('backend') not in {'scnet', 'spleeter'} or
                    not valid_exports(directory, record['backend'])):
                continue
            jobs[record['id']] = {'id': record['id'], 'hash': record['hash'],
                                 'backend': record['backend'], 'directory': directory,
                                 'state': 'complete', 'process': None, 'error': None}
        except (OSError, ValueError, TypeError, AttributeError):
            continue
    return jobs
