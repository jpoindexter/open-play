#!/usr/bin/env python3
"""Serve the review packet on loopback without exposing Git or raw evidence."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit, parse_qs
import argparse
import webbrowser
import json
from stem_service import StemJobs, MAX_BYTES

JOBS = StemJobs()

ROOT = Path(__file__).resolve().parents[1]


class ReviewHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def permitted(self, mutation=False):
        allowed = {f"127.0.0.1:{self.server.server_port}", f"localhost:{self.server.server_port}"}
        origin = self.headers.get('Origin')
        valid = self.headers.get('Host') in allowed and (not origin or origin in {'http://' + host for host in allowed})
        if mutation:
            valid = valid and self.headers.get('X-Open-Play') == 'local-prototype'
        if not valid:
            self.send_error(403, 'Only the local prototype may access this service.')
        return valid

    def json_response(self, value, code=200):
        data = json.dumps(value).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        if not self.permitted(mutation=True):
            return
        if urlsplit(self.path).path != '/api/stems':
            return self.send_error(404)
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 44 <= length <= MAX_BYTES:
                return self.json_response({'error': 'WAV size must be 44 bytes to 128 MiB.'}, 413)
            self.connection.settimeout(30)
            data = self.rfile.read(length)
            if len(data) != length:
                raise ValueError('Incomplete audio upload.')
            backend = parse_qs(urlsplit(self.path).query).get('model', ['scnet'])[0]
            self.json_response(JOBS.create(data, backend), 202)
        except (ValueError, OSError) as error:
            self.json_response({'error': str(error)}, 400)

    def do_DELETE(self):
        if not self.permitted(mutation=True):
            return
        parts = urlsplit(self.path).path.strip('/').split('/')
        result = JOBS.cancel(parts[2]) if len(parts) == 3 and parts[:2] == ['api', 'stems'] else None
        self.json_response(result or {'error': 'Job not found'}, 200 if result else 404)

    def do_GET(self):
        if not self.permitted():
            return
        parts = urlsplit(self.path).path.strip('/').split('/')
        if parts[:2] == ['api', 'stems']:
            if len(parts) == 3:
                result = JOBS.get(parts[2])
                return self.json_response(result or {'error': 'Job not found'}, 200 if result else 404)
            path = JOBS.file(parts[2], parts[3]) if len(parts) == 4 else None
            if path:
                self.send_response(200)
                self.send_header('Content-Type', 'audio/wav')
                self.send_header('Content-Length', str(path.stat().st_size))
                self.end_headers()
                with path.open('rb') as stream:
                    self.copyfile(stream, self.wfile)
                return
            return self.send_error(404)
        relative = unquote(urlsplit(self.path).path).lstrip('/')
        if relative == '':
            self.send_response(302)
            self.send_header('Location', '/prototype/')
            self.end_headers()
            return
        target = (ROOT / relative).resolve()
        allowed_root = any(target.is_relative_to((ROOT / folder).resolve()) for folder in ('prototype', 'docs', 'handoffs'))
        allowed_file = target in {ROOT / name for name in ('README.md', 'FULL_BUILD_PLAN.md', 'PROJECT_PROMPT.md')}
        if not target.is_relative_to(ROOT) or not (allowed_root or allowed_file):
            self.send_error(404)
            return
        if target.is_dir() and not (target / 'index.html').is_file():
            self.send_error(404)
            return
        super().do_GET()

    def do_HEAD(self):
        self.send_error(405)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8768)
    parser.add_argument('--open-browser', action='store_true')
    args = parser.parse_args()
    server = ThreadingHTTPServer(('127.0.0.1', args.port), ReviewHandler)
    print(f'Open Play review: http://127.0.0.1:{args.port}/prototype/', flush=True)
    print('Control-C stops the server. Native implementation remains unapproved.', flush=True)
    if args.open_browser:
        webbrowser.open(f'http://127.0.0.1:{args.port}/prototype/')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        JOBS.close()
        server.server_close()
