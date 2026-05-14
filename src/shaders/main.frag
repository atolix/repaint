#version 300 es

precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform int u_debugMode;
uniform vec2 u_mouse;

out vec4 outColor;

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    uv -= 0.5;
    uv.x *= u_resolution.x / u_resolution.y;

    float d = length(uv);

    vec3 color = vec3(
        0.5 + 0.5 * cos(u_time + uv.xyx + vec3(0.0, 2.0, 4.0))
    );

    if (u_debugMode == 1) {
        // show uv
        color = vec3(uv + 0.5, 0.0);
    }

    if (u_debugMode == 2) {
        // show distance
        color = vec3(d);
    }

    if (u_debugMode == 3) {
        // show grid
        vec2 grid = fract(uv * 10.0);
        float line = step(grid.x, 0.05) + step(grid.y, 0.05);

        color = vec3(line);
    }

    outColor = vec4(color, 1.0);
}
