import { describe, expect, it } from "vitest";
import {
  aggregateAnnual,
  interestForMonth,
  managementCost,
  netWorth,
  pushAnnual,
  pushLedger,
  settleDebt,
  spend,
  spendable,
  transmissionCost,
} from "../../src/domain/finance";
import { baseState, ledger } from "./test-helpers";

const finance = () => baseState().finance;

describe("finance", () => {
  it("charges monthly interest on positive debt only", () => {
    expect(interestForMonth(12_000, 0.06)).toBeCloseTo(60);
    expect(interestForMonth(-10, 0.06)).toBe(0);
  });

  it("settles debt with a cash floor and repayment reserve", () => {
    expect(settleDebt(5_000, 10_000, 1_000)).toEqual({ cash: 6_000, debt: 10_000 });
    expect(settleDebt(5_000, 10_000, -7_000)).toEqual({ cash: 2_000, debt: 14_000 });
    expect(settleDebt(10_000, 4_000, 0)).toEqual({ cash: 6_000, debt: 0 });
    expect(settleDebt(6_000, 0, 0)).toEqual({ cash: 6_000, debt: 0 });
  });

  it("spends from cash before debt", () => {
    expect(spend({ ...finance(), cash: 5_000, debt: 10_000, debtLimit: 100_000 }, 2_000)).toEqual({
      cash: 3_000,
      debt: 10_000,
      amount: 2_000,
    });
    expect(spend({ ...finance(), cash: 1_000, debt: 10_000, debtLimit: 100_000 }, 3_000)).toEqual({
      cash: 0,
      debt: 12_000,
      amount: 3_000,
    });
    expect(spend({ ...finance(), cash: 1_000, debt: 99_000, debtLimit: 100_000 }, 5_000)).toEqual({
      cash: 1_000,
      debt: 99_000,
      amount: 0,
    });
    expect(spendable({ ...finance(), cash: 1_000, debt: 99_000, debtLimit: 100_000 })).toBe(2_000);
  });

  it("prices fixed management and transmission", () => {
    expect(managementCost(2_200)).toBeGreaterThan(420);
    expect(transmissionCost(1_000)).toBe(380);
  });

  it("keeps the ledger bounded and aggregates a year", () => {
    const rows = Array.from({ length: 121 }, (_, index) =>
      ledger({ tick: index, month: (index % 12) + 1, year: 2022 + Math.floor(index / 12) }),
    );

    const trimmed = pushLedger(rows, ledger({ tick: 200 }));

    expect(trimmed).toHaveLength(120);
    expect(trimmed.at(-1)?.tick).toBe(200);

    const report = aggregateAnnual(2022, rows);

    expect(report.year).toBe(2022);
    expect(report.revenue).toBeGreaterThan(0);
    expect(report.satisfactionAverage).toBeCloseTo(66);
  });

  it("handles an empty annual aggregate", () => {
    expect(aggregateAnnual(2022, []).coverage).toBe(0);
  });

  it("replaces an annual report and caps history at ten years", () => {
    const reports = Array.from({ length: 11 }, (_, index) =>
      aggregateAnnual(2015 + index, [ledger({ year: 2015 + index })]),
    );

    const replaced = pushAnnual(reports, aggregateAnnual(2022, [ledger({ revenueTotal: 99 })]));

    expect(replaced).toHaveLength(10);
    expect(replaced.find((row) => row.year === 2022)?.revenue).toBe(99);
    expect(replaced[0]?.year).toBe(2016);
  });

  it("computes net worth", () => {
    expect(netWorth({ ...finance(), cash: 5_000, debt: 2_000 })).toBe(3_000);
  });
});
