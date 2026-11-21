import { describe, expect, it } from "vitest";
import { createInitialState } from "../../src/domain/constants";
import {
  advanceMarket,
  computeDemand,
  exchangeIndex,
  fertilizerIndex,
  fuelIndex,
  growVillage,
} from "../../src/domain/market";

const initial = createInitialState(11);

describe("market", () => {
  it("prices the three pillars from indices", () => {
    expect(fertilizerIndex(initial.market)).toBe(1);
    expect(fuelIndex(initial.market)).toBe(1);
    expect(exchangeIndex(initial.market)).toBe(1);
  });

  it("computes connected household and workshop demand", () => {
    const demand = computeDemand(
      initial.village,
      initial.infrastructure,
      initial.market,
      initial.metrics,
      initial.clock,
    );

    expect(demand.household).toBeCloseTo(191.5, 1);
    expect(demand.workshop).toBeCloseTo(216, 1);
    expect(demand.total).toBeCloseTo(demand.household + demand.workshop);
    expect(demand.externalOffer).toBeCloseTo(
      demand.total * initial.market.privateShare * initial.market.externalSupplyFactor,
    );
    expect(demand.household).toBeGreaterThan(0);
  });

  it("raises connected demand with full coverage", () => {
    const low = computeDemand(
      initial.village,
      { ...initial.infrastructure, coverage: 0 },
      initial.market,
      initial.metrics,
      initial.clock,
    );

    const high = computeDemand(
      initial.village,
      { ...initial.infrastructure, coverage: 100 },
      initial.market,
      initial.metrics,
      initial.clock,
    );

    expect(high.household).toBeGreaterThan(low.household);
  });

  it("walks the market deterministically within bounds", () => {
    const summer = advanceMarket(initial.market, { year: 2022, month: 6, tick: 5 }, 3.2, 42);
    expect(summer.market.ricePrice).toBeGreaterThanOrEqual(9.5);
    expect(summer.market.ricePrice).toBeLessThanOrEqual(28);
    expect(summer.market.drought).toBeGreaterThan(0.5);
    expect(summer.market.drought).toBeLessThanOrEqual(1);
    expect(summer.seed).not.toBe(42);
  });

  it("handles every scripted drought year", () => {
    for (const year of [2022, 2023, 2024, 2025, 2026, 2027]) {
      for (const month of [2, 7]) {
        const step = advanceMarket(initial.market, { year, month, tick: 0 }, 4, year + month);
        expect(step.market.drought).toBeGreaterThanOrEqual(0);
        expect(step.market.drought).toBeLessThanOrEqual(1);
      }
    }
  });

  it("clamps stressed prices and exchange rates", () => {
    const stressed = advanceMarket(
      {
        ...initial.market,
        ricePrice: 40,
        fertilizerPrice: 30,
        fuelPrice: 60,
        exchangeRate: 1.5,
      },
      { year: 2025, month: 7, tick: 42 },
      20,
      5,
    );

    expect(stressed.market.ricePrice).toBeLessThanOrEqual(28);
    expect(stressed.market.fertilizerPrice).toBeLessThanOrEqual(16);
    expect(stressed.market.fuelPrice).toBeLessThanOrEqual(38);
    expect(stressed.market.exchangeRate).toBeLessThanOrEqual(1.24);
    expect(stressed.market.externalSupplyFactor).toBeGreaterThanOrEqual(0.62);
  });

  it("grows village demand annually", () => {
    const grown = growVillage(initial.village);
    expect(grown.householdsThousand).toBeGreaterThan(initial.village.householdsThousand);
    expect(grown.workshopsThousand).toBeGreaterThan(initial.village.workshopsThousand);
    expect(grown.remoteHouseholdsThousand).toBeGreaterThan(
      initial.village.remoteHouseholdsThousand,
    );
  });
});
