import type { Finance, GameState } from "./types";
import { N2_RATE_DEFAULT } from "./constants";

export interface RecoveryInfo {
  readonly eligibleLoss: number;
  readonly eligibleYear: number;
  readonly monthlyCredit: number;
  readonly remaining: number;
  readonly rate: number;
}

export const recoveryFor = (
  finance: Finance,
  currentYear: number,
  rate: number,
  enabled: boolean,
): RecoveryInfo => {
  const eligibleYear = currentYear - 2;
  const report = finance.annualHistory.find((row) => row.year === eligibleYear);
  const eligibleLoss = Math.max(0, -(report?.netResult ?? 0));
  const base = enabled && currentYear >= 2024 ? eligibleLoss : 0;
  const remaining = Math.max(0, base - finance.recoveredTotal);
  const monthlyCredit = Math.min(remaining, (base * rate) / 12);

  return { eligibleLoss, eligibleYear, monthlyCredit, remaining, rate };
};

export const recoveryOf = (state: GameState): RecoveryInfo =>
  recoveryFor(
    state.finance,
    state.clock.year,
    state.policy.n2Rate || N2_RATE_DEFAULT,
    state.policy.n2Enabled,
  );

export const recoveryRateCost = (rate: number): number => Math.max(0, rate - N2_RATE_DEFAULT) * 24;
