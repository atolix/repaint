#version 300 es

precision highp float;

#include "./lib/uniforms.glsl"
#include "./lib/util.glsl"
#include "./lib/noise.glsl"
#include "./lib/debug.glsl"

out vec4 outColor;

void main() {
  vec2 uv = getUV();
  float d = length(uv);
  vec3 color = vec3(uv, 0.5 + 0.5 * sin(u_time));
  if (u_debugMode == 1) color = debugUV(uv);
  if (u_debugMode == 2) color = debugDistance(d);
  if (u_debugMode == 3) color = debugGrid(uv);
  outColor = vec4(color, 1.0);
}
