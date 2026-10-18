#!/usr/bin/env python3
"""Real uploader-process crash/reinitialization; no audio model or user files."""
import argparse
import json
from pathlib import Path
import subprocess
import sys
import tempfile
from stem_uploads import StemUploads


class Jobs:
    def runtime(self, backend): return None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    with tempfile.TemporaryDirectory(prefix='open-play-upload-recovery-158-') as temporary:
        root = Path(temporary) / '.uploads'
        child_code = '''
import json,sys,time
from pathlib import Path
from stem_uploads import StemUploads
class Jobs:
 def runtime(self, backend): return None
uploads=StemUploads(Jobs(),Path(sys.argv[1]))
session=uploads.begin(4096,'scnet')
uploads.append(session['id'],0,b'owned partial fixture')
print(json.dumps({'id':session['id']}),flush=True)
time.sleep(120)
'''
        child = subprocess.Popen([sys.executable, '-c', child_code, str(root)],
                                 cwd=Path(__file__).parent, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        try:
            first = json.loads(child.stdout.readline())
            owned = root / first['id']
            assert (owned / 'input.part').read_bytes() == b'owned partial fixture'
            legacy = root / ('a' * 32); legacy.mkdir(); (legacy / 'input.part').write_bytes(b'unknown legacy')
            original = Path(temporary) / 'original.wav'; original.write_bytes(b'preserve original')
            link = root / ('b' * 32); link.symlink_to(original)
            complete = root / 'completed-unrelated'; complete.mkdir(); (complete / 'manifest.json').write_text('preserve')
            observer = StemUploads(Jobs(), root)
            assert observer.recovered == [] and owned.is_dir() and child.poll() is None
            # Terminate only our declared fixture child: actual OS lock release, not a stale-map simulation.
            child.kill(); code = child.wait(timeout=10)
            assert code != 0
            restarted = StemUploads(Jobs(), root)
            assert restarted.recovered == [first['id']] and not owned.exists()
            assert (legacy / 'input.part').read_bytes() == b'unknown legacy'
            assert original.read_bytes() == b'preserve original' and link.is_symlink()
            assert (complete / 'manifest.json').read_text() == 'preserve'
            report = dict(checkpoint=158, passed=True, execution='Actual separate Python uploader held advisory lock; live reinitialization preserved it, abrupt process termination released lock, fresh reinitialization reclaimed dead-owned partial directory.',
                          childExitCode=code, recoveredUploads=1, liveOwnerPreservedBeforeCrash=True,
                          legacyUnknownLayoutPreserved=True, symlinkAndOriginalPreserved=True,
                          unrelatedCompletedLayoutPreserved=True, modelInferenceClaim=False, fullParityAcceptance=False)
        finally:
            if child.poll() is None: child.kill()
            child.wait(timeout=10)
    with args.output.open('x') as stream:
        json.dump(report, stream, indent=2); stream.write('\n')
    print(json.dumps(report, indent=2))


if __name__ == '__main__': main()
