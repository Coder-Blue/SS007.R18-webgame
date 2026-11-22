import { describe, expect, it } from "vitest";
import {
  advanceMetrics,
  citizenTarget,
  institutionalTarget,
  nextIndustrialOutput,
  nextInflation,
} from "../../src/domain/metrics";
import { baseState } from "./test-helpers";

const context = () => {
  const state = baseState();

  return {
    previous: state.metrics,
    reliability: 98,
    reserveMargin: 25,
    coverage: 80,
    averageTariff: 2_450,
    previousAverageTariff: 2_440,
    industrialTariff: 1_750,
    fuelPriceIndex: 1.05,
    previousFuelPriceIndex: 1,
    mediaActive: false,
    branch: state.policy.branch,
    completedMissions: 1,
    missionProgress: 60,
    netResult: -500,
    debt: 40_000,
    policy: state.policy,
  };
};

describe("metrics", () => {
  it("moves inflation toward tariff and fuel pressure", () => {
    expect(nextInflation(3, 2_500, 0, 1, 1, 0.55)).toBeGreaterThan(3);
    expect(nextInflation(3, 2_400, 2_400, 1, 1, 0.55)).toBeLessThan(20);
    expect(nextInflation(29, 2_400, 2_400, 1, 1, 0.55)).toBeLessThanOrEqual(30);
  });

  it("grows industrial output with reliability and reforms", () => {
    const state = baseState();

    expect(nextIndustrialOutput(100, 100, 1_700, state.policy, 4)).toBeGreaterThan(100);
    expect(nextIndustrialOutput(100, 80, 1_900, state.policy, 9)).toBeLessThan(100);
    expect(nextIndustrialOutput(60, 100, 1_700, state.policy, 4)).toBeGreaterThanOrEqual(55);
    expect(
      nextIndustrialOutput(
        160,
        100,
        1_700,
        { ...state.policy, dppa: true, vrem: true, nsmo: true },
        4,
      ),
    ).toBeLessThanOrEqual(165);
  });

  it("derives trust targets from service and legitimacy", () => {
    const ctx = context();

    expect(citizenTarget(ctx, 4)).toBeGreaterThan(0);
    expect(citizenTarget({ ...ctx, reliability: 0 }, 30)).toBe(0);
    expect(institutionalTarget(ctx, 4)).toBeGreaterThan(0);
    expect(
      institutionalTarget(
        { ...ctx, coverage: 0, debt: 200_000, netResult: -5_000, reliability: 0 },
        30,
      ),
    ).toBe(0);
  });

  it("advances trust with media and private-branch decay", () => {
    const step = advanceMetrics(context());

    expect(step.metrics.reliability).toBe(98);
    expect(step.metrics.reserveMargin).toBe(25);
    expect(step.metrics.inflation).toBeGreaterThan(0);

    const media = advanceMetrics({ ...context(), mediaActive: true });
    const privateBranch = advanceMetrics({ ...context(), branch: "private" });

    expect(media.metrics.citizenTrust).toBeLessThan(step.metrics.citizenTrust);
    expect(privateBranch.metrics.citizenTrust).toBeLessThan(step.metrics.citizenTrust);
  });

  it("clamps trust at zero and one hundred", () => {
    const low = advanceMetrics({
      ...context(),
      previous: { ...baseState().metrics, citizenTrust: 0, institutionalTrust: 0 },
      reliability: 0,
      reserveMargin: 0,
      coverage: 0,
      mediaActive: true,
      branch: "private",
      netResult: -5_000,
      debt: 200_000,
    });

    expect(low.metrics.citizenTrust).toBe(0);
    expect(low.metrics.institutionalTrust).toBe(0);

    const high = advanceMetrics({
      ...context(),
      previous: { ...baseState().metrics, citizenTrust: 100, institutionalTrust: 100 },
      reliability: 110,
      coverage: 120,
      completedMissions: 3,
      netResult: 10_000,
    });

    expect(high.metrics.citizenTrust).toBeLessThanOrEqual(100);
    expect(high.metrics.institutionalTrust).toBeLessThanOrEqual(100);
  });
});
