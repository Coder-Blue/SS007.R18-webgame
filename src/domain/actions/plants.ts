import type { GameState } from "../types";
import { ok, type Result } from "../types";
import { PLANT_PROJECTS, type PlantKind } from "../constants";
import { addProject, charge } from "./helpers";

export const buildPlantAction = (state: GameState, kind: PlantKind): Result<GameState> => {
  const plan = PLANT_PROJECTS[kind];
  const paid = charge(state, plan.cost);

  if (!paid.ok) return paid;

  return addProject(paid.value, kind, kind, plan.months);
};

export const plantPlan = (kind: PlantKind) => PLANT_PROJECTS[kind];

export const buildablePlants = (): readonly PlantKind[] =>
  ["hydro", "thermal", "renewable", "substation"] as const;

export const isPlantKind = (value: string): value is PlantKind =>
  value === "hydro" || value === "thermal" || value === "renewable" || value === "substation";

export const plantAction = (state: GameState, kind: string): Result<GameState> =>
  isPlantKind(kind) ? buildPlantAction(state, kind) : ok(state);
