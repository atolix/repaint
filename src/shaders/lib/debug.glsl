vec3 debugUV(vec2 uv) {
  return vec3(uv + 0.5, 0.0);
}

vec3 debugDistance(float d) {
  return vec3(d);
}

vec3 debugGrid(vec2 uv) {
  vec2 grid = fract(uv * 10.0);
  float line = step(grid.x, 0.05) + step(grid.y, 0.05);

  return vec3(line);
}

vec4 debugInvalidColor(vec4 color) {
  if (any(isnan(color))) return vec4(1.0, 0.0, 1.0, 1.0);
  if (any(isinf(color))) return vec4(0.0, 1.0, 1.0, 1.0);
  if (any(lessThan(color, vec4(0.0)))) return vec4(0.0, 0.25, 1.0, 1.0);
  if (any(greaterThan(color, vec4(1.0)))) return vec4(1.0, 0.8, 0.0, 1.0);
  return color;
}

vec4 debugOutput(vec4 color) {
  return u_debugMode == 5 ? debugInvalidColor(color) : color;
}
