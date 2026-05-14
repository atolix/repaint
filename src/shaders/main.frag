#version 300 es

precision highp float;

#include "./lib/uniforms.glsl"
#include "./lib/util.glsl"
#include "./lib/debug.glsl"

out vec4 outColor;

void main() {
  vec2 uv = getUV();
  vec3 color = vec3(uv, 0.5 + 0.5 * sin(u_time));
  outColor = vec4(color, 1.0);
}
