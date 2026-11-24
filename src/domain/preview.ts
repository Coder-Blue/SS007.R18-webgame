import type { Dispatch, GameState, TariffTiers } from "./types";
import { averageOfTiers, industrialRevenue, lossFactor, residentialRevenue } from "./tariffs";
import { averageHouseholdTariff } from "./tariffs";
import { approvalLikelihood, tariffChangePercent } from "./approval";
import { computeSupply, dispatchWithinCaps, reserveMargin, servedDemandMw } from "./production";
import { peakDemandMw, zoneDemand } from "./market";
import { interestForMonth, managementCost, transmissionCost } from "./finance";
import { recoveryOf } from "./recovery";
import { reformRevenue } from "./reforms";

export type MonthPreview = {
  readonly netResult: number;
  readonly revenue: number;
  readonly cost: number;
  readonly reliability: number;
  readonly reserveMargin: number;
  readonly averageTariff: number;
  readonly trustDelta: number;
  readonly trustBefore: number;
  readonly trustAfter: number;
  readonly satisfactionDelta: number;
  readonly satisfactionBefore: number;
  readonly satisfactionAfter: number;
  readonly approvalLikelihood: number;
};

export type PreviewPair = {
  readonly before: MonthPreview;
  readonly after: MonthPreview;
};

const supplierQuote = (state: GameState, supplierId: string) =>
  state.market.suppliers.find((row) => row.id === supplierId) ?? state.market.suppliers[0];

const supplierPrice = (state: GameState, supplierId: string): number =>
  supplierQuote(state, supplierId)?.priceVndPerKwh ?? 2_450;

export const projectMonth = (
  state: GameState,
  dispatch: Dispatch,
  tariffs: TariffTiers,
  supplierId: string,
): MonthPreview => {
  const demand = zoneDemand(state.zones, state.market, state.metrics);
  const capped = dispatchWithinCaps(dispatch, state.generation, state.market, supplierId);

  const supply = computeSupply(
    state.generation,
    capped,
    state.market,
    supplierPrice(state, supplierId),
    supplierQuote(state, supplierId)?.capacityMw ?? 0,
  );

  const served = servedDemandMw(state.policy.branch, demand, supply.supplyMw);
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
    industrialRevenue(delivered * (1 - residentialShare), tariffs.industrial) +
    recoveryOf(state.finance, state.clock.year, state.policy).monthlyCredit +
    reformRevenue(state.policy).total;

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

  const householdChange = tariffChangePercent(state, average);

  const industrialChange =
    state.tariffs.industrial > 0
      ? Math.max(
          0,
          ((tariffs.industrial - state.tariffs.industrial) / state.tariffs.industrial) * 100,
        )
      : 0;

  const change = Math.max(householdChange, industrialChange);

  const trustDelta =
    (reliability - state.metrics.reliability) * 0.1 - Math.max(0, average - 2_400) * 0.02;

  const satisfactionDelta =
    (reliability - state.metrics.reliability) * 0.12 - Math.max(0, average - 2_400) * 0.025;

  return {
    netResult: revenue - cost,
    revenue,
    cost,
    reliability,
    reserveMargin: reserve,
    averageTariff: average,
    trustDelta,
    trustBefore: state.metrics.citizenTrust,
    trustAfter: Math.min(100, Math.max(0, state.metrics.citizenTrust + trustDelta)),
    satisfactionDelta,
    satisfactionBefore: state.metrics.citizenTrust,
    satisfactionAfter: Math.min(100, Math.max(0, state.metrics.citizenTrust + satisfactionDelta)),
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
