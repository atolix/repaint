float easeInQuad(float t) {
  return t * t;
}

float easeOutQuad(float t) {
  return t * (2.0 - t);
}

float easeInOutQuad(float t) {
  return t < 0.5 ? 2.0 * t * t : 1.0 - pow(-2.0 * t + 2.0, 2.0) * 0.5;
}

float easeInCubic(float t) {
  return t * t * t;
}

float easeOutCubic(float t) {
  return 1.0 - pow(1.0 - t, 3.0);
}

float easeInOutCubic(float t) {
  return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) * 0.5;
}

float easeInSine(float t) {
  return 1.0 - cos((t * 3.14159) * 0.5);
}

float easeOutSine(float t) {
  return sin((t * 3.14159) * 0.5);
}

float easeInOutSine(float t) {
  return -(cos(3.14159 * t) - 1.0) * 0.5;
}
