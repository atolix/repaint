float sdCircle(vec2 p, float radius) {
  return length(p) - radius;
}

float sdRing(vec2 p, float radius, float width) {
  return abs(length(p) - radius) - width * 0.5;
}

float sdBox(vec2 p, vec2 halfSize) {
  vec2 d = abs(p) - halfSize;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float sdRoundedBox(vec2 p, vec2 halfSize, float radius) {
  vec2 q = abs(p) - halfSize + radius;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
}

float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = saturate(dot(pa, ba) / dot(ba, ba));
  return length(pa - ba * h);
}

float sdLine(vec2 p, vec2 a, vec2 b, float width) {
  return sdSegment(p, a, b) - width * 0.5;
}

float sdHexagon(vec2 p, float radius) {
  const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
  p = abs(p);
  p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
  p -= vec2(clamp(p.x, -k.z * radius, k.z * radius), radius);
  return length(p) * sign(p.y);
}

float fill(float distance) {
  return 1.0 - step(0.0, distance);
}

float fill(float distance, float softness) {
  return 1.0 - smoothstep(0.0, softness, distance);
}

float stroke(float distance, float width) {
  return 1.0 - step(width, abs(distance));
}

float stroke(float distance, float width, float softness) {
  return 1.0 - smoothstep(width, width + softness, abs(distance));
}

float opUnion(float a, float b) {
  return min(a, b);
}

float opSubtract(float a, float b) {
  return max(a, -b);
}

float opIntersect(float a, float b) {
  return max(a, b);
}

float opSmoothUnion(float a, float b, float k) {
  float h = saturate(0.5 + 0.5 * (b - a) / k);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float opSmoothSubtract(float a, float b, float k) {
  float h = saturate(0.5 - 0.5 * (b + a) / k);
  return mix(a, -b, h) + k * h * (1.0 - h);
}

float opSmoothIntersect(float a, float b, float k) {
  float h = saturate(0.5 - 0.5 * (b - a) / k);
  return mix(b, a, h) + k * h * (1.0 - h);
}

vec2 repeat(vec2 p, vec2 spacing) {
  return mod(p + spacing * 0.5, spacing) - spacing * 0.5;
}

vec2 repeat(vec2 p, float spacing) {
  return repeat(p, vec2(spacing));
}
