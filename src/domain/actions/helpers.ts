import type { GameState, ProjectKind, Result } from "../types";
import { err, ok } from "../types";
import { spend } from "../finance";

export const MAX_PROJECTS = 3;

export const charge = (state: GameState, amount: number): Result<GameState> => {
  const available = state.finance.cash + (state.finance.debtLimit - state.finance.debt);

  if (amount > available) return err("finance.insufficient");
  const step = spend(state.finance, amount);

  return ok({
    ...state,
    finance: { ...state.finance, cash: step.cash, debt: step.debt },
  });
};

export const addProject = (
  state: GameState,
  kind: ProjectKind,
  targetId: string,
  months: number,
): Result<GameState> => {
  if (state.operations.projects.length >= MAX_PROJECTS) return err("project.queue-full");

  return ok({
    ...state,
    operations: {
      ...state.operations,
      projects: [
        ...state.operations.projects,
        {
          id: `${kind}-${targetId}-${state.clock.tick}-${state.operations.projects.length}`,
          kind,
          targetId,
          monthsLeft: months,
          totalMonths: months,
        },
      ],
    },
  });
};

export const uniqueFlag = (flags: readonly string[], flag: string): readonly string[] =>
  flags.includes(flag) ? flags : [...flags, flag];
