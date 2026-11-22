import type { AnnualReport, Finance, MonthlyLedger, Spendable } from "./types";
import {
  CASH_FLOOR,
  CASH_REPAY_RESERVE,
  MANAGEMENT_BASE_COST,
  MANAGEMENT_PER_GW,
  MONTHS_PER_YEAR,
  TRANSMISSION_COST_PER_KWH,
} from "./constants";

export const interestForMonth = (debt: number, rate: number): number =>
  (Math.max(0, debt) * rate) / MONTHS_PER_YEAR;

export type DebtStep = {
  readonly cash: number;
  readonly debt: number;
};

export const settleDebt = (cash: number, debt: number, netResult: number): DebtStep => {
  let nextCash = cash + netResult;
  let nextDebt = Math.max(0, debt);

  if (nextCash < CASH_FLOOR) {
    nextDebt += CASH_FLOOR - nextCash;
    nextCash = CASH_FLOOR;
  }

  const repay = Math.max(0, nextCash - CASH_REPAY_RESERVE);

  if (nextDebt > 0 && repay > 0) {
    const payment = Math.min(nextDebt, repay);
    nextDebt -= payment;
    nextCash -= payment;
  }

  return { cash: nextCash, debt: nextDebt };
};

export const spend = (finance: Finance, amount: number): Spendable => {
  const available = finance.cash + (finance.debtLimit - finance.debt);

  if (amount > available) return { cash: finance.cash, debt: finance.debt, amount: 0 };

  if (amount <= finance.cash) return { cash: finance.cash - amount, debt: finance.debt, amount };

  return { cash: 0, debt: finance.debt + (amount - finance.cash), amount };
};

export const spendable = (finance: Finance): number =>
  finance.cash + Math.max(0, finance.debtLimit - finance.debt);

export const managementCost = (capacityMw: number): number =>
  MANAGEMENT_BASE_COST + (capacityMw / 1_000) * MANAGEMENT_PER_GW;

export const transmissionCost = (energyMillionKwh: number): number =>
  (energyMillionKwh * TRANSMISSION_COST_PER_KWH) / 1_000;

export const pushLedger = (
  history: readonly MonthlyLedger[],
  ledger: MonthlyLedger,
): readonly MonthlyLedger[] => {
  const next = [...history, ledger];

  return next.length > 120 ? next.slice(next.length - 120) : next;
};

export const aggregateAnnual = (year: number, ledgers: readonly MonthlyLedger[]): AnnualReport => {
  const rows = ledgers.filter((row) => row.year === year);
  const count = rows.length || 1;
  const last = rows[rows.length - 1];

  return {
    year,
    revenue: rows.reduce((sum, row) => sum + row.revenueTotal, 0),
    costs: rows.reduce((sum, row) => sum + row.costTotal, 0),
    netResult: rows.reduce((sum, row) => sum + row.netResult, 0),
    debtEnd: last?.debt ?? 0,
    coverage: last?.coverage ?? 0,
    trustAverage: rows.reduce((sum, row) => sum + row.institutionalTrust, 0) / count,
    satisfactionAverage: rows.reduce((sum, row) => sum + row.citizenTrust, 0) / count,
    reliability: rows.reduce((sum, row) => sum + row.reliability, 0) / count,
    inflationAverage: rows.reduce((sum, row) => sum + row.inflation, 0) / count,
  };
};

export const pushAnnual = (
  history: readonly AnnualReport[],
  report: AnnualReport,
): readonly AnnualReport[] => {
  const withoutYear = history.filter((row) => row.year !== report.year);

  return [...withoutYear, report].toSorted((a, b) => a.year - b.year).slice(-10);
};

export const netWorth = (finance: Finance): number => finance.cash - finance.debt;
