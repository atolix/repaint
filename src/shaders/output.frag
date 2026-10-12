#version 300 es

precision highp float;

#include "./lib/debug-modes.glsl"

uniform sampler2D u_scene;
uniform sampler2D u_originalScene;
uniform vec2 u_resolution;
uniform int u_debugMode;

out vec4 outColor;

float outputLuminance(vec3 color) {
  return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

vec3 heatmap(float value) {
  vec3 color = vec3(
    1.5 - abs(4.0 * value - 3.0),
    1.5 - abs(4.0 * value - 2.0),
    1.5 - abs(4.0 * value - 1.0)
  );
  return clamp(color, 0.0, 1.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec4 processed = texture(u_scene, uv);

  if (u_debugMode == DEBUG_MODE_LUMINANCE_HEATMAP) {
    outColor = vec4(heatmap(outputLuminance(processed.rgb)), 1.0);
    return;
  }

  if (u_debugMode == DEBUG_MODE_BEFORE_AFTER) {
    vec4 original = texture(u_originalScene, uv);
    outColor = uv.x < 0.5 ? original : processed;
    return;
  }

  outColor = processed;
}
