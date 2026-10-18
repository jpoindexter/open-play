// Supported Open Play controls, not claims about Serato's parameter ranges.
export const lpfParameterFields = [
  {name: 'Resonance', value: '1.77', hint: '0.1–12'},
  {name: 'Slope', value: '24 dB', hint: '6–48 dB/octave, in steps of 6'},
  {name: 'Min Freq', value: '200 Hz', hint: '20–20,000 Hz; Hz or kHz'},
  {name: 'Max Freq', value: '20.0 kHz', hint: '20–20,000 Hz; at least Min Freq'},
];

const numeric = '[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:e[+-]?\\d+)?';
function parse(value, units = '') {
  if (typeof value !== 'string' && typeof value !== 'number') return NaN;
  const match = String(value).trim().match(new RegExp(`^(${numeric})\\s*(${units})$`, 'i'));
  if (!match) return NaN;
  const number = Number(match[1]) * (/^khz$/i.test(match[2]) ? 1000 : 1);
  return Number.isFinite(number) ? number : NaN;
}

// Validate the whole proposal before returning any settings to commit.
export function validateLPFParameters(proposal = {}) {
  const errors = {}, params = {...proposal}, values = {};
  for (const field of lpfParameterFields) {
    const raw = proposal[field.name] === undefined ? field.value : proposal[field.name];
    const units = field.name === 'Slope' ? '(?:dB(?:/oct(?:ave)?)?)?' : field.name.endsWith('Freq') ? '(?:k?Hz)?' : '';
    const value = parse(raw, units);
    values[field.name] = value;
    if (field.name === 'Resonance') {
      if (!(value >= .1 && value <= 12)) errors[field.name] = 'Enter a resonance from 0.1 to 12.';
      else params[field.name] = String(value);
    } else if (field.name === 'Slope') {
      if (!(value >= 6 && value <= 48 && value % 6 === 0)) errors[field.name] = 'Enter a slope from 6 to 48 dB/octave, in steps of 6.';
      else params[field.name] = `${value} dB`;
    } else {
      if (!(value >= 20 && value <= 20000)) errors[field.name] = 'Enter a frequency from 20 to 20,000 Hz, using Hz or kHz.';
      else params[field.name] = `${value} Hz`;
    }
  }
  if (!errors['Min Freq'] && !errors['Max Freq'] && values['Min Freq'] > values['Max Freq']) {
    errors['Min Freq'] = 'Min Freq must be at or below Max Freq.';
    errors['Max Freq'] = 'Max Freq must be at or above Min Freq.';
  }
  const ok = Object.keys(errors).length === 0;
  return {ok, params: ok ? params : null, errors};
}
