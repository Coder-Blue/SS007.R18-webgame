import type { ActionResult, GameState, Result } from "../types";
import { err } from "../types";
import {
  BAILOUT_SATISFACTION_COST,
  BAILOUT_TRUST_COST,
  N2_RATE_MAX,
  N2_RATE_MIN,
} from "../constants";
import { clamp } from "../clock";
import { finishAction, requirePlaying } from "./helpers";

const already = (code: string): Result<never, { code: string }> => err({ code });

export const enactRecoveryAction = (state: GameState): ActionResult => {
  const blocked = requirePlaying(state);
  if (blocked !== null) return blocked;
  if (state.clock.year < 2024) return already("policy.too-early");
  if (state.policy.n2Enabled) return already("policy.already-enabled");
  return finishAction({
    ...state,
    policy: { ...state.policy, n2Enabled: true },
    metrics: {
      ...state.metrics,
      trust: clamp(state.metrics.trust + 3, 0, 100),
      inflation: state.metrics.inflation + 0.3,
    },
  });
};

export const setRecoveryRateAction = (state: GameState, rate: number): ActionResult => {
  const blocked = requirePlaying(state);
  if (blocked !== null) return blocked;
  if (!state.policy.n2Enabled) return already("policy.not-enabled");
  if (rate < N2_RATE_MIN || rate > N2_RATE_MAX) return already("policy.rate-out-of-range");
  return finishAction({
    ...state,
    policy: { ...state.policy, n2Rate: rate },
  });
};

const enablePolicy = (
  state: GameState,
  field: "nsmo" | "dppa" | "vrem",
  cost: number,
): ActionResult => {
  const blocked = requirePlaying(state);
  if (blocked !== null) return blocked;
  if (state.policy[field]) return already("policy.already-enabled");
  if (state.finance.cash + (state.finance.debtLimit - state.finance.debt) < cost) {
    return already("finance.insufficient");
  }
  const cash = state.finance.cash - cost;
  const borrowed = cash < 0 ? -cash : 0;
  return finishAction({
    ...state,
    finance: {
      ...state.finance,
      cash: Math.max(0, cash),
      debt: state.finance.debt + borrowed,
    },
    policy: { ...state.policy, [field]: true },
    metrics: {
      ...state.metrics,
      trust: clamp(state.metrics.trust + 2, 0, 100),
    },
  });
};

export const enableNsmoAction = (state: GameState): ActionResult =>
  enablePolicy(state, "nsmo", 250);

export const enableDppaAction = (state: GameState): ActionResult =>
  enablePolicy(state, "dppa", 400);

export const enableVremAction = (state: GameState): ActionResult =>
  enablePolicy(state, "vrem", 350);

export const enableTwoPartAction = (state: GameState): ActionResult => {
  const blocked = requirePlaying(state);
  if (blocked !== null) return blocked;
  if (!state.policy.vrem) return already("policy.requires-vrem");
  if (state.policy.twoPartTariff) return already("policy.already-enabled");
  return finishAction({
    ...state,
    policy: { ...state.policy, twoPartTariff: true },
    metrics: {
      ...state.metrics,
      trust: clamp(state.metrics.trust + 2, 0, 100),
      satisfaction: clamp(state.metrics.satisfaction + 1, 0, 100),
    },
  });
};

export const requestBailoutAction = (state: GameState): ActionResult => {
  const blocked = requirePlaying(state);
  if (blocked !== null) return blocked;
  if (state.policy.bailoutUsed) return already("policy.bailout-used");
  return finishAction({
    ...state,
    finance: {
      ...state.finance,
      debt: Math.max(0, state.finance.debt - 8_000),
    },
    metrics: {
      ...state.metrics,
      trust: clamp(state.metrics.trust - BAILOUT_TRUST_COST, 0, 100),
      satisfaction: clamp(state.metrics.satisfaction - BAILOUT_SATISFACTION_COST, 0, 100),
    },
    policy: { ...state.policy, bailoutUsed: true },
  });
};
