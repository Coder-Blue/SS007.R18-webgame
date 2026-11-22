import { describe, expect, it } from "vitest";
import {
  evaluateEarlyEnding,
  evaluateFinalEnding,
  withEndingCheck,
  withFinalCheck,
} from "../../src/domain/endings";
import { baseState } from "./test-helpers";

const complete = () => {
  const state = baseState();

  return {
    ...state,
    zones: {
      urban: { ...state.zones.urban, coverage: 100 },
      industrial: { ...state.zones.industrial, coverage: 100 },
      rural: { ...state.zones.rural, coverage: 100 },
    },
    policy: { ...state.policy, n2Enabled: true, nsmo: true, dppa: true, vrem: true },
    metrics: { ...state.metrics, citizenTrust: 70, institutionalTrust: 70 },
  };
};

describe("endings", () => {
  it("ends on zero citizen trust", () => {
    const state = baseState();

    expect(
      evaluateEarlyEnding({ ...state, metrics: { ...state.metrics, citizenTrust: 0 } })?.reason,
    ).toBe("citizen-trust");
  });

  it("ends on zero institutional trust", () => {
    const state = baseState();

    expect(
      evaluateEarlyEnding({ ...state, metrics: { ...state.metrics, institutionalTrust: 0 } })
        ?.reason,
    ).toBe("institutional-trust");
  });

  it("ends above the debt limit", () => {
    const state = baseState();

    expect(
      evaluateEarlyEnding({ ...state, finance: { ...state.finance, debt: 100_001 } })?.reason,
    ).toBe("debt");
  });

  it("ends after a year in the private branch", () => {
    const state = baseState();

    expect(
      evaluateEarlyEnding({
        ...state,
        policy: { ...state.policy, branch: "private" },
        missions: { ...state.missions, privateMonths: 12 },
      })?.reason,
    ).toBe("privatization");
  });

  it("ends on a grid blackout", () => {
    const state = baseState();

    expect(
      evaluateEarlyEnding({ ...state, metrics: { ...state.metrics, reliability: 40 } })?.reason,
    ).toBe("blackout");
  });

  it("returns null while the run is healthy", () => {
    expect(evaluateEarlyEnding(baseState())).toBeNull();
  });

  it("awards the reformer ending on a complete legitimate term", () => {
    expect(evaluateFinalEnding(complete()).id).toBe("reformer");
  });

  it("awards the caretaker ending when coverage is incomplete", () => {
    expect(evaluateFinalEnding(baseState()).id).toBe("caretaker");
  });

  it("marks a captured corporation when citizens are abandoned", () => {
    const state = baseState();

    expect(
      evaluateFinalEnding({ ...state, metrics: { ...state.metrics, citizenTrust: 30 } }).id,
    ).toBe("captured");
  });

  it("fails the private branch at the final audit", () => {
    const state = baseState();

    expect(
      evaluateFinalEnding({ ...state, policy: { ...state.policy, branch: "private" } }).reason,
    ).toBe("privatization");
  });

  it("wraps early and final checks", () => {
    const ended = withEndingCheck({
      ...baseState(),
      metrics: { ...baseState().metrics, citizenTrust: 0 },
    });

    expect(ended.phase).toBe("ended");
    expect(withEndingCheck(ended)).toBe(ended);
    expect(
      withFinalCheck({ ...baseState(), clock: { year: 2026, month: 12, tick: 59 } }).ending,
    ).not.toBeNull();
    expect(withFinalCheck(baseState())).toEqual(baseState());
  });
});
