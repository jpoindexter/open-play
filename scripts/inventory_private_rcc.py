#!/usr/bin/env python3
"""Bounded read-only Qt RCC inventory and explicit-prefix private extraction.

Independently implemented from Qt's documented/open binary resource layout:
https://github.com/qt/qtbase/blob/5.15/src/corelib/io/qresource.cpp
Vendor files remain private data and are never executed or included in Git.
"""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import struct
import zlib

MAX_FILE = 8*1024*1024
MAX_TOTAL = 128*1024*1024
DEFAULT_PREFIXES = tuple(a+'/'+b for a in ('userio','userio_partner','userio_hidden_from_partners') for b in ('midi','audio','hid'))


def inventory(data, prefixes):
    def block(offset, length, end=None):
        if offset < 0 or length < 0 or offset+length > (len(data) if end is None else end):
            raise ValueError('RCC offset/length exceeds its section')
        return data[offset:offset+length]
    def number(offset, kind, end=None):
        return struct.unpack('>'+kind, block(offset, struct.calcsize('>'+kind), end))[0]
    if block(0, 4) != b'qres': raise ValueError('Not a Qt RCC resource')
    version, tree, payload, names = struct.unpack('>4I', block(4, 16))
    if version not in (1, 2, 3): raise ValueError('Unsupported RCC version')
    if not (20 <= payload < names < tree < len(data)): raise ValueError('Unsupported or invalid RCC section order')
    stride = 14+(8 if version >= 2 else 0)
    if (len(data)-tree) % stride: raise ValueError('RCC tree is not node-aligned')
    count = (len(data)-tree)//stride
    if not 1 <= count <= 200000: raise ValueError('RCC node limit exceeded')
    records, retained, seen, total = [], {}, set(), 0
    stack = [(0, (), 0)]
    while stack:
        index, parent, depth = stack.pop()
        if index in seen or not 0 <= index < count or depth > 48: raise ValueError('Invalid/repeated RCC tree node or depth')
        seen.add(index); offset = tree+index*stride
        flags = number(offset+4, 'H')
        if flags & ~7: raise ValueError('Unsupported RCC flags')
        if index:
            name_at = names+number(offset, 'I'); length = number(name_at, 'H', tree)
            name = block(name_at+6, length*2, tree).decode('utf-16-be')
            if not name or name in ('.', '..') or any(c in name for c in ('/','\\','\0')): raise ValueError('Unsafe RCC path component')
            parts = parent+(name,)
        else: parts = parent
        if flags & 2:
            children, first = struct.unpack('>2I', block(offset+6, 8))
            if first+children > count: raise ValueError('RCC child range exceeds tree')
            stack.extend((child, parts, depth+1) for child in reversed(range(first, first+children)))
            continue
        country, language, data_at = struct.unpack('>HHI', block(offset+6, 8))
        start = payload+data_at; length = number(start, 'I', names)
        stored = block(start+4, length, names)
        path = '/'.join(parts); chosen = any(path.startswith(prefix.rstrip('/')+'/') for prefix in prefixes)
        record = {'path': path, 'country': country, 'language': language, 'flags': flags,
                  'storedBytes': length, 'selected': chosen, 'nodeIndex': index}
        if chosen:
            if flags & 1 and flags & 4: raise ValueError('Conflicting RCC compression flags')
            if flags & 1:
                if len(stored) < 4: raise ValueError('Truncated qCompress length')
                expected = struct.unpack('>I', stored[:4])[0]
                if expected > MAX_FILE: raise ValueError('RCC file exceeds8MiB')
                stream = zlib.decompressobj(); content = stream.decompress(stored[4:], MAX_FILE+1)
                if len(content) != expected or not stream.eof or stream.unused_data or stream.unconsumed_tail: raise ValueError('Invalid/incomplete RCC zlib payload')
            elif flags & 4:
                import zstandard
                expected = zstandard.frame_content_size(stored)
                if not 0 <= expected <= MAX_FILE: raise ValueError('Unknown or excessive RCC zstd output')
                content = zstandard.ZstdDecompressor().decompress(stored, max_output_size=MAX_FILE)
                if len(content) != expected: raise ValueError('RCC zstd size mismatch')
            else: content = stored
            if len(content) > MAX_FILE: raise ValueError('RCC file exceeds8MiB')
            total += len(content)
            if total > MAX_TOTAL: raise ValueError('Selected RCC output exceeds128MiB')
            key = path
            if key in retained: key = f'_locale_{country}_{language}/{path}'
            if key in retained: raise ValueError('Duplicate locale/path collision')
            retained[key] = content
            record.update(bytes=len(content), sha256=hashlib.sha256(content).hexdigest(), privateOutput=key)
        records.append(record)
    if len(seen) != count: raise ValueError('RCC has unreachable nodes; inventory is incomplete')
    return {'version': version, 'nodes': count, 'files': records, 'selectedFiles': len(retained),
            'selectedBytes': total, 'prefixes': list(prefixes)}, retained


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('rcc'); parser.add_argument('--prefix', action='append')
    parser.add_argument('--output', required=True); parser.add_argument('--manifest', required=True)
    args = parser.parse_args()
    source, output, manifest = Path(args.rcc), Path(args.output), Path(args.manifest)
    if source.is_symlink() or source.stat().st_size > 64*1024*1024: raise ValueError('Use a regular RCC of at most64MiB')
    if output.exists() or manifest.exists(): raise ValueError('Use new private output/manifest paths')
    data = source.read_bytes(); report, retained = inventory(data, args.prefix or DEFAULT_PREFIXES)
    report.update(source=source.name, sourceSHA256=hashlib.sha256(data).hexdigest(),
                  scope='Complete structural inventory of this RCC; selected-prefix byte extraction only, not runtime loading/controller compatibility or full conversion acceptance')
    output.mkdir()
    for relative, content in retained.items():
        path = output.joinpath(*PurePosixPath(relative).parts)
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open('xb') as file: file.write(content)
    with manifest.open('x') as file: json.dump(report, file, indent=2); file.write('\n')
    print(json.dumps({key: report[key] for key in ('source','nodes','selectedFiles','selectedBytes')}))
