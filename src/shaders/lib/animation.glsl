float loopTime(float time, float duration) {
  float safeDuration = max(abs(duration), 0.00001);
  return mod(time, safeDuration);
}

float pingPong(float time, float duration) {
  float safeDuration = max(abs(duration), 0.00001);
  float phase = loopTime(time, safeDuration) / safeDuration;
  return 1.0 - abs(phase * 2.0 - 1.0);
}

float pulse(float value, float center, float width) {
  float halfWidth = max(abs(width) * 0.5, 0.00001);
  return 1.0 - smoothstep(0.0, halfWidth, abs(value - center));
}
