#version 300 es

precision highp float;

uniform sampler2D u_scene;

#include "../lib/uniforms.glsl"
#include "../lib/util.glsl"
#include "../lib/debug.glsl"

out vec4 outColor;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 direction = uv - 0.5;
  vec2 offset = direction * 0.012;

  float red = texture(u_scene, uv + offset).r;
  float green = texture(u_scene, uv).g;
  float blue = texture(u_scene, uv - offset).b;

  outColor = vec4(red, green, blue, 1.0);
}
