import type { Finance, Policy } from "./types";
import { clamp } from "./clock";

export type Recovery = {
  readonly eligibleYear: number;
  readonly eligibleLoss: number;
  readonly monthlyCredit: number;
  readonly remaining: number;
};

export const recoveryOf = (finance: Finance, year: number, policy: Policy): Recovery => {
  const eligibleYear = year - 2;
  const report = finance.annualHistory.find((row) => row.year === eligibleYear);
  const eligibleLoss = Math.abs(Math.min(0, report?.netResult ?? 0));
  const recovered = finance.recoveredYears.find((row) => row.year === eligibleYear)?.amount ?? 0;
  const remaining = Math.max(0, eligibleLoss - recovered);

  if (!policy.n2Enabled || eligibleLoss <= 0 || remaining <= 0) {
    return { eligibleYear, eligibleLoss, monthlyCredit: 0, remaining };
  }

  const monthlyCredit = Math.min(remaining, (eligibleLoss * clamp(policy.n2Rate, 0, 1)) / 12);

  return {
    eligibleYear,
    eligibleLoss,
    monthlyCredit,
    remaining: remaining - monthlyCredit,
  };
};
