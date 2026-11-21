import type { AnnualReport, Finance, MonthlyLedger } from "./types";
import { CASH_FLOOR, CASH_REPAY_RESERVE, MONTHS_PER_YEAR } from "./constants";

export const interestForMonth = (debt: number, rate: number): number =>
  Math.max(0, debt) * (rate / MONTHS_PER_YEAR);

export interface DebtStep {
  readonly cash: number;
  readonly debt: number;
}

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

export interface SpendStep {
  readonly cash: number;
  readonly debt: number;
  readonly amount: number;
}

export const spend = (finance: Finance, amount: number): SpendStep => {
  const available = finance.cash + (finance.debtLimit - finance.debt);
  if (amount > available) {
    return { cash: finance.cash, debt: finance.debt, amount: 0 };
  }
  if (amount <= finance.cash) {
    return { cash: finance.cash - amount, debt: finance.debt, amount };
  }
  const shortfall = amount - finance.cash;
  return { cash: 0, debt: finance.debt + shortfall, amount };
};

export const spendable = (finance: Finance): number =>
  finance.cash + Math.max(0, finance.debtLimit - finance.debt);

export const pushLedger = (
  history: readonly MonthlyLedger[],
  ledger: MonthlyLedger,
): readonly MonthlyLedger[] => {
  const next = [...history, ledger];
  return next.length > 120 ? next.slice(next.length - 120) : next;
};

export const aggregateAnnual = (year: number, ledgers: readonly MonthlyLedger[]): AnnualReport => {
  const rows = ledgers.filter((row) => row.year === year);
  const totalRevenue = rows.reduce((sum, row) => sum + row.revenueTotal, 0);
  const totalCosts = rows.reduce((sum, row) => sum + row.costTotal, 0);
  const netResult = rows.reduce((sum, row) => sum + row.netResult, 0);
  const count = rows.length || 1;
  const last = rows[rows.length - 1];
  return {
    year,
    revenue: totalRevenue,
    costs: totalCosts,
    netResult,
    debtEnd: last?.debt ?? 0,
    coverage: last?.coverage ?? 0,
    trustAverage: rows.reduce((sum, row) => sum + row.trust, 0) / count,
    satisfactionAverage: rows.reduce((sum, row) => sum + row.satisfaction, 0) / count,
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
