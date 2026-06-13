#version 300 es

precision highp float;

uniform sampler2D u_scene;

#include "../lib/uniforms.glsl"
#include "../lib/util.glsl"
#include "../lib/debug.glsl"

out vec4 outColor;

float sampleLuma(vec2 uv, vec2 offset) {
  return luminance(texture(u_scene, uv + offset / u_resolution).rgb);
}

void main() {
  vec2 uv = getScreenUV();

  float tl = sampleLuma(uv, vec2(-1.0, 1.0));
  float t = sampleLuma(uv, vec2(0.0, 1.0));
  float tr = sampleLuma(uv, vec2(1.0, 1.0));
  float l = sampleLuma(uv, vec2(-1.0, 0.0));
  float r = sampleLuma(uv, vec2(1.0, 0.0));
  float bl = sampleLuma(uv, vec2(-1.0, -1.0));
  float b = sampleLuma(uv, vec2(0.0, -1.0));
  float br = sampleLuma(uv, vec2(1.0, -1.0));

  float gx = -tl - 2.0 * l - bl + tr + 2.0 * r + br;
  float gy = -bl - 2.0 * b - br + tl + 2.0 * t + tr;
  float edge = smoothstep(0.08, 0.34, length(vec2(gx, gy)));
  vec3 color = texture(u_scene, uv).rgb;

  color = mix(color * 0.45, vec3(edge), 0.72);

  outColor = vec4(saturate(color), 1.0);
}
