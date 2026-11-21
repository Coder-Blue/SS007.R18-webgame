import type { Infrastructure, RoadGrade } from "./types";
import { ROAD_PROJECTS } from "./constants";
import { clamp } from "./clock";

export interface RoadBuildResult {
  readonly infrastructure: Infrastructure;
  readonly cost: number;
  readonly km: number;
}

export const buildRoad = (infrastructure: Infrastructure, grade: RoadGrade): RoadBuildResult => {
  const project = ROAD_PROJECTS[grade];

  const coverage = clamp(
    Math.max(
      infrastructure.coverage + project.coverage,
      infrastructure.remoteCoverage + project.remoteCoverage,
    ),
    0,
    100,
  );

  const remoteCoverage = clamp(infrastructure.remoteCoverage + project.remoteCoverage, 0, 100);

  const next: Infrastructure = {
    ...infrastructure,
    dirtKm: infrastructure.dirtKm + (grade === "dirt" ? project.km : 0),
    cobbleKm: infrastructure.cobbleKm + (grade === "cobble" ? project.km : 0),
    asphaltKm: infrastructure.asphaltKm + (grade === "asphalt" ? project.km : 0),
    coverage,
    remoteCoverage,
  };

  return { infrastructure: next, cost: project.cost, km: project.km };
};

export const fleetUpgrade = (infrastructure: Infrastructure, step: number): Infrastructure => ({
  ...infrastructure,
  fleet: infrastructure.fleet + step,
});

export const coverageGap = (infrastructure: Infrastructure): number =>
  Math.max(0, 100 - infrastructure.coverage) + Math.max(0, 100 - infrastructure.remoteCoverage);

export const logisticsEfficiency = (fleet: number): number =>
  clamp(1 - (fleet - 120) / 2_000, 0.82, 1.05);

export const roadQualityIndex = (infrastructure: Infrastructure): number => {
  const total = infrastructure.dirtKm + infrastructure.cobbleKm + infrastructure.asphaltKm;

  if (total === 0) return 0.4;

  return (
    (infrastructure.dirtKm * 0.4 + infrastructure.cobbleKm * 0.7 + infrastructure.asphaltKm * 1) /
    total
  );
};
