import type { Clock, Infrastructure, Market, Metrics, Village } from "./types";
import { clamp, seasonFactor } from "./clock";
import { randomBetween } from "./rng";

export interface Demand {
  readonly household: number;
  readonly workshop: number;
  readonly total: number;
  readonly externalOffer: number;
}

const scriptedDrought = (year: number, month: number): number => {
  const summer = month >= 5 && month <= 8;

  if (year === 2022) return summer ? 0.78 : 0.28;

  if (year === 2023) return summer ? 0.82 : 0.34;

  if (year === 2024) return summer ? 0.46 : 0.24;

  if (year === 2025) return summer ? 0.28 : 0.18;

  return summer ? 0.38 : 0.2;
};

export const computeDemand = (
  village: Village,
  infrastructure: Infrastructure,
  market: Market,
  metrics: Metrics,
  clock: Clock,
): Demand => {
  const connectedShare = 0.55 + 0.45 * (infrastructure.coverage / 100);

  const household =
    village.householdsThousand *
    connectedShare *
    0.55 *
    seasonFactor(clock.month) *
    market.demandIndex;

  const workshop =
    village.workshopsThousand *
    18 *
    (metrics.industrialOutput / 100) *
    (1 + (market.demandIndex - 1) * 0.5);

  const total = household + workshop;
  const externalOffer = total * market.privateShare * market.externalSupplyFactor;

  return { household, workshop, total, externalOffer };
};

export interface MarketStep {
  readonly market: Market;
  readonly seed: number;
}

export const advanceMarket = (
  market: Market,
  clock: Clock,
  inflation: number,
  seed: number,
): MarketStep => {
  const droughtStep = randomBetween(seed, -0.06, 0.06);
  const drought = clamp(scriptedDrought(clock.year, clock.month) + droughtStep.value, 0, 1);
  const riceStep = randomBetween(droughtStep.seed, -0.6, 0.65);
  const inflationPull = 12 * (1 + inflation / 400);
  const droughtPush = drought * 0.35;

  const ricePrice = clamp(
    market.ricePrice + (inflationPull - market.ricePrice) * 0.035 + riceStep.value + droughtPush,
    9.5,
    28,
  );

  const fertilizerStep = randomBetween(riceStep.seed, -0.35, 0.4);

  const fertilizerPrice = clamp(
    market.fertilizerPrice +
      (8.4 * (1 + inflation / 500) - market.fertilizerPrice) * 0.04 +
      fertilizerStep.value,
    6.2,
    16,
  );

  const fuelStep = randomBetween(fertilizerStep.seed, -0.6, 0.7);

  const fuelPrice = clamp(
    market.fuelPrice +
      (22 * (1 + inflation / 450) - market.fuelPrice) * 0.04 +
      fuelStep.value +
      drought * 0.2,
    16,
    38,
  );

  const exchangeStep = randomBetween(fuelStep.seed, -0.012, 0.016);

  const exchangeRate = clamp(
    market.exchangeRate + exchangeStep.value + Math.max(0, inflation - 4) * 0.002,
    0.96,
    1.24,
  );

  const supplyStep = randomBetween(exchangeStep.seed, -0.03, 0.03);

  const externalSupplyFactor = clamp(
    1 - drought * 0.12 - Math.max(0, ricePrice - 16) * 0.018 + supplyStep.value,
    0.62,
    1,
  );

  const demandStep = randomBetween(supplyStep.seed, -0.008, 0.008);

  const demandIndex = clamp(
    1 + (clock.year - 2022) * 0.012 + demandStep.value + Math.max(0, inflation - 5) * 0.002,
    0.9,
    1.35,
  );

  const privateStep = randomBetween(demandStep.seed, -0.015, 0.015);
  const privateShare = clamp(market.privateShare + privateStep.value, 0.54, 0.62);

  return {
    market: {
      ricePrice,
      fertilizerPrice,
      fuelPrice,
      exchangeRate,
      drought,
      privateShare,
      demandIndex,
      externalSupplyFactor,
    },
    seed: privateStep.seed,
  };
};

export const growVillage = (village: Village): Village => ({
  householdsThousand: village.householdsThousand * 1.035,
  remoteHouseholdsThousand: village.remoteHouseholdsThousand * 1.012,
  workshopsThousand: village.workshopsThousand * 1.05,
});

export const fertilizerIndex = (market: Market): number => market.fertilizerPrice / 8.4;

export const fuelIndex = (market: Market): number => market.fuelPrice / 22;

export const exchangeIndex = (market: Market): number => market.exchangeRate;
