#!/usr/bin/env python3
"""Locate exact Itanium C++ RTTI names and bounded vtable candidates in ARM64 Mach-O.

Read-only structural evidence, not method semantics or execution proof. Keep
reports containing vendor identifiers and addresses in private local evidence.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct


def inspect(data, name):
    if data[:8] != b'\xcf\xfa\xed\xfe\x0c\x00\x00\x01' or len(data) < 32:
        raise ValueError('Expected thin little-endian ARM64 Mach-O')
    count, command_bytes = struct.unpack_from('<II', data, 16)
    end = 32 + command_bytes
    if end > len(data) or count > command_bytes // 8:
        raise ValueError('Load commands exceed file')
    segments, offset = [], 32
    for _ in range(count):
        if offset + 8 > end: raise ValueError('Truncated load command')
        command, size = struct.unpack_from('<II', data, offset)
        if size < 8 or offset + size > end: raise ValueError('Invalid load command size')
        if command == 0x19:
            if size < 72: raise ValueError('Truncated segment command')
            vm, vmsize, file, length, _, protection = struct.unpack_from('<QQQQii', data, offset + 24)
            if file + length > len(data) or length > vmsize:
                raise ValueError('Segment exceeds file or virtual extent')
            segments.append((vm, file, length, protection))
        offset += size
    if offset != end: raise ValueError('Load-command length mismatch')

    def address(file):
        return next((vm + file - start for vm, start, length, _ in segments
                     if start <= file < start + length), None)

    def code(pointer):
        return any(protection & 4 and vm <= pointer < vm + length
                   for vm, _, length, protection in segments)

    def references(values):
        pointers = {value: [] for value in values}
        for vm, start, length, _ in segments:
            first = start + (-vm % 8)
            for file in range(first, start + length - 7, 8):
                value = struct.unpack_from('<Q', data, file)[0]
                if value in pointers:
                    if len(pointers[value]) >= 4096: raise ValueError('Too many pointer candidates')
                    pointers[value].append(file)
        return pointers
    token = name.encode('ascii') + b'\0'
    if not name or b'\0' in token[:-1]: raise ValueError('Expected nonempty exact RTTI name')
    names, begin = [], 0
    while (found := data.find(token, begin)) >= 0:
        begin = found + 1
        if found and data[found - 1] != 0: continue
        va = address(found)
        if va is None: continue
        names.append(va)
        if len(names) > 64: raise ValueError('Too many exact name candidates')
    name_refs = references(names)
    type_refs = references({address(ref - 8) for refs in name_refs.values() for ref in refs} - {None})
    matches = []
    for va in names:
        types = []
        for ref in name_refs.get(va, []):
            type_address = address(ref - 8)
            if type_address is None: continue
            tables = []
            for use in type_refs.get(type_address, []):
                if use < 8 or use + 16 > len(data): continue
                top = struct.unpack_from('<q', data, use - 8)[0]
                if not -1048576 < top <= 0: continue
                methods = []
                for slot in range(8):
                    at = use + 8 + slot * 8
                    if at + 8 > len(data): break
                    pointer = struct.unpack_from('<Q', data, at)[0]
                    if not code(pointer): break
                    methods.append(hex(pointer))
                if methods:
                    tables.append(dict(addressPoint=hex(address(use + 8)), offsetToTop=top,
                                       firstExecutableSlots=methods))
            types.append(dict(address=hex(type_address), vtableCandidates=tables))
        matches.append(dict(nameAddress=hex(va), typeinfoCandidates=types))
    return dict(binarySHA256=hashlib.sha256(data).hexdigest(), exactRTTIName=name,
                matches=matches, scope='Structural candidates only; at most eight consecutive executable slots. No demangling, relocation resolution, method semantics or runtime acceptance.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('binary', type=Path)
    parser.add_argument('name')
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    result = inspect(args.binary.read_bytes(), args.name)
    with args.output.open('x') as output:
        json.dump(result, output, indent=2); output.write('\n')
    print(json.dumps(dict(output=str(args.output), exactNameMatches=len(result['matches']))))
