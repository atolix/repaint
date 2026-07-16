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
  vec2 pixel = getPixelSize();
  vec3 low = texture(u_scene, uv - pixel).rgb;
  vec3 high = texture(u_scene, uv + pixel).rgb;
  float relief = luminance(high - low) * 2.8 + 0.5;
  vec3 base = texture(u_scene, uv).rgb;
  vec3 color = mix(vec3(relief), base * relief, 0.28);

  outColor = vec4(saturate(color), 1.0);
}
