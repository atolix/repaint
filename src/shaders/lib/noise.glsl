float hash12(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec2 hash22(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(123.34, 456.21, 345.45));
  q += dot(q, q + 45.32);
  return fract(vec2(q.x * q.y, q.y * q.z));
}

float rand(vec2 n) {
  return fract(sin(dot(n, vec2(12.9898, 4.141414))) * 43562.6543);
}

float noise(vec2 p) {
  vec2 ip = floor(p);
  vec2 u = fract(p);

  u = u * u * (3.0 - 2.0 * u);
  float res = mix(
    mix(rand(ip), rand(ip + vec2(1.0, 0.0)), u.x),
    mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x),
    u.y
  );

  return res * res;
}

float fbm(vec2 p) {
  float f = 0.0;

  f += 1.0 * noise(p);
  p *= 2.0;

  f += .5 * noise(p);
  p *= 2.0;

  f += .125 * noise(p);
  p *= 2.0;

  f += .065 * noise(p);

  return f;
}
