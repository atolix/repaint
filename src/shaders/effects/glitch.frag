#version 300 es

precision highp float;

uniform sampler2D u_scene;
uniform float u_strength;
uniform float u_speed;
uniform float u_bands;

#include "../lib/uniforms.glsl"
#include "../lib/util.glsl"
#include "../lib/noise.glsl"
#include "../lib/debug.glsl"

out vec4 outColor;

void main() {
  vec2 uv = getScreenUV();
  float band = floor(uv.y * u_bands);
  float gate = step(0.76, hash12(vec2(band, floor(u_time * u_speed))));
  float offset = (hash12(vec2(band, u_time)) - 0.5) * 0.08 * u_strength * gate;
  vec2 shiftedUv = saturate(uv + vec2(offset, 0.0));
  vec2 channelOffset = vec2(0.006 * u_strength * gate, 0.0);

  float red = texture(u_scene, saturate(shiftedUv + channelOffset)).r;
  float green = texture(u_scene, shiftedUv).g;
  float blue = texture(u_scene, saturate(shiftedUv - channelOffset)).b;
  float staticNoise = (hash12(gl_FragCoord.xy + u_time * 120.0) - 0.5)
    * 0.08 * u_strength * gate;

  outColor = vec4(saturate(vec3(red, green, blue) + staticNoise), 1.0);
}
