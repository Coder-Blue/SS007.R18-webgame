import { describe, expect, it } from "vitest";
import {
  availableCapacityMw,
  availableHydroMw,
  computeSupply,
  dispatchWithinCaps,
  reserveMargin,
  supplierCapacity,
} from "../../src/domain/production";
import { baseState } from "./test-helpers";

describe("production", () => {
  it("derives available hydro from reservoir and maintenance", () => {
    expect(availableHydroMw({ ...baseState().generation, reservoir: 100, maintenance: 100 })).toBe(
      963,
    );
    expect(availableHydroMw(baseState().generation)).toBeLessThan(900);
  });

  it("caps import at the supplier fleet", () => {
    const market = baseState().market;

    expect(supplierCapacity(market, 100)).toBe(100);
    expect(supplierCapacity(market, 10_000)).toBe(1_350);
  });

  it("computes dispatch, energy and variable cost", () => {
    const state = baseState();

    const supply = computeSupply(
      state.generation,
      { hydroMw: 500, thermalMw: 400, importMw: 150 },
      state.market,
      2_450,
    );

    expect(supply.output.hydroMw).toBeLessThanOrEqual(500);
    expect(supply.output.thermalMw).toBe(400);
    expect(supply.output.importMw).toBe(150);
    expect(supply.supplyMw).toBeGreaterThan(0);
    expect(supply.costSupplyVariable).toBeGreaterThan(0);
    expect(supply.output.hydroMillionKwh).toBeGreaterThan(0);
  });

  it("clamps dispatch to installed capacity", () => {
    const state = baseState();

    const capped = dispatchWithinCaps(
      { hydroMw: 99_999, thermalMw: -1, importMw: 99_999 },
      state.generation,
      state.market,
    );

    expect(capped.hydroMw).toBe(state.generation.hydroCapacityMw);
    expect(capped.thermalMw).toBe(0);
    expect(capped.importMw).toBe(500);
  });

  it("reports reserve margin against peak demand", () => {
    const state = baseState();

    expect(reserveMargin(state.generation, state.market, 0, 100)).toBe(100);
    expect(reserveMargin(state.generation, state.market, 10_000, 100)).toBeLessThan(0);
    expect(availableCapacityMw(state.generation, state.market, 100)).toBeGreaterThan(0);
  });
});
