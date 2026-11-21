import { describe, expect, it } from "vitest";
import { chance, nextRandom, pick, randomBetween, randomInt } from "../../src/domain/rng";

describe("rng", () => {
  it("is deterministic for a seed", () => {
    expect(nextRandom(1)).toEqual(nextRandom(1));
    expect(nextRandom(1).value).not.toBe(nextRandom(2).value);
  });

  it("threads the seed through bounded draws", () => {
    const step = randomBetween(7, 2, 4);
    expect(step.value).toBeGreaterThanOrEqual(2);
    expect(step.value).toBeLessThan(4);
    const int = randomInt(7, 2, 4);
    expect(Number.isInteger(int.value)).toBe(true);
    expect(int.value).toBeGreaterThanOrEqual(2);
    expect(int.value).toBeLessThanOrEqual(4);
  });

  it("picks an item from a collection", () => {
    const picked = pick(3, ["a", "b", "c"]);
    expect(["a", "b", "c"]).toContain(picked.value);
    expect(picked.seed).toBeTypeOf("number");
  });

  it("throws when picking from an empty collection", () => {
    expect(() => pick(1, [])).toThrow("pick: empty collection");
  });

  it("reports a chance draw", () => {
    expect(chance(1, 1).value).toBe(true);
    expect(chance(1, 0).value).toBe(false);
  });
});
