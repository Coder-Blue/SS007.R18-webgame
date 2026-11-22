import type { Ending, GameState } from "./types";
import { DEBT_LIMIT, END_MONTH, END_YEAR } from "./constants";
import { missionStatus, reformsEnabled } from "./missions";

const ending = (state: GameState, id: Ending["id"], reason: Ending["reason"]): Ending => ({
  id,
  reason,
  year: state.clock.year,
  month: state.clock.month,
});

export const evaluateEarlyEnding = (state: GameState): Ending | null => {
  if (state.metrics.citizenTrust <= 0) return ending(state, "collapse", "citizen-trust");

  if (state.metrics.institutionalTrust <= 0) {
    return ending(state, "collapse", "institutional-trust");
  }

  if (state.finance.debt > DEBT_LIMIT) return ending(state, "collapse", "debt");

  if (state.policy.branch === "private" && state.missions.privateMonths >= 12) {
    return ending(state, "collapse", "privatization");
  }

  if (state.metrics.reliability < 45) return ending(state, "collapse", "blackout");

  return null;
};

export const evaluateFinalEnding = (state: GameState): Ending => {
  const coverageComplete = missionStatus(state).some(
    (row) => row.id === "electrification" && row.done,
  );

  const legitimate =
    state.metrics.institutionalTrust >= 50 &&
    state.metrics.citizenTrust >= 45 &&
    state.metrics.industrialOutput >= 100 &&
    reformsEnabled(state) >= 3;

  if (state.policy.branch === "private") return ending(state, "collapse", "privatization");

  if (coverageComplete && legitimate) return ending(state, "reformer", "final");

  if (state.metrics.citizenTrust < 40) return ending(state, "captured", "final");

  return ending(state, "caretaker", "final");
};

export const withEndingCheck = (state: GameState): GameState => {
  if (state.ending !== null) return state;
  const early = evaluateEarlyEnding(state);

  if (early !== null) return { ...state, phase: "ended", ending: early };

  return state;
};

export const withFinalCheck = (state: GameState): GameState => {
  if (state.ending !== null) return state;

  if (state.clock.year === END_YEAR && state.clock.month === END_MONTH) {
    return { ...state, phase: "ended", ending: evaluateFinalEnding(state) };
  }

  return state;
};
