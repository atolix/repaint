#include "./debug-modes.glsl"

// Visualizes centered UV coordinates by mapping -0.5..0.5 to red/green.
vec3 debugUV(vec2 uv) {
  return vec3(uv + 0.5, 0.0);
}

// Copies a scalar distance into RGB without remapping or clamping.
vec3 debugDistance(float d) {
  return vec3(d);
}

// Draws a 10-cell-per-unit grid in the current UV coordinate system.
vec3 debugGrid(vec2 uv) {
  vec2 grid = fract(uv * 10.0);
  float line = step(grid.x, 0.05) + step(grid.y, 0.05);

  return vec3(line);
}

// Marks NaN channels magenta and infinite channels cyan.
vec4 debugNonFiniteColor(vec4 color) {
  if (any(isnan(color))) return vec4(1.0, 0.0, 1.0, 1.0);
  if (any(isinf(color))) return vec4(0.0, 1.0, 1.0, 1.0);
  return color;
}

// Applies the selected final-output diagnostic to color.
vec4 debugOutput(vec4 color) {
  return u_debugMode == DEBUG_MODE_NON_FINITE_VALUES
    ? debugNonFiniteColor(color)
    : color;
}
