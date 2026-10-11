#version 300 es

precision highp float;

uniform sampler2D u_scene;
uniform float u_levels;

#include "../lib/uniforms.glsl"
#include "../lib/util.glsl"
#include "../lib/debug.glsl"

out vec4 outColor;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec3 color = texture(u_scene, uv).rgb;
  float steps = max(1.0, u_levels - 1.0);
  color = floor(color * steps + 0.5) / steps;

  outColor = vec4(color, 1.0);
}
