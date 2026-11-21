export interface RngStep {
  readonly value: number;
  readonly seed: number;
}

// mulberry32: one integer state, deterministic across platforms and runs.
export const nextRandom = (seed: number): RngStep => {
  const nextSeed = (seed + 0x6d2b79f5) | 0;
  let t = nextSeed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  return { value, seed: nextSeed };
};

export const randomBetween = (
  seed: number,
  min: number,
  max: number,
): { readonly value: number; readonly seed: number } => {
  const step = nextRandom(seed);
  return { value: min + step.value * (max - min), seed: step.seed };
};

export const randomInt = (
  seed: number,
  min: number,
  max: number,
): { readonly value: number; readonly seed: number } => {
  const step = randomBetween(seed, min, max + 1);
  return { value: Math.floor(step.value), seed: step.seed };
};

export const pick = <T>(
  seed: number,
  items: readonly T[],
): { readonly value: T; readonly seed: number } => {
  const step = randomInt(seed, 0, items.length - 1);
  const value = items[step.value];
  if (value === undefined) {
    throw new Error("pick: empty collection");
  }
  return { value, seed: step.seed };
};

export const chance = (
  seed: number,
  probability: number,
): { readonly value: boolean; readonly seed: number } => {
  const step = nextRandom(seed);
  return { value: step.value < probability, seed: step.seed };
};
