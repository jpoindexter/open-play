"""Loopback-only job adapter for the browser prototype's local separation worker."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import hashlib
import json
import os
import signal
import subprocess
import threading
import uuid
from stem_job_cache import restore_complete, save_complete, valid_exports
from stem_limits import preparation_budget

ROOT = Path(__file__).resolve().parents[1]
JOBS_ROOT = ROOT / 'local-evidence/stem-jobs'
MAX_BYTES = 128 * 1024 * 1024


class StemJobs:
    def __init__(self):
        self.jobs = restore_complete(JOBS_ROOT)
        self.lock = threading.RLock()
        self.pool = ThreadPoolExecutor(max_workers=1, thread_name_prefix='stem-worker')
        from stem_uploads import StemUploads
        self.uploads = StemUploads(self, JOBS_ROOT / '.uploads')

    def runtime(self, backend="scnet"):
        # Backend/interpreter selection is explicit and never installs anything.
        if backend not in {'scnet', 'spleeter'}:
            raise ValueError('Unknown local separation model.')
        environment = 'spleeter-venv' if backend == 'spleeter' else 'venv'
        return (ROOT / f'local-evidence/stems-runtime/{environment}/bin/python', ['--backend', backend])

    def create(self, data, backend="scnet"):
        if len(data) < 44 or data[:4] != b'RIFF' or data[8:12] != b'WAVE':
            raise ValueError('Upload must be a decoded WAV file.')
        return self._create(data, backend)

    def create_file(self, path, backend="scnet"):
        # Only the generated, closed upload file is handed here by StemUploads.
        return self._create(path, backend)

    def _create(self, source, backend):
        # Cached exports belong to the exact worker/postprocessor, not just audio/model.
        self.runtime(backend)
        pipeline = b''.join((ROOT / 'scripts' / name).read_bytes() for name in ('stem_worker.py', 'stem_mix_consistency.py'))
        fingerprint = hashlib.sha256(backend.encode() + hashlib.sha256(pipeline).digest())
        if isinstance(source, bytes):
            fingerprint.update(source)
        else:
            with source.open('rb') as stream:
                for block in iter(lambda: stream.read(1024 * 1024), b''):
                    fingerprint.update(block)
        key = fingerprint.hexdigest()
        with self.lock:
            for job in self.jobs.values():
                if job['hash'] == key and job['state'] == 'complete':
                    if valid_exports(job['directory'], job['backend']):
                        return self.public(job)
                    job.update(state='failed', error='Cached exports changed or are incomplete. Prepare again.')
            if sum(j['state'] in {'queued', 'running'} for j in self.jobs.values()) >= 4:
                raise ValueError('Preparation queue is full. Wait or cancel a job.')
            interpreter, _ = self.runtime(backend)
            if not interpreter.is_file():
                raise ValueError('Local separation runtime is not installed. See STEMS_RUNTIME_EVALUATION.md.')
            ident = uuid.uuid4().hex
            directory = JOBS_ROOT / ident
            directory.mkdir(parents=True)
            if isinstance(source, bytes):
                (directory / 'input.wav').write_bytes(source)
            else:
                source.replace(directory / 'input.wav')
            job = {'id': ident, 'hash': key, 'state': 'queued', 'directory': directory,
                   'process': None, 'error': None, 'backend': backend}
            self.jobs[ident] = job
            self.pool.submit(self.run, job)
            return self.public(job)

    def run(self, job):
        directory = job['directory']
        interpreter, options = self.runtime(job['backend'])
        with self.lock:
            if job['state'] == 'cancelled':
                return
            try:
                job['budget'] = preparation_budget(directory / 'input.wav')
            except (ValueError, OSError) as error:
                job.update(state='failed', error=str(error))
                return
            job['state'] = 'running'
            with (directory / 'worker.log').open('wb') as log:
                try:
                    process = subprocess.Popen([str(interpreter), str(ROOT / 'scripts/stem_worker.py'),
                        str(directory / 'input.wav'), str(directory / 'output'),
                        '--status', str(directory / 'status.json'), '--max-seconds', str(job['budget']['maximumDecodeSeconds']), *options],
                        stdout=log, stderr=log, start_new_session=True)
                    job['process'] = process
                except OSError as error:
                    job.update(state='failed', error=str(error))
                    return
        try:
            result = process.wait(timeout=job['budget']['workerTimeoutSeconds'])
            with self.lock:
                if job['state'] == 'cancelled':
                    return
                if result == 0 and (directory / 'output/manifest.json').is_file():
                    job['state'] = 'complete'
                    try:
                        save_complete(job)
                    except (OSError, ValueError) as error:
                        # Inference remains usable if only its restart receipt fails.
                        job['cache_warning'] = str(error)
                else:
                    status = self.read_json(directory / 'status.json')
                    job.update(state='failed', error=status.get('error', 'Local separation failed.'))
        except subprocess.TimeoutExpired:
            self.cancel(job['id'])
            with self.lock:
                job.update(state='failed', error=f"Preparation exceeded its {job['budget']['workerTimeoutSeconds']} second processing budget.")
        finally:
            with self.lock:
                job['process'] = None

    @staticmethod
    def read_json(path):
        try:
            return json.loads(path.read_text())
        except (OSError, ValueError):
            return {}

    def public(self, job):
        status = self.read_json(job['directory'] / 'status.json') if job['state'] == 'running' else {}
        value = {'id': job['id'], 'state': job['state'], 'stage': status.get('state', job['state']),
                 'progress': status.get('progress', 1 if job['state'] == 'complete' else 0),
                 'error': job['error']}
        if job.get('budget'):
            value['preparationBudget'] = job['budget']
        if job.get('cache_warning'):
            value['cache_warning'] = job['cache_warning']
        if job['state'] == 'complete':
            manifest = self.read_json(job['directory'] / 'output/manifest.json')
            value.update(model=manifest.get('model'), duration=manifest.get('duration'),
                         timing=manifest.get('timing'), license=manifest.get('weight_redistribution'))
            value['stems'] = [{'name': s['name'], 'url': f"/api/stems/{job['id']}/{s['name']}.wav"}
                              for s in manifest.get('stems', [])]
        return value

    def get(self, ident):
        with self.lock:
            job = self.jobs.get(ident)
            if job and job['state'] == 'complete' and not valid_exports(job['directory'], job['backend']):
                job.update(state='failed', error='Cached exports changed or are incomplete. Prepare again.')
            return self.public(job) if job else None

    def trash(self, ident):
        from stem_job_cache import IDENT
        if not isinstance(ident, str) or not IDENT.fullmatch(ident):
            raise ValueError('Invalid preparation job.')
        with self.lock:
            job = self.jobs.get(ident)
            if not job:
                return None
            if job['state'] == 'trashed':
                return self.public(job)
            if job['state'] in {'queued', 'running'} or (job.get('process') and job['process'].poll() is None):
                raise ValueError('Cancel preparation before moving its files to Trash.')
            directory = JOBS_ROOT / ident
            if job['directory'] != directory or directory.is_symlink() or JOBS_ROOT.is_symlink() or not directory.is_dir():
                raise ValueError('Preparation cache folder is unavailable or invalid.')
            try:
                from send2trash import send2trash
            except ImportError as error:
                raise RuntimeError('Send2Trash is required to move prepared files safely. Files were retained.') from error
            send2trash(str(directory))
            job.update(state='trashed', process=None, error=None)
            job.pop('cache_warning', None)
            return self.public(job)

    def cancel(self, ident):
        process = None
        with self.lock:
            job = self.jobs.get(ident)
            if not job:
                return None
            if job['state'] in {'queued', 'running'}:
                job['state'] = 'cancelled'
                process = job['process']
                if process and process.poll() is None:
                    try:
                        os.killpg(process.pid, signal.SIGTERM)
                    except ProcessLookupError:
                        pass
        # Reap outside the lock; the worker completion path acquires the same lock.
        if process:
            try:
                process.wait(timeout=2)
            except subprocess.TimeoutExpired:
                try:
                    os.killpg(process.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
                process.wait(timeout=2)
        with self.lock:
            return self.public(job)

    def file(self, ident, name):
        with self.lock:
            job = self.jobs.get(ident)
            if not job or job['state'] != 'complete' or name not in {'vocals.wav', 'other.wav', 'bass.wav', 'drums.wav'}:
                return None
            path = job['directory'] / 'output' / name
            return path if path.is_file() else None

    def close(self):
        self.uploads.close()
        for ident in list(self.jobs):
            self.cancel(ident)
        self.pool.shutdown(wait=False, cancel_futures=True)
