import type { Dispatch, GameState } from "../types";
import { err, ok, type Result } from "../types";
import { dispatchWithinCaps } from "../production";

export const setDispatchAction = (state: GameState, dispatch: Dispatch): Result<GameState> => {
  if (
    !Number.isFinite(dispatch.hydroMw) ||
    !Number.isFinite(dispatch.thermalMw) ||
    !Number.isFinite(dispatch.importMw)
  ) {
    return ok(state);
  }

  return ok({
    ...state,
    operations: {
      ...state.operations,
      dispatch: dispatchWithinCaps(dispatch, state.generation, state.market),
    },
  });
};

export const setSupplierAction = (state: GameState, supplierId: string): Result<GameState> => {
  const supplier = state.market.suppliers.find((candidate) => candidate.id === supplierId);

  if (supplier === undefined) return err("supplier.unknown");

  return ok({
    ...state,
    operations: { ...state.operations, supplierId },
  });
};
