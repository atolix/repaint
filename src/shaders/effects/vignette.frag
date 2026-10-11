#version 300 es

precision highp float;

uniform sampler2D u_scene;
uniform float u_radius;
uniform float u_softness;

#include "../lib/uniforms.glsl"
#include "../lib/util.glsl"
#include "../lib/debug.glsl"

out vec4 outColor;

void main() {
  vec2 uv = getScreenUV();
  vec3 color = texture(u_scene, uv).rgb;
  float vignette = circleMask(getCenteredUV(), u_radius, u_softness);

  color *= vignette;

  outColor = vec4(color, 1.0);
}
