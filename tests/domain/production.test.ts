import { describe, expect, it } from "vitest";
import { createInitialState } from "../../src/domain/constants";
import {
  computeProduction,
  fleetCost,
  productionCostPerTonne,
  roadMaintenanceCost,
  staffCost,
} from "../../src/domain/production";

const initial = createInitialState();

describe("production", () => {
  it("produces from hydro and mechanized paddies", () => {
    const result = computeProduction(initial.production, initial.market, initial.metrics);
    expect(result.hydro).toBeGreaterThan(0);
    expect(result.mechanized).toBeGreaterThan(0);
    expect(result.ownProduction).toBeCloseTo(result.hydro + result.mechanized);
    expect(result.productionCost).toBeCloseTo(result.ownProduction * result.costPerTonne);
  });

  it("drought reduces hydro output", () => {
    const dry = computeProduction(
      initial.production,
      { ...initial.market, drought: 1 },
      initial.metrics,
    );
    expect(dry.hydro).toBeLessThan(initial.production.hydroPaddies * 24);
  });

  it("fertilizer and fuel increase production cost", () => {
    const cheap = productionCostPerTonne(initial.market, 0);
    const expensive = productionCostPerTonne(
      { ...initial.market, fertilizerPrice: 14, fuelPrice: 32 },
      0,
    );
    expect(expensive).toBeGreaterThan(cheap);
    expect(productionCostPerTonne(initial.market, 3)).toBeLessThan(cheap);
  });

  it("clamps the fertilizer harvest factor at its floor", () => {
    const result = computeProduction(
      initial.production,
      { ...initial.market, fertilizerPrice: 20 },
      initial.metrics,
    );
    expect(result.mechanized).toBeGreaterThan(0);
  });

  it("clamps industrial demand influence on mechanized paddies", () => {
    const low = computeProduction(initial.production, initial.market, {
      ...initial.metrics,
      industrialOutput: 0,
    });
    const high = computeProduction(initial.production, initial.market, {
      ...initial.metrics,
      industrialOutput: 400,
    });
    expect(high.mechanized).toBeGreaterThan(low.mechanized);
  });

  it("calculates road, fleet and staff costs", () => {
    expect(roadMaintenanceCost(100, 100, 100)).toBeCloseTo(12 + 28 + 50);
    expect(roadMaintenanceCost(0, 0, 0)).toBe(0);
    expect(fleetCost(100, initial.market)).toBeCloseTo(38);
    expect(staffCost(10)).toBe(310);
  });
});
