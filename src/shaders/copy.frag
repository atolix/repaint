#version 300 es

precision highp float;

uniform sampler2D u_scene;
uniform vec2 u_resolution;

out vec4 outColor;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  outColor = texture(u_scene, uv);
}
