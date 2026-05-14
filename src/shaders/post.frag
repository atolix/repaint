#version 300 es

precision highp float;

uniform sampler2D u_scene;
uniform vec2 u_resolution;
uniform float u_time;

out vec4 outColor;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec3 color = texture(u_scene, uv).rgb;
  color = 1.0 - color;
  outColor = vec4(color, 1.0);
}
