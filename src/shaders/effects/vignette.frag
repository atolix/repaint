#version 300 es

precision highp float;

uniform sampler2D u_scene;

#include "../lib/uniforms.glsl"
#include "../lib/util.glsl"
#include "../lib/debug.glsl"

out vec4 outColor;

void main() {
  vec2 uv = getScreenUV();
  vec3 color = texture(u_scene, uv).rgb;
  float vignette = circleMask(getCenteredUV(), 0.806, 0.382);

  color *= vignette;

  outColor = vec4(color, 1.0);
}
