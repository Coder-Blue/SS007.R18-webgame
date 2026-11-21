import { describe, expect, it } from "vitest";
import { createInitialState } from "../../src/domain/constants";
import {
  buildRoad,
  coverageGap,
  fleetUpgrade,
  logisticsEfficiency,
  roadQualityIndex,
} from "../../src/domain/infrastructure";

const initial = createInitialState();

describe("infrastructure", () => {
  it.each(["dirt", "cobble", "asphalt"] as const)(
    "builds a %s road with the expected cost and coverage",
    (grade) => {
      const result = buildRoad(initial.infrastructure, grade);
      expect(result.cost).toBeGreaterThan(0);
      expect(result.km).toBeGreaterThan(0);
      expect(result.infrastructure.coverage).toBeGreaterThan(initial.infrastructure.coverage);
      expect(result.infrastructure.remoteCoverage).toBeGreaterThan(
        initial.infrastructure.remoteCoverage,
      );
    },
  );

  it("never exceeds 100 percent coverage", () => {
    const result = buildRoad(
      { ...initial.infrastructure, coverage: 99, remoteCoverage: 99 },
      "asphalt",
    );

    expect(result.infrastructure.coverage).toBe(100);
    expect(result.infrastructure.remoteCoverage).toBe(100);
  });

  it("adds fleet capacity", () => {
    expect(fleetUpgrade(initial.infrastructure, 20).fleet).toBe(initial.infrastructure.fleet + 20);
  });

  it("measures coverage gaps", () => {
    expect(coverageGap(initial.infrastructure)).toBe(38 + 82);
    expect(coverageGap({ ...initial.infrastructure, coverage: 100, remoteCoverage: 100 })).toBe(0);
  });

  it("clamps logistics efficiency", () => {
    expect(logisticsEfficiency(120)).toBe(1);
    expect(logisticsEfficiency(0)).toBe(1.05);
    expect(logisticsEfficiency(1_000)).toBe(0.82);
  });

  it("computes a weighted road quality index and defaults empty networks", () => {
    expect(roadQualityIndex(initial.infrastructure)).toBeGreaterThan(0);
    expect(
      roadQualityIndex({
        dirtKm: 100,
        cobbleKm: 0,
        asphaltKm: 0,
        coverage: 0,
        remoteCoverage: 0,
        fleet: 0,
      }),
    ).toBeCloseTo(0.4);
    expect(
      roadQualityIndex({
        dirtKm: 0,
        cobbleKm: 100,
        asphaltKm: 0,
        coverage: 0,
        remoteCoverage: 0,
        fleet: 0,
      }),
    ).toBeCloseTo(0.7);
    expect(
      roadQualityIndex({
        dirtKm: 0,
        cobbleKm: 0,
        asphaltKm: 100,
        coverage: 0,
        remoteCoverage: 0,
        fleet: 0,
      }),
    ).toBeCloseTo(1);
    expect(
      roadQualityIndex({
        dirtKm: 0,
        cobbleKm: 0,
        asphaltKm: 0,
        coverage: 0,
        remoteCoverage: 0,
        fleet: 0,
      }),
    ).toBeCloseTo(0.4);
  });
});
