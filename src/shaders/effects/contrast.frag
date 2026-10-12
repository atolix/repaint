#version 300 es

precision highp float;

uniform sampler2D u_scene;
uniform float u_contrast;

#include "../lib/uniforms.glsl"
#include "../lib/util.glsl"
#include "../lib/color.glsl"
#include "../lib/debug.glsl"

out vec4 outColor;

void main() {
  vec2 uv = getScreenUV();
  vec3 color = texture(u_scene, uv).rgb;

  outColor = debugOutput(vec4(saturate(contrast(color, u_contrast)), 1.0));
}
