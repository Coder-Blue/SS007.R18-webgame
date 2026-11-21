import { describe, expect, it } from "vitest";
import { createInitialState } from "../../src/domain/constants";
import {
  evaluateEarlyEnding,
  evaluateFinalEnding,
  finalReliability,
  withEndingCheck,
  withFinalCheck,
} from "../../src/domain/endings";

const initial = createInitialState();

describe("endings", () => {
  it("detects debt, unrest, dismissal and premature privatization", () => {
    expect(
      evaluateEarlyEnding({ ...initial, finance: { ...initial.finance, debt: 60_001 } })?.reason,
    ).toBe("debt");
    expect(
      evaluateEarlyEnding({ ...initial, metrics: { ...initial.metrics, satisfaction: 0 } })?.reason,
    ).toBe("unrest");
    expect(
      evaluateEarlyEnding({ ...initial, metrics: { ...initial.metrics, trust: 0 } })?.reason,
    ).toBe("deposed");
    expect(
      evaluateEarlyEnding({
        ...initial,
        events: { ...initial.events, flags: ["privatization_accepted"] },
      })?.reason,
    ).toBe("privatization");
    expect(evaluateEarlyEnding(initial)).toBeNull();
  });

  it("reads final reliability from the current annual report", () => {
    const state = {
      ...initial,
      clock: { year: 2026, month: 12, tick: 59 },
      finance: {
        ...initial.finance,
        annualHistory: [
          {
            year: 2026,
            revenue: 1,
            costs: 1,
            netResult: 0,
            debtEnd: 10_000,
            coverage: 100,
            trustAverage: 60,
            satisfactionAverage: 60,
            reliability: 96,
            inflationAverage: 4,
          },
        ],
      },
    };

    expect(finalReliability(state)).toBe(96);
    expect(finalReliability(initial)).toBe(initial.metrics.reliability);
  });

  it("awards the architect ending only to a complete reformer", () => {
    const state = {
      ...initial,
      clock: { year: 2026, month: 12, tick: 59 },
      finance: { ...initial.finance, debt: 10_000 },
      infrastructure: { ...initial.infrastructure, coverage: 100, remoteCoverage: 100 },
      policy: { ...initial.policy, n2Enabled: true, dppa: true, vrem: true },
      metrics: {
        ...initial.metrics,
        trust: 60,
        satisfaction: 60,
        reliability: 99,
      },
    };

    expect(evaluateFinalEnding(state).id).toBe("architect");
    expect(
      evaluateFinalEnding({
        ...state,
        infrastructure: { ...state.infrastructure, remoteCoverage: 99 },
      }).id,
    ).toBe("collapse");
    expect(
      evaluateFinalEnding({
        ...state,
        policy: { ...state.policy, vrem: false },
      }).id,
    ).toBe("collapse");
  });

  it("awards the predator ending to a rich, captured operator", () => {
    const state = {
      ...initial,
      clock: { year: 2026, month: 12, tick: 59 },
      finance: { ...initial.finance, cash: 30_000 },
      metrics: { ...initial.metrics, satisfaction: 40 },
      events: { ...initial.events, flags: ["bribe_accepted"] },
    };

    expect(evaluateFinalEnding(state).id).toBe("predator");
    expect(
      evaluateFinalEnding({
        ...state,
        events: { ...state.events, flags: ["smuggling_rampant"] },
      }).id,
    ).toBe("predator");
    expect(
      evaluateFinalEnding({
        ...state,
        finance: { ...state.finance, cash: 10_000 },
      }).id,
    ).toBe("collapse");
  });

  it("applies early and final ending guards", () => {
    const ended = {
      ...initial,
      ending: { id: "collapse" as const, reason: "debt" as const, year: 2022, month: 1 },
    };

    expect(withEndingCheck(ended)).toBe(ended);
    expect(
      withEndingCheck({ ...initial, finance: { ...initial.finance, debt: 61_000 } }).phase,
    ).toBe("ended");
    expect(withEndingCheck(initial)).toBe(initial);
    expect(withFinalCheck(initial)).toBe(initial);

    const december = {
      ...initial,
      clock: { year: 2026, month: 12, tick: 59 },
      finance: { ...initial.finance, debt: 40_000 },
    };

    expect(withFinalCheck(december).phase).toBe("ended");
    expect(withFinalCheck(ended)).toBe(ended);
  });
});
