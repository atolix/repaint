#version 300 es

precision highp float;

uniform sampler2D u_scene;

#include "../lib/uniforms.glsl"
#include "../lib/util.glsl"
#include "../lib/debug.glsl"

out vec4 outColor;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec3 color = texture(u_scene, uv).rgb;
  vec2 centered = uv - 0.5;
  float distanceFromCenter = dot(centered, centered);
  float vignette = smoothstep(0.65, 0.18, distanceFromCenter);

  color *= vignette;

  outColor = vec4(color, 1.0);
}
