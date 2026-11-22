import { describe, expect, it } from "vitest";
import { recoveryOf } from "../../src/domain/recovery";
import { reformRevenue } from "../../src/domain/reforms";
import { baseState } from "./test-helpers";

describe("recovery", () => {
  it("has no credit without an eligible audited loss", () => {
    const state = baseState();

    expect(recoveryOf(state.finance, 2022, state.policy).monthlyCredit).toBe(0);
  });

  it("credits the two-year-old loss at the selected rate", () => {
    const state = baseState();

    const finance = {
      ...state.finance,
      annualHistory: [
        {
          year: 2022,
          revenue: 10,
          costs: 20,
          netResult: -12_000,
          debtEnd: 40_000,
          coverage: 80,
          trustAverage: 50,
          satisfactionAverage: 50,
          reliability: 100,
          inflationAverage: 3,
        },
      ],
    };

    const policy = { ...state.policy, n2Enabled: true, n2Rate: 0.5 };
    const credit = recoveryOf(finance, 2024, policy);

    expect(credit.eligibleLoss).toBe(12_000);
    expect(credit.monthlyCredit).toBe(500);
  });

  it("stops when the eligible loss is exhausted or disabled", () => {
    const state = baseState();

    const finance = {
      ...state.finance,
      recoveredTotal: 12_000,
      annualHistory: [
        {
          year: 2022,
          revenue: 10,
          costs: 20,
          netResult: -12_000,
          debtEnd: 40_000,
          coverage: 80,
          trustAverage: 50,
          satisfactionAverage: 50,
          reliability: 100,
          inflationAverage: 3,
        },
      ],
    };

    expect(recoveryOf(finance, 2024, { ...state.policy, n2Enabled: true }).monthlyCredit).toBe(0);
    expect(recoveryOf(finance, 2024, state.policy).monthlyCredit).toBe(0);
  });

  it("caps the credit at the remaining balance", () => {
    const state = baseState();

    const finance = {
      ...state.finance,
      recoveredTotal: 11_999,
      annualHistory: [
        {
          year: 2022,
          revenue: 10,
          costs: 20,
          netResult: -12_000,
          debtEnd: 40_000,
          coverage: 80,
          trustAverage: 50,
          satisfactionAverage: 50,
          reliability: 100,
          inflationAverage: 3,
        },
      ],
    };

    const credit = recoveryOf(finance, 2024, { ...state.policy, n2Enabled: true, n2Rate: 0.8 });

    expect(credit.monthlyCredit).toBe(1);
  });
});

describe("reforms", () => {
  it("pays wheeling revenue for each enabled reform", () => {
    const state = baseState();

    const full = reformRevenue({
      ...state.policy,
      dppa: true,
      vrem: true,
      nsmo: true,
      twoPartTariff: true,
    });

    expect(full.total).toBe(490);
  });

  it("pays nothing without authority or price cap", () => {
    const state = baseState();

    expect(reformRevenue(state.policy).total).toBe(0);
    expect(reformRevenue({ ...state.policy, dppa: true, branch: "private" }).total).toBe(0);
    expect(reformRevenue({ ...state.policy, dppa: true, priceCap: false }).total).toBe(0);
  });
});
