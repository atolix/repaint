// Quadratic acceleration for t in [0, 1]; input is not clamped.
float easeInQuad(float t) {
  return t * t;
}

// Quadratic deceleration for t in [0, 1]; input is not clamped.
float easeOutQuad(float t) {
  return t * (2.0 - t);
}

// Symmetric quadratic acceleration then deceleration for t in [0, 1].
float easeInOutQuad(float t) {
  return t < 0.5 ? 2.0 * t * t : 1.0 - pow(-2.0 * t + 2.0, 2.0) * 0.5;
}

// Cubic acceleration for t in [0, 1]; input is not clamped.
float easeInCubic(float t) {
  return t * t * t;
}

// Cubic deceleration for t in [0, 1]; input is not clamped.
float easeOutCubic(float t) {
  return 1.0 - pow(1.0 - t, 3.0);
}

// Symmetric cubic acceleration then deceleration for t in [0, 1].
float easeInOutCubic(float t) {
  return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) * 0.5;
}

// Sinusoidal acceleration for t in [0, 1]; input is not clamped.
float easeInSine(float t) {
  return 1.0 - cos((t * 3.14159) * 0.5);
}

// Sinusoidal deceleration for t in [0, 1]; input is not clamped.
float easeOutSine(float t) {
  return sin((t * 3.14159) * 0.5);
}

// Symmetric sinusoidal acceleration then deceleration for t in [0, 1].
float easeInOutSine(float t) {
  return -(cos(3.14159 * t) - 1.0) * 0.5;
}
