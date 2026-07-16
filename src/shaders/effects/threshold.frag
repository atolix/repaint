#version 300 es

precision highp float;

uniform sampler2D u_scene;

#include "../lib/uniforms.glsl"
#include "../lib/util.glsl"
#include "../lib/color.glsl"
#include "../lib/debug.glsl"

out vec4 outColor;

void main() {
  vec2 uv = getScreenUV();
  vec3 color = texture(u_scene, uv).rgb;
  float mask = step(0.5, luminance(color));

  outColor = vec4(vec3(mask), 1.0);
}
