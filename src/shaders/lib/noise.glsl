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

float fbm(vec2 p, int octaves) {
  float f = 0.0;
  float amplitude = 0.5;
  float totalAmplitude = 0.0;

  for (int i = 0; i < octaves; i++) {
    f += noise(p) * amplitude;
    totalAmplitude += amplitude;
    p *= 2.0;
    amplitude *= 0.5;
  }

  return f / max(totalAmplitude, 0.0001);
}

float ridgedNoise(vec2 p) {
  return 1.0 - abs(noise(p) * 2.0 - 1.0);
}

float ridgedFbm(vec2 p) {
  float f = 0.0;
  float amplitude = 0.5;
  float totalAmplitude = 0.0;

  for (int i = 0; i < 5; i++) {
    f += ridgedNoise(p) * amplitude;
    totalAmplitude += amplitude;
    p *= 2.0;
    amplitude *= 0.5;
  }

  return f / totalAmplitude;
}

vec2 domainWarp(vec2 p, float amount) {
  vec2 q = vec2(
    fbm(p + vec2(0.0, 0.0)),
    fbm(p + vec2(5.2, 1.3))
  );
  vec2 r = vec2(
    fbm(p + q * 4.0 + vec2(1.7, 9.2)),
    fbm(p + q * 4.0 + vec2(8.3, 2.8))
  );

  return p + (r * 2.0 - 1.0) * amount;
}

vec2 curlNoise(vec2 p) {
  const float e = 0.001;
  float n1 = noise(p + vec2(0.0, e));
  float n2 = noise(p - vec2(0.0, e));
  float n3 = noise(p + vec2(e, 0.0));
  float n4 = noise(p - vec2(e, 0.0));
  float dx = (n1 - n2) / (2.0 * e);
  float dy = (n3 - n4) / (2.0 * e);

  return vec2(dx, -dy);
}
