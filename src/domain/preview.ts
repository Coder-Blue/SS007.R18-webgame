import type { Dispatch, GameState, TariffTiers } from "./types";
import { averageOfTiers, industrialRevenue, lossFactor, residentialRevenue } from "./tariffs";
import { averageHouseholdTariff } from "./tariffs";
import { approvalLikelihood, tariffChangePercent } from "./approval";
import { computeSupply, dispatchWithinCaps, reserveMargin } from "./production";
import { peakDemandMw, zoneDemand } from "./market";
import { interestForMonth, managementCost, transmissionCost } from "./finance";

export type MonthPreview = {
  readonly netResult: number;
  readonly revenue: number;
  readonly cost: number;
  readonly reliability: number;
  readonly reserveMargin: number;
  readonly averageTariff: number;
  readonly trustDelta: number;
  readonly satisfactionDelta: number;
  readonly approvalLikelihood: number;
};

export type PreviewPair = {
  readonly before: MonthPreview;
  readonly after: MonthPreview;
};

const supplierPrice = (state: GameState, supplierId: string): number => {
  const supplier =
    state.market.suppliers.find((row) => row.id === supplierId) ?? state.market.suppliers[0];

  return supplier?.priceVndPerKwh ?? 2_450;
};

export const projectMonth = (
  state: GameState,
  dispatch: Dispatch,
  tariffs: TariffTiers,
  supplierId: string,
): MonthPreview => {
  const demand = zoneDemand(state.zones, state.market, state.metrics);
  const capped = dispatchWithinCaps(dispatch, state.generation, state.market);

  const supply = computeSupply(
    state.generation,
    capped,
    state.market,
    supplierPrice(state, supplierId),
  );

  const served = Math.min(demand.total, supply.supplyMw);
  const reliability = demand.total > 0 ? (served / demand.total) * 100 : 100;

  const reserve = reserveMargin(
    state.generation,
    state.market,
    peakDemandMw(demand.total),
    capped.importMw,
  );

  const loss = lossFactor(state.infrastructure.gridStrength);
  const delivered = (served * 720 * (1 - loss)) / 1_000;

  const residentialShare = demand.total > 0 ? (demand.urban + demand.rural) / demand.total : 1;

  const average = averageHouseholdTariff(tariffs);

  const revenue =
    residentialRevenue(delivered * residentialShare, average) +
    industrialRevenue(delivered * (1 - residentialShare), tariffs.industrial);

  const costSupply =
    supply.costSupplyVariable + transmissionCost((supply.output.totalMw * 720) / 1_000);

  const cost =
    costSupply +
    managementCost(
      state.generation.hydroCapacityMw +
        state.generation.thermalCapacityMw +
        state.generation.renewableCapacityMw,
    ) +
    interestForMonth(state.finance.debt, state.finance.interestRate);

  const change = tariffChangePercent(state, average);

  return {
    netResult: revenue - cost,
    revenue,
    cost,
    reliability,
    reserveMargin: reserve,
    averageTariff: average,
    trustDelta:
      (reliability - state.metrics.reliability) * 0.1 - Math.max(0, average - 2_400) * 0.02,
    satisfactionDelta:
      (reliability - state.metrics.reliability) * 0.12 - Math.max(0, average - 2_400) * 0.025,
    approvalLikelihood: approvalLikelihood(state, average, change),
  };
};

export const dispatchPreview = (state: GameState, dispatch: Dispatch): PreviewPair => ({
  before: projectMonth(
    state,
    state.operations.dispatch,
    state.tariffs,
    state.operations.supplierId,
  ),
  after: projectMonth(state, dispatch, state.tariffs, state.operations.supplierId),
});

export const supplierPreview = (state: GameState, supplierId: string): PreviewPair => ({
  before: projectMonth(
    state,
    state.operations.dispatch,
    state.tariffs,
    state.operations.supplierId,
  ),
  after: projectMonth(state, state.operations.dispatch, state.tariffs, supplierId),
});

export const tariffPreview = (
  state: GameState,
  tiers: readonly [number, number, number, number, number, number],
  industrial: number,
): PreviewPair => {
  const next: TariffTiers = { ...state.tariffs, tiers, industrial };

  return {
    before: projectMonth(
      state,
      state.operations.dispatch,
      state.tariffs,
      state.operations.supplierId,
    ),
    after: projectMonth(state, state.operations.dispatch, next, state.operations.supplierId),
  };
};

export const nextAverage = (
  tiers: readonly [number, number, number, number, number, number],
): number => averageOfTiers(tiers);
