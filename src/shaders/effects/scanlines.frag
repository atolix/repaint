#version 300 es

precision highp float;

uniform sampler2D u_scene;
uniform float u_intensity;
uniform float u_frequency;

#include "../lib/uniforms.glsl"
#include "../lib/util.glsl"
#include "../lib/debug.glsl"

out vec4 outColor;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec3 color = texture(u_scene, uv).rgb;
  float line = sin(gl_FragCoord.y * u_frequency);
  float mask = mix(1.0 - u_intensity, 1.0, smoothstep(-0.2, 0.8, line));

  color *= mask;

  outColor = vec4(color, 1.0);
}
