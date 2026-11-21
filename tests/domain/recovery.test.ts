import { describe, expect, it } from "vitest";
import { createInitialState } from "../../src/domain/constants";
import { recoveryFor, recoveryOf, recoveryRateCost } from "../../src/domain/recovery";

const initial = createInitialState();

const finance = {
  ...initial.finance,
  annualHistory: [
    {
      year: 2022,
      revenue: 40_000,
      costs: 60_000,
      netResult: -20_000,
      debtEnd: 40_000,
      coverage: 80,
      trustAverage: 60,
      satisfactionAverage: 60,
      reliability: 90,
      inflationAverage: 5,
    },
  ],
};

describe("recovery", () => {
  it("returns no credit before the reform or before 2024", () => {
    expect(recoveryFor(finance, 2024, 0.55, false).monthlyCredit).toBe(0);
    expect(recoveryFor(finance, 2023, 0.55, true).monthlyCredit).toBe(0);
    expect(recoveryFor(finance, 2025, 0.55, true).eligibleLoss).toBe(0);
  });

  it("credits the audited N-2 loss at the chosen rate", () => {
    const result = recoveryFor(finance, 2024, 0.55, true);
    expect(result.eligibleLoss).toBe(20_000);
    expect(result.eligibleYear).toBe(2022);
    expect(result.monthlyCredit).toBeCloseTo((20_000 * 0.55) / 12);
    expect(result.remaining).toBe(20_000);
  });

  it("stops when the eligible loss is exhausted", () => {
    const result = recoveryFor({ ...finance, recoveredTotal: 20_000 }, 2024, 0.55, true);
    expect(result.monthlyCredit).toBe(0);
    expect(result.remaining).toBe(0);
  });

  it("reads recovery from a game state", () => {
    const state = {
      ...initial,
      clock: { year: 2024, month: 3, tick: 26 },
      policy: { ...initial.policy, n2Enabled: true, n2Rate: 0.6 },
      finance: { ...initial.finance, annualHistory: finance.annualHistory },
    };

    expect(recoveryOf(state).rate).toBe(0.6);
    expect(recoveryOf(state).monthlyCredit).toBeCloseTo((20_000 * 0.6) / 12);
  });

  it("falls back to the default rate when the stored rate is zero", () => {
    const state = {
      ...initial,
      clock: { year: 2024, month: 3, tick: 26 },
      policy: { ...initial.policy, n2Rate: 0, n2Enabled: true },
      finance: { ...initial.finance, annualHistory: finance.annualHistory },
    };

    expect(recoveryOf(state).rate).toBe(0.55);
  });

  it("prices a higher recovery rate as a trust cost", () => {
    expect(recoveryRateCost(0.55)).toBe(0);
    expect(recoveryRateCost(0.8)).toBeCloseTo(6);
  });
});
