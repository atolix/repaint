// Hashes a 2D coordinate to a deterministic scalar in [0, 1).
float hash12(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// Hashes a 2D coordinate to a deterministic vector in [0, 1)^2.
vec2 hash22(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(123.34, 456.21, 345.45));
  q += dot(q, q + 45.32);
  return fract(vec2(q.x * q.y, q.y * q.z));
}

// Hashes a 3D coordinate to a deterministic scalar in [0, 1).
float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

// Returns a lightweight deterministic pseudo-random value in [0, 1).
float rand(vec2 n) {
  return fract(sin(dot(n, vec2(12.9898, 4.141414))) * 43562.6543);
}

// Samples smooth 2D value noise with a nominal [0, 1] range.
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

// Samples smooth 3D value noise with a nominal [0, 1] range.
float noise(vec3 p) {
  vec3 cell = floor(p);
  vec3 local = fract(p);
  vec3 blend = local * local * (3.0 - 2.0 * local);

  float z0 = mix(
    mix(hash13(cell), hash13(cell + vec3(1.0, 0.0, 0.0)), blend.x),
    mix(
      hash13(cell + vec3(0.0, 1.0, 0.0)),
      hash13(cell + vec3(1.0, 1.0, 0.0)),
      blend.x
    ),
    blend.y
  );
  float z1 = mix(
    mix(
      hash13(cell + vec3(0.0, 0.0, 1.0)),
      hash13(cell + vec3(1.0, 0.0, 1.0)),
      blend.x
    ),
    mix(
      hash13(cell + vec3(0.0, 1.0, 1.0)),
      hash13(cell + vec3(1.0, 1.0, 1.0)),
      blend.x
    ),
    blend.y
  );

  return mix(z0, z1, blend.z);
}

// Sums four 2D noise octaves; this legacy variant is not amplitude-normalized.
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

// Sums and normalizes the requested number of 2D noise octaves.
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

// Sums and normalizes the requested number of 3D noise octaves.
float fbm(vec3 p, int octaves) {
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

// Samples normalized 3D fBm using five octaves.
float fbm(vec3 p) {
  return fbm(p, 5);
}

// Folds 2D value noise into sharp ridges with a nominal [0, 1] range.
float ridgedNoise(vec2 p) {
  return 1.0 - abs(noise(p) * 2.0 - 1.0);
}

// Sums and normalizes five octaves of ridged 2D noise.
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

// Displaces p through two fBm stages, scaling the resulting offset by amount.
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

// Approximates a divergence-free vector field from 2D noise derivatives.
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
