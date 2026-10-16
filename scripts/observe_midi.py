"""Read-only diagnostic: enumerate and capture a named CoreMIDI source.

No MIDI output, audio output, mapping edits or device configuration writes.
Uses legacy MIDI 1 packets; offsets/alignment checked against macOS SDK headers.
This is investigation tooling, not native application implementation.
"""
import ctypes as C
import json
import platform
import sys
import time
from pathlib import Path

if platform.system() != "Darwin":
    raise SystemExit("This diagnostic requires macOS CoreMIDI")
duration = min(120, max(1, int(sys.argv[1]) if len(sys.argv) > 1 else 60))
m = C.CDLL('/System/Library/Frameworks/CoreMIDI.framework/CoreMIDI')
cf = C.CDLL('/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation')
cf.CFStringCreateWithCString.argtypes = [C.c_void_p, C.c_char_p, C.c_uint32]
cf.CFStringCreateWithCString.restype = C.c_void_p
cf.CFStringGetCString.argtypes = [C.c_void_p, C.c_char_p, C.c_long, C.c_uint32]
cf.CFRelease.argtypes = [C.c_void_p]
cf.CFRunLoopRunInMode.argtypes = [C.c_void_p, C.c_double, C.c_bool]
m.MIDIGetNumberOfSources.restype = C.c_ulong
m.MIDIGetSource.argtypes = [C.c_ulong]
m.MIDIGetSource.restype = C.c_uint32
m.MIDIObjectGetStringProperty.argtypes = [C.c_uint32, C.c_void_p, C.POINTER(C.c_void_p)]
m.MIDIClientCreate.argtypes = [C.c_void_p, C.c_void_p, C.c_void_p, C.POINTER(C.c_uint32)]
callback_type = C.CFUNCTYPE(None, C.c_void_p, C.c_void_p, C.c_void_p)
m.MIDIInputPortCreate.argtypes = [C.c_uint32, C.c_void_p, callback_type, C.c_void_p, C.POINTER(C.c_uint32)]
m.MIDIPortConnectSource.argtypes = [C.c_uint32, C.c_uint32, C.c_void_p]
m.MIDIPortDisconnectSource.argtypes = [C.c_uint32, C.c_uint32]
m.MIDIPortDispose.argtypes = [C.c_uint32]
m.MIDIClientDispose.argtypes = [C.c_uint32]

def string(value):
    return cf.CFStringCreateWithCString(None, value.encode(), 0x08000100)

def check(code, operation):
    if code:
        raise RuntimeError(f'{operation}: OSStatus {code}')

def name(obj):
    key = string('name')
    value = C.c_void_p()
    status = m.MIDIObjectGetStringProperty(obj, key, C.byref(value))
    cf.CFRelease(key)
    if status or not value.value:
        return ''
    buffer = C.create_string_buffer(1024)
    cf.CFStringGetCString(value, buffer, len(buffer), 0x08000100)
    cf.CFRelease(value)
    return buffer.value.decode()

sources = [(m.MIDIGetSource(i), name(m.MIDIGetSource(i))) for i in range(m.MIDIGetNumberOfSources())]
matches = [(obj, n) for obj, n in sources if n.lower() == 'djcontrol inpulse 300 mk2']
if len(matches) != 1:
    raise SystemExit('Expected exactly one named Hercules source; no capture started')
endpoint, endpoint_name = matches[0]
events = []
started = time.monotonic()

@callback_type
def receive(packet_list, _read_context, _source_context):
    count = C.c_uint32.from_address(packet_list).value
    packet = packet_list + 4
    for _ in range(min(count, 4096)):
        size = C.c_uint16.from_address(packet + 8).value
        if len(events) < 20000:
            events.append({'elapsed_s': round(time.monotonic() - started, 6),
                           'data_hex': C.string_at(packet + 10, size).hex()})
        packet += 10 + size
        if platform.machine() == 'arm64':
            packet = (packet + 3) & ~3

client, port = C.c_uint32(), C.c_uint32()
label = string('Open Play passive research')
connected = False
try:
    check(m.MIDIClientCreate(label, None, None, C.byref(client)), 'MIDIClientCreate')
    check(m.MIDIInputPortCreate(client, label, receive, None, C.byref(port)), 'MIDIInputPortCreate')
    check(m.MIDIPortConnectSource(port, endpoint, None), 'MIDIPortConnectSource')
    connected = True
    print(f'Listening to {endpoint_name} for {duration}s; no output commands', flush=True)
    mode = C.c_void_p.in_dll(cf, 'kCFRunLoopDefaultMode')
    while time.monotonic() - started < duration:
        cf.CFRunLoopRunInMode(mode, .25, False)
finally:
    if connected:
        m.MIDIPortDisconnectSource(port, endpoint)
    if port.value:
        m.MIDIPortDispose(port)
    if client.value:
        m.MIDIClientDispose(client)
    cf.CFRelease(label)
out = Path('local-evidence')
out.mkdir(exist_ok=True)
report = {'source': endpoint_name, 'duration_s': duration, 'output_commands_sent': 0,
          'event_count': len(events), 'events': events,
          'interpretation': 'Raw input only; physical action correlation requires user observation.'}
(out / 'midi-passive-capture.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'event_count': len(events), 'unique_packets': sorted({e['data_hex'] for e in events})[:40]}))
