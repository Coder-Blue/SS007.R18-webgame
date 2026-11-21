import { describe, expect, it } from "vitest";
import {
  approach,
  approachAngle,
  clamp,
  curvatureSpeedFactor,
  laneFactor,
  planarTurnAngle,
  puffFade,
  puffProgress,
  puffScale,
  wrapAngle,
  wrapRange,
  wrapUnit,
} from "../../src/scene/motion";

describe("scene motion", () => {
  describe("approach", () => {
    it("eases toward the target without overshooting", () => {
      const next = approach(0, 10, 4, 0.1);

      expect(next).toBeGreaterThan(0);
      expect(next).toBeLessThan(10);
    });

    it("matches one long step when split into equal steps", () => {
      const single = approach(0, 10, 4, 0.5);
      const split = approach(approach(0, 10, 4, 0.25), 10, 4, 0.25);

      expect(split).toBeCloseTo(single, 6);
    });

    it("snaps to the target when the remaining distance is negligible", () => {
      expect(approach(9.99999, 10, 5, 0.016)).toBe(10);
    });

    it("holds the current value without elapsed time or a positive rate", () => {
      expect(approach(2, 10, 4, 0)).toBe(2);
      expect(approach(2, 10, 0, 1)).toBe(2);
      expect(approach(2, 10, 4, -1)).toBe(2);
    });
  });

  describe("angles", () => {
    it("wraps into the signed half turn", () => {
      expect(wrapAngle(0)).toBe(0);
      expect(wrapAngle((3 * Math.PI) / 2)).toBeCloseTo(-Math.PI / 2);
      expect(wrapAngle((-3 * Math.PI) / 2)).toBeCloseTo(Math.PI / 2);
    });

    it("takes the short path when easing across the wrap point", () => {
      const next = approachAngle(3, -3, 4, 0.1);

      expect(next).toBeGreaterThan(3);
    });

    it("measures the signed planar turn between tangents", () => {
      expect(planarTurnAngle(1, 0, 0, 1)).toBeCloseTo(Math.PI / 2);
      expect(planarTurnAngle(1, 0, 0, -1)).toBeCloseTo(-Math.PI / 2);
      expect(planarTurnAngle(1, 0, 1, 0)).toBe(0);
    });
  });

  describe("curvature", () => {
    it("keeps full speed on a straight and caps the loss on a sharp turn", () => {
      expect(curvatureSpeedFactor(0)).toBe(1);
      expect(curvatureSpeedFactor(Math.PI / 5)).toBeCloseTo(0.55);
      expect(curvatureSpeedFactor(10)).toBeCloseTo(0.55);
    });

    it("slows monotonically as curvature grows", () => {
      const samples = [0, 0.1, 0.2, 0.4, 0.8].map((turn) => curvatureSpeedFactor(turn));

      for (let index = 1; index < samples.length; index += 1) {
        expect(samples[index] ?? 0).toBeLessThanOrEqual(samples[index - 1] ?? 0);
      }
    });

    it("keeps the lane offset on straights and collapses it on sharp turns", () => {
      expect(laneFactor(0)).toBe(1);
      expect(laneFactor(0.04)).toBe(1);
      expect(laneFactor(0.22)).toBe(0);
      expect(laneFactor(2)).toBe(0);
    });
  });

  describe("puff cycle", () => {
    it("wraps progress and applies per-stack phase offsets", () => {
      expect(puffProgress(0, 0, 2)).toBe(0);
      expect(puffProgress(1, 0, 2)).toBeCloseTo(0.5);
      expect(puffProgress(0, 0.5, 2)).toBeCloseTo(0.5);
      expect(puffProgress(5, 0.25, 2)).toBeCloseTo(0.75);
      expect(puffProgress(0, 1.25, 2)).toBeCloseTo(0.25);
    });

    it("returns the start of the cycle for an invalid duration", () => {
      expect(puffProgress(1, 0.25, 0)).toBe(0);
      expect(puffProgress(1, 0.25, -2)).toBe(0);
    });

    it("fades in and out before the cycle wraps", () => {
      expect(puffFade(0)).toBe(0);
      expect(puffFade(0.3)).toBe(1);
      expect(puffFade(1)).toBe(0);
      expect(puffFade(0.999)).toBeLessThan(0.01);
    });

    it("grows from the young to the old puff", () => {
      expect(puffScale(0, 0.5, 1.5)).toBe(0.5);
      expect(puffScale(0.5, 0.5, 1.5)).toBe(1);
      expect(puffScale(1, 0.5, 1.5)).toBe(1.5);
      expect(puffScale(2, 0.5, 1.5)).toBe(1.5);
    });
  });

  describe("wrapping", () => {
    it("wraps a unit interval", () => {
      expect(wrapUnit(0.25)).toBe(0.25);
      expect(wrapUnit(1.25)).toBeCloseTo(0.25);
      expect(wrapUnit(-0.25)).toBeCloseTo(0.75);
    });

    it("respawns rain near the top when it falls past the bottom", () => {
      expect(wrapRange(0.59, 0.6, 19)).toBeCloseTo(18.99);
      expect(wrapRange(18.99, 0.6, 19)).toBeCloseTo(18.99);
    });

    it("wraps horizontal drift across the rain field", () => {
      expect(wrapRange(15.01, -15, 15)).toBeCloseTo(-14.99);
      expect(wrapRange(-15.01, -15, 15)).toBeCloseTo(14.99);
    });

    it("falls back to the minimum for an empty range", () => {
      expect(wrapRange(5, 1, 1)).toBe(1);
      expect(wrapRange(5, 1, 0)).toBe(1);
    });

    it("clamps between bounds", () => {
      expect(clamp(-1, 0, 1)).toBe(0);
      expect(clamp(0.5, 0, 1)).toBe(0.5);
      expect(clamp(2, 0, 1)).toBe(1);
    });
  });
});
