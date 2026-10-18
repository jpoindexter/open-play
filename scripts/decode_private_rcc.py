#!/usr/bin/env python3
"""Decode explicit private XXTEA resource data; never patch an application.

Independent implementation of the standard corrected block TEA arithmetic.
Supply a16-byte key file separately; no vendor constants or resource content are
included here. Decoded resources are analysis evidence, not app implementation.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct

MASK = 0xffffffff
DELTA = 0x9e3779b9


def decode(data, key):
    if len(key) != 16 or not 8 <= len(data) <= 32*1024*1024 or len(data) % 4:
        raise ValueError('Expected16-byte key and8bytes..32MiB data aligned to four bytes')
    words = list(struct.unpack('<%dI' % (len(data)//4), data))
    keys = struct.unpack('<4I', key)
    total = ((6+52//len(words))*DELTA) & MASK
    y = words[0]
    while total:
        e = (total >> 2) & 3
        for p in range(len(words)-1, -1, -1):
            z = words[p-1] if p else words[-1]
            mix = (((z >> 5) ^ ((y << 2) & MASK))+(((z << 4) & MASK) ^ (y >> 3))) ^ ((keys[(p & 3) ^ e] ^ z)+(y ^ total))
            y = words[p] = (words[p]-mix) & MASK
        total = (total-DELTA) & MASK
    result = struct.pack('<%dI' % len(words), *words)
    padding = result[-1]
    if padding:
        if padding > len(result) or result[-padding:] != bytes([padding])*padding:
            raise ValueError('Decoded resource padding is invalid; no output written')
        result = result[:-padding]
    if result[:4] != b'qres' or len(result) < 20:
        raise ValueError('Decoded data is not a binary Qt resource; no output written')
    version, tree, payload, names = struct.unpack_from('>4I', result, 4)
    if version not in (1, 2, 3) or not all(20 <= value < len(result) for value in (tree, payload, names)):
        raise ValueError('Decoded Qt resource header/offsets are unsupported')
    return result, {'version': version, 'treeOffset': tree, 'payloadOffset': payload, 'namesOffset': names}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source'); parser.add_argument('--key-file', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    source, keyfile, output = Path(args.source), Path(args.key_file), Path(args.output)
    if source.is_symlink() or keyfile.is_symlink() or output.exists():
        raise ValueError('Use explicit regular inputs and a new output path')
    if source.stat().st_size > 32*1024*1024 or keyfile.stat().st_size != 16:
        raise ValueError('Input size limit exceeded')
    data, key = source.read_bytes(), keyfile.read_bytes()
    result, header = decode(data, key)
    with output.open('xb') as file: file.write(result)
    print(json.dumps({'source': source.name, 'sourceSHA256': hashlib.sha256(data).hexdigest(),
                      'decodedBytes': len(result), 'decodedSHA256': hashlib.sha256(result).hexdigest(),
                      'header': header, 'scope': 'Decoded private data/header only; no map conversion, physical compatibility or full parity acceptance'}, indent=2))
