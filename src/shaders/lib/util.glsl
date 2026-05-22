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

vec2 rotate2D(vec2 p, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c) * p;
}

vec2 getScreenUV() {
  return gl_FragCoord.xy / u_resolution;
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

float circleMask(vec2 uv, float radius, float softness) {
  return 1.0 - smoothstep(radius - softness, radius, length(uv));
}

float luminance(vec3 color) {
  return dot(color, vec3(0.2126, 0.7152, 0.0722));
}
