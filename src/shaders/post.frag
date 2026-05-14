#version 300 es

precision highp float;

uniform sampler2D u_scene;

#include "./lib/uniforms.glsl"
#include "./lib/util.glsl"
#include "./lib/debug.glsl"

out vec4 outColor;

void main() {
  vec2 uv = getUV();
  vec3 color = texture(u_scene, uv).rgb;
  color = 1.0 - color;
  outColor = vec4(color, 1.0);
}
