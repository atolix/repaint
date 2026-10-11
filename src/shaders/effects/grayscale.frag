#version 300 es

precision highp float;

uniform sampler2D u_scene;
uniform float u_amount;

#include "../lib/uniforms.glsl"
#include "../lib/util.glsl"
#include "../lib/color.glsl"
#include "../lib/debug.glsl"

out vec4 outColor;

void main() {
  vec2 uv = getScreenUV();
  vec3 color = texture(u_scene, uv).rgb;

  outColor = vec4(mix(color, grayscale(color), u_amount), 1.0);
}
