#!/usr/bin/env python3
"""Loopback-only resource diagnostic server; raw evidence stays private."""
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import argparse
import hashlib
import json
import re
from serve_prototype import ReviewHandler, ROOT

LIMIT = 64*1024*1024
TARGET = ROOT/'local-evidence'/'stem-resource-150'/'browser-exports'


class ResourceHandler(ReviewHandler):
    def do_POST(self):
        path = urlsplit(self.path).path
        match = re.fullmatch(r'/api/test-evidence/stem-resource-150/([a-f0-9]{32})',path)
        if not match:
            return super().do_POST()
        if not self.permitted(mutation=True):
            return
        try:
            length = int(self.headers.get('Content-Length','0'))
            if not 1 <= length <= LIMIT:
                return self.json_response({'error':'Evidence exceeds the declared64MiB bound.'},413)
            self.connection.settimeout(30)
            body = self.rfile.read(length)
            if len(body) != length:
                return self.json_response({'error':'Incomplete evidence body.'},400)
            report = json.loads(body)
            if report.get('checkpoint') != 150 or not isinstance(report.get('samples'),list):
                return self.json_response({'error':'Not a resource150 report.'},400)
            ident = match.group(1)
            digest = hashlib.sha256(body).hexdigest()
            TARGET.mkdir(parents=True,exist_ok=True)
            destination = TARGET/(ident+'.json')
            try:
                with destination.open('xb') as output:
                    output.write(body)
                duplicate = False
            except FileExistsError:
                if hashlib.sha256(destination.read_bytes()).hexdigest() != digest:
                    return self.json_response({'error':'Evidence ID already contains different bytes.'},409)
                duplicate = True
            return self.json_response({'id':ident,'bytes':length,'sha256':digest,'duplicate':duplicate})
        except (ValueError,TypeError,AttributeError):
            return self.json_response({'error':'Invalid evidence JSON.'},400)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port',type=int,default=8790)
    args = parser.parse_args()
    ThreadingHTTPServer(('127.0.0.1',args.port),ResourceHandler).serve_forever()
