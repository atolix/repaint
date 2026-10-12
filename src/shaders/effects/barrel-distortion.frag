#version 300 es

precision highp float;

uniform sampler2D u_scene;
uniform float u_strength;

#include "../lib/uniforms.glsl"
#include "../lib/util.glsl"
#include "../lib/debug.glsl"

out vec4 outColor;

void main() {
  vec2 uv = getScreenUV();
  vec2 distortedUv = barrelDistort(uv, u_strength);
  float bounds = step(0.0, distortedUv.x)
    * step(distortedUv.x, 1.0)
    * step(0.0, distortedUv.y)
    * step(distortedUv.y, 1.0);
  vec3 color = texture(u_scene, saturate(distortedUv)).rgb;

  outColor = debugOutput(vec4(color * bounds, 1.0));
}
