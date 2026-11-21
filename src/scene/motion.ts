const APPROACH_EPSILON = 1e-4;
const SHARP_TURN_RADIANS = Math.PI / 5;
const SPEED_LOSS_ON_SHARP_TURN = 0.45;
const LANE_FADE_START_RADIANS = 0.04;
const LANE_FADE_END_RADIANS = 0.22;
const PUFF_FADE_IN_END = 0.16;
const PUFF_FADE_OUT_START = 0.45;

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const wrapUnit = (value: number): number => value - Math.floor(value);

export const wrapRange = (value: number, min: number, max: number): number => {
  const span = max - min;

  if (!(span > 0)) return min;
  const offset = value - min;

  return min + offset - Math.floor(offset / span) * span;
};

export const approach = (current: number, target: number, rate: number, delta: number): number => {
  if (!(delta > 0) || !(rate > 0)) return current;

  const blend = 1 - Math.exp(-rate * delta);
  const next = current + (target - current) * blend;

  return Math.abs(target - next) <= APPROACH_EPSILON ? target : next;
};

export const wrapAngle = (angle: number): number =>
  wrapRange(angle + Math.PI, 0, Math.PI * 2) - Math.PI;

export const approachAngle = (
  current: number,
  target: number,
  rate: number,
  delta: number,
): number => wrapAngle(current + approach(0, wrapAngle(target - current), rate, delta));

const smoothstep = (value: number): number => value * value * (3 - 2 * value);

export const curvatureSpeedFactor = (turnAngle: number): number => {
  const sharpness = clamp(Math.abs(turnAngle) / SHARP_TURN_RADIANS, 0, 1);

  return 1 - SPEED_LOSS_ON_SHARP_TURN * smoothstep(sharpness);
};

export const laneFactor = (turnAngle: number): number => {
  const sharpness = clamp(
    (Math.abs(turnAngle) - LANE_FADE_START_RADIANS) /
      (LANE_FADE_END_RADIANS - LANE_FADE_START_RADIANS),
    0,
    1,
  );

  return 1 - smoothstep(sharpness);
};

export const planarTurnAngle = (fromX: number, fromZ: number, toX: number, toZ: number): number =>
  Math.atan2(fromX * toZ - fromZ * toX, fromX * toX + fromZ * toZ);

export const puffProgress = (time: number, phase: number, cycleSeconds: number): number => {
  if (!(cycleSeconds > 0)) return 0;

  return wrapUnit(time / cycleSeconds + phase);
};

export const puffFade = (progress: number): number => {
  const clamped = clamp(progress, 0, 1);
  const fadeIn = smoothstep(clamp(clamped / PUFF_FADE_IN_END, 0, 1));

  const fadeOut =
    1 - smoothstep(clamp((clamped - PUFF_FADE_OUT_START) / (1 - PUFF_FADE_OUT_START), 0, 1));

  return clamp(fadeIn * fadeOut, 0, 1);
};

export const puffScale = (progress: number, from: number, to: number): number =>
  from + (to - from) * clamp(progress, 0, 1);
