#version 300 es

precision highp float;

uniform sampler2D u_scene;

#include "../lib/uniforms.glsl"
#include "../lib/util.glsl"
#include "../lib/debug.glsl"

out vec4 outColor;

void main() {
  vec2 uv = getScreenUV();
  vec2 centered = uv - 0.5;
  float radius = length(centered);
  float falloff = smoothstep(0.72, 0.0, radius);
  float angle = falloff * 2.4;
  vec2 swirledUv = 0.5 + rotate2D(centered, angle);

  outColor = texture(u_scene, saturate(swirledUv));
}
