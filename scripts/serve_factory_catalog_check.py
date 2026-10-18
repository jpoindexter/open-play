#!/usr/bin/env python3
"""Temporary loopback check server with an explicit private JSON allowlist."""
import argparse
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
from serve_prototype import ReviewHandler, JOBS

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--catalog-dir', type=Path, required=True)
    parser.add_argument('--port', type=int, default=8780)
    parser.add_argument('--harness', choices=['factory-catalog-harness.html', 'controller-conditions-harness.html'], default='factory-catalog-harness.html')
    args = parser.parse_args()
    fixtures = {}
    for path in sorted(args.catalog_dir.glob('factory-*.json')):
        if path.is_symlink() or not path.is_file() or path.stat().st_size > 32*1024*1024: raise ValueError('Unsafe fixture')
        fixtures['/api/controller-fixtures/'+path.name] = path
    if not fixtures or len(fixtures) > 64: raise ValueError('Select the bounded private factory catalog directory')

    class FactoryCheckHandler(ReviewHandler):
        def do_GET(self):
            if not self.permitted(): return
            target = urlsplit(self.path).path
            if target == '/api/controller-fixtures': return self.json_response({'files': list(fixtures)})
            if target in fixtures:
                data = fixtures[target].read_bytes()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(data)))
                self.end_headers(); self.wfile.write(data)
                return
            super().do_GET()

    server = ThreadingHTTPServer(('127.0.0.1', args.port), FactoryCheckHandler)
    print(f'Isolated factory check: http://127.0.0.1:{args.port}/prototype/{args.harness}', flush=True)
    try: server.serve_forever()
    except KeyboardInterrupt: pass
    finally: server.server_close(); JOBS.close()
