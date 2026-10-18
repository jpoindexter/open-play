#!/usr/bin/env python3
"""Exact-byte/idempotency and access checks for the private diagnostic sink."""
import hashlib
import http.client
import json
from pathlib import Path
import tempfile
from threading import Thread
from http.server import ThreadingHTTPServer
import serve_resource_observation as target

checks = []
with tempfile.TemporaryDirectory(prefix='open-play-resource-evidence-') as temp:
    target.TARGET = Path(temp)
    server = ThreadingHTTPServer(('127.0.0.1',0),target.ResourceHandler)
    port = server.server_port
    thread = Thread(target=server.serve_forever,daemon=True)
    thread.start()
    ident = 'a'*32
    body = json.dumps({'checkpoint':150,'samples':[],'fixture':True}).encode()

    def request(data=body,path='/api/test-evidence/stem-resource-150/'+ident,extra=None):
        headers = {'Content-Type':'application/json','X-Open-Play':'local-prototype'}
        headers.update(extra or {})
        connection = http.client.HTTPConnection('127.0.0.1',port,timeout=2)
        connection.request('POST',path,data,headers)
        response = connection.getresponse()
        status = response.status
        content = response.read()
        connection.close()
        return status,content

    try:
        status,raw = request();receipt = json.loads(raw)
        assert status == 200 and receipt['sha256'] == hashlib.sha256(body).hexdigest()
        assert receipt['bytes'] == len(body) and not receipt['duplicate']
        assert (Path(temp)/(ident+'.json')).read_bytes() == body
        status,raw = request();assert status == 200 and json.loads(raw)['duplicate']
        checks.append({'name':'Exact original bytes and hash retained; identical ID retry is idempotent','passed':True})
        status,_ = request(body+b' ');assert status == 409
        assert (Path(temp)/(ident+'.json')).read_bytes() == body
        checks.append({'name':'Conflicting bytes cannot overwrite retained evidence','passed':True})
        status,_ = request(extra={'Origin':'https://untrusted.example'});assert status == 403
        status,_ = request(extra={'X-Open-Play':'wrong'});assert status == 403
        checks.append({'name':'Foreign origin and missing mutation authorization are refused','passed':True})
        status,_ = request(extra={'Content-Length':str(target.LIMIT+1)});assert status == 413
        status,_ = request(json.dumps({'checkpoint':149,'samples':[]}).encode());assert status == 400
        checks.append({'name':'Oversize and wrong-report payloads are refused before evidence creation','passed':True})
    finally:
        server.shutdown();server.server_close();thread.join()

result = {'checkpoint':150,'passed':True,'scope':'Actual local diagnostic HTTP handler over ephemeral loopback with declared synthetic JSON; not a recovered browser capture.', 'checks':checks}
output = Path(__file__).resolve().parents[1]/'docs/prototype/resource-evidence-150-server-results.json'
with output.open('x') as f:
    json.dump(result,f,indent=2);f.write('\n')
print(json.dumps(result,indent=2))
