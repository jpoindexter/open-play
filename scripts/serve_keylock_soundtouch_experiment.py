"""Fixed-route loopback host for the separate published SoundTouch worklet comparison."""
import hashlib
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT/'local-evidence/keylock-soundtouch-browser-initial'
assert not OUT.exists(), 'Refuse to reuse prior capture directory'
OUT.mkdir(parents=True)
PORT = 18813
PACKAGE = 'local-evidence/keylock-soundtouch-source/node_modules/@soundtouchjs/audio-worklet/.dist/'
PAGES = {'/': ('experiments/keylock-soundtouch/index.html','text/html'), '/harness.js': ('experiments/keylock-soundtouch/harness.js','text/javascript'), '/capture.js': ('experiments/keylock-history/capture.js','text/javascript'), '/plan.json': ('docs/prototype/keylock-soundtouch-browser-plan.json','application/json')}
for name in ['SoundTouchNode.js','constants.js','soundtouch-processor.js']: PAGES['/'+name] = (PACKAGE+name,'text/javascript')
CASES = {c['id'] for c in json.loads((ROOT/PAGES['/plan.json'][0]).read_text())['cases']}

class Handler(BaseHTTPRequestHandler):
    def valid(self, mutation=False):
        return self.headers.get('Host') == f'127.0.0.1:{PORT}' and (not mutation or self.headers.get('Origin') == f'http://127.0.0.1:{PORT}' and self.headers.get('X-Open-Play-Test') == 'pitch-isolation')
    def respond(self, body, mime='application/json'):
        self.send_response(200);self.send_header('Content-Type',mime);self.send_header('Content-Length',str(len(body)));self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.end_headers();self.wfile.write(body)
    def do_GET(self):
        if not self.valid() or self.path not in PAGES:return self.send_error(404)
        name,mime=PAGES[self.path];self.respond((ROOT/name).read_bytes(),mime)
    def do_POST(self):
        if not self.valid(True):return self.send_error(403)
        name=self.path.removeprefix('/raw/')
        if self.path!='/report' and (not self.path.startswith('/raw/') or name not in CASES):return self.send_error(404)
        n=int(self.headers.get('Content-Length','0'))
        if not 1<=n<=32*1024*1024:return self.send_error(413)
        self.connection.settimeout(30);data=self.rfile.read(n)
        if len(data)!=n:return self.send_error(400)
        target=OUT/(name+'.f32') if self.path!='/report' else ROOT/'docs/prototype/keylock-soundtouch-browser-initial-results.json'
        if target.suffix=='.json':json.loads(data)
        with target.open('xb') as handle:handle.write(data)
        self.respond(json.dumps({'path':str(target.relative_to(ROOT)),'bytes':n,'sha256':hashlib.sha256(data).hexdigest()}).encode())

server=ThreadingHTTPServer(('127.0.0.1',PORT),Handler)
print(f'Owned SoundTouch experiment http://127.0.0.1:{PORT}/',flush=True)
try:server.serve_forever()
except KeyboardInterrupt:pass
finally:server.server_close()
