import type { GameState, Policy } from "../types";
import { clamp } from "../clock";

export const applyCashDebt = (
  state: GameState,
  cashDelta: number,
  debtDelta: number,
): GameState => {
  const cash = state.finance.cash + cashDelta;
  const borrowed = cash < 0 ? -cash : 0;
  return {
    ...state,
    finance: {
      ...state.finance,
      cash: Math.max(0, cash),
      debt: Math.max(0, state.finance.debt + debtDelta + borrowed),
    },
  };
};

export const appendFlags = (
  flags: readonly string[],
  additions: readonly string[],
): readonly string[] => {
  const merged = [...flags];
  for (const flag of additions) {
    if (!merged.includes(flag)) merged.push(flag);
  }
  return merged;
};

export const applyUnlocks = (
  policy: Policy,
  unlocks: readonly ("dppa" | "vrem" | "nsmo" | "antiSmuggling")[],
  n2Unlock: boolean,
): Policy => {
  const next: Policy = {
    ...policy,
    dppa: policy.dppa || unlocks.includes("dppa"),
    vrem: policy.vrem || unlocks.includes("vrem"),
    nsmo: policy.nsmo || unlocks.includes("nsmo"),
    antiSmuggling: policy.antiSmuggling || unlocks.includes("antiSmuggling"),
    n2Enabled: policy.n2Enabled || n2Unlock,
  };
  return next;
};

export const clampMetric = (value: number): number => clamp(value, 0, 100);
