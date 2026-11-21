import type { Market, Metrics, Production } from "./types";
import { fertilizerIndex, fuelIndex } from "./market";

export interface ProductionResult {
  readonly hydro: number;
  readonly mechanized: number;
  readonly ownProduction: number;
  readonly costPerTonne: number;
  readonly productionCost: number;
}

export const productionCostPerTonne = (market: Market, rndLevel: number): number =>
  8.4 *
  (0.55 + 0.45 * fertilizerIndex(market)) *
  (0.8 + 0.2 * fuelIndex(market)) *
  (1 - 0.02 * rndLevel);

export const computeProduction = (
  production: Production,
  market: Market,
  metrics: Metrics,
): ProductionResult => {
  const hydro =
    production.hydroPaddies * 24 * (1 - 0.55 * market.drought) * (1 + 0.02 * production.rndLevel);

  const fertilizerFactor = Math.max(0.82, 1 - Math.max(0, fertilizerIndex(market) - 1) * 0.18);

  const mechanized =
    production.mechanizedPaddies *
    30 *
    (1 + 0.05 * production.irrigationLevel) *
    (1 + 0.03 * production.rndLevel) *
    fertilizerFactor *
    Math.max(0.85, Math.min(1.05, metrics.industrialOutput / 100));

  const costPerTonne = productionCostPerTonne(market, production.rndLevel);
  const ownProduction = hydro + mechanized;

  return {
    hydro,
    mechanized,
    ownProduction,
    costPerTonne,
    productionCost: ownProduction * costPerTonne,
  };
};

export const fleetCost = (fleet: number, market: Market): number =>
  fleet * 0.38 * fuelIndex(market);

export const roadMaintenanceCost = (dirtKm: number, cobbleKm: number, asphaltKm: number): number =>
  dirtKm * 0.12 + cobbleKm * 0.28 + asphaltKm * 0.5;

export const staffCost = (workshopsThousand: number): number => 280 + workshopsThousand * 3;
