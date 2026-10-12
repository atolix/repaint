#version 300 es

precision highp float;

uniform sampler2D u_scene;
uniform float u_angle;
uniform float u_radius;

#include "../lib/uniforms.glsl"
#include "../lib/util.glsl"
#include "../lib/debug.glsl"

out vec4 outColor;

void main() {
  vec2 uv = getScreenUV();
  vec2 centered = uv - 0.5;
  float radius = length(centered);
  float falloff = smoothstep(u_radius, 0.0, radius);
  float angle = falloff * u_angle;
  vec2 swirledUv = 0.5 + rotate2D(centered, angle);

  outColor = debugOutput(texture(u_scene, saturate(swirledUv)));
}
