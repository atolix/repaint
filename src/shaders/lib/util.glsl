const float PI = 3.14159265359;
const float TAU = 6.28318530718;

float saturate(float value) {
  return clamp(value, 0.0, 1.0);
}

vec2 saturate(vec2 value) {
  return clamp(value, 0.0, 1.0);
}

vec3 saturate(vec3 value) {
  return clamp(value, 0.0, 1.0);
}

float remap(float value, float inMin, float inMax, float outMin, float outMax) {
  float t = (value - inMin) / (inMax - inMin);
  return mix(outMin, outMax, t);
}

float remap01(float value, float inMin, float inMax) {
  return saturate((value - inMin) / (inMax - inMin));
}

float remapClamped(float value, float inMin, float inMax, float outMin, float outMax) {
  return mix(outMin, outMax, remap01(value, inMin, inMax));
}

vec2 safeNormalize(vec2 value) {
  float len = length(value);
  return len > 0.00001 ? value / len : vec2(0.0);
}

vec3 safeNormalize(vec3 value) {
  float len = length(value);
  return len > 0.00001 ? value / len : vec3(0.0);
}

vec2 rotate2D(vec2 p, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c) * p;
}

vec2 getScreenUV() {
  return gl_FragCoord.xy / u_resolution;
}

vec2 getPixelSize() {
  return 1.0 / u_resolution;
}

vec2 getPixelUV() {
  return (floor(gl_FragCoord.xy) + 0.5) / u_resolution;
}

vec2 getCenteredUV() {
  return getScreenUV() - 0.5;
}

vec2 aspectCorrect(vec2 uv) {
  uv.x *= u_resolution.x / u_resolution.y;
  return uv;
}

vec2 getUV() {
  return aspectCorrect(getCenteredUV());
}

vec2 toPolar(vec2 p) {
  return vec2(length(p), atan(p.y, p.x));
}

vec2 fromPolar(float radius, float angle) {
  return vec2(cos(angle), sin(angle)) * radius;
}

vec2 barrelDistort(vec2 uv, float amount) {
  vec2 centered = uv - 0.5;
  float radius2 = dot(centered, centered);
  return 0.5 + centered * (1.0 + amount * radius2);
}

float circleMask(vec2 uv, float radius, float softness) {
  return 1.0 - smoothstep(radius - softness, radius, length(uv));
}

float luminance(vec3 color) {
  return dot(color, vec3(0.2126, 0.7152, 0.0722));
}
