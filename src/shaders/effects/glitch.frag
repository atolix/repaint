#version 300 es

precision highp float;

uniform sampler2D u_scene;

#include "../lib/uniforms.glsl"
#include "../lib/util.glsl"
#include "../lib/debug.glsl"

out vec4 outColor;

float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float row = floor(gl_FragCoord.y / 12.0);
  float shiftNoise = hash(row + floor(u_time * 12.0));
  float active = step(0.82, shiftNoise);
  float shift = (shiftNoise - 0.5) * 0.08 * active;
  vec2 shiftedUv = vec2(fract(uv.x + shift), uv.y);
  vec3 color = texture(u_scene, shiftedUv).rgb;

  outColor = vec4(color, 1.0);
}
