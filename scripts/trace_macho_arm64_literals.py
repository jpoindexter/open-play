#!/usr/bin/env python3
"""Find bounded ARM64 ADRP/ADD literal candidates and compiler function starts.

Static candidates are not runtime execution or complete indirect-reference proof.
Use a verified thin Mach-O copy. Keep reports containing vendor literals private.
"""
import argparse
import bisect
import json
from pathlib import Path
import struct


def trace(path, needles, calls_to=()):
    data = Path(path).read_bytes()
    if data[:4] != b'\xcf\xfa\xed\xfe' or struct.unpack_from('<I', data, 4)[0] != 0x100000c:
        raise ValueError('Expected a thin little-endian ARM64 Mach-O')
    segments, text_sections, function_data = [], [], None
    offset = 32
    for _ in range(struct.unpack_from('<I', data, 16)[0]):
        command, size = struct.unpack_from('<II', data, offset)
        if size < 8 or offset+size > len(data):
            raise ValueError('Invalid load command')
        if command == 0x19:
            vm, vmsize, file, filesize = struct.unpack_from('<QQQQ', data, offset+24)
            segments.append((vm, vmsize, file, filesize))
            for n in range(struct.unpack_from('<I', data, offset+64)[0]):
                section = offset+72+n*80
                name = data[section:section+16].split(b'\0')[0]
                if name == b'__text':
                    address, length, file_offset = struct.unpack_from('<QQI', data, section+32)
                    text_sections.append((address, length, file_offset))
        elif command == 0x26:
            function_data = struct.unpack_from('<II', data, offset+8)
        offset += size
    def address(file_offset):
        return next((vm+file_offset-file for vm, _, file, length in segments if file <= file_offset < file+length), None)
    starts = []
    if function_data:
        off, length = function_data
        current = next(vm for vm, _, file, size in segments if file == 0 and size)
        value, shift = 0, 0
        for byte in data[off:off+length]:
            value |= (byte & 127) << shift
            if byte & 128:
                shift += 7
                if shift > 63: raise ValueError('Function-start delta overflow')
            else:
                if value == 0: break
                current += value; starts.append(current); value = shift = 0
    literals = []
    for needle in needles:
        begin = 0
        while (found := data.find(needle.encode(), begin)) >= 0:
            begin = found+1
            start = data.rfind(b'\0', max(0, found-1024), found)+1
            end = data.find(b'\0', found, min(len(data), found+2048))
            if end < 0: continue
            va = address(start)
            if va is not None: literals.append({'needle': needle, 'address': hex(va), 'fileOffset': start, 'text': data[start:end].decode(errors='replace'), 'references': []})
    targets = {int(row['address'], 16): row for row in literals}
    pages = {target & ~4095 for target in targets}
    calls = {int(value, 0): [] for value in calls_to}
    for base, length, file in text_sections:
        for delta in range(0, length-16, 4):
            word = struct.unpack_from('<I', data, file+delta)[0]
            if calls and word & 0xfc000000 == 0x94000000:
                immediate = word & 0x3ffffff
                if immediate & 0x2000000: immediate -= 0x4000000
                target = base+delta+immediate*4
                if target in calls:
                    index = bisect.bisect_right(starts, base+delta)-1
                    calls[target].append({'call': hex(base+delta), 'compilerFunctionStartCandidate': hex(starts[index]) if index >= 0 else None})
            if word & 0x9f000000 != 0x90000000: continue
            immediate = ((word >> 5) & 0x7ffff) << 2 | ((word >> 29) & 3)
            if immediate & 0x100000: immediate -= 0x200000
            page = ((base+delta) & ~4095)+(immediate << 12)
            if page not in pages: continue
            register = word & 31
            for step in range(1, 5):
                add = struct.unpack_from('<I', data, file+delta+step*4)[0]
                if add & 0x7f000000 != 0x11000000 or (add >> 5) & 31 != register: continue
                target = page+(((add >> 10) & 4095) << (12 if add & (1 << 22) else 0))
                if target not in targets: continue
                pc = base+delta+step*4; index = bisect.bisect_right(starts, pc)-1
                targets[target]['references'].append({'adrp': hex(base+delta), 'add': hex(pc), 'compilerFunctionStartCandidate': hex(starts[index]) if index >= 0 else None})
    return {'binary': Path(path).name, 'functionStarts': len(starts), 'literals': literals,
            'directBLReferences': {hex(key): value for key, value in calls.items()},
            'scope': 'Bounded nearby ADRP/ADD candidates only; register overwrite/path and indirect uses require disassembly review. Compiler function boundaries do not establish full auto-analysis or runtime execution.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('binary'); parser.add_argument('needles', nargs='*')
    parser.add_argument('--calls-to', action='append', default=[])
    args = parser.parse_args()
    print(json.dumps(trace(args.binary, args.needles, args.calls_to), indent=2))
