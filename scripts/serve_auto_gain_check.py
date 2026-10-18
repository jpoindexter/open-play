#!/usr/bin/env python3
"""Isolated check server: expose only four hash-pinned, generated test WAVs."""
import argparse,hashlib,json
from http.server import ThreadingHTTPServer
from urllib.parse import urlsplit
from serve_prototype import ReviewHandler,JOBS,ROOT

class AutoGainCheckHandler(ReviewHandler):
    def do_GET(self):
        path=urlsplit(self.path).path
        allowed={f'/test-fixtures/auto-gain/{name}.wav':name for name in ('A','B','silence','mono')}
        if path not in allowed:
            return super().do_GET()
        if not self.permitted():
            return
        name=allowed[path]
        row=next(x for x in json.loads((ROOT/'docs/prototype/auto-gain-fixture-reference.json').read_text())['fixtures'] if x['name']==name)
        fixture=ROOT/'local-evidence/auto-gain/fixtures'/f'{name}.wav'
        if fixture.is_symlink() or not fixture.is_file():
            return self.send_error(404)
        payload=fixture.read_bytes()
        if hashlib.sha256(payload).hexdigest()!=row['wavSHA256']:
            return self.send_error(409,'Generated fixture does not match its reference hash.')
        self.send_response(200);self.send_header('Content-Type','audio/wav');self.send_header('Content-Length',str(len(payload)));self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(payload)

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=18869);args=parser.parse_args()
    server=ThreadingHTTPServer(('127.0.0.1',args.port),AutoGainCheckHandler)
    print(f'Isolated Auto Gain check: http://127.0.0.1:{args.port}/prototype/auto-gain-harness.html',flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:JOBS.close();server.server_close()
if __name__=='__main__':main()
