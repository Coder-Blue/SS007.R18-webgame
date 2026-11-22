import type { Market, Metrics, Season, Zones } from "./types";
import { clamp, seasonOf } from "./clock";
import { nextRandom } from "./rng";

export type MarketStep = {
  readonly market: Market;
  readonly seed: number;
};

export type ZoneDemand = {
  readonly urban: number;
  readonly industrial: number;
  readonly rural: number;
  readonly total: number;
  readonly connected: number;
};

const SEASON_DEMAND: Readonly<Record<Season, number>> = {
  spring: 0.96,
  summer: 1.14,
  autumn: 1.02,
  winter: 1.06,
};

const SEASON_DROUGHT: Readonly<Record<Season, number>> = {
  spring: 0.2,
  summer: 0.62,
  autumn: 0.34,
  winter: 0.16,
};

const SEASON_RENEWABLE: Readonly<Record<Season, number>> = {
  spring: 0.58,
  summer: 0.66,
  autumn: 0.5,
  winter: 0.42,
};

const walk = (value: number, target: number, pull: number, noise: number, seed: number) => {
  const step = nextRandom(seed);
  const next = value + (target - value) * pull + (step.value - 0.5) * noise;

  return { value: next, seed: step.seed };
};

const refreshSuppliers = (market: Market, seed: number): MarketStep => {
  const step = nextRandom(seed);
  const base = 2_400 + market.fuelPriceIndex * 90 + (step.value - 0.5) * 36;

  const quotes = market.suppliers.map((supplier, index) => {
    const spread = [-9, 0, 11][index] ?? 0;
    const drift = (step.value - 0.5) * 4;

    return {
      ...supplier,
      priceVndPerKwh: Math.round((base + spread + drift) * 10) / 10,
    };
  });

  return {
    market: { ...market, suppliers: quotes },
    seed: step.seed,
  };
};

export const advanceMarket = (
  market: Market,
  month: number,
  metrics: Metrics,
  seed: number,
): MarketStep => {
  const season = seasonOf(month);
  const fuel = walk(market.fuelPriceIndex, 1 + (season === "summer" ? 0.08 : 0), 0.16, 0.05, seed);

  const drought = walk(market.drought, SEASON_DROUGHT[season], 0.22, 0.08, fuel.seed);

  const heat = walk(market.heat, SEASON_DEMAND[season], 0.3, 0.025, drought.seed);

  const renewable = walk(market.renewableFactor, SEASON_RENEWABLE[season], 0.2, 0.07, heat.seed);

  const next: Market = {
    ...market,
    fuelPriceIndex: clamp(fuel.value, 0.8, 2.4),
    coalPrice: Math.round(130 + fuel.value * 28),
    gasPrice: Math.round((8.4 + fuel.value * 2.6) * 10) / 10,
    exchangeRate: Math.round((0.96 + fuel.value * 0.1) * 1_000) / 1_000,
    drought: clamp(drought.value, 0, 1),
    heat: clamp(heat.value, 0.9, 1.22),
    renewableFactor: clamp(renewable.value, 0.25, 0.85),
    demandIndex: Math.min(
      1.35,
      market.demandIndex * (1 + 0.0012 + metrics.industrialOutput * 0.0000008),
    ),
  };

  return refreshSuppliers(next, renewable.seed);
};

export const zoneDemand = (zones: Zones, market: Market, metrics: Metrics): ZoneDemand => {
  const heat = market.heat;
  const factory = metrics.industrialOutput / 100;

  const urban = zones.urban.baseDemandMw * (zones.urban.coverage / 100) * heat;
  const industrial = zones.industrial.baseDemandMw * (zones.industrial.coverage / 100) * factory;
  const rural = zones.rural.baseDemandMw * (zones.rural.coverage / 100) * (0.92 + heat * 0.08);
  const factor = market.demandIndex;
  const total = (urban + industrial + rural) * factor;

  return {
    urban: urban * factor,
    industrial: industrial * factor,
    rural: rural * factor,
    total,
    connected: total,
  };
};

export const peakDemandMw = (averageMw: number): number => averageMw * 1.15;

export const cheapestSupplier = (market: Market): number =>
  Math.min(...market.suppliers.map((supplier) => supplier.priceVndPerKwh));
