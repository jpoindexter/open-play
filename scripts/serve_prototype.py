#!/usr/bin/env python3
"""Serve the review packet on loopback without exposing Git or raw evidence."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit
import argparse
import webbrowser

ROOT = Path(__file__).resolve().parents[1]


class ReviewHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        relative = unquote(urlsplit(self.path).path).lstrip('/')
        if relative == '':
            self.send_response(302)
            self.send_header('Location', '/prototype/')
            self.end_headers()
            return
        target = (ROOT / relative).resolve()
        allowed_root = relative.split('/')[0] in {'prototype', 'docs', 'handoffs'}
        allowed_file = relative in {'README.md', 'FULL_BUILD_PLAN.md', 'PROJECT_PROMPT.md'}
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
        server.server_close()
