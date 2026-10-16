"""Exercise CoreMIDI delivery into an isolated temporary diagnostic destination.

Sends only to the endpoint created here, never a hardware destination. This is
an investigation fixture, not the native DJ application or a controller map.
With --source, publishes two messages on an owned temporary virtual source and
receives through an owned input port; the source is visible briefly to CoreMIDI.
No hardware endpoint is enumerated, selected or sent messages.
"""
import ctypes as C
import json
import platform
import sys
import time
from pathlib import Path

if platform.system() != 'Darwin':
    raise SystemExit('macOS required')
m = C.CDLL('/System/Library/Frameworks/CoreMIDI.framework/CoreMIDI')
cf = C.CDLL('/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation')
cf.CFStringCreateWithCString.argtypes = [C.c_void_p, C.c_char_p, C.c_uint32]
cf.CFStringCreateWithCString.restype = C.c_void_p
cf.CFRelease.argtypes = [C.c_void_p]
cf.CFRunLoopRunInMode.argtypes = [C.c_void_p, C.c_double, C.c_bool]
CB = C.CFUNCTYPE(None, C.c_void_p, C.c_void_p, C.c_void_p)
ref = C.POINTER(C.c_uint32)
m.MIDIClientCreate.argtypes = [C.c_void_p, C.c_void_p, C.c_void_p, ref]
m.MIDIDestinationCreate.argtypes = [C.c_uint32, C.c_void_p, CB, C.c_void_p, ref]
m.MIDIOutputPortCreate.argtypes = [C.c_uint32, C.c_void_p, ref]
m.MIDISourceCreate.argtypes = [C.c_uint32, C.c_void_p, ref]
m.MIDIInputPortCreate.argtypes = [C.c_uint32, C.c_void_p, CB, C.c_void_p, ref]
m.MIDIPortConnectSource.argtypes = [C.c_uint32, C.c_uint32, C.c_void_p]
m.MIDIPortDisconnectSource.argtypes = [C.c_uint32, C.c_uint32]
m.MIDIReceived.argtypes = [C.c_uint32, C.c_void_p]
m.MIDIPacketListInit.argtypes = [C.c_void_p]
m.MIDIPacketListInit.restype = C.c_void_p
m.MIDIPacketListAdd.argtypes = [C.c_void_p, C.c_ulong, C.c_void_p, C.c_uint64, C.c_ulong, C.c_void_p]
m.MIDIPacketListAdd.restype = C.c_void_p
m.MIDISend.argtypes = [C.c_uint32, C.c_uint32, C.c_void_p]
for fn in ['MIDIEndpointDispose', 'MIDIPortDispose', 'MIDIClientDispose']:
    getattr(m, fn).argtypes = [C.c_uint32]
events = []

@CB
def receive(packet_list, _read, _source):
    count = C.c_uint32.from_address(packet_list).value
    packet = packet_list + 4
    for _ in range(count):
        size = C.c_uint16.from_address(packet + 8).value
        events.append(C.string_at(packet + 10, size).hex())
        packet += 10 + size
        if platform.machine() == 'arm64':
            packet = (packet + 3) & ~3

def check(status, action):
    if status:
        raise RuntimeError(f'{action}: {status}')

client, port, endpoint = C.c_uint32(), C.c_uint32(), C.c_uint32()
label = cf.CFStringCreateWithCString(None, b'Open Play isolated receiver diagnostic', 0x08000100)
expected = ['b01001', 'b0107f']
source_mode = '--source' in sys.argv
connected = False
try:
    check(m.MIDIClientCreate(label, None, None, C.byref(client)), 'client')
    if source_mode:
        check(m.MIDISourceCreate(client, label, C.byref(endpoint)), 'own virtual source')
        check(m.MIDIInputPortCreate(client, label, receive, None, C.byref(port)), 'input port')
        check(m.MIDIPortConnectSource(port, endpoint, None), 'connect own virtual source')
        connected = True
    else:
        check(m.MIDIDestinationCreate(client, label, receive, None, C.byref(endpoint)), 'own virtual destination')
        check(m.MIDIOutputPortCreate(client, label, C.byref(port)), 'output port')
    packets = C.create_string_buffer(1024)
    current = m.MIDIPacketListInit(packets)
    for data in expected:
        payload = C.create_string_buffer(bytes.fromhex(data))
        current = m.MIDIPacketListAdd(packets, len(packets), current, 0, 3, payload)
        if not current:
            raise RuntimeError('Packet buffer full')
    if source_mode:
        check(m.MIDIReceived(endpoint, packets), 'deliver via own virtual source')
    else:
        check(m.MIDISend(port, endpoint, packets), 'send to own diagnostic destination')
    mode = C.c_void_p.in_dll(cf, 'kCFRunLoopDefaultMode')
    deadline = time.monotonic() + 3
    while time.monotonic() < deadline and ''.join(events) != ''.join(expected):
        cf.CFRunLoopRunInMode(mode, .05, False)
finally:
    if connected:
        m.MIDIPortDisconnectSource(port, endpoint)
    if endpoint.value:
        m.MIDIEndpointDispose(endpoint)
    if port.value:
        m.MIDIPortDispose(port)
    if client.value:
        m.MIDIClientDispose(client)
    cf.CFRelease(label)
report = {'test': 'CoreMIDI virtual source to input port' if source_mode else 'isolated CoreMIDI destination delivery', 'expected_hex': ''.join(expected),
          'received_hex': ''.join(events), 'passed': ''.join(events) == ''.join(expected),
          'hardware_destinations_used': 0,
          'boundary': 'Validates callback/packet decoding, not Hercules source delivery or Serato input.'}
Path('local-evidence').mkdir(exist_ok=True)
Path('local-evidence/midi-source-self-test.json' if source_mode else 'local-evidence/midi-receiver-self-test.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report))
raise SystemExit(0 if report['passed'] else 1)
