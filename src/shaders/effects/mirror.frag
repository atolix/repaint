#version 300 es

precision highp float;

uniform sampler2D u_scene;

#include "../lib/uniforms.glsl"
#include "../lib/util.glsl"
#include "../lib/debug.glsl"

out vec4 outColor;

void main() {
  vec2 uv = getScreenUV();

  uv.x = 1.0 - abs(uv.x * 2.0 - 1.0);

  outColor = texture(u_scene, uv);
}
