#version 300 es

precision highp float;

#include "./lib/uniforms.glsl"
#include "./lib/util.glsl"
#include "./lib/noise.glsl"
#include "./lib/color.glsl"
#include "./lib/sdf.glsl"
#include "./lib/easing.glsl"
#include "./lib/debug.glsl"

out vec4 outColor;

void main() {
  vec2 screenUv = getScreenUV();
  vec2 uv = getUV();
  float d = length(uv);
  float pulse = 0.5 + 0.5 * sin(u_time);
  vec3 color = vec3(screenUv, pulse);
  if (u_debugMode == DEBUG_MODE_UV_COORDINATES) color = debugUV(uv);
  if (u_debugMode == DEBUG_MODE_RADIAL_DISTANCE) color = debugDistance(d);
  if (u_debugMode == DEBUG_MODE_UV_GRID) color = debugGrid(uv);
  outColor = debugOutput(vec4(color, 1.0));
}
