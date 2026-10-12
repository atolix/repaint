// Signed distance to a centered circle; negative values are inside.
float sdCircle(vec2 p, float radius) {
  return length(p) - radius;
}

// Signed distance to a centered ring whose total thickness is width.
float sdRing(vec2 p, float radius, float width) {
  return abs(length(p) - radius) - width * 0.5;
}

// Signed distance to a centered axis-aligned box defined by half extents.
float sdBox(vec2 p, vec2 halfSize) {
  vec2 d = abs(p) - halfSize;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

// Signed distance to a centered box with uniformly rounded corners.
float sdRoundedBox(vec2 p, vec2 halfSize, float radius) {
  vec2 q = abs(p) - halfSize + radius;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
}

// Unsigned distance from p to the finite segment a..b.
float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = saturate(dot(pa, ba) / dot(ba, ba));
  return length(pa - ba * h);
}

// Signed distance to a stroked segment whose total thickness is width.
float sdLine(vec2 p, vec2 a, vec2 b, float width) {
  return sdSegment(p, a, b) - width * 0.5;
}

// Signed distance to a centered regular hexagon; negative values are inside.
float sdHexagon(vec2 p, float radius) {
  const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
  p = abs(p);
  p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
  p -= vec2(clamp(p.x, -k.z * radius, k.z * radius), radius);
  return length(p) * sign(p.y);
}

// Converts signed distance to a hard binary fill mask.
float fill(float distance) {
  return 1.0 - step(0.0, distance);
}

// Converts signed distance to a fill mask softened outward by softness.
float fill(float distance, float softness) {
  return 1.0 - smoothstep(0.0, softness, distance);
}

// Converts signed distance to a derivative-based antialiased fill mask.
float fillAA(float distance) {
  float softness = max(fwidth(distance), 0.00001);
  return 1.0 - smoothstep(-softness, softness, distance);
}

// Creates a hard stroke extending width to either side of the zero contour.
float stroke(float distance, float width) {
  return 1.0 - step(width, abs(distance));
}

// Creates an outward-softened stroke around the zero contour.
float stroke(float distance, float width, float softness) {
  return 1.0 - smoothstep(width, width + softness, abs(distance));
}

// Creates a derivative-based antialiased stroke around the zero contour.
float strokeAA(float distance, float width) {
  float softness = max(fwidth(distance), 0.00001);
  return 1.0 - smoothstep(
    width - softness,
    width + softness,
    abs(distance)
  );
}

// Combines two signed-distance fields as a union.
float opUnion(float a, float b) {
  return min(a, b);
}

// Subtracts field b from field a.
float opSubtract(float a, float b) {
  return max(a, -b);
}

// Combines two signed-distance fields as an intersection.
float opIntersect(float a, float b) {
  return max(a, b);
}

// Blends a union over smoothing radius k; k must be positive.
float opSmoothUnion(float a, float b, float k) {
  float h = saturate(0.5 + 0.5 * (b - a) / k);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// Smoothly subtracts field b from field a over radius k.
float opSmoothSubtract(float a, float b, float k) {
  float h = saturate(0.5 - 0.5 * (b + a) / k);
  return mix(a, -b, h) + k * h * (1.0 - h);
}

// Blends an intersection over smoothing radius k; k must be positive.
float opSmoothIntersect(float a, float b, float k) {
  float h = saturate(0.5 - 0.5 * (b - a) / k);
  return mix(b, a, h) + k * h * (1.0 - h);
}

// Wraps p into a cell centered at zero with per-axis spacing.
vec2 repeat(vec2 p, vec2 spacing) {
  return mod(p + spacing * 0.5, spacing) - spacing * 0.5;
}

// Wraps p into a square cell centered at zero.
vec2 repeat(vec2 p, float spacing) {
  return repeat(p, vec2(spacing));
}
