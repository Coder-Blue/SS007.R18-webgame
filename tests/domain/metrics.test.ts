import { describe, expect, it } from "vitest";
import { createInitialState } from "../../src/domain/constants";
import {
  advanceMetrics,
  nextIndustrialOutput,
  nextInflation,
  nextSatisfaction,
  nextTrust,
  reliabilityOf,
  type MetricContext,
} from "../../src/domain/metrics";

const initial = createInitialState();

const context = (overrides: Partial<MetricContext> = {}): MetricContext => ({
  previous: initial.metrics,
  reliability: 100,
  infrastructure: initial.infrastructure,
  tariffs: initial.tariffs,
  market: initial.market,
  policy: initial.policy,
  flags: [],
  industrialOutput: 100,
  ...overrides,
});

describe("metrics", () => {
  it("computes reliability and handles empty demand", () => {
    expect(reliabilityOf(90, 100)).toBe(90);
    expect(reliabilityOf(120, 100)).toBe(100);
    expect(reliabilityOf(10, 0)).toBe(100);
    expect(reliabilityOf(0, 100)).toBe(0);
  });

  it("smooths inflation from tariff and rice changes", () => {
    const steady = nextInflation(3, 10.58, 10.58, 12, 12, 0.55);
    expect(steady).toBeCloseTo(3);
    const raised = nextInflation(3, 12, 10, 14, 12, 0.8);
    expect(raised).toBeGreaterThan(3);
    const unknownBase = nextInflation(3, 10, 0, 12, 0, 0.55);
    expect(unknownBase).toBe(3);
  });

  it("grows industrial output with cheap tariff and reliability", () => {
    const cheap = nextIndustrialOutput(100, 100, 7, initial.policy, 3);
    const expensive = nextIndustrialOutput(100, 90, 9, initial.policy, 10);
    expect(cheap).toBeGreaterThan(100);
    expect(expensive).toBeLessThan(100);
    expect(nextIndustrialOutput(170, 100, 6, initial.policy, 2)).toBeLessThanOrEqual(175);
  });

  it("adds reform pull and inflation drag", () => {
    const reform = {
      ...initial.policy,
      dppa: true,
      vrem: true,
      nsmo: true,
    };

    const withReform = nextIndustrialOutput(100, 100, 7.4, reform, 3);
    const without = nextIndustrialOutput(100, 100, 7.4, initial.policy, 3);
    expect(withReform).toBeGreaterThan(without);
    expect(nextIndustrialOutput(100, 100, 7.4, initial.policy, 12)).toBeLessThan(
      nextIndustrialOutput(100, 100, 7.4, initial.policy, 3),
    );
  });

  it("computes satisfaction from coverage, tariff and flags", () => {
    const base = nextSatisfaction(context());

    const universal = nextSatisfaction(
      context({
        infrastructure: { ...initial.infrastructure, coverage: 100, remoteCoverage: 100 },
      }),
    );

    const strained = nextSatisfaction(
      context({
        reliability: 60,
        tariffs: { ...initial.tariffs, tiers: [9.4, 11.8, 15.4, 19.5], workshop: 9.2 },
        flags: ["bribe_accepted"],
      }),
    );

    expect(universal).toBeGreaterThan(base);
    expect(strained).toBeLessThan(base);
    expect(
      nextSatisfaction(context({ policy: { ...initial.policy, antiSmuggling: true } })),
    ).toBeGreaterThan(base);
    expect(nextSatisfaction(context({ flags: ["farmers_helped"] }))).toBeGreaterThan(base);
  });

  it("computes trust from reforms, debate and scandals", () => {
    const base = nextTrust({ ...context(), metricsDebate: 50 }, 4);

    const reformed = nextTrust(
      {
        ...context({
          policy: {
            ...initial.policy,
            n2Enabled: true,
            nsmo: true,
            dppa: true,
            vrem: true,
          },
        }),
        metricsDebate: 80,
      },
      4,
    );

    const scandal = nextTrust(
      {
        ...context({
          flags: ["bribe_accepted", "smuggling_rampant", "privatization_accepted"],
        }),
        metricsDebate: 20,
      },
      10,
    );

    expect(reformed).toBeGreaterThan(base);
    expect(scandal).toBeLessThan(base);
    expect(nextTrust({ ...context(), metricsDebate: 50 }, 20)).toBeLessThan(base);
  });

  it("composes the monthly metric step", () => {
    const step = advanceMetrics(context(), 10.58, 12);
    expect(step.averageTariff).toBeCloseTo(10.58);
    expect(step.metrics.reliability).toBe(100);
    expect(step.metrics.industrialOutput).toBeGreaterThan(100);
    expect(step.metrics.trust).toBeGreaterThan(0);
  });
});
