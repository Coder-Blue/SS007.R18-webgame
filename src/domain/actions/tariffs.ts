import type { ActionResult, GameState } from "../types";
import { err } from "../types";
import { validateTariffs } from "../tariffs";
import { finishAction, requirePlaying } from "./helpers";

export const setTariffsAction = (
  state: GameState,
  tiers: readonly [number, number, number, number],
  workshop: number,
): ActionResult => {
  const blocked = requirePlaying(state);

  if (blocked !== null) return blocked;
  const validated = validateTariffs(tiers, workshop, state.tariffs.ceiling);

  if (!validated.ok) return err({ code: validated.error });

  return finishAction({ ...state, tariffs: validated.value });
};
