const APPROACH_EPSILON = 1e-4;

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

export const smoothstep = (value: number): number => value * value * (3 - 2 * value);

export const puffProgress = (time: number, phase: number, cycleSeconds: number): number => {
  if (!(cycleSeconds > 0)) return 0;

  return wrapUnit(time / cycleSeconds + phase);
};

export const puffFade = (progress: number): number => {
  const clamped = clamp(progress, 0, 1);
  const fadeIn = smoothstep(clamp(clamped / 0.16, 0, 1));
  const fadeOut = 1 - smoothstep(clamp((clamped - 0.45) / 0.55, 0, 1));

  return clamp(fadeIn * fadeOut, 0, 1);
};

export const puffScale = (progress: number, from: number, to: number): number =>
  from + (to - from) * clamp(progress, 0, 1);
