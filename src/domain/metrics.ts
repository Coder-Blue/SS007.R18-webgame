import type { Infrastructure, Market, Metrics, Policy, TariffTiers } from "./types";
import { clamp } from "./clock";
import { averageHouseholdTariff } from "./tariffs";
import { N2_RATE_DEFAULT } from "./constants";

export const reliabilityOf = (supplied: number, demand: number): number => {
  if (demand <= 0) return 100;

  return clamp((supplied / demand) * 100, 0, 100);
};

export interface MetricContext {
  readonly previous: Metrics;
  readonly reliability: number;
  readonly infrastructure: Infrastructure;
  readonly tariffs: TariffTiers;
  readonly market: Market;
  readonly policy: Policy;
  readonly flags: readonly string[];
  readonly industrialOutput: number;
}

export const nextInflation = (
  previous: number,
  averageTariff: number,
  previousTariff: number,
  ricePrice: number,
  previousRicePrice: number,
  recoveryRate: number,
): number => {
  const tariffChange =
    previousTariff > 0 ? ((averageTariff - previousTariff) / previousTariff) * 100 : 0;

  const riceChange =
    previousRicePrice > 0 ? ((ricePrice - previousRicePrice) / previousRicePrice) * 100 : 0;

  const recoveryPush = Math.max(0, recoveryRate - N2_RATE_DEFAULT) * 2.4;
  const target = 3 + tariffChange * 1.1 + riceChange * 0.45 + recoveryPush;

  return clamp(previous + (target - previous) * 0.35, 0, 28);
};

export const nextIndustrialOutput = (
  previous: number,
  reliability: number,
  workshopTariff: number,
  policy: Policy,
  inflation: number,
): number => {
  const reliabilityPull = (reliability - 95) * 0.0012;
  const tariffPull = (8 - workshopTariff) * 0.002;

  const reformPull =
    (policy.dppa ? 0.0018 : 0) + (policy.vrem ? 0.0015 : 0) + (policy.nsmo ? 0.0008 : 0);

  const inflationDrag = inflation > 8 ? -0.0025 : 0;

  return clamp(previous * (1 + reliabilityPull + tariffPull + reformPull + inflationDrag), 65, 175);
};

export const nextSatisfaction = (context: MetricContext): number => {
  const averageTariff = averageHouseholdTariff(context.tariffs);

  const target =
    70 +
    (context.reliability - 95) * 1.25 +
    (context.infrastructure.coverage - 60) * 0.2 +
    (context.infrastructure.remoteCoverage - 30) * 0.16 -
    Math.max(0, averageTariff - 10.5) * 1.65 -
    Math.max(0, context.tariffs.workshop - 7.4) * 2.1 +
    (context.industrialOutput - 100) * 0.12 +
    (context.policy.antiSmuggling ? 2 : 0) +
    (context.flags.includes("farmers_helped") ? 3 : 0) +
    (context.flags.includes("bribe_accepted") ? -4 : 0);

  return clamp(
    context.previous.satisfaction + (target - context.previous.satisfaction) * 0.35,
    0,
    100,
  );
};

export const nextTrust = (context: MetricsDebateContext, inflation: number): number => {
  const averageTariff = averageHouseholdTariff(context.tariffs);

  const reformBonus =
    (context.policy.n2Enabled ? 4 : 0) +
    (context.policy.nsmo ? 2 : 0) +
    (context.policy.dppa ? 2 : 0) +
    (context.policy.vrem ? 2 : 0);

  const scandal =
    (context.flags.includes("bribe_accepted") ? 9 : 0) +
    (context.flags.includes("smuggling_rampant") ? 6 : 0) +
    (context.flags.includes("privatization_accepted") ? 60 : 0);

  const target =
    58 +
    context.infrastructure.coverage * 0.22 +
    (context.industrialOutput - 100) * 0.1 -
    inflation * 1.45 +
    (context.reliability - 95) * 0.4 +
    (context.metricsDebate - 50) * 0.12 +
    reformBonus -
    Math.max(0, averageTariff - 12) * 1.2 -
    Math.max(0, context.tariffs.workshop - 8) * 1.8 -
    scandal;

  return clamp(context.previous.trust + (target - context.previous.trust) * 0.32, 0, 100);
};

export interface MetricsDebateContext extends MetricContext {
  readonly metricsDebate: number;
}

export interface MetricsStep {
  readonly metrics: Metrics;
  readonly averageTariff: number;
}

export const advanceMetrics = (
  context: MetricContext,
  previousTariff: number,
  previousRicePrice: number,
): MetricsStep => {
  const averageTariff = averageHouseholdTariff(context.tariffs);

  const inflation = nextInflation(
    context.previous.inflation,
    averageTariff,
    previousTariff,
    context.market.ricePrice,
    previousRicePrice,
    context.policy.n2Rate,
  );

  const industrialOutput = nextIndustrialOutput(
    context.industrialOutput,
    context.reliability,
    context.tariffs.workshop,
    context.policy,
    inflation,
  );

  const withIndustry: MetricContext = { ...context, industrialOutput };
  const satisfaction = nextSatisfaction(withIndustry);

  const debateContext: MetricsDebateContext = {
    ...withIndustry,
    metricsDebate: context.previous.debateScore,
  };

  const trust = nextTrust(debateContext, inflation);

  return {
    metrics: {
      ...context.previous,
      satisfaction,
      trust,
      inflation,
      industrialOutput,
      reliability: context.reliability,
    },
    averageTariff,
  };
};
