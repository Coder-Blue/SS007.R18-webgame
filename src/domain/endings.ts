import type { Ending, GameState } from "./types";
import {
  ARCHITECT_DEBT_MAX,
  FINAL_RELIABILITY_MIN,
  FINAL_SATISFACTION_MIN,
  FINAL_TRUST_MIN,
  PREDATOR_CASH_MIN,
  PREDATOR_SATISFACTION_MAX,
} from "./constants";

const ending = (state: GameState, id: Ending["id"], reason: Ending["reason"]): Ending => ({
  id,
  reason,
  year: state.clock.year,
  month: state.clock.month,
});

export const evaluateEarlyEnding = (state: GameState): Ending | null => {
  if (state.finance.debt > state.finance.debtLimit) {
    return ending(state, "collapse", "debt");
  }
  if (state.metrics.satisfaction <= 0) {
    return ending(state, "collapse", "unrest");
  }
  if (state.metrics.trust <= 0) {
    return ending(state, "collapse", "deposed");
  }
  if (state.events.flags.includes("privatization_accepted")) {
    return ending(state, "collapse", "privatization");
  }
  return null;
};

export const finalReliability = (state: GameState): number => {
  const report = state.finance.annualHistory.find((row) => row.year === state.clock.year);
  return report?.reliability ?? state.metrics.reliability;
};

export const evaluateFinalEnding = (state: GameState): Ending => {
  const reportFlags = state.events.flags;
  const debtHealed = state.finance.debt <= ARCHITECT_DEBT_MAX;
  const coverageComplete =
    state.infrastructure.coverage >= 100 && state.infrastructure.remoteCoverage >= 100;
  const reforms = state.policy.n2Enabled && state.policy.dppa && state.policy.vrem;
  const legitimate =
    state.metrics.trust >= FINAL_TRUST_MIN &&
    state.metrics.satisfaction >= FINAL_SATISFACTION_MIN &&
    finalReliability(state) >= FINAL_RELIABILITY_MIN;
  if (debtHealed && coverageComplete && reforms && legitimate) {
    return ending(state, "architect", "final");
  }
  const predatory =
    state.finance.cash >= PREDATOR_CASH_MIN &&
    state.metrics.satisfaction < PREDATOR_SATISFACTION_MAX &&
    (reportFlags.includes("bribe_accepted") || reportFlags.includes("smuggling_rampant"));
  if (predatory) return ending(state, "predator", "final");
  return ending(state, "collapse", "final");
};

export const withEndingCheck = (state: GameState): GameState => {
  if (state.ending !== null) return state;
  const early = evaluateEarlyEnding(state);
  if (early !== null) {
    return { ...state, phase: "ended", ending: early };
  }
  return state;
};

export const withFinalCheck = (state: GameState): GameState => {
  if (state.ending !== null) return state;
  if (state.clock.year === 2026 && state.clock.month === 12) {
    return { ...state, phase: "ended", ending: evaluateFinalEnding(state) };
  }
  return state;
};
