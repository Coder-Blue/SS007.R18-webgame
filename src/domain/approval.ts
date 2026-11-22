import type { GameState } from "./types";
import { clamp } from "./clock";
import { APPROVAL_THRESHOLD } from "./constants";
import { averageOfTiers } from "./tariffs";

export type ApprovalAudit = {
  readonly likelihood: number;
  readonly average: number;
  readonly changePct: number;
  readonly approved: boolean;
};

export const tariffChangePercent = (state: GameState, average: number): number => {
  const current = averageOfTiers(state.tariffs.tiers);

  return current <= 0 ? 0 : ((average - current) / current) * 100;
};

export const approvalLikelihood = (
  state: GameState,
  average: number,
  changePct: number,
): number => {
  const fuelPressure = clamp((state.market.fuelPriceIndex - 1) * 120, -10, 35);
  const deficitPressure = clamp(state.finance.accumulatedLoss / 2_500, 0, 18);
  const debtPressure = clamp(state.finance.debt / 5_000, 0, 12);
  const petition = state.policy.petitionDone ? 14 : 0;
  const publicMood = (state.metrics.citizenTrust - 50) * 0.35;
  const inflationDrag = Math.max(0, state.metrics.inflation - 6) * 4;
  const overshoot = Math.max(0, changePct - 5) * 2.5;
  const privateDrag = state.policy.branch === "private" ? 25 : 0;

  return clamp(
    Math.round(
      30 +
        fuelPressure +
        deficitPressure +
        debtPressure +
        petition +
        publicMood -
        inflationDrag -
        overshoot -
        privateDrag,
    ),
    5,
    95,
  );
};

export const auditTariffRequest = (
  state: GameState,
  average: number,
  changePct: number,
): ApprovalAudit => {
  const likelihood = approvalLikelihood(state, average, changePct);

  return {
    likelihood,
    average,
    changePct,
    approved: likelihood >= APPROVAL_THRESHOLD,
  };
};
