export const TAU = Math.PI * 2;

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function wrap(value, min, max) {
  const range = max - min;
  if (range === 0) return min;
  let result = (value - min) % range;
  if (result < 0) result += range;
  return result + min;
}

export function distanceSquared(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

export function angleDifference(target, source) {
  let diff = target - source;
  while (diff > Math.PI) diff -= TAU;
  while (diff < -Math.PI) diff += TAU;
  return diff;
}

export function wrapAngle(angle) {
  while (angle <= -Math.PI) angle += TAU;
  while (angle > Math.PI) angle -= TAU;
  return angle;
}

export function rotateVector(vector, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: vector.x * cos - vector.y * sin,
    y: vector.x * sin + vector.y * cos,
  };
}

export function normalize(vector) {
  const length = Math.hypot(vector.x, vector.y);
  if (length === 0) {
    return { x: 1, y: 0 };
  }
  return { x: vector.x / length, y: vector.y / length };
}

export function scale(vector, scalar) {
  return { x: vector.x * scalar, y: vector.y * scalar };
}

export function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function subtract(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function length(vector) {
  return Math.hypot(vector.x, vector.y);
}

export function setLength(vector, newLength) {
  const current = length(vector);
  if (current === 0) {
    return { x: newLength, y: 0 };
  }
  const scaleFactor = newLength / current;
  return { x: vector.x * scaleFactor, y: vector.y * scaleFactor };
}

export function directionFromAngle(angle) {
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

export function angleFromDirection(vector) {
  return Math.atan2(vector.y, vector.x);
}
