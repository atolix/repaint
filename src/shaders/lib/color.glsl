// Converts normalized RGB to grayscale while preserving perceived luminance.
vec3 grayscale(vec3 color) {
  return vec3(luminance(color));
}

// Adds amount to every RGB channel; the result is not clamped.
vec3 brightness(vec3 color, float amount) {
  return color + amount;
}

// Scales colorfulness around grayscale: 0 is gray and 1 is unchanged.
vec3 saturation(vec3 color, float amount) {
  return mix(grayscale(color), color, amount);
}

// Multiplies toward tintColor; amount is clamped to [0, 1].
vec3 tint(vec3 color, vec3 tintColor, float amount) {
  return mix(color, color * tintColor, saturate(amount));
}

// Scales contrast around middle gray (0.5); 1 leaves the color unchanged.
vec3 contrast(vec3 color, float amount) {
  return (color - 0.5) * amount + 0.5;
}

// Adjusts linear RGB exposure in photographic stops.
vec3 exposure(vec3 color, float stops) {
  return color * exp2(stops);
}

// Applies a simple power-law display correction; gamma must be positive.
vec3 gammaCorrect(vec3 color, float gamma) {
  return pow(max(color, vec3(0.0)), vec3(1.0 / gamma));
}

// Remaps blackPoint..whitePoint to [0, 1], then applies gamma correction.
vec3 levels(vec3 color, float blackPoint, float whitePoint, float gamma) {
  vec3 leveled = saturate((color - blackPoint) / max(whitePoint - blackPoint, 0.0001));
  return pow(leveled, vec3(1.0 / max(gamma, 0.0001)));
}

// Encodes non-negative linear RGB with the standard sRGB transfer function.
vec3 linearToSrgb(vec3 color) {
  vec3 value = max(color, vec3(0.0));
  vec3 low = value * 12.92;
  vec3 high = 1.055 * pow(value, vec3(1.0 / 2.4)) - 0.055;
  return mix(low, high, step(vec3(0.0031308), value));
}

// Decodes non-negative sRGB with the standard linear-light transfer function.
vec3 srgbToLinear(vec3 color) {
  vec3 value = max(color, vec3(0.0));
  vec3 low = value / 12.92;
  vec3 high = pow((value + 0.055) / 1.055, vec3(2.4));
  return mix(low, high, step(vec3(0.04045), value));
}

// Rotates RGB hue by angle radians around the neutral gray axis.
vec3 hueShift(vec3 color, float angle) {
  const vec3 k = vec3(0.57735);
  float c = cos(angle);
  return color * c + cross(k, color) * sin(angle) + k * dot(k, color) * (1.0 - c);
}

// Converts normalized RGB to HSV, with hue wrapped to [0, 1].
vec3 rgbToHsv(vec3 color) {
  vec4 k = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(color.bg, k.wz), vec4(color.gb, k.xy), step(color.b, color.g));
  vec4 q = mix(vec4(p.xyw, color.r), vec4(color.r, p.yzx), step(p.x, color.r));
  float d = q.x - min(q.w, q.y);
  float e = 0.0000001;

  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

// Converts HSV to RGB; hue wraps naturally and saturation/value are not clamped.
vec3 hsvToRgb(vec3 color) {
  vec3 p = abs(fract(color.xxx + vec3(0.0, 2.0 / 3.0, 1.0 / 3.0)) * 6.0 - 3.0);
  return color.z * mix(vec3(1.0), saturate(p - 1.0), color.y);
}

// Applies the multiply blend mode to normalized RGB colors.
vec3 blendMultiply(vec3 base, vec3 blend) {
  return base * blend;
}

// Applies the screen blend mode to normalized RGB colors.
vec3 blendScreen(vec3 base, vec3 blend) {
  return 1.0 - (1.0 - base) * (1.0 - blend);
}

// Applies overlay, choosing multiply or screen from each base channel.
vec3 blendOverlay(vec3 base, vec3 blend) {
  vec3 low = 2.0 * base * blend;
  vec3 high = 1.0 - 2.0 * (1.0 - base) * (1.0 - blend);
  return mix(low, high, step(vec3(0.5), base));
}

// Applies a polynomial soft-light approximation to normalized RGB colors.
vec3 blendSoftLight(vec3 base, vec3 blend) {
  return (1.0 - 2.0 * blend) * base * base + 2.0 * blend * base;
}

// Produces a cosine palette: offset a, amplitude b, frequency c, phase d.
vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318 * (c * t + d));
}
