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
  vec2 direction = getCenteredUV();
  vec2 offset = direction * u_amount;

  float red = texture(u_scene, uv + offset).r;
  float green = texture(u_scene, uv).g;
  float blue = texture(u_scene, uv - offset).b;

  outColor = vec4(red, green, blue, 1.0);
}
