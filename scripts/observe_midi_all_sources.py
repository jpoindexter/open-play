#!/usr/bin/env python3
"""Bounded, passive CoreMIDI input diagnostic; physical capture is explicit.

--abi-check compiles static assertions against Apple's installed SDK, with no
MIDI client. --self-test connects ONLY an owned virtual source; other MIDI
clients can see that temporary source. It never enumerates hardware or sends to
a destination. --capture requires a separately coordinated movement window.
No output port, MIDISend, property setter, SysEx handshake or driver operation.
This research fixture is not native DJ application implementation.
"""
import argparse
import ctypes as C
from datetime import datetime, timezone
import json
from pathlib import Path
import platform
import select
import subprocess
import sys
import threading
import time
import uuid

U32, PTR = C.c_uint32, C.c_void_p
READ = C.CFUNCTYPE(None, PTR, PTR, PTR)
NOTIFY = C.CFUNCTYPE(None, PTR, PTR)
ARM = platform.machine().lower() in ('arm64', 'aarch64', 'arm')
MAX_PACKETS = 4096
MAX_CALLBACK_BYTES = 262144
MAX_EVENTS = 20000
MAX_RETAINED_BYTES = 2 * 1024 * 1024
MAX_NOTICES = 2048
MAX_CONNECTIONS = 1024
MAX_CHANGES = 4096


def stamp():
    return {'utc': datetime.now(timezone.utc).isoformat(),
            'monotonic_s': time.monotonic()}


def require(status, action):
    if status:
        raise RuntimeError(f'{action}: OSStatus {status}')


def abi_check():
    """Compile only: independently checks declarations, not physical delivery."""
    source = r'''
    #include <stddef.h>
    #include <CoreMIDI/CoreMIDI.h>
    _Static_assert(sizeof(MIDIObjectRef) == 4, "MIDIObjectRef");
    _Static_assert(sizeof(ItemCount) == sizeof(unsigned long), "ItemCount");
    _Static_assert(sizeof(MIDITimeStamp) == 8, "timestamp");
    _Static_assert(offsetof(MIDIPacketList, packet) == 4, "first packet");
    _Static_assert(offsetof(MIDIPacket, length) == 8, "length");
    _Static_assert(offsetof(MIDIPacket, data) == 10, "data");
    _Static_assert(sizeof(MIDINotification) == 8, "notification header");
    _Static_assert(offsetof(MIDINotification, messageSize) == 4, "notify size");
    _Static_assert(sizeof(MIDIObjectAddRemoveNotification) == 24, "add/remove size");
    _Static_assert(offsetof(MIDIObjectAddRemoveNotification, child) == 16, "child ref");
    _Static_assert(offsetof(MIDIObjectAddRemoveNotification, childType) == 20, "child type");
    _Static_assert(kMIDIMsgObjectRemoved == 3 && kMIDIObjectType_Source == 2,
                   "remove/source enum");
    _Static_assert(kMIDIObjectNotFound == -10842, "absent virtual parent status");
    static void read_cb(const MIDIPacketList *p, void *r, void *s) {}
    static void notify_cb(const MIDINotification *m, void *r) {}
    static MIDIReadProc r = read_cb;
    static MIDINotifyProc n = notify_cb;
    static ItemCount (*count_fn)(void) = MIDIGetNumberOfSources;
    static MIDIEndpointRef (*source_fn)(ItemCount) = MIDIGetSource;
    static OSStatus (*int_fn)(MIDIObjectRef, CFStringRef, SInt32 *) =
        MIDIObjectGetIntegerProperty;
    static OSStatus (*entity_fn)(MIDIEndpointRef, MIDIEntityRef *) =
        MIDIEndpointGetEntity;
    static OSStatus (*device_fn)(MIDIEntityRef, MIDIDeviceRef *) =
        MIDIEntityGetDevice;
    static OSStatus (*client_fn)(CFStringRef, MIDINotifyProc, void *, MIDIClientRef *) =
        MIDIClientCreate;
    static OSStatus (*port_fn)(MIDIClientRef, CFStringRef, MIDIReadProc, void *, MIDIPortRef *) =
        MIDIInputPortCreate;
    static OSStatus (*connect_fn)(MIDIPortRef, MIDIEndpointRef, void *) = MIDIPortConnectSource;
    static MIDIPacket *(*add_fn)(MIDIPacketList *, ByteCount, MIDIPacket *, MIDITimeStamp,
                                 ByteCount, const Byte *) = MIDIPacketListAdd;
    static OSStatus (*received_fn)(MIDIEndpointRef, const MIDIPacketList *) = MIDIReceived;
    '''
    sdk = subprocess.run(['xcrun', '--show-sdk-path'], capture_output=True,
                         text=True, check=True).stdout.strip()
    result = subprocess.run(['xcrun', 'clang', '-x', 'c', '-fsyntax-only',
                             '-Werror=incompatible-function-pointer-types',
                             '-isysroot', sdk, '-'], input=source,
                            text=True, capture_output=True, timeout=30)
    report = {'test': 'Apple SDK ABI compile assertions', 'sdk': sdk,
              'machine': platform.machine(), 'passed': result.returncode == 0,
              'compiler_diagnostics': result.stderr[-12000:],
              'packet_iteration': 'Apple MIDIPacketNext: data+length; ARM aligns to 4',
              'boundary': 'Compile/layout proof only; no MIDI client or hardware delivery.'}
    if result.returncode:
        raise RuntimeError(json.dumps(report))
    return report


class CoreMIDI:
    def __init__(self):
        self.m = C.CDLL('/System/Library/Frameworks/CoreMIDI.framework/CoreMIDI')
        self.cf = C.CDLL('/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation')
        self.cf.CFStringCreateWithCString.argtypes = [PTR, C.c_char_p, U32]
        self.cf.CFStringCreateWithCString.restype = PTR
        self.cf.CFStringGetCString.argtypes = [PTR, PTR, C.c_long, U32]
        self.cf.CFStringGetCString.restype = C.c_bool
        self.cf.CFRelease.argtypes = [PTR]
        self.cf.CFRelease.restype = None
        self.cf.CFRunLoopRunInMode.argtypes = [PTR, C.c_double, C.c_bool]
        self.cf.CFRunLoopRunInMode.restype = C.c_int32
        declarations = {
            'MIDIGetNumberOfSources': ([], C.c_ulong),
            'MIDIGetSource': ([C.c_ulong], U32),
            'MIDIObjectGetIntegerProperty': ([U32, PTR, C.POINTER(C.c_int32)], C.c_int32),
            'MIDIObjectGetStringProperty': ([U32, PTR, C.POINTER(PTR)], C.c_int32),
            'MIDIEndpointGetEntity': ([U32, C.POINTER(U32)], C.c_int32),
            'MIDIEntityGetDevice': ([U32, C.POINTER(U32)], C.c_int32),
            'MIDIClientCreate': ([PTR, NOTIFY, PTR, C.POINTER(U32)], C.c_int32),
            'MIDIInputPortCreate': ([U32, PTR, READ, PTR, C.POINTER(U32)], C.c_int32),
            'MIDIPortConnectSource': ([U32, U32, PTR], C.c_int32),
            'MIDIPortDisconnectSource': ([U32, U32], C.c_int32),
            'MIDIPortDispose': ([U32], C.c_int32),
            'MIDIClientDispose': ([U32], C.c_int32),
            'MIDISourceCreate': ([U32, PTR, C.POINTER(U32)], C.c_int32),
            'MIDIEndpointDispose': ([U32], C.c_int32),
            'MIDIReceived': ([U32, PTR], C.c_int32),
            'MIDIPacketListInit': ([PTR], PTR),
            'MIDIPacketListAdd': ([PTR, C.c_ulong, PTR, C.c_uint64, C.c_ulong, PTR], PTR),
        }
        for name, (args, result) in declarations.items():
            fn = getattr(self.m, name)
            fn.argtypes, fn.restype = args, result
        self.mode = PTR.in_dll(self.cf, 'kCFRunLoopDefaultMode')

    def string(self, text):
        result = self.cf.CFStringCreateWithCString(None, text.encode(), 0x08000100)
        if not result:
            raise RuntimeError('CFStringCreateWithCString failed')
        return result

    def prop(self, obj, symbol, integer=False):
        try:
            key = PTR.in_dll(self.m, symbol)
        except ValueError:
            return {'status': 'symbol-unavailable', 'value': None}
        value = C.c_int32() if integer else PTR()
        fn = self.m.MIDIObjectGetIntegerProperty if integer else self.m.MIDIObjectGetStringProperty
        status = fn(obj, key, C.byref(value))
        if integer:
            return {'status': status, 'value': value.value if not status else None}
        text, truncated = None, False
        if value.value:
            try:
                buf = C.create_string_buffer(1024)
                ok = self.cf.CFStringGetCString(value, buf, len(buf), 0x08000100)
                if ok:
                    text = buf.value.decode('utf-8', errors='replace')
                else:
                    truncated = True
            finally:
                self.cf.CFRelease(value)
        return {'status': status, 'value': text if not status else None,
                'unrepresentable_or_over_1023_utf8_bytes': truncated}

    def object_info(self, ref):
        return {'ref': ref,
                **{name: self.prop(ref, symbol, integer) for name, symbol, integer in (
                    ('uid', 'kMIDIPropertyUniqueID', True),
                    ('name', 'kMIDIPropertyName', False),
                    ('display_name', 'kMIDIPropertyDisplayName', False),
                    ('manufacturer', 'kMIDIPropertyManufacturer', False),
                    ('model', 'kMIDIPropertyModel', False),
                    ('offline', 'kMIDIPropertyOffline', True),
                    ('protocol_id', 'kMIDIPropertyProtocolID', True))}}

    def source_info(self, ref):
        entity, device = U32(), U32()
        entity_status = self.m.MIDIEndpointGetEntity(ref, C.byref(entity))
        device_status = self.m.MIDIEntityGetDevice(entity, C.byref(device)) if entity.value else None
        return {'endpoint': self.object_info(ref), 'entity_status': entity_status,
                'entity': self.object_info(entity.value) if entity.value else None,
                'device_status': device_status,
                'device': self.object_info(device.value) if device.value else None}

    def runloop(self, seconds=.05):
        self.cf.CFRunLoopRunInMode(self.mode, seconds, False)


def packets(packet_list):
    """Trusted CoreMIDI-owned allocation only; ABI offers no buffer-size argument.

    Caps work per callback. A Python exception cannot catch invalid native
    memory; SDK assertions + native-builder self-test are mandatory beforehand.
    """
    if not packet_list:
        raise ValueError('null packet list')
    declared = U32.from_address(packet_list).value
    packet, decoded_bytes = packet_list + 4, 0
    if declared > MAX_PACKETS:
        raise ValueError(f'packet count exceeds {MAX_PACKETS}: {declared}')
    for _ in range(declared):
        host = C.c_uint64.from_address(packet).value
        length = C.c_uint16.from_address(packet + 8).value
        decoded_bytes += length
        if decoded_bytes > MAX_CALLBACK_BYTES:
            raise ValueError('callback byte budget exceeded; remaining packets unparsed')
        yield host, length, packet + 10
        packet += 10 + length
        if ARM:
            packet = (packet + 3) & ~3


class Observer:
    def __init__(self, api):
        self.api = api
        self.client, self.port = U32(), U32()
        self.lock = threading.RLock()
        self.rescan = threading.Event()
        self.connections, self.active = {}, {}
        self.failed = {}
        self.events, self.notices, self.changes, self.markers = [], [], [], []
        self.retire = set()
        self.scans = []
        self.bytes_retained = 0
        self.omitted_notices = self.omitted_changes = self.unknown_callbacks = self.omitted_scans = 0
        self.scan_count = 0
        self.omitted_markers = 0
        self.cleanup = []
        self.receive = READ(self._receive)
        self.notify = NOTIFY(self._notify)

    def _receive(self, packet_list, _context, source_context):
        token = int(source_context or 0)
        with self.lock:
            record = self.connections.get(token)
            if record is None:
                self.unknown_callbacks += 1
                return
            record['callbacks'] += 1  # independent of parsing success
            received = stamp()
            record['last_callback'] = received
            try:
                record['declared_packets'] += U32.from_address(packet_list).value if packet_list else 0
                for host, length, data in packets(packet_list):
                    record['packets_decoded'] += 1
                    record['bytes_decoded'] += length
                    retain = min(length, 4096, MAX_RETAINED_BYTES - self.bytes_retained)
                    if len(self.events) >= MAX_EVENTS:
                        retain = 0
                        record['event_records_omitted'] += 1
                    else:
                        self.events.append({'source_token': token, **received,
                                            'host_timestamp': host, 'length': length,
                                            'data_hex': C.string_at(data, retain).hex(),
                                            'raw_bytes_omitted': length - retain})
                        self.bytes_retained += retain
                    record['raw_bytes_omitted'] += length - retain
            except Exception as error:
                record['parser_errors'] += 1
                record['last_parser_error'] = str(error)[:512]

    def _notify(self, pointer, _context):
        with self.lock:
            try:
                message_id = U32.from_address(pointer).value
                size = U32.from_address(pointer + 4).value
                notice = {**stamp(), 'message_id': message_id, 'size': size,
                          'raw_hex': C.string_at(pointer, min(size, 256)).hex() if size >= 8 else '',
                          'raw_bytes_omitted': max(0, size - 256)}
                if message_id in (2, 3) and size >= 24:
                    child = U32.from_address(pointer + 16).value
                    child_type = C.c_int32.from_address(pointer + 20).value
                    notice.update(child_ref=child, child_type=child_type)
                    if message_id == 3 and child_type == 2:
                        for token, record in self.connections.items():
                            if record['key'][0] == child and 'removed' not in record:
                                record['removal_notification'] = stamp()
                                self.retire.add(token)
            except Exception as error:
                notice = {**stamp(), 'error': str(error)[:512]}
            if len(self.notices) < MAX_NOTICES:
                self.notices.append(notice)
            else:
                self.omitted_notices += 1
        self.rescan.set()

    def open(self):
        label = self.api.string('Open Play passive all-source research')
        try:
            require(self.api.m.MIDIClientCreate(label, self.notify, None, C.byref(self.client)), 'create client')
            require(self.api.m.MIDIInputPortCreate(self.client, label, self.receive, None, C.byref(self.port)), 'create input')
        finally:
            self.api.cf.CFRelease(label)

    def connect(self, endpoint, info, key):
        if len(self.connections) >= MAX_CONNECTIONS:
            raise RuntimeError('connection history limit reached; capture stopped explicitly')
        token = len(self.connections) + 1
        record = {'token': token, 'key': list(key), 'info': info, 'initial_info': info,
                  'created': stamp(),
                  'callbacks': 0, 'declared_packets': 0, 'packets_decoded': 0,
                  'bytes_decoded': 0, 'parser_errors': 0,
                  'raw_bytes_omitted': 0, 'event_records_omitted': 0}
        with self.lock:
            self.connections[token] = record
        status = self.api.m.MIDIPortConnectSource(self.port, endpoint, PTR(token))
        record['connect_status'] = status
        if not status:
            self.active[key] = token
        else:
            self.failed[key] = token
        return token

    def scan(self):
        """Main runloop only; no enumeration is called in isolated self-test."""
        self.scan_count += 1
        with self.lock:
            retired = self.retire.copy()
            self.retire.clear()
        for key, token in list(self.active.items()):
            if token in retired:
                self.active.pop(key)
                self.connections[token]['removed'] = stamp()
                self.connections[token]['disconnect_status'] = self.api.m.MIDIPortDisconnectSource(self.port, key[0])
        for key, token in list(self.failed.items()):
            if token in retired:
                self.failed.pop(key)
                self.connections[token]['removed'] = stamp()
        count = self.api.m.MIDIGetNumberOfSources()
        if len(self.scans) < 256:
            self.scans.append({**stamp(), 'source_count': count})
        else:
            self.omitted_scans += 1
        if count > MAX_CONNECTIONS:
            raise RuntimeError('source count exceeds diagnostic bound; no silent selection')
        found = set()
        for index in range(count):
            endpoint = self.api.m.MIDIGetSource(index)
            if not endpoint:
                continue  # setup can change between count and lookup
            info = self.api.source_info(endpoint)
            uid = info['endpoint']['uid']
            key = (endpoint, uid['value'] if uid['status'] == 0 else None)
            found.add(key)
            # Disconnect the old source reference before reusing it with a new
            # UID. Connecting first could fail "already connected", then leave
            # the new identity disconnected when the stale key is retired.
            for old_key in list(self.active):
                if old_key[0] == endpoint and old_key != key:
                    old_token = self.active.pop(old_key)
                    old = self.connections[old_token]
                    old['removed'] = stamp()
                    old['retirement_reason'] = 'same endpoint ref, changed UID lookup'
                    old['disconnect_status'] = self.api.m.MIDIPortDisconnectSource(self.port, endpoint)
            for old_key in list(self.failed):
                if old_key[0] == endpoint and old_key != key:
                    old_token = self.failed.pop(old_key)
                    self.connections[old_token]['removed'] = stamp()
            known_token = self.active.get(key) or self.failed.get(key)
            if known_token is None:
                self.connect(endpoint, info, key)
            else:
                with self.lock:
                    record = self.connections[known_token]
                    record['last_seen'] = stamp()
                    if info != record['info']:
                        change = {**stamp(), 'source_token': record['token'], 'info': info}
                        if len(self.changes) < MAX_CHANGES:
                            self.changes.append(change)
                        else:
                            self.omitted_changes += 1
                        record['info'] = info
        for key in list(self.active):
            if key not in found:
                token = self.active.pop(key)
                self.connections[token]['removed'] = stamp()
                self.connections[token]['disconnect_status'] = self.api.m.MIDIPortDisconnectSource(self.port, key[0])
        for key, token in list(self.failed.items()):
            if key not in found:
                self.failed.pop(key)
                self.connections[token]['removed'] = stamp()

    def close(self, owned_endpoint=0):
        for key, token in list(self.active.items()):
            status = self.api.m.MIDIPortDisconnectSource(self.port, key[0])
            self.connections[token]['disconnect_status'] = status
        self.active.clear()
        if owned_endpoint:
            self.cleanup.append({'owned_endpoint_dispose': self.api.m.MIDIEndpointDispose(owned_endpoint)})
        if self.port.value:
            self.cleanup.append({'port_dispose': self.api.m.MIDIPortDispose(self.port)})
        if self.client.value:
            self.cleanup.append({'client_dispose': self.api.m.MIDIClientDispose(self.client)})

    def report(self):
        with self.lock:
            return {'connections': list(self.connections.values()), 'events': self.events,
                    'notifications': self.notices, 'property_changes': self.changes,
                    'markers': self.markers, 'scan_count': self.scan_count,
                    'markers_omitted': self.omitted_markers,
                    'scans': self.scans, 'scan_records_omitted': self.omitted_scans,
                    'unknown_source_callbacks': self.unknown_callbacks,
                    'retained_raw_bytes': self.bytes_retained,
                    'notifications_omitted': self.omitted_notices,
                    'property_changes_omitted': self.omitted_changes,
                    'cleanup': self.cleanup}


def isolated_test(api):
    observer, endpoint = Observer(api), U32()
    label = api.string('Open Play OWNED SOURCE SELF TEST ' + uuid.uuid4().hex)
    expected = [b'\xf8', bytes.fromhex('b00101'), bytes.fromhex('b0017fb30101'),
                b'\xf0' + bytes(range(127)) * 2 + bytes(range(44)) + b'\xf7']
    parser_cases = []
    try:
        observer.open()
        require(api.m.MIDISourceCreate(observer.client, label, C.byref(endpoint)), 'owned source')
        info = api.source_info(endpoint.value)
        info['owned_test_source'] = True
        parser_cases.append({'case': 'owned virtual source property ABI / UID / no parent entity',
                             'passed': info['endpoint']['uid']['status'] == 0 and
                                       info['endpoint']['name']['status'] == 0 and
                                       info['endpoint']['name']['value'].startswith('Open Play OWNED SOURCE SELF TEST ') and
                                       info['entity_status'] in (0, -10842) and info['entity'] is None,
                             'entity_status': info['entity_status'],
                             'note': 'Virtual sources have no entity; this OS reports kMIDIObjectNotFound.'})
        observer.connect(endpoint.value, info, (endpoint.value, info['endpoint']['uid']['value']))
        require(observer.connections[1]['connect_status'], 'connect owned source')
        buffer = C.create_string_buffer(2048)
        packet = api.m.MIDIPacketListInit(buffer)
        for timestamp, payload in enumerate(expected, 1):
            data = C.create_string_buffer(payload)
            packet = api.m.MIDIPacketListAdd(buffer, len(buffer), packet, timestamp, len(payload), data)
            if not packet:
                raise RuntimeError('native packet builder overflow')
        native_packets = [(host, length, C.string_at(data, length))
                          for host, length, data in packets(C.addressof(buffer))]
        parser_cases.append({'case': 'native builder mixed-length packets including >256 bytes',
                             'passed': [data for _, _, data in native_packets] == expected,
                             'lengths': [length for _, length, _ in native_packets]})
        # Counter must increment even when the parser rejects a structurally bounded fixture.
        bad = C.create_string_buffer(4)
        U32.from_buffer(bad).value = MAX_PACKETS + 1
        observer.receive(C.addressof(bad), None, PTR(1))
        parser_cases.append({'case': 'callback counted independently of parser rejection',
                             'passed': observer.connections[1]['callbacks'] == 1 and
                                       observer.connections[1]['parser_errors'] == 1})
        parser_cases.extend(controlled_tests(C.addressof(buffer)))
        # Separate malformed fixture evidence from actual virtual delivery metrics.
        observer.connections[1].update(callbacks=0, parser_errors=0, declared_packets=0)
        observer.connections[1].pop('last_parser_error', None)
        require(api.m.MIDIReceived(endpoint, buffer), 'publish ONLY owned source')
        deadline = time.monotonic() + 3
        target = b''.join(expected).hex()
        while time.monotonic() < deadline:
            api.runloop()
            if ''.join(event['data_hex'] for event in observer.events) == target:
                break
        received = ''.join(event['data_hex'] for event in observer.events)
        report = {'test': 'owned virtual source to input port', 'parser_cases': parser_cases,
                  'expected_hex': target, 'received_hex': received,
                  'passed': all(case['passed'] for case in parser_cases) and received == target and
                            observer.connections[1]['callbacks'] > 0 and
                            observer.connections[1]['parser_errors'] == 0,
                  'hardware_sources_enumerated': 0, 'hardware_destinations_used': 0,
                  'boundary': 'Native packet construction and virtual callback delivery only; '
                              'does not prove Hercules delivery, protocol conversion or Serato sharing.'}
    finally:
        observer.close(endpoint.value)
        api.cf.CFRelease(label)
    report.update(observer.report())
    report['passed'] = report['passed'] and all(
        status == 0 for operation in observer.cleanup for status in operation.values())
    return report


def controlled_tests(packet_list):
    """Fake lifecycle collaborator only; these are not CoreMIDI/device proofs."""
    class FakeAPI:
        def __init__(self):
            self.m = self
            self.sources = [11, 12]
            self.offline = 0
            self.uid = 101
            self.connected = set()
        def MIDIGetNumberOfSources(self):
            return len(self.sources)
        def MIDIGetSource(self, index):
            return self.sources[index]
        def source_info(self, ref):
            return {'endpoint': {'ref': ref, 'uid': {'status': 0, 'value': self.uid + ref},
                                 'offline': {'status': 0, 'value': self.offline}}}
        def MIDIPortConnectSource(self, port, endpoint, context):
            if endpoint == 13:
                return -10830
            if endpoint in self.connected:
                return -1
            self.connected.add(endpoint)
            return 0
        def MIDIPortDisconnectSource(self, port, endpoint):
            self.connected.discard(endpoint)
            return 0
    fake = FakeAPI()
    observer = Observer(fake)
    observer.scan()
    observer.receive(packet_list, None, PTR(1))
    observer.receive(packet_list, None, PTR(2))
    cases = [{'case': 'controlled all-source connection and distinct source refCon counters',
              'passed': len(observer.active) == 2 and
                        all(record['callbacks'] == 1 for record in observer.connections.values()) and
                        {event['source_token'] for event in observer.events} == {1, 2}}]
    notice = C.create_string_buffer(24)
    U32.from_buffer(notice, 0).value = 3
    U32.from_buffer(notice, 4).value = 24
    U32.from_buffer(notice, 16).value = 11
    U32.from_buffer(notice, 20).value = 2
    observer.notify(C.addressof(notice), None)
    observer.scan()  # same ref AND UID; removal notice must force a new token
    cases.append({'case': 'controlled removal then same-ref same-UID replacement gets new token',
                  'passed': observer.active[(11, 112)] == 3 and
                            'removed' in observer.connections[1] and
                            observer.connections[3]['callbacks'] == 0})
    fake.offline = 1
    observer.scan()
    cases.append({'case': 'controlled property change retains initial identity snapshot',
                  'passed': observer.connections[3]['initial_info']['endpoint']['offline']['value'] == 0 and
                            observer.connections[3]['info']['endpoint']['offline']['value'] == 1 and
                            len(observer.changes) == 2})
    fake.sources.append(13)
    observer.scan()
    observer.scan()
    cases.append({'case': 'controlled failed connection status retained without retry storm',
                  'passed': len(observer.connections) == 4 and
                            observer.connections[4]['connect_status'] == -10830 and
                            (13, 114) in observer.failed})
    observer.bytes_retained = MAX_RETAINED_BYTES
    observer.receive(packet_list, None, PTR(3))
    cases.append({'case': 'controlled raw-byte retention bound preserves packet metrics',
                  'passed': observer.connections[3]['packets_decoded'] == 4 and
                            observer.connections[3]['bytes_decoded'] == 310 and
                            observer.connections[3]['raw_bytes_omitted'] == 310 and
                            observer.bytes_retained == MAX_RETAINED_BYTES})
    observer.events = [None] * MAX_EVENTS
    observer.receive(packet_list, None, PTR(3))
    cases.append({'case': 'controlled event bound reports omissions while counting callbacks',
                  'passed': observer.connections[3]['callbacks'] == 2 and
                            observer.connections[3]['event_records_omitted'] == 4 and
                            len(observer.events) == MAX_EVENTS})
    observer.receive(packet_list, None, PTR(999))
    cases.append({'case': 'controlled unknown source context is counted, never relabeled',
                  'passed': observer.unknown_callbacks == 1})
    fake.uid = 202
    observer.scan()
    cases.append({'case': 'controlled UID change disconnects stale ref before reconnect',
                  'passed': (11, 213) in observer.active and (12, 214) in observer.active and
                            (11, 112) not in observer.active and
                            observer.connections[observer.active[(11, 213)]]['connect_status'] == 0})
    return cases


def capture(api, seconds, note):
    observer = Observer(api)
    started = stamp()
    error = None
    try:
        observer.open()  # create client BEFORE enumerating
        observer.scan()
        began = time.monotonic()
        observer.markers.append({**stamp(), 'label': 'ready', 'elapsed_s': 0})
        print('READY: all current CoreMIDI sources connected where connect_status=0. '
              'No MIDI output. Press Enter to add a correlation marker.', flush=True)
        print('Use only the fresh movement window agreed with Jason; this script does '
              'not assume that physical movement occurred.', flush=True)
        next_scan = began + .5
        while time.monotonic() - began < seconds:
            api.runloop()
            now = time.monotonic()
            if observer.rescan.is_set() or now >= next_scan:
                observer.rescan.clear()
                observer.scan()
                next_scan = now + .5
            if sys.stdin.isatty() and select.select([sys.stdin], [], [], 0)[0]:
                sys.stdin.readline()
                if len(observer.markers) < 256:
                    marker = {**stamp(), 'label': 'operator-enter', 'elapsed_s': now - began}
                    observer.markers.append(marker)
                    print(json.dumps(marker), flush=True)
                else:
                    observer.omitted_markers += 1
    except (Exception, KeyboardInterrupt) as caught:
        error = f'{type(caught).__name__}: {caught}'[:1024]
    finally:
        observer.close()
    return {'test': 'passive all-source physical-session observation',
            'started': started, 'ended': stamp(), 'requested_seconds': seconds,
            'operator_note': note, 'error': error,
            'hardware_output_commands_sent': 0,
            'input_api': 'legacy MIDIInputPortCreate / MIDIPacketList (not native UMP)',
            'physical_movement_confirmed': None,
            'boundary': 'Callbacks and raw input only. Physical action/Serato-response '
                        'correlation requires Jason confirmation for this exact window.',
            **observer.report()}


def save_report(report, mode):
    directory = Path(__file__).resolve().parent.parent / 'local-evidence'
    directory.mkdir(exist_ok=True)
    filename = 'midi-all-sources-' + mode + '-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S') + '-' + uuid.uuid4().hex[:8] + '.json'
    path = directory / filename
    with path.open('x') as handle:
        json.dump(report, handle, indent=2)
        handle.write('\n')
    return path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--abi-check', action='store_true')
    group.add_argument('--self-test', action='store_true')
    group.add_argument('--capture', type=float, metavar='SECONDS')
    parser.add_argument('--note', default='', help='Local correlation note, at most 512 characters')
    args = parser.parse_args()
    if platform.system() != 'Darwin':
        parser.error('macOS required')
    if len(args.note) > 512:
        parser.error('--note exceeds 512 characters')
    if args.capture is not None and not (1 <= args.capture <= 120):
        parser.error('--capture must be finite and between 1 and 120 seconds')
    abi = abi_check()  # no capture proceeds after failed ABI validation
    if args.abi_check:
        print(json.dumps(abi, indent=2))
        return 0
    api = CoreMIDI()
    report = isolated_test(api) if args.self_test else capture(api, args.capture, args.note)
    report['abi'] = abi
    report['limits'] = {'packet_count_per_callback': MAX_PACKETS,
                        'decoded_bytes_per_callback': MAX_CALLBACK_BYTES,
                        'retained_events': MAX_EVENTS, 'retained_raw_bytes': MAX_RETAINED_BYTES,
                        'raw_bytes_per_event': 4096, 'notifications': MAX_NOTICES,
                        'connection_history': MAX_CONNECTIONS, 'property_changes': MAX_CHANGES}
    path = save_report(report, 'self-test' if args.self_test else 'capture')
    print(json.dumps({'path': str(path), 'passed': report.get('passed'),
                      'error': report.get('error'),
                      'callbacks': sum(row['callbacks'] for row in report['connections']),
                      'packets': sum(row['packets_decoded'] for row in report['connections']),
                      'parser_errors': sum(row['parser_errors'] for row in report['connections'])}))
    return 0 if report.get('passed', report.get('error') is None) else 1


if __name__ == '__main__':
    raise SystemExit(main())
