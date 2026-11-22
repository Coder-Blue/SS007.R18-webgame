import type { Dispatch, Generation, Market } from "./types";
import { clamp } from "./clock";
import {
  HOURS_PER_MONTH,
  HYDRO_VARIABLE_COST,
  RENEWABLE_PPA_COST,
  THERMAL_FUEL_COST,
} from "./constants";

export type GenerationOutput = {
  readonly hydroMw: number;
  readonly thermalMw: number;
  readonly renewableMw: number;
  readonly importMw: number;
  readonly totalMw: number;
  readonly hydroMillionKwh: number;
  readonly thermalMillionKwh: number;
  readonly renewableMillionKwh: number;
  readonly importMillionKwh: number;
};

export type SupplyStep = {
  readonly output: GenerationOutput;
  readonly supplyMw: number;
  readonly costSupplyVariable: number;
};

export const availableHydroMw = (generation: Generation): number =>
  generation.hydroCapacityMw *
  (generation.reservoir / 100) *
  (0.72 + generation.maintenance * 0.0035);

export const availableCapacityMw = (
  generation: Generation,
  market: Market,
  importMw: number,
): number =>
  availableHydroMw(generation) +
  generation.thermalCapacityMw +
  Math.min(importMw, supplierCapacity(market, importMw));

export const supplierCapacity = (market: Market, requestedMw: number): number => {
  let remaining = requestedMw;

  for (const supplier of market.suppliers) {
    remaining -= supplier.capacityMw;

    if (remaining <= 0) return requestedMw;
  }

  return Math.max(0, requestedMw - remaining);
};

export const reserveMargin = (
  generation: Generation,
  market: Market,
  peakMw: number,
  importMw: number,
): number => {
  if (peakMw <= 0) return 100;
  const capacity = availableCapacityMw(generation, market, importMw);

  return clamp(((capacity - peakMw) / peakMw) * 100, -100, 200);
};

export const computeSupply = (
  generation: Generation,
  dispatch: Dispatch,
  market: Market,
  importPriceVndPerKwh: number,
  importCapacityMw: number,
): SupplyStep => {
  const hydro = Math.min(dispatch.hydroMw, availableHydroMw(generation));
  const thermal = Math.min(dispatch.thermalMw, generation.thermalCapacityMw);
  const renewable = generation.renewableCapacityMw * market.renewableFactor;
  const importMw = Math.min(dispatch.importMw, Math.max(0, importCapacityMw));
  const totalMw = hydro + thermal + renewable + importMw;
  const millionKwh = (mw: number): number => (mw * HOURS_PER_MONTH) / 1_000;

  const costSupplyVariable =
    (millionKwh(hydro) * HYDRO_VARIABLE_COST +
      millionKwh(thermal) * THERMAL_FUEL_COST * market.fuelPriceIndex +
      millionKwh(renewable) * RENEWABLE_PPA_COST +
      millionKwh(importMw) * importPriceVndPerKwh) /
    1_000;

  return {
    output: {
      hydroMw: hydro,
      thermalMw: thermal,
      renewableMw: renewable,
      importMw,
      totalMw,
      hydroMillionKwh: millionKwh(hydro),
      thermalMillionKwh: millionKwh(thermal),
      renewableMillionKwh: millionKwh(renewable),
      importMillionKwh: millionKwh(importMw),
    },
    supplyMw: totalMw,
    costSupplyVariable,
  };
};

export const dispatchWithinCaps = (
  dispatch: Dispatch,
  generation: Generation,
  market: Market,
  supplierId: string,
): Dispatch => {
  const supplier = market.suppliers.find((row) => row.id === supplierId);

  return {
    hydroMw: clamp(dispatch.hydroMw, 0, generation.hydroCapacityMw),
    thermalMw: clamp(dispatch.thermalMw, 0, generation.thermalCapacityMw),
    importMw: clamp(dispatch.importMw, 0, supplier?.capacityMw ?? 0),
  };
};
