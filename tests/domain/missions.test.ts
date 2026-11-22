import { describe, expect, it } from "vitest";
import {
  advanceMissions,
  missionProgressScore,
  missionStatus,
  reformsEnabled,
} from "../../src/domain/missions";
import { baseState } from "./test-helpers";

describe("missions", () => {
  it("reports three long-term duties", () => {
    const state = baseState();

    expect(missionStatus(state)).toHaveLength(3);
    expect(reformsEnabled(state)).toBe(0);
    expect(missionProgressScore(state)).toBeGreaterThan(0);
  });

  it("completes electrification when all zones reach 100", () => {
    const state = {
      ...baseState(),
      zones: {
        urban: { ...baseState().zones.urban, coverage: 100 },
        industrial: { ...baseState().zones.industrial, coverage: 100 },
        rural: { ...baseState().zones.rural, coverage: 100 },
      },
    };

    expect(missionStatus(state)[0]?.done).toBe(true);
  });

  it("completes the market duty with reliable supply and reforms", () => {
    const state = baseState();

    const reformed = {
      ...state,
      policy: { ...state.policy, n2Enabled: true, nsmo: true, dppa: true },
      metrics: { ...state.metrics, reliability: 99 },
    };

    expect(missionStatus(reformed)[1]?.done).toBe(true);
  });

  it("counts a reserve streak and rewards completion once", () => {
    const state = baseState();
    let missions = state.missions;
    let completions = 0;

    for (let index = 0; index < 13; index += 1) {
      const step = advanceMissions({ ...state, missions }, 20, 100);

      completions += step.completed.length;
      missions = step.missions;
    }

    expect(completions).toBe(1);
    expect(missions.reserveStreak).toBe(13);
    expect(missions.completed).toContain("security");
  });

  it("resets the streak when reserve or reliability fails", () => {
    const state = baseState();

    expect(advanceMissions(state, 5, 100).missions.reserveStreak).toBe(0);
    expect(advanceMissions(state, 20, 80).missions.reserveStreak).toBe(0);
  });
});
