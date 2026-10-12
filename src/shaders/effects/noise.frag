#version 300 es

precision highp float;

uniform sampler2D u_scene;
uniform float u_amount;

#include "../lib/uniforms.glsl"
#include "../lib/util.glsl"
#include "../lib/noise.glsl"
#include "../lib/debug.glsl"

out vec4 outColor;

void main() {
  vec2 uv = getScreenUV();
  vec3 color = texture(u_scene, uv).rgb;
  float grain = hash12(gl_FragCoord.xy + u_time * 60.0) - 0.5;

  color += grain * u_amount;

  outColor = debugOutput(vec4(color, 1.0));
}
