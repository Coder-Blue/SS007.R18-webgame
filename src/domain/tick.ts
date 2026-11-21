import type { AnnualReport, GameState, MonthlyLedger, Result, TickOutcome } from "./types";
import { err, ok } from "./types";
import { CEILINGS, MONTHS_PER_YEAR } from "./constants";
import { actOf, clamp, nextClock } from "./clock";
import { advanceMarket, computeDemand, growVillage } from "./market";
import { computeProduction, fleetCost, roadMaintenanceCost, staffCost } from "./production";
import { computeRevenue } from "./tariffs";
import { aggregateAnnual, interestForMonth, pushAnnual, pushLedger, settleDebt } from "./finance";
import { recoveryFor } from "./recovery";
import { reformRevenue } from "./reforms";
import { advanceMetrics } from "./metrics";
import { scheduleEvents } from "./events";
import { withEndingCheck, withFinalCheck } from "./endings";

export const advanceMonth = (state: GameState): Result<TickOutcome> => {
  if (state.phase !== "playing") return err("tick.not-playing");
  if (state.events.activeId !== null) return err("tick.event-pending");
  const marketStep = advanceMarket(state.market, state.clock, state.metrics.inflation, state.seed);
  const market = marketStep.market;
  const demand = computeDemand(
    state.village,
    state.infrastructure,
    market,
    state.metrics,
    state.clock,
  );
  const production = computeProduction(state.production, market, state.metrics);
  const availableRice = state.production.riceInventory + production.ownProduction;
  const purchaseNeed = Math.max(0, demand.total - availableRice);
  const externalPurchase = Math.min(demand.externalOffer, purchaseNeed);
  const available = availableRice + externalPurchase;
  const supplied = Math.min(demand.total, available);
  const shortage = Math.max(0, demand.total - supplied);
  const inventoryEnd = Math.min(600, Math.max(0, available - supplied));
  const servedRatio = demand.total > 0 ? supplied / demand.total : 1;
  const revenue = computeRevenue(demand.household, demand.workshop, state.tariffs, servedRatio);
  const recovery = recoveryFor(
    state.finance,
    state.clock.year,
    state.policy.n2Rate,
    state.policy.n2Enabled,
  );
  const revenueRecovery = recovery.monthlyCredit;
  const wheeling = reformRevenue(state.policy, state.village);
  const costProduction = production.productionCost;
  const costProcurement =
    externalPurchase * market.ricePrice * (1 + 0.02 * (market.exchangeRate - 1));
  const costRoads = roadMaintenanceCost(
    state.infrastructure.dirtKm,
    state.infrastructure.cobbleKm,
    state.infrastructure.asphaltKm,
  );
  const costFleet = fleetCost(state.infrastructure.fleet, market);
  const costStaff = staffCost(state.village.workshopsThousand);
  const costInterest = interestForMonth(state.finance.debt, state.finance.interestRate);
  const costTotal =
    costProduction + costProcurement + costRoads + costFleet + costStaff + costInterest;
  const revenueTotal = revenue.total + revenueRecovery + wheeling.total;
  const netResult = revenueTotal - costTotal;
  const settled = settleDebt(state.finance.cash, state.finance.debt, netResult);
  const reliability = demand.total > 0 ? clamp((supplied / demand.total) * 100, 0, 100) : 100;
  const last = state.finance.monthlyHistory[state.finance.monthlyHistory.length - 1];
  const metricStep = advanceMetrics(
    {
      previous: state.metrics,
      reliability,
      infrastructure: state.infrastructure,
      tariffs: state.tariffs,
      market,
      policy: state.policy,
      flags: state.events.flags,
      industrialOutput: state.metrics.industrialOutput,
    },
    last?.tariffAverage ?? 11,
    last?.ricePrice ?? 12,
  );
  const ledger: MonthlyLedger = {
    year: state.clock.year,
    month: state.clock.month,
    tick: state.clock.tick,
    householdDemand: demand.household,
    workshopDemand: demand.workshop,
    totalDemand: demand.total,
    ownProduction: production.ownProduction,
    externalPurchase,
    supplied,
    shortage,
    reliability,
    inventoryEnd,
    revenueHousehold: revenue.household,
    revenueWorkshop: revenue.workshop,
    revenueRecovery,
    revenueWheeling: wheeling.total,
    revenueTotal,
    costProduction,
    costProcurement,
    costRoads,
    costFleet,
    costStaff,
    costInterest,
    costTotal,
    netResult,
    cash: settled.cash,
    debt: settled.debt,
    tariffAverage: metricStep.averageTariff,
    ricePrice: market.ricePrice,
    satisfaction: metricStep.metrics.satisfaction,
    trust: metricStep.metrics.trust,
    inflation: metricStep.metrics.inflation,
    coverage: state.infrastructure.coverage,
  };
  const monthlyHistory = pushLedger(state.finance.monthlyHistory, ledger);
  const annualHistory = addAnnual(
    state.finance.annualHistory,
    state.clock.year,
    state.clock.month,
    monthlyHistory,
  );
  const nextState: GameState = {
    ...state,
    seed: marketStep.seed,
    market,
    production: {
      ...state.production,
      riceInventory: inventoryEnd,
    },
    finance: {
      ...state.finance,
      cash: settled.cash,
      debt: settled.debt,
      accumulatedLoss: Math.max(
        0,
        state.finance.accumulatedLoss +
          (netResult < 0 ? -netResult : -Math.min(netResult, state.finance.accumulatedLoss)),
      ),
      recoveredTotal: state.finance.recoveredTotal + revenueRecovery,
      monthlyHistory,
      annualHistory,
    },
    metrics: metricStep.metrics,
    events: {
      ...state.events,
      flags: state.events.flags,
    },
  };
  const notices = buildNotices(nextState, shortage, revenueRecovery);
  const endedEarly = withEndingCheck(nextState);
  if (endedEarly.ending !== null) {
    return ok({ state: endedEarly, ledger, notices });
  }
  const final = withFinalCheck(endedEarly);
  if (final.ending !== null) {
    return ok({ state: final, ledger, notices });
  }
  const next = nextClock(state.clock);
  const scheduled = scheduleEvents({
    ...endedEarly,
    clock: next,
    act: actOf(next.year, next.month),
    village: next.month === 1 ? growVillage(endedEarly.village) : endedEarly.village,
    tariffs: {
      ...endedEarly.tariffs,
      ceiling: CEILINGS[next.year] ?? endedEarly.tariffs.ceiling,
    },
    policy: {
      ...endedEarly.policy,
      campaignCooldown: Math.max(0, endedEarly.policy.campaignCooldown - 1),
    },
  });
  return ok({
    state: scheduled,
    ledger,
    notices:
      scheduled.events.activeId === null
        ? notices
        : [...notices, `notice.event:${scheduled.events.activeId}`],
  });
};

export const addAnnual = (
  history: readonly AnnualReport[],
  year: number,
  month: number,
  ledgers: readonly MonthlyLedger[],
): readonly AnnualReport[] =>
  month === MONTHS_PER_YEAR ? pushAnnual(history, aggregateAnnual(year, ledgers)) : history;

export const buildNotices = (
  state: GameState,
  shortage: number,
  recovery: number,
): readonly string[] => {
  const notices: string[] = [];
  if (shortage > 0.5) notices.push("notice.shortage");
  if (state.finance.debt > state.finance.debtLimit * 0.8) {
    notices.push("notice.debt");
  }
  if (state.metrics.inflation > 8) notices.push("notice.inflation");
  if (state.infrastructure.coverage >= 100) notices.push("notice.coverage");
  if (recovery > 0) notices.push("notice.recovery");
  if (state.metrics.satisfaction < 30) notices.push("notice.unrest");
  return notices;
};
