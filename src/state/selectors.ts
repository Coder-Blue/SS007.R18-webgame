import type { GameState } from "~/domain";
import { missionStatus, recoveryOf } from "~/domain";

export type Projection = {
  readonly monthlyNet: number;
  readonly runwayMonths: number;
  readonly debtRatio: number;
  readonly isDanger: boolean;
  readonly recovery: number;
};

export const projectFinance = (state: GameState): Projection => {
  const last = state.finance.monthlyHistory[state.finance.monthlyHistory.length - 1];
  const monthlyNet = last?.netResult ?? 0;
  const debtRatio = state.finance.debtLimit > 0 ? state.finance.debt / state.finance.debtLimit : 1;

  const runwayMonths =
    monthlyNet >= 0
      ? 99
      : Math.max(0, (state.finance.debtLimit - state.finance.debt) / Math.abs(monthlyNet));

  return {
    monthlyNet,
    runwayMonths,
    debtRatio,
    isDanger: debtRatio > 0.82,
    recovery: recoveryOf(state.finance, state.clock.year, state.policy).monthlyCredit,
  };
};

export const totalCoverage = (state: GameState): number =>
  (state.zones.urban.coverage + state.zones.industrial.coverage + state.zones.rural.coverage) / 3;

export const missionOverview = (state: GameState) => missionStatus(state);

export const isModalOpen = (state: GameState): boolean =>
  state.events.activeId !== null || state.approval !== null || state.ending !== null;
