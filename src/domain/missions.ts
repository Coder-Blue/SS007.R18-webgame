import type { GameState, MissionId, Missions } from "./types";
import { clamp } from "./clock";
import { SECURITY_STREAK_MONTHS } from "./constants";
import { cheapestSupplier } from "./market";

export type MissionStatus = {
  readonly id: MissionId;
  readonly progress: number;
  readonly done: boolean;
  readonly detail: string;
};

export const reformsEnabled = (state: GameState): number =>
  [state.policy.n2Enabled, state.policy.nsmo, state.policy.dppa, state.policy.vrem].filter(Boolean)
    .length;

export const missionStatus = (state: GameState): readonly MissionStatus[] => {
  const zones = [state.zones.urban, state.zones.industrial, state.zones.rural];
  const minCoverage = Math.min(...zones.map((zone) => zone.coverage));
  const active = state.market.suppliers.find((row) => row.id === state.operations.supplierId);

  const competitive =
    active !== undefined && active.priceVndPerKwh <= cheapestSupplier(state.market) * 1.015;

  const reformShare = reformsEnabled(state) / 4;
  const reliable = clamp(state.metrics.reliability, 0, 100);
  const marketProgress = reliable * 0.45 + reformShare * 100 * 0.35 + (competitive ? 20 : 8);

  return [
    {
      id: "electrification",
      progress: minCoverage,
      done: zones.every((zone) => zone.coverage >= 100),
      detail: `${Math.round(minCoverage)}%`,
    },
    {
      id: "market",
      progress: clamp(marketProgress, 0, 100),
      done: reliable >= 98 && reformsEnabled(state) >= 3 && competitive,
      detail: `${Math.round(reliable)}% · ${reformsEnabled(state)}/4 cải cách`,
    },
    {
      id: "security",
      progress: clamp((state.missions.reserveStreak / SECURITY_STREAK_MONTHS) * 100, 0, 100),
      done: state.missions.reserveStreak >= SECURITY_STREAK_MONTHS,
      detail: `${state.missions.reserveStreak}/${SECURITY_STREAK_MONTHS} tháng`,
    },
  ];
};

export type MissionStep = {
  readonly missions: Missions;
  readonly completed: readonly MissionId[];
};

export const advanceMissions = (
  state: GameState,
  reserveMargin: number,
  reliability: number,
): MissionStep => {
  const streak = reserveMargin >= 15 && reliability >= 95 ? state.missions.reserveStreak + 1 : 0;

  const nextState: GameState = {
    ...state,
    missions: { ...state.missions, reserveStreak: streak },
  };

  const completed: MissionId[] = [];

  for (const mission of missionStatus(nextState)) {
    if (mission.done && !state.missions.completed.includes(mission.id)) completed.push(mission.id);
  }

  return {
    missions: {
      reserveStreak: streak,
      completed: [...state.missions.completed, ...completed],
      privateMonths: state.missions.privateMonths,
    },
    completed,
  };
};

export const missionProgressScore = (state: GameState): number => {
  const duties = missionStatus(state);
  let total = 0;

  for (const duty of duties) total += duty.progress;

  return total / Math.max(1, duties.length);
};
