#version 300 es

precision highp float;

uniform sampler2D u_scene;
uniform float u_amplitude;
uniform float u_frequency;
uniform float u_speed;

#include "../lib/uniforms.glsl"
#include "../lib/util.glsl"
#include "../lib/debug.glsl"

out vec4 outColor;

void main() {
  vec2 uv = getScreenUV();
  vec2 wave = vec2(
    sin((uv.y * 18.0 * u_frequency) + u_time * 2.4 * u_speed),
    cos((uv.x * 14.0 * u_frequency) - u_time * 1.8 * u_speed)
  ) * u_amplitude;

  outColor = debugOutput(texture(u_scene, saturate(uv + wave)));
}
