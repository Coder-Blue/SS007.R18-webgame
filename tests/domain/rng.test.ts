import { describe, expect, it } from "vitest";
import { chance, nextRandom, pick, randomBetween, randomInt } from "../../src/domain/rng";

describe("rng", () => {
  it("is deterministic for a seed", () => {
    expect(nextRandom(1)).toEqual(nextRandom(1));
    expect(nextRandom(1).value).not.toBe(nextRandom(2).value);
  });

  it("threads the seed through bounded draws", () => {
    const between = randomBetween(3, 5, 9);

    expect(between.value).toBeGreaterThanOrEqual(5);
    expect(between.value).toBeLessThan(9);
    expect(between.seed).not.toBe(3);

    const integer = randomInt(3, 1, 4);

    expect(Number.isInteger(integer.value)).toBe(true);
    expect(integer.value).toBeGreaterThanOrEqual(1);
    expect(integer.value).toBeLessThanOrEqual(4);
  });

  it("picks an item and rejects an empty collection", () => {
    const picked = pick(1, ["a", "b", "c"]);

    expect(["a", "b", "c"]).toContain(picked.value);
    expect(() => pick(1, [])).toThrow("pick: empty collection");
  });

  it("returns deterministic booleans", () => {
    expect(chance(1, 0).value).toBe(false);
    expect(chance(1, 1).value).toBe(true);
  });
});
