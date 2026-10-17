// Standard channel voice input only. No SysEx, firmware commands or guessed device mappings.
export function decodeMIDI(bytes) {
  const status = bytes[0],
    kind = status & 0xf0;
  if (![0x80, 0x90, 0xb0, 0xe0].includes(kind) || bytes.length < 3) return null;
  return {
    type: kind === 0xb0 ? "CC" : kind === 0xe0 ? "Pitch bend" : "Note",
    channel: (status & 15) + 1,
    number: kind === 0xe0 ? 0 : bytes[1],
    value:
      kind === 0xe0 ? bytes[1] + 128 * bytes[2] : kind === 0x80 ? 0 : bytes[2],
    pressed: kind !== 0x80 && bytes[2] > 0,
  };
}
export function mappedValue(message, encoding, pairs = new Map()) {
  if (encoding === "Relative two’s complement")
    return message.value < 64 ? message.value : message.value - 128;
  if (encoding === "Relative offset") return message.value - 64;
  if (encoding === "14-bit absolute" && message.type === "CC") {
    const base = message.number % 32,
      key = `${message.channel}:${base}`,
      pair = pairs.get(key) || [0, 0];
    pair[message.number < 32 ? 0 : 1] = message.value;
    pairs.set(key, pair);
    return (pair[0] * 128 + pair[1]) / 16383;
  }
  return message.value / (message.type === "Pitch bend" ? 16383 : 127);
}
// Independent mapping policy: full travel is -24..+24 semitones, rounded to
// semitones; relative units are semitones. This does not claim Serato's taper.
export function keyShiftSemitones(message, encoding, current = 0, pairs = new Map()) {
  if (!Number.isFinite(message.value) || !Number.isFinite(current))
    throw new RangeError("Key Shift needs finite MIDI and pitch values.");
  if (message.type === "Note" && !message.pressed) return null;
  const value = mappedValue(message, encoding, pairs);
  const semitones = encoding.startsWith("Relative") ? current + value : value * 48 - 24;
  return Math.max(-24, Math.min(24, Math.round(semitones))) || 0;
}
export function syntheticMIDIMessage({type,channel,number,value}) {
  if (!['CC','Note','Pitch bend'].includes(type) || !Number.isInteger(channel) || channel<1 || channel>16 ||
      !Number.isInteger(number) || number<0 || number>127 || !Number.isInteger(value) || value<0 || value>(type==='Pitch bend'?16383:127))
    throw new RangeError('Use a channel1–16, controller/note0–127 and integer value0–127 (pitch bend0–16383).');
  const status=({CC:0xb0,Note:0x90,'Pitch bend':0xe0})[type]+channel-1;
  return decodeMIDI(type==='Pitch bend'?[status,value&127,value>>7]:[status,number,value]);
}
export function matchesMIDIMap(message,mapping) {
  if(mapping.deviceId&&mapping.deviceId!==message.deviceId)return false;
  if (mapping.channel!==message.channel || (mapping.type||'CC')!==message.type) return false;
  if (mapping.encoding==='14-bit absolute' && message.type==='CC')
    return mapping.number>=0 && mapping.number<64 && message.number>=0 && message.number<64 &&
      mapping.number%32===message.number%32;
  return mapping.number===message.number;
}
export function createMIDI({ onMessage, onState }) {
  let access = null,
    generation = 0;
  const attach = () => {
    for (const input of access.inputs.values())
      input.onmidimessage = (e) => {
        const message = decodeMIDI(e.data);
        if (message)
          onMessage({
            ...message,
            device: input.name || input.id,
            deviceId: input.id,
            timestamp: e.timeStamp,
            synthetic: false,
          });
      };
    onState(
      [...access.inputs.values()].map((x) => ({
        id: x.id,
        name: x.name || x.id,
        state: x.state,
      })),
    );
  };
  return {
    async connect() {
      if (!navigator.requestMIDIAccess)
        throw new Error(
          "Web MIDI is unavailable in this browser. Use a browser with Web MIDI support; physical compatibility remains unverified.",
        );
      const token = ++generation;
      let timeout;
      try {
        const request = navigator.requestMIDIAccess({ sysex: false });
        access = await Promise.race([
          request,
          new Promise((_, reject) => {
            timeout = setTimeout(
              () =>
                reject(
                  new Error(
                    "MIDI permission or device access did not resolve within 10 seconds. No hardware input was verified.",
                  ),
                ),
              10000,
            );
          }),
        ]);
        if (token !== generation) return;
      } finally {
        clearTimeout(timeout);
      }
      access.onstatechange = attach;
      attach();
    },
    disconnect() {
      generation++;
      if (access) {
        for (const input of access.inputs.values()) input.onmidimessage = null;
        access.onstatechange = null;
        access = null;
      }
      onState([]);
    },
  };
}
