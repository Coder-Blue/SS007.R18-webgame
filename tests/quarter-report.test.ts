import { describe, expect, it } from "vitest";
import { quarterReport } from "../src/state/selectors";
import { baseState, ledger } from "./domain/test-helpers";

const withHistory = (rows: ReturnType<typeof ledger>[]) => ({
  ...baseState(),
  finance: { ...baseState().finance, monthlyHistory: rows },
});

const row = (overrides: Parameters<typeof ledger>[0]) => ledger(overrides);

describe("quarter report", () => {
  it("returns null until three months are complete", () => {
    expect(quarterReport(withHistory([]))).toBeNull();
    expect(quarterReport(withHistory([row({ month: 1 }), row({ month: 2 })]))).toBeNull();
  });

  it("aggregates the latest three months and keeps the closing balances", () => {
    const report = quarterReport(
      withHistory([
        row({
          year: 2022,
          month: 1,
          energySoldMillionKwh: 100,
          hydroMillionKwh: 40,
          thermalMillionKwh: 30,
          renewableMillionKwh: 20,
          importMillionKwh: 10,
          revenueTotal: 300,
          costSupply: 200,
          costManagement: 40,
          costTotal: 240,
          netResult: 60,
          averageRetailTariff: 2_400,
          debt: 10_000,
          accumulatedLoss: 500,
          cash: 4_000,
          citizenTrust: 70,
          institutionalTrust: 60,
          reliability: 99,
        }),
        row({
          year: 2022,
          month: 2,
          energySoldMillionKwh: 200,
          hydroMillionKwh: 60,
          thermalMillionKwh: 70,
          renewableMillionKwh: 40,
          importMillionKwh: 30,
          revenueTotal: 500,
          costSupply: 300,
          costManagement: 50,
          costTotal: 350,
          netResult: 150,
          averageRetailTariff: 2_500,
          debt: 10_500,
          accumulatedLoss: 350,
          cash: 4_200,
          citizenTrust: 72,
          institutionalTrust: 61,
          reliability: 98,
        }),
        row({
          year: 2022,
          month: 3,
          energySoldMillionKwh: 300,
          hydroMillionKwh: 80,
          thermalMillionKwh: 100,
          renewableMillionKwh: 60,
          importMillionKwh: 60,
          revenueTotal: 900,
          costSupply: 500,
          costManagement: 60,
          costTotal: 560,
          netResult: 340,
          averageRetailTariff: 2_600,
          debt: 11_000,
          accumulatedLoss: 10,
          cash: 4_500,
          citizenTrust: 75,
          institutionalTrust: 62,
          reliability: 97,
        }),
      ]),
    );

    expect(report).not.toBeNull();

    if (report === null) return;
    expect(report).toMatchObject({
      year: 2022,
      quarter: 1,
      startMonth: 1,
      endMonth: 3,
      energyMillionKwh: 600,
      hydroMillionKwh: 180,
      thermalMillionKwh: 200,
      renewableMillionKwh: 120,
      importMillionKwh: 100,
      revenueBillionVnd: 1_700,
      costSupplyBillionVnd: 1_000,
      costManagementBillionVnd: 150,
      costTotalBillionVnd: 1_150,
      netBillionVnd: 550,
      debtBillionVnd: 11_000,
      accumulatedLossBillionVnd: 10,
      cashBillionVnd: 4_500,
      citizenTrust: 75,
      institutionalTrust: 62,
      reliability: 97,
      previousEnergyMillionKwh: null,
      previousNetBillionVnd: null,
    });
    expect(report.averageRetailTariffVndPerKwh).toBeCloseTo(2_533.333, 2);
  });

  it("compares with the previous quarter when six months exist", () => {
    const rows = Array.from({ length: 6 }, (_, index) =>
      row({
        year: 2022,
        month: index + 1,
        energySoldMillionKwh: 100,
        netResult: index < 3 ? -100 : 50,
        averageRetailTariff: 2_500,
      }),
    );

    const report = quarterReport(withHistory(rows));

    expect(report?.quarter).toBe(2);
    expect(report?.energyMillionKwh).toBe(300);
    expect(report?.previousEnergyMillionKwh).toBe(300);
    expect(report?.netBillionVnd).toBe(150);
    expect(report?.previousNetBillionVnd).toBe(-300);
  });

  it("falls back to the last tariff when no energy was sold", () => {
    const report = quarterReport(
      withHistory([
        row({ month: 1, energySoldMillionKwh: 0, averageRetailTariff: 2_100 }),
        row({ month: 2, energySoldMillionKwh: 0, averageRetailTariff: 2_200 }),
        row({ month: 3, energySoldMillionKwh: 0, averageRetailTariff: 2_300 }),
      ]),
    );

    expect(report?.averageRetailTariffVndPerKwh).toBe(2_300);
  });
});
