"""Admission bounds derived from the canonical uploaded float WAV, not minutes."""
import math
from pathlib import Path
import shutil
import struct

DECODED_BYTES = 1024 * 1024 * 1024


def preparation_budget(path):
    path = Path(path)
    with path.open('rb') as stream:
        header = stream.read(44)
    size = path.stat().st_size
    if len(header) != 44 or header[:4] != b'RIFF' or header[8:16] != b'WAVEfmt ' or header[36:40] != b'data':
        raise ValueError('Preparation requires the canonical decoded float WAV.')
    fmt_size, encoding, channels, rate, byte_rate, alignment, bits = struct.unpack_from('<IHHIIHH', header, 16)
    count = struct.unpack_from('<I', header, 40)[0]
    if (fmt_size != 16 or encoding != 3 or not 1 <= channels <= 32 or rate <= 0 or
            alignment != channels * 4 or byte_rate != rate * alignment or bits != 32 or
            count <= 0 or count % alignment or count + 44 != size or
            struct.unpack_from('<I', header, 4)[0] + 8 != size):
        raise ValueError('Decoded WAV length or sample layout is invalid.')
    frames = count // alignment
    duration = frames / rate
    target_bytes = ((frames * 44100 + rate - 1) // rate) * 2 * 4
    if target_bytes > DECODED_BYTES:
        raise ValueError('Prepared stereo audio exceeds the 1 GiB decoded working-input budget.')
    disk = target_bytes * 5 + 128 * 1024 * 1024
    if shutil.disk_usage(path.parent).free < disk:
        raise ValueError('Not enough free disk space for decoded audio and four prepared outputs.')
    return dict(inputDurationSeconds=duration, inputFrames=frames, inputSampleRate=rate,
                decodedWorkingBytes=target_bytes, reservedOutputDiskBytes=disk,
                maximumDecodeSeconds=math.ceil(duration),
                workerTimeoutSeconds=max(900, math.ceil(duration * 3 + 120)))
