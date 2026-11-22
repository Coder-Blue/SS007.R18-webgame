import type { TariffTiers } from "./types";
import { err, ok, type Result } from "./types";
import {
  INDUSTRIAL_TARIFF_MAX,
  INDUSTRIAL_TARIFF_MIN,
  TARIFF_BANDS,
  TARIFF_WEIGHTS,
} from "./constants";

export type TariffInput = {
  readonly tiers: readonly [number, number, number, number, number, number];
  readonly industrial: number;
};

export const averageHouseholdTariff = (tariffs: TariffTiers): number => {
  const [t1, t2, t3, t4, t5, t6] = tariffs.tiers;
  const [w1, w2, w3, w4, w5, w6] = TARIFF_WEIGHTS;

  return t1 * w1 + t2 * w2 + t3 * w3 + t4 * w4 + t5 * w5 + t6 * w6;
};

export const averageOfTiers = (
  tiers: readonly [number, number, number, number, number, number],
): number => {
  const [t1, t2, t3, t4, t5, t6] = tiers;
  const [w1, w2, w3, w4, w5, w6] = TARIFF_WEIGHTS;

  return t1 * w1 + t2 * w2 + t3 * w3 + t4 * w4 + t5 * w5 + t6 * w6;
};

export const tariffChangePct = (current: number, next: number): number =>
  current <= 0 ? 0 : ((next - current) / current) * 100;

export const validateTariffs = (input: TariffInput, ceiling: number): Result<TariffTiers> => {
  const entries = [
    [input.tiers[0], TARIFF_BANDS[0]],
    [input.tiers[1], TARIFF_BANDS[1]],
    [input.tiers[2], TARIFF_BANDS[2]],
    [input.tiers[3], TARIFF_BANDS[3]],
    [input.tiers[4], TARIFF_BANDS[4]],
    [input.tiers[5], TARIFF_BANDS[5]],
  ] as const;

  let previous = Number.NEGATIVE_INFINITY;

  for (const [value, band] of entries) {
    if (!Number.isFinite(value)) return err("tariff.invalid-value");

    if (value < band[0] || value > band[1]) return err("tariff.out-of-band");

    if (value <= previous) return err("tariff.not-progressive");
    previous = value;
  }

  if (
    !Number.isFinite(input.industrial) ||
    input.industrial < INDUSTRIAL_TARIFF_MIN ||
    input.industrial > INDUSTRIAL_TARIFF_MAX
  ) {
    return err("tariff.industrial-out-of-band");
  }

  const average = averageOfTiers(input.tiers);

  if (average > ceiling) return err("tariff.above-ceiling");

  return ok({ tiers: input.tiers, industrial: input.industrial, ceiling });
};

export const residentialRevenue = (energyMillionKwh: number, average: number): number =>
  (energyMillionKwh * average) / 1_000;

export const industrialRevenue = (energyMillionKwh: number, tariff: number): number =>
  (energyMillionKwh * tariff) / 1_000;

export const lossFactor = (gridStrength: number): number => {
  const factor = 0.09 - gridStrength * 0.0005;

  return Math.max(0.04, factor);
};
