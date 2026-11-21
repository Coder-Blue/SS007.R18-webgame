import type { ActionResult, ActionError, GameState, Result } from "../types";
import { err, ok } from "../types";
import { spend, spendable } from "../finance";
import { withEndingCheck } from "../endings";

export const pay = (state: GameState, cost: number): Result<GameState, ActionError> => {
  if (cost < 0 || cost > spendable(state.finance)) {
    return err({ code: "finance.insufficient", detail: String(cost) });
  }
  const step = spend(state.finance, cost);
  return ok({
    ...state,
    finance: { ...state.finance, cash: step.cash, debt: step.debt },
  });
};

export const requirePlaying = (state: GameState): ActionResult | null => {
  if (state.phase !== "playing") {
    return err({ code: "game.not-playing" });
  }
  if (state.ending !== null) {
    return err({ code: "game.ended" });
  }
  return null;
};

export const finishAction = (state: GameState): ActionResult => ok(withEndingCheck(state));
