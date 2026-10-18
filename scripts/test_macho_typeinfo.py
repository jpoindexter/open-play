#!/usr/bin/env python3
"""Authored RTTI fixture checks; no vendor bytes or executable code."""
import struct
import unittest
from trace_macho_typeinfo import inspect


def fixture():
    data = bytearray(1024)
    struct.pack_into('<IIIIIIII', data, 0, 0xfeedfacf, 0x100000c, 0, 2, 2, 144, 0, 0)
    for offset, vm, start, length, protection in [(32, 0x1000, 0, 512, 5), (104, 0x3000, 512, 512, 3)]:
        struct.pack_into('<II16sQQQQiiII', data, offset, 0x19, 72, b'authored', vm, length,
                         start, length, protection, protection, 0, 0)
    data[600:609] = b'4TestRTT\0'
    struct.pack_into('<QQ', data, 640, 0x3330, 0x3058)
    struct.pack_into('<qQQQ', data, 680, 0, 0x3080, 0x1100, 0x1104)
    # Positive RTTI base-class references are not vtable headers.
    struct.pack_into('<qQQ', data, 752, 0x1234, 0x3080, 0x1108)
    return data


class TypeinfoTest(unittest.TestCase):
    def test_exact_name_primary_table_and_noncode_boundary(self):
        result = inspect(fixture(), '4TestRTT')
        self.assertEqual(result['matches'], [dict(nameAddress='0x3058', typeinfoCandidates=[
            dict(address='0x3080', vtableCandidates=[dict(addressPoint='0x30b8', offsetToTop=0,
                 firstExecutableSlots=['0x1100', '0x1104'])])])])
        self.assertEqual(inspect(fixture(), 'TestRTT')['matches'], [])

    def test_negative_secondary_offset_is_retained(self):
        data = fixture(); struct.pack_into('<q', data, 680, -64)
        row = inspect(data, '4TestRTT')['matches'][0]['typeinfoCandidates'][0]['vtableCandidates'][0]
        self.assertEqual(row['offsetToTop'], -64)

    def test_malformed_segment_and_commands_rejected(self):
        for offset, value in [(20, 999999), (36, 7), (32 + 48, 5000)]:
            with self.subTest(offset=offset):
                data = fixture(); struct.pack_into('<I', data, offset, value)
                with self.assertRaises(ValueError): inspect(data, '4TestRTT')


if __name__ == '__main__': unittest.main()
