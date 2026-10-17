// Original GLSL algorithms inferred from semantic names, not Serato algorithms.
// Coordinates inside this shader are top-left normalized. Uploaded and copied
// textures share bottom-left storage; fetchPremul() performs the single conversion.
export const transitionVertexShader = `
attribute vec2 position;
varying vec2 uv;
void main() {
  uv = vec2((position.x + 1.0) * 0.5, (1.0 - position.y) * 0.5);
  gl_Position = vec4(position, 0.0, 1.0);
}`;

export const transitionFragmentShader = `
precision highp float;
varying vec2 uv;
uniform sampler2D leftSource, rightSource, historySource, latchLeft, latchRight;
uniform float amount, clockTime, tempo, historyReady, latchSide, motion, premultipliedOutput;
uniform vec2 upfaders, levels, scratchGates;
uniform float gridOrder[9];
uniform int kind;
const float PI = 3.14159265359;
vec4 fetchPremul(sampler2D source, vec2 p) {
  if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) return vec4(0.0);
  // Live inputs, latch captures and history are premultiplied BEFORE filtering.
  return texture2D(source, vec2(p.x, 1.0 - p.y));
}
vec4 A(vec2 p) { return fetchPremul(leftSource, p) * upfaders.x; }
vec4 B(vec2 p) { return fetchPremul(rightSource, p) * upfaders.y; }
vec4 additive(vec4 a, vec4 b) { return vec4(min(a.rgb + b.rgb, vec3(1.0)), max(a.a, b.a)); }
vec2 rotate(vec2 p, float angle) {
  float c = cos(angle), s = sin(angle);
  return mat2(c, -s, s, c) * p;
}
float hash(vec2 p) { return fract(sin(dot(p, vec2(37.17, 91.43))) * 17231.347); }
vec4 transition() {
  float t = amount;
  vec4 a = A(uv), b = B(uv);
  // Upfaders Only deliberately ignores the crossfader, including its endpoints.
  if (kind == 1) return additive(a, b);
  if (t <= 0.0) return a;
  if (t >= 1.0) return b;
  float envelope = 4.0 * t * (1.0 - t);
  float phase = clockTime * tempo / 60.0 * 2.0 * PI;
  vec2 p = uv, center = uv - 0.5;
  if (kind == 0) {
    float luma = dot(b.rgb / max(b.a, 0.0001), vec3(0.2126, 0.7152, 0.0722));
    float reveal = smoothstep(1.0 - t - 0.06, 1.0 - t + 0.06, luma);
    return mix(a, b, reveal);
  }
  if (kind == 2 || kind == 3) {
    float wa = min(1.0, 2.0 * (1.0 - t)), wb = min(1.0, 2.0 * t);
    if (kind == 2) return (a * wa + b * wb) / (wa + wb);
    return additive(a * wa, b * wb);
  }
  if (kind == 4) {
    vec4 difference = vec4(abs(a.rgb - b.rgb), max(a.a, b.a));
    return mix(mix(a, b, t), difference, envelope);
  }
  if (kind == 5) {
    vec2 shift = vec2(0.11 * envelope, 0.015 * sin(uv.x * 19.0) * envelope);
    vec4 current = mix((A(p) + A(p + shift) + A(p - shift)) / 3.0, B(p), t);
    vec4 trail = fetchPremul(historySource, p - shift * 0.35);
    return mix(current, trail, 0.42 * envelope * historyReady * motion);
  }
  if (kind == 6) {
    float column = floor(p.x * 18.0);
    float drip = (0.25 + 0.75 * hash(vec2(column, 1.0))) * envelope;
    vec2 ap = p - vec2(0.0, drip * t), bp = p + vec2(0.0, drip * (1.0 - t));
    return mix(A(ap), B(bp), smoothstep(t - 0.16, t + 0.16, 1.0 - p.y + drip * 0.2));
  }
  // Center amount is remapped from the central half by the lifecycle planner.
  if (kind == 8) return mix(a, b, t);
  // Endpoint hysteresis / midpoint selection acts on current live textures.
  if (kind == 9 || kind == 10) return latchSide < 0.5 ? a : b;
  if (kind == 11) return additive(a * scratchGates.x, b * scratchGates.y);
  if (kind == 12 || kind == 13) {
    bool horizontal = kind == 12;
    float axis = horizontal ? p.x : p.y;
    bool incoming = axis >= 1.0 - t;
    float coordinate = incoming ? (axis - (1.0 - t)) / t : axis / (1.0 - t);
    vec2 q = horizontal ? vec2(coordinate, p.y) : vec2(p.x, coordinate);
    vec4 c = incoming ? B(q) : A(q);
    c.rgb *= incoming ? 0.55 + 0.45 * t : 1.0 - 0.45 * t;
    return c;
  }
  // Box Both resolves to the exact Box H/V kernel per declared traversal.
  if (kind == 15 || kind == 16 || kind == 17) {
    float scale = max(abs(cos(PI * t)), 0.015);
    vec2 q = center;
    if (kind == 17) q = rotate(q, PI * t);
    if (kind == 15 || kind == 17) q.x /= scale;
    if (kind == 16 || kind == 17) q.y /= scale;
    vec4 c = t < 0.5 ? A(q + 0.5) : B(q + 0.5);
    c.rgb *= 0.6 + 0.4 * scale;
    return c;
  }
  if (kind == 18) return p.x < t ? b : a;
  if (kind == 19) return p.y < t ? b : a;
  if (kind == 20) {
    vec4 ca = A(p + vec2(t * 0.7, 0.12 * envelope));
    vec4 cb = B(p - vec2((1.0 - t) * 0.7, 0.12 * envelope));
    return mix(ca, cb, smoothstep(0.3, 0.7, t));
  }
  if (kind == 21 || kind == 22) {
    bool horizontal = kind == 21;
    float axis = horizontal ? p.x : p.y;
    bool incoming = axis >= 1.0 - t;
    vec2 shift = horizontal ? vec2(incoming ? -(1.0 - t) : t, 0.0) : vec2(0.0, incoming ? -(1.0 - t) : t);
    return incoming ? B(p + shift) : A(p + shift);
  }
  if (kind == 23 || kind == 24) {
    vec2 grid = vec2(6.0, 4.0), cell = floor(p * grid), local = fract(p * grid);
    float delay = kind == 23 ? cell.x / 5.0 : cell.y / 3.0;
    float progress = clamp(t * 1.8 - delay * 0.8, 0.0, 1.0);
    float width = max(abs(cos(PI * progress)), 0.02);
    vec2 q = local - 0.5;
    if (kind == 23) q.x /= width; else q.y /= width;
    if (abs(q.x) > 0.5 || abs(q.y) > 0.5) return vec4(0.0);
    q = (cell + q + 0.5) / grid;
    return progress < 0.5 ? A(q) : B(q);
  }
  if (kind == 25 || kind == 26) {
    bool horizontal = kind == 25;
    float axis = horizontal ? p.x : p.y, across = horizontal ? p.y : p.x;
    float bar = floor(across * 12.0);
    float ripple = sin(bar * 1.71 + phase) * (0.05 + 0.045 * max(levels.x, levels.y)) * envelope;
    float reveal = 1.0 - smoothstep(t + ripple - 0.012, t + ripple + 0.012, axis);
    vec2 warp = horizontal ? vec2(0.0, ripple * sin(axis * 16.0)) : vec2(ripple * sin(axis * 16.0), 0.0);
    return mix(A(p - warp), B(p + warp), reveal);
  }
  if (kind == 27) {
    float radius = length(center);
    float twist = 7.0 * envelope * pow(max(0.0, 1.0 - radius), 2.0);
    twist += sin(phase) * 0.15 * envelope * motion;
    vec2 qa = rotate(center, twist) + 0.5, qb = rotate(center, -twist) + 0.5;
    float reveal = 1.0 - smoothstep(t * 0.8 - 0.06, t * 0.8 + 0.06, radius);
    return mix(A(qa), B(qb), reveal);
  }
  if (kind == 28) {
    vec2 cell = floor(p * 2.0), local = fract(p * 2.0);
    float delay = mod(cell.x + cell.y, 2.0) * 0.22;
    float progress = clamp((t - delay) / (1.0 - delay), 0.0, 1.0);
    float reveal = local.x < progress ? 1.0 : 0.0;
    return mix(a, b, reveal);
  }
  if (kind == 29) {
    vec2 cell = floor(p * 3.0);
    float rank = cell.x + cell.y * 3.0;
    return t * 9.0 >= rank + 1.0 ? b : a;
  }
  if (kind == 30) {
    vec2 grid = vec2(4.0, 3.0), cell = floor(p * grid), local = fract(p * grid);
    float progress = clamp(t * 1.35 - hash(cell) * 0.35, 0.0, 1.0);
    vec2 q = (local - 0.5) / max(progress, 0.001) + 0.5;
    if (abs(q.x - 0.5) > 0.5 || abs(q.y - 0.5) > 0.5) return a;
    return B((cell + q) / grid);
  }
  if (kind == 31 || kind == 32) {
    vec2 cell = floor(p * 3.0);
    float index = cell.x + cell.y * 3.0, rank = index;
    if (kind == 32) {
      // Invert the CPU's seeded cell-order permutation to a per-cell rank.
      for (int i = 0; i < 9; i++) if (abs(gridOrder[i] - index) < 0.1) rank = float(i);
      return t * 9.0 >= rank + 1.0 ? b : a;
    }
    return mix(a, b, clamp(t * 9.0 - rank, 0.0, 1.0));
  }
  // Default is an original linear interpretation. Crossfade is Open Play's
  // separately labeled baseline alias; neither claims reference equivalence.
  return mix(a, b, t);
}
void main() {
  vec4 c = transition();
  c.a = clamp(c.a, 0.0, 1.0);
  vec3 straight = c.a > 0.00001 ? clamp(c.rgb / c.a, 0.0, 1.0) : vec3(0.0);
  // Display canvas remains straight-alpha. The offscreen history pass stores
  // premultiplied values, so subsequent warped/linear history taps are correct.
  gl_FragColor = vec4(premultipliedOutput > 0.5 ? straight * c.a : straight, c.a);
}`;
