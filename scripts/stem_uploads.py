"""Bounded temporary WAV transport, separate from persistent preparation jobs."""
from pathlib import Path
import shutil
import struct
import threading
import time
import uuid

CHUNK_BYTES = 4 * 1024 * 1024
UPLOAD_BYTES = 1024 * 1024 * 1024
IDLE_SECONDS = 30 * 60


class StemUploads:
    def __init__(self, jobs, root):
        self.jobs = jobs
        self.root = Path(root)
        self.sessions = {}
        self.lock = threading.RLock()

    def _discard(self, session):
        # Paths are generated here, never supplied by a client or cache receipt.
        path = session['path']
        path.unlink(missing_ok=True)
        path.parent.rmdir()

    def _expire(self):
        now = time.monotonic()
        for ident, session in list(self.sessions.items()):
            if now - session['updated'] > IDLE_SECONDS:
                if not session.get('job'):
                    self._discard(session)
                del self.sessions[ident]
        # Completed transport receipts have no files and only cover commit/abort races.
        completed = [ident for ident, s in self.sessions.items() if s.get('job')]
        for ident in completed[:-64]:
            del self.sessions[ident]

    def begin(self, size, backend):
        if type(size) is not int or not 44 < size <= UPLOAD_BYTES:
            raise ValueError('Decoded WAV must be between 45 bytes and 1 GiB.')
        self.jobs.runtime(backend)
        with self.lock:
            self._expire()
            pending = [s for s in self.sessions.values() if not s.get('job')]
            if len(pending) >= 2:
                raise ValueError('Two audio uploads are already active. Wait or cancel one.')
            self.root.mkdir(parents=True, exist_ok=True)
            reserved = sum(s['size'] - s['received'] for s in pending)
            if shutil.disk_usage(self.root).free < size + reserved + 64 * 1024 * 1024:
                raise ValueError('Not enough free disk space for local audio preparation.')
            ident = uuid.uuid4().hex
            directory = self.root / ident
            directory.mkdir()
            path = directory / 'input.part'
            path.touch(exist_ok=False)
            self.sessions[ident] = dict(path=path, size=size, received=0, backend=backend,
                                        updated=time.monotonic(), job=None)
            return dict(id=ident, received=0, size=size, chunkBytes=CHUNK_BYTES)

    def append(self, ident, offset, data):
        with self.lock:
            self._expire()
            session = self.sessions.get(ident)
            if not session or session.get('job'):
                raise ValueError('Audio upload is unavailable. Prepare again.')
            if type(offset) is not int or offset != session['received']:
                raise ValueError('Audio chunk offset does not match. Prepare again.')
            if not 0 < len(data) <= CHUNK_BYTES or offset + len(data) > session['size']:
                raise ValueError('Audio chunk exceeds its declared upload boundary.')
            with session['path'].open('ab') as stream:
                stream.write(data)
            session.update(received=offset + len(data), updated=time.monotonic())
            return dict(id=ident, received=session['received'], size=session['size'])

    def commit(self, ident):
        with self.lock:
            self._expire()
            session = self.sessions.get(ident)
            if not session:
                raise ValueError('Audio upload is unavailable. Prepare again.')
            if session.get('job'):
                return self.jobs.get(session['job'])
            if session['received'] != session['size']:
                raise ValueError('Audio upload is incomplete.')
            path = session['path']
            with path.open('rb') as stream:
                header = stream.read(44)
            if (len(header) != 44 or header[:4] != b'RIFF' or header[8:16] != b'WAVEfmt ' or
                    header[36:40] != b'data' or struct.unpack_from('<I', header, 4)[0] != session['size'] - 8 or
                    struct.unpack_from('<I', header, 40)[0] != session['size'] - 44 or
                    struct.unpack_from('<HH', header, 20)[0] != 3 or struct.unpack_from('<H', header, 34)[0] != 32):
                raise ValueError('Upload is not the declared decoded float WAV.')
            result = self.jobs.create_file(path, session['backend'])
            session.update(job=result['id'], updated=time.monotonic())
            # create_file either moved input into its job or reused a verified completed cache.
            self._discard(session)
            return result

    def cancel(self, ident):
        with self.lock:
            session = self.sessions.pop(ident, None)
            if not session:
                return None
            if session.get('job'):
                job = self.jobs.cancel(session['job'])
                return dict(id=ident, state='cancelled', job=job['id'] if job else None)
            self._discard(session)
            return dict(id=ident, state='cancelled')

    def close(self):
        for ident in list(self.sessions):
            self.cancel(ident)
