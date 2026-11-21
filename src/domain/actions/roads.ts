import type { ActionResult, GameState, RoadGrade } from "../types";
import { buildRoad } from "../infrastructure";
import { ROAD_PROJECTS } from "../constants";
import { finishAction, pay, requirePlaying } from "./helpers";

export const buildRoadAction = (state: GameState, grade: RoadGrade): ActionResult => {
  const blocked = requirePlaying(state);

  if (blocked !== null) return blocked;
  const built = buildRoad(state.infrastructure, grade);
  const paid = pay(state, ROAD_PROJECTS[grade].cost);

  if (!paid.ok) return paid;

  return finishAction({
    ...paid.value,
    infrastructure: built.infrastructure,
  });
};
