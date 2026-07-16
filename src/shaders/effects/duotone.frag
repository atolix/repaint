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
  float tone = smoothstep(0.08, 0.92, luminance(color));
  vec3 shadow = vec3(0.08, 0.12, 0.28);
  vec3 highlight = vec3(1.0, 0.72, 0.28);

  outColor = vec4(mix(shadow, highlight, tone), 1.0);
}
