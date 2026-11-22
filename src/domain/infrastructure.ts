import type { GameState, Project, ZoneId } from "./types";
import { clamp } from "./clock";
import { LINE_PROJECTS, PLANT_PROJECTS, DECISIONS } from "./constants";
import { completeDecision } from "./events/effects";

export type ProjectStep = {
  readonly state: GameState;
  readonly completed: readonly Project[];
};

const isZoneId = (value: string): value is ZoneId =>
  value === "urban" || value === "industrial" || value === "rural";

export const completeProject = (state: GameState, project: Project): GameState => {
  if (project.kind === "line" && isZoneId(project.targetId)) {
    const plan = LINE_PROJECTS[project.targetId];
    const zone = state.zones[project.targetId];

    return {
      ...state,
      zones: {
        ...state.zones,
        [project.targetId]: {
          ...zone,
          coverage: clamp(zone.coverage + plan.coverage, 0, 100),
        },
      },
      infrastructure: {
        ...state.infrastructure,
        lineKm500: state.infrastructure.lineKm500 + plan.lineKm500,
        lineKm220: state.infrastructure.lineKm220 + plan.lineKm220,
      },
    };
  }

  if (project.kind === "hydro" || project.kind === "thermal" || project.kind === "renewable") {
    const plan = PLANT_PROJECTS[project.kind];

    const key =
      project.kind === "hydro"
        ? "hydroCapacityMw"
        : project.kind === "thermal"
          ? "thermalCapacityMw"
          : "renewableCapacityMw";

    return {
      ...state,
      generation: {
        ...state.generation,
        [key]: state.generation[key] + plan.capacityMw,
      },
    };
  }

  if (project.kind === "substation") {
    return {
      ...state,
      infrastructure: {
        ...state.infrastructure,
        substations: state.infrastructure.substations + 1,
        gridStrength: clamp(state.infrastructure.gridStrength + 6, 0, 100),
      },
    };
  }

  const decision = DECISIONS.find((candidate) => candidate.id === project.targetId);

  return decision === undefined ? state : completeDecision(state, decision.id);
};

export const advanceProjects = (state: GameState): ProjectStep => {
  const completed: Project[] = [];
  const remaining: Project[] = [];
  let current = state;

  for (const project of state.operations.projects) {
    if (project.monthsLeft > 1) {
      remaining.push({ ...project, monthsLeft: project.monthsLeft - 1 });
      continue;
    }

    completed.push(project);
    current = completeProject(current, project);
  }

  return {
    state: {
      ...current,
      operations: { ...current.operations, projects: remaining },
    },
    completed,
  };
};
