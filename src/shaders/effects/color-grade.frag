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
  vec3 shadows = vec3(0.92, 0.96, 1.08);
  vec3 highlights = vec3(1.08, 1.02, 0.92);
  float luma = dot(color, vec3(0.299, 0.587, 0.114));
  vec3 tint = mix(shadows, highlights, smoothstep(0.15, 0.9, luma));

  color *= tint;
  color = pow(color, vec3(0.95));

  outColor = vec4(color, 1.0);
}
