const float PI = 3.14159265359;
const float TAU = 6.28318530718;

// Clamps a scalar to the normalized range [0, 1].
float saturate(float value) {
  return clamp(value, 0.0, 1.0);
}

// Clamps both components to the normalized range [0, 1].
vec2 saturate(vec2 value) {
  return clamp(value, 0.0, 1.0);
}

// Clamps all three components to the normalized range [0, 1].
vec3 saturate(vec3 value) {
  return clamp(value, 0.0, 1.0);
}

// Maps a scalar from one range into another without clamping.
float remap(float value, float inMin, float inMax, float outMin, float outMax) {
  float t = (value - inMin) / (inMax - inMin);
  return mix(outMin, outMax, t);
}

// Maps a scalar from the input range into [0, 1] and clamps the result.
float remap01(float value, float inMin, float inMax) {
  return saturate((value - inMin) / (inMax - inMin));
}

// Maps a scalar into the output range after clamping its normalized position.
float remapClamped(float value, float inMin, float inMax, float outMin, float outMax) {
  return mix(outMin, outMax, remap01(value, inMin, inMax));
}

// Normalizes a 2D vector, returning zero when its length is nearly zero.
vec2 safeNormalize(vec2 value) {
  float len = length(value);
  return len > 0.00001 ? value / len : vec2(0.0);
}

// Normalizes a 3D vector, returning zero when its length is nearly zero.
vec3 safeNormalize(vec3 value) {
  float len = length(value);
  return len > 0.00001 ? value / len : vec3(0.0);
}

// Rotates a point around the origin by an angle in radians.
vec2 rotate2D(vec2 p, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c) * p;
}

// Rotates a point around an arbitrary center by an angle in radians.
vec2 rotateAround(vec2 p, vec2 center, float angle) {
  return center + rotate2D(p - center, angle);
}

// Repeats space in mirrored, centered cells of the given 2D size.
vec2 mirrorRepeat(vec2 p, vec2 spacing) {
  vec2 safeSpacing = max(abs(spacing), vec2(0.00001));
  vec2 cell = floor(p / safeSpacing);
  vec2 local = mod(p, safeSpacing);
  vec2 mirrored = mix(local, safeSpacing - local, mod(cell, 2.0));
  return mirrored - safeSpacing * 0.5;
}

// Repeats space in mirrored, centered square cells.
vec2 mirrorRepeat(vec2 p, float spacing) {
  return mirrorRepeat(p, vec2(spacing));
}

// Folds a point into one angular sector around the origin.
vec2 polarRepeat(vec2 p, float repetitions) {
  float count = max(abs(repetitions), 1.0);
  float sector = TAU / count;
  float angle = mod(atan(p.y, p.x) + sector * 0.5, sector) - sector * 0.5;
  return vec2(cos(angle), sin(angle)) * length(p);
}

// Returns normalized screen coordinates from bottom-left 0 to top-right 1.
vec2 getScreenUV() {
  return gl_FragCoord.xy / u_resolution;
}

// Returns the UV size of one framebuffer pixel.
vec2 getPixelSize() {
  return 1.0 / u_resolution;
}

// Returns normalized coordinates at the center of the current pixel.
vec2 getPixelUV() {
  return (floor(gl_FragCoord.xy) + 0.5) / u_resolution;
}

// Returns screen coordinates centered on zero without aspect correction.
vec2 getCenteredUV() {
  return getScreenUV() - 0.5;
}

// Scales the horizontal axis so shapes retain their proportions.
vec2 aspectCorrect(vec2 uv) {
  uv.x *= u_resolution.x / u_resolution.y;
  return uv;
}

// Returns centered, aspect-corrected screen coordinates.
vec2 getUV() {
  return aspectCorrect(getCenteredUV());
}

// Converts a Cartesian point to radius and angle in radians.
vec2 toPolar(vec2 p) {
  return vec2(length(p), atan(p.y, p.x));
}

// Converts a radius and angle in radians back to Cartesian coordinates.
vec2 fromPolar(float radius, float angle) {
  return vec2(cos(angle), sin(angle)) * radius;
}

// Applies radial lens distortion to UV coordinates in the [0, 1] domain.
vec2 barrelDistort(vec2 uv, float amount) {
  vec2 centered = uv - 0.5;
  float radius2 = dot(centered, centered);
  return 0.5 + centered * (1.0 + amount * radius2);
}

// Returns a soft circular mask centered at the coordinate origin.
float circleMask(vec2 uv, float radius, float softness) {
  return 1.0 - smoothstep(radius - softness, radius, length(uv));
}

// Computes perceptual Rec. 709 luminance from an RGB color.
float luminance(vec3 color) {
  return dot(color, vec3(0.2126, 0.7152, 0.0722));
}
