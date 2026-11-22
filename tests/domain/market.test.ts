import { describe, expect, it } from "vitest";
import { advanceMarket, cheapestSupplier, peakDemandMw, zoneDemand } from "../../src/domain/market";
import { baseState } from "./test-helpers";

describe("market", () => {
  it("advances prices deterministically inside bounds", () => {
    const state = baseState();
    const first = advanceMarket(state.market, 1, state.metrics, 7);
    const again = advanceMarket(state.market, 1, state.metrics, 7);

    expect(first).toEqual(again);
    expect(first.market.fuelPriceIndex).toBeGreaterThanOrEqual(0.8);
    expect(first.market.fuelPriceIndex).toBeLessThanOrEqual(2.4);
    expect(first.market.drought).toBeGreaterThanOrEqual(0);
    expect(first.market.suppliers).toHaveLength(3);
  });

  it("keeps competing suppliers within a narrow band", () => {
    const state = baseState();
    const { market } = advanceMarket(state.market, 7, state.metrics, 11);
    const prices = market.suppliers.map((row) => row.priceVndPerKwh);

    expect(Math.max(...prices) - Math.min(...prices)).toBeLessThan(40);
    expect(cheapestSupplier(market)).toBe(Math.min(...prices));
  });

  it("weights zone demand by coverage, season and industrial output", () => {
    const state = baseState();
    const demand = zoneDemand(state.zones, state.market, state.metrics);

    expect(demand.total).toBeGreaterThan(0);
    expect(demand.urban).toBeGreaterThan(0);
    expect(demand.industrial).toBeGreaterThan(0);
    expect(demand.rural).toBeGreaterThan(0);
    expect(demand.connected).toBe(demand.total);
  });

  it("sets peak demand above average", () => {
    expect(peakDemandMw(1_000)).toBeCloseTo(1_150);
  });
});
