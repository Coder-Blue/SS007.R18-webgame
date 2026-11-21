import type { Result, TariffTiers } from "./types";
import { err, ok } from "./types";
import {
  TARIFF_BANDS,
  TARIFF_WEIGHTS,
  WORKSHOP_TARIFF_MAX,
  WORKSHOP_TARIFF_MIN,
} from "./constants";

export const averageHouseholdTariff = (tiers: TariffTiers): number =>
  tiers.tiers.reduce((sum, price, index) => {
    const weight = TARIFF_WEIGHTS[index]!;

    return sum + price * weight;
  }, 0);

export interface RevenueSplit {
  readonly household: number;
  readonly workshop: number;
  readonly total: number;
}

export const computeRevenue = (
  householdDemand: number,
  workshopDemand: number,
  tariffs: TariffTiers,
  servedRatio: number,
): RevenueSplit => {
  const household = householdDemand * averageHouseholdTariff(tariffs) * servedRatio;
  const workshop = workshopDemand * tariffs.workshop * servedRatio;

  return { household, workshop, total: household + workshop };
};

export const validateTariffs = (
  tiers: readonly number[],
  workshop: number,
  ceiling: number,
): Result<TariffTiers> => {
  if (tiers.length !== 4) return err("tariff.missing-tier");

  for (let index = 0; index < tiers.length; index += 1) {
    const band = TARIFF_BANDS[index]!;
    const price = tiers[index]!;

    if (price < band[0] || price > band[1]) {
      return err("tariff.out-of-band");
    }

    if (index > 0) {
      const previous = tiers[index - 1];

      if (previous === undefined || price <= previous) {
        return err("tariff.not-progressive");
      }
    }
  }

  if (workshop < WORKSHOP_TARIFF_MIN || workshop > WORKSHOP_TARIFF_MAX) {
    return err("tariff.workshop-out-of-band");
  }

  const candidate: TariffTiers = {
    tiers: [tiers[0]!, tiers[1]!, tiers[2]!, tiers[3]!],
    workshop,
    ceiling,
  };

  if (averageHouseholdTariff(candidate) > ceiling + 1e-9) {
    return err("tariff.above-ceiling");
  }

  return ok(candidate);
};

export const withCeiling = (tariffs: TariffTiers, ceiling: number): TariffTiers => ({
  ...tariffs,
  ceiling,
});

export const tariffBurden = (average: number, medianIncomeIndex: number): number =>
  (average / Math.max(0.5, medianIncomeIndex)) * 10;
