import type { ActionResult, GameState } from "../types";
import { IMPORT_RICE_MARKUP, IMPORT_RICE_VOLUME } from "../constants";
import { finishAction, pay, requirePlaying } from "./helpers";

export const importRiceAction = (state: GameState): ActionResult => {
  const blocked = requirePlaying(state);
  if (blocked !== null) return blocked;
  if (state.production.riceInventory >= 600) {
    return { ok: false, error: { code: "action.stock-full" } };
  }
  const cost = IMPORT_RICE_VOLUME * state.market.ricePrice * IMPORT_RICE_MARKUP;
  const paid = pay(state, cost);
  if (!paid.ok) return paid;
  return finishAction({
    ...paid.value,
    production: {
      ...paid.value.production,
      riceInventory: Math.min(600, paid.value.production.riceInventory + IMPORT_RICE_VOLUME),
    },
  });
};
