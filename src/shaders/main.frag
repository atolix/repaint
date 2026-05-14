#version 300 es

precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;

out vec4 outColor;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;

    vec3 color = vec3(uv, 0.5 + 0.5 * sin(u_time));

    outColor = vec4(color, 1.0);
}
