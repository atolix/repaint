vec3 debugUV(vec2 uv) {
  return vec3(uv + 0.5, 0.0);
}

vec3 debugDistance(float d) {
  return vec3(d);
}

vec3 debugGrid(vec2 uv) {
  vec2 grid = fract(uv * 10.0);
  float line = step(grid.x, 0.05) + step(grid.y, 0.05);

  return vec3(line);
}
