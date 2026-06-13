vec3 grayscale(vec3 color) {
  return vec3(luminance(color));
}

vec3 brightness(vec3 color, float amount) {
  return color + amount;
}

vec3 saturation(vec3 color, float amount) {
  return mix(grayscale(color), color, amount);
}

vec3 tint(vec3 color, vec3 tintColor, float amount) {
  return mix(color, color * tintColor, saturate(amount));
}

vec3 contrast(vec3 color, float amount) {
  return (color - 0.5) * amount + 0.5;
}

vec3 exposure(vec3 color, float stops) {
  return color * exp2(stops);
}

vec3 gammaCorrect(vec3 color, float gamma) {
  return pow(max(color, vec3(0.0)), vec3(1.0 / gamma));
}

vec3 levels(vec3 color, float blackPoint, float whitePoint, float gamma) {
  vec3 leveled = saturate((color - blackPoint) / max(whitePoint - blackPoint, 0.0001));
  return pow(leveled, vec3(1.0 / max(gamma, 0.0001)));
}

vec3 linearToSrgb(vec3 color) {
  return pow(max(color, vec3(0.0)), vec3(1.0 / 2.2));
}

vec3 srgbToLinear(vec3 color) {
  return pow(max(color, vec3(0.0)), vec3(2.2));
}

vec3 hueShift(vec3 color, float angle) {
  const vec3 k = vec3(0.57735);
  float c = cos(angle);
  return color * c + cross(k, color) * sin(angle) + k * dot(k, color) * (1.0 - c);
}

vec3 rgbToHsv(vec3 color) {
  vec4 k = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(color.bg, k.wz), vec4(color.gb, k.xy), step(color.b, color.g));
  vec4 q = mix(vec4(p.xyw, color.r), vec4(color.r, p.yzx), step(p.x, color.r));
  float d = q.x - min(q.w, q.y);
  float e = 0.0000001;

  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsvToRgb(vec3 color) {
  vec3 p = abs(fract(color.xxx + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
  return color.z * mix(vec3(1.0), saturate(p - 1.0), color.y);
}

vec3 blendMultiply(vec3 base, vec3 blend) {
  return base * blend;
}

vec3 blendScreen(vec3 base, vec3 blend) {
  return 1.0 - (1.0 - base) * (1.0 - blend);
}

vec3 blendOverlay(vec3 base, vec3 blend) {
  vec3 low = 2.0 * base * blend;
  vec3 high = 1.0 - 2.0 * (1.0 - base) * (1.0 - blend);
  return mix(low, high, step(vec3(0.5), base));
}

vec3 blendSoftLight(vec3 base, vec3 blend) {
  return (1.0 - 2.0 * blend) * base * base + 2.0 * blend * base;
}

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318 * (c * t + d));
}
