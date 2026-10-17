"""Frozen-source loopback host for one uniquely named actual transport cohort."""
import argparse
import hashlib
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--cohort', required=True)
parser.add_argument('--plan', default='docs/prototype/soundtouch-transport-browser-anchored-plan.json')
args = parser.parse_args()
assert re.fullmatch('[a-z0-9-]{1,40}', args.cohort)
OUT = ROOT / ('local-evidence/soundtouch-transport-browser-' + args.cohort)
REPORT = ROOT / ('docs/prototype/soundtouch-transport-browser-' + args.cohort + '-results.json')
assert not OUT.exists() and not REPORT.exists(), 'Refuse to overwrite a prior cohort'
OUT.mkdir(parents=True)
PORT = 18814
PAGES = {}
def route(url, relative, mime='text/javascript', transform=None):
    data = (ROOT / relative).read_bytes()
    served = transform(data) if transform else data
    PAGES[url] = (served, mime, {'path': relative, 'sourceSHA256': hashlib.sha256(data).hexdigest(),
                              'servedSHA256': hashlib.sha256(served).hexdigest(), 'importSpecifierOnlyRewrite': transform is not None})

route('/', 'experiments/keylock-soundtouch/transport.html', 'text/html')
route('/transport-harness.mjs', 'experiments/keylock-soundtouch/transport-harness.mjs')
plan = (ROOT / args.plan).resolve()
assert plan.is_relative_to(ROOT / 'docs/prototype')
route('/plan.json', str(plan.relative_to(ROOT)), 'application/json')
for name in ['pull-transport.mjs', 'pull-worklet.mjs', 'transport-capture.mjs']:
    relative = 'experiments/keylock-soundtouch/' + name
    route('/' + relative, relative)
prefix = 'local-evidence/keylock-soundtouch-source/node_modules/@soundtouchjs/'
def import_path_only(data):
    old = b"from '@soundtouchjs/interpolation-strategy-lanczos'"
    assert data.count(old) == 1
    return data.replace(old, b"from '/official/lanczos/index.js'")
for path in sorted((ROOT / prefix / 'core/.dist').glob('*.js')):
    relative = str(path.relative_to(ROOT))
    route('/' + relative, relative, transform=import_path_only if path.name == 'interpolationStrategyRegistry.js' else None)
for path in sorted((ROOT / prefix / 'interpolation-strategy-lanczos/.dist').glob('*.js')):
    route('/official/lanczos/' + path.name, str(path.relative_to(ROOT)))
sources = {'cohort': args.cohort, 'scope': 'Source bytes frozen once at server startup. One bare dependency import rewritten to a fixed local URL; no DSP algorithm changes.',
           'routes': {url: metadata for url, (_, _, metadata) in PAGES.items()}}
PAGES['/sources.json'] = (json.dumps(sources, indent=2).encode(), 'application/json', None)
CASES = {c['id'] for c in json.loads(PAGES['/plan.json'][0])['cases']}

class Handler(BaseHTTPRequestHandler):
    def valid(self, mutation=False):
        return self.headers.get('Host') == f'127.0.0.1:{PORT}' and (not mutation or self.headers.get('Origin') == f'http://127.0.0.1:{PORT}' and self.headers.get('X-Open-Play-Test') == 'soundtouch-transport')
    def respond(self, data, mime='application/json'):
        self.send_response(200); self.send_header('Content-Type', mime); self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store'); self.send_header('X-Content-Type-Options', 'nosniff'); self.end_headers(); self.wfile.write(data)
    def do_GET(self):
        if not self.valid() or self.path not in PAGES: return self.send_error(404)
        data, mime, _ = PAGES[self.path]; self.respond(data, mime)
    def do_POST(self):
        if not self.valid(True): return self.send_error(403)
        case = self.path.removeprefix('/raw/')
        if self.path != '/report' and (not self.path.startswith('/raw/') or case not in CASES): return self.send_error(404)
        try: size = int(self.headers.get('Content-Length', '0'))
        except ValueError: return self.send_error(400)
        if not 0 < size <= 128 * 1024 * 1024: return self.send_error(413)
        self.connection.settimeout(30); data = self.rfile.read(size)
        if len(data) != size: return self.send_error(400)
        target = REPORT if self.path == '/report' else OUT / (case + '.f32')
        if target == REPORT: json.loads(data)
        with target.open('xb') as handle: handle.write(data)
        self.respond(json.dumps({'path': str(target.relative_to(ROOT)), 'bytes': size, 'sha256': hashlib.sha256(data).hexdigest()}).encode())

server = ThreadingHTTPServer(('127.0.0.1', PORT), Handler)
print(f'Owned transport cohort {args.cohort} http://127.0.0.1:{PORT}/', flush=True)
try: server.serve_forever()
except KeyboardInterrupt: pass
finally: server.server_close()
