import type { GameState } from "~/domain";
import { recoveryOf } from "~/domain";
import type { GameStore } from "./game-store";

export interface Projection {
  readonly monthlyFixed: number;
  readonly recovery: number;
  readonly runwayMonths: number;
  readonly debtRatio: number;
  readonly isDanger: boolean;
}

export const projectFinance = (state: GameState): Projection => {
  const last = state.finance.monthlyHistory[state.finance.monthlyHistory.length - 1];
  const monthlyFixed = last?.costTotal ?? 0;
  const recovery = recoveryOf(state).monthlyCredit;
  const debtRatio = state.finance.debtLimit > 0 ? state.finance.debt / state.finance.debtLimit : 1;
  const netMonthly = (last?.netResult ?? 0) + recovery;
  const runwayMonths =
    netMonthly >= 0
      ? 99
      : Math.max(0, (state.finance.debtLimit - state.finance.debt) / Math.abs(netMonthly));
  return {
    monthlyFixed,
    recovery,
    runwayMonths,
    debtRatio,
    isDanger: debtRatio > 0.82,
  };
};

export const storeSnapshot = (store: GameStore): GameState => store.state();
