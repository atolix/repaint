#version 300 es

precision highp float;

uniform sampler2D u_scene;

#include "../lib/uniforms.glsl"
#include "../lib/util.glsl"
#include "../lib/debug.glsl"

out vec4 outColor;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 pixelSize = vec2(8.0) / u_resolution;
  vec2 pixelUv = (floor(uv / pixelSize) + 0.5) * pixelSize;

  outColor = texture(u_scene, pixelUv);
}
