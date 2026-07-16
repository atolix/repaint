#version 300 es

precision highp float;

uniform sampler2D u_scene;

#include "../lib/uniforms.glsl"
#include "../lib/util.glsl"
#include "../lib/debug.glsl"

out vec4 outColor;

void main() {
  vec2 uv = getScreenUV();
  vec2 wave = vec2(
    sin((uv.y * 18.0) + u_time * 2.4),
    cos((uv.x * 14.0) - u_time * 1.8)
  ) * 0.012;

  outColor = texture(u_scene, saturate(uv + wave));
}
