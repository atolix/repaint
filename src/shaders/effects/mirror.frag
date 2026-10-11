#version 300 es

precision highp float;

uniform sampler2D u_scene;
uniform float u_amount;

#include "../lib/uniforms.glsl"
#include "../lib/util.glsl"
#include "../lib/debug.glsl"

out vec4 outColor;

void main() {
  vec2 uv = getScreenUV();

  float mirroredX = 1.0 - abs(uv.x * 2.0 - 1.0);
  uv.x = mix(uv.x, mirroredX, u_amount);

  outColor = texture(u_scene, uv);
}
