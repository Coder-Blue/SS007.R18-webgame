import { describe, expect, it } from "vitest";
import {
  aggregateAnnual,
  interestForMonth,
  netWorth,
  pushAnnual,
  pushLedger,
  settleDebt,
  spend,
  spendable,
} from "../../src/domain/finance";
import { createInitialState } from "../../src/domain/constants";
import type { AnnualReport, MonthlyLedger } from "../../src/domain/types";

const initial = createInitialState();

const ledger = (overrides: Partial<MonthlyLedger> = {}): MonthlyLedger => ({
  year: 2022,
  month: 1,
  tick: 0,
  householdDemand: 200,
  workshopDemand: 100,
  totalDemand: 300,
  ownProduction: 150,
  externalPurchase: 150,
  supplied: 300,
  shortage: 0,
  reliability: 100,
  inventoryEnd: 0,
  revenueHousehold: 2_000,
  revenueWorkshop: 740,
  revenueRecovery: 0,
  revenueWheeling: 0,
  revenueTotal: 2_740,
  costProduction: 1_200,
  costProcurement: 1_800,
  costRoads: 100,
  costFleet: 50,
  costStaff: 300,
  costInterest: 70,
  costTotal: 3_520,
  netResult: -780,
  cash: 1_000,
  debt: 20_000,
  tariffAverage: 10.58,
  ricePrice: 12,
  satisfaction: 70,
  trust: 65,
  inflation: 3.2,
  coverage: 62,
  ...overrides,
});

describe("finance", () => {
  it("charges monthly interest only on positive debt", () => {
    expect(interestForMonth(12_000, 0.065)).toBeCloseTo(65);
    expect(interestForMonth(-1, 0.065)).toBe(0);
  });

  it("borrows to restore the cash floor", () => {
    expect(settleDebt(500, 1_000, -100)).toEqual({ cash: 1_000, debt: 1_600 });
  });

  it("repays debt with cash above the reserve", () => {
    expect(settleDebt(6_000, 2_000, 0)).toEqual({ cash: 4_000, debt: 0 });
  });

  it("repays debt only up to the outstanding balance", () => {
    expect(settleDebt(6_000, 500, 0)).toEqual({ cash: 5_500, debt: 0 });
  });

  it("does not repay when there is no debt or no surplus", () => {
    expect(settleDebt(3_500, 1_000, 0)).toEqual({ cash: 3_500, debt: 1_000 });
    expect(settleDebt(6_000, 0, 0)).toEqual({ cash: 6_000, debt: 0 });
  });

  it("spends from cash without borrowing", () => {
    const result = spend(initial.finance, 1_000);
    expect(result).toEqual({ cash: 5_000, debt: 14_000, amount: 1_000 });
  });

  it("borrows when a purchase exceeds cash but fits the debt ceiling", () => {
    const finance = { ...initial.finance, cash: 100, debt: 10_000 };
    const result = spend(finance, 500);
    expect(result).toEqual({ cash: 0, debt: 10_400, amount: 500 });
  });

  it("refuses a purchase beyond debt capacity", () => {
    const finance = { ...initial.finance, cash: 100, debt: 59_900 };
    expect(spend(finance, 1_000)).toEqual({ cash: 100, debt: 59_900, amount: 0 });
    expect(spendable(finance)).toBe(200);
  });

  it("keeps short monthly history intact", () => {
    expect(pushLedger([ledger()], ledger({ month: 2 }))).toHaveLength(2);
  });

  it("trims monthly history to 120 rows", () => {
    const rows = Array.from({ length: 120 }, (_value, index) =>
      ledger({ month: (index % 12) + 1 }),
    );

    const next = pushLedger(rows, ledger({ month: 12 }));
    expect(next).toHaveLength(120);
    expect(next[next.length - 1]?.month).toBe(12);
  });

  it("aggregates a year of ledgers", () => {
    const rows = [ledger(), ledger({ month: 2, netResult: 220 })];
    const report = aggregateAnnual(2022, rows);
    expect(report.revenue).toBe(5_480);
    expect(report.costs).toBe(7_040);
    expect(report.netResult).toBe(-560);
    expect(report.trustAverage).toBe(65);
  });

  it("aggregates an empty year to zero", () => {
    const report = aggregateAnnual(2025, []);
    expect(report.revenue).toBe(0);
    expect(report.debtEnd).toBe(0);
    expect(report.reliability).toBe(0);
  });

  it("replaces the same year and keeps the last ten annual reports", () => {
    const reports: AnnualReport[] = Array.from({ length: 10 }, (_value, index) => ({
      year: 2022 + index,
      revenue: 1,
      costs: 1,
      netResult: 0,
      debtEnd: 0,
      coverage: 0,
      trustAverage: 0,
      satisfactionAverage: 0,
      reliability: 0,
      inflationAverage: 0,
    }));

    const replaced = pushAnnual(reports, { ...reports[0]!, revenue: 99 });
    expect(replaced.find((row) => row.year === 2022)?.revenue).toBe(99);
    const eleven = pushAnnual(replaced, { ...reports[0]!, year: 2032 });
    expect(eleven).toHaveLength(10);
    expect(eleven[0]?.year).toBe(2023);
  });

  it("computes net worth", () => {
    expect(netWorth(initial.finance)).toBe(-8_000);
  });
});
