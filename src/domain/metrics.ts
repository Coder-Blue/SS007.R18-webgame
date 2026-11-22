import type { Metrics, Policy } from "./types";
import { clamp } from "./clock";
import { RECOVERY_RATE_DEFAULT } from "./constants";

export type MetricContext = {
  readonly previous: Metrics;
  readonly reliability: number;
  readonly reserveMargin: number;
  readonly coverage: number;
  readonly averageTariff: number;
  readonly previousAverageTariff: number;
  readonly industrialTariff: number;
  readonly fuelPriceIndex: number;
  readonly previousFuelPriceIndex: number;
  readonly mediaActive: boolean;
  readonly branch: Policy["branch"];
  readonly completedMissions: number;
  readonly missionProgress: number;
  readonly netResult: number;
  readonly debt: number;
  readonly policy: Policy;
};

export type MetricStep = {
  readonly metrics: Metrics;
};

export const nextInflation = (
  previous: number,
  averageTariff: number,
  previousTariff: number,
  fuelPriceIndex: number,
  previousFuel: number,
  recoveryRate: number,
): number => {
  const tariffChange =
    previousTariff > 0 ? ((averageTariff - previousTariff) / previousTariff) * 100 : 0;

  const fuelChange = (fuelPriceIndex - previousFuel) * 100;
  const recoveryPush = Math.max(0, recoveryRate - RECOVERY_RATE_DEFAULT) * 1.8;
  const target = 3.2 + tariffChange * 0.55 + fuelChange * 0.04 + recoveryPush;

  return clamp(previous + (target - previous) * 0.32, 0, 30);
};

export const nextIndustrialOutput = (
  previous: number,
  reliability: number,
  industrialTariff: number,
  policy: Policy,
  inflation: number,
): number => {
  const reliabilityPull = (reliability - 96) * 0.0014;
  const tariffPull = (1_750 - industrialTariff) * 0.00004;

  const reformPull =
    (policy.dppa ? 0.0018 : 0) + (policy.vrem ? 0.0015 : 0) + (policy.nsmo ? 0.0008 : 0);

  const inflationDrag = inflation > 8 ? -0.0025 : 0;
  const privateDrag = policy.branch === "private" ? -0.004 : 0;

  return clamp(
    previous * (1 + reliabilityPull + tariffPull + reformPull + inflationDrag + privateDrag),
    55,
    165,
  );
};

export const citizenTarget = (context: MetricContext, inflation: number): number => {
  const blackout = Math.max(0, 95 - context.reliability) * 1.45;
  const pricePressure = Math.max(0, context.averageTariff - 2_400) * 0.028;
  const missionBonus = context.completedMissions * 2.2 + context.missionProgress * 0.025;

  return clamp(
    72 +
      (context.reliability - 96) * 1.1 +
      (context.coverage - 60) * 0.16 -
      pricePressure -
      blackout -
      Math.max(0, inflation - 8) * 0.8 +
      missionBonus,
    0,
    100,
  );
};

export const institutionalTarget = (context: MetricContext, inflation: number): number => {
  const lossDrag = context.netResult < 0 ? Math.min(9, Math.abs(context.netResult) / 260) : 0;
  const debtDrag = Math.max(0, context.debt / 1_000 - 30) * 0.18;
  const missionBonus = context.completedMissions * 3.4 + context.missionProgress * 0.02;

  return clamp(
    58 +
      context.coverage * 0.14 +
      (context.reliability - 96) * 0.5 -
      inflation * 1.35 -
      lossDrag -
      debtDrag +
      missionBonus +
      (context.policy.n2Enabled ? 2 : 0) +
      (context.policy.nsmo ? 1.5 : 0) +
      (context.policy.dppa ? 1.5 : 0) +
      (context.policy.vrem ? 1.5 : 0),
    0,
    100,
  );
};

export const advanceMetrics = (context: MetricContext): MetricStep => {
  const inflation = nextInflation(
    context.previous.inflation,
    context.averageTariff,
    context.previousAverageTariff,
    context.fuelPriceIndex,
    context.previousFuelPriceIndex,
    context.policy.n2Rate,
  );

  const industrialOutput = nextIndustrialOutput(
    context.previous.industrialOutput,
    context.reliability,
    context.industrialTariff,
    context.policy,
    inflation,
  );

  const mediaDecay = context.mediaActive ? 1.15 : 0;
  const privateDecay = context.branch === "private" ? 2.1 : 0;
  const lossDecay = context.netResult < 0 ? Math.min(1.4, Math.abs(context.netResult) / 900) : 0;

  const citizen = clamp(
    context.previous.citizenTrust +
      (citizenTarget(context, inflation) - context.previous.citizenTrust) * 0.3 -
      mediaDecay -
      privateDecay,
    0,
    100,
  );

  const institutional = clamp(
    context.previous.institutionalTrust +
      (institutionalTarget(context, inflation) - context.previous.institutionalTrust) * 0.2 -
      lossDecay,
    0,
    100,
  );

  return {
    metrics: {
      ...context.previous,
      citizenTrust: citizen,
      institutionalTrust: institutional,
      inflation,
      industrialOutput,
      reliability: context.reliability,
      reserveMargin: context.reserveMargin,
    },
  };
};
