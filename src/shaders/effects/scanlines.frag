#version 300 es

precision highp float;

uniform sampler2D u_scene;

#include "../lib/uniforms.glsl"
#include "../lib/util.glsl"
#include "../lib/debug.glsl"

out vec4 outColor;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec3 color = texture(u_scene, uv).rgb;
  float line = sin(gl_FragCoord.y * 3.14159265);
  float mask = mix(0.82, 1.0, smoothstep(-0.2, 0.8, line));

  color *= mask;

  outColor = vec4(color, 1.0);
}
