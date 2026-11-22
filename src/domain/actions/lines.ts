import type { GameState, ZoneId } from "../types";
import { err, type Result } from "../types";
import { LINE_PROJECTS } from "../constants";
import { addProject, charge } from "./helpers";

export const buildLineAction = (state: GameState, zone: ZoneId): Result<GameState> => {
  const plan = LINE_PROJECTS[zone];

  if (state.zones[zone].coverage >= 100) return err("action.at-cap");

  if (
    state.operations.projects.some(
      (project) => project.kind === "line" && project.targetId === zone,
    )
  ) {
    return err("project.pending");
  }

  const paid = charge(state, plan.cost);

  if (!paid.ok) return paid;

  return addProject(paid.value, "line", zone, plan.months);
};

export const buildableZones = (state: GameState): readonly ZoneId[] =>
  (["urban", "industrial", "rural"] as const).filter(
    (zone) =>
      state.zones[zone].coverage < 100 &&
      !state.operations.projects.some(
        (project) => project.kind === "line" && project.targetId === zone,
      ),
  );

export const lineProjectOf = (zone: ZoneId) => LINE_PROJECTS[zone];

export const canBuildLine = (state: GameState, zone: ZoneId): boolean =>
  buildableZones(state).includes(zone);
