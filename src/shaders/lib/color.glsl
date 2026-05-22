vec3 grayscale(vec3 color) {
  return vec3(luminance(color));
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

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318 * (c * t + d));
}
