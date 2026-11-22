import type { GameState, MissionId, MonthlyLedger, Project, Result, TickOutcome } from "./types";
import { err, ok } from "./types";
import { ceilingFor, MONTHS_PER_YEAR } from "./constants";
import { actOf, clamp, nextClock } from "./clock";
import { advanceMarket, peakDemandMw, zoneDemand } from "./market";
import { computeSupply, dispatchWithinCaps, reserveMargin } from "./production";
import {
  aggregateAnnual,
  interestForMonth,
  managementCost,
  pushAnnual,
  pushLedger,
  settleDebt,
  transmissionCost,
} from "./finance";
import { advanceProjects } from "./infrastructure";
import { advanceMissions, missionProgressScore } from "./missions";
import { advanceMetrics } from "./metrics";
import { recoveryOf } from "./recovery";
import { reformRevenue } from "./reforms";
import { advanceReforms } from "./reform-progress";
import {
  averageHouseholdTariff,
  industrialRevenue,
  lossFactor,
  residentialRevenue,
} from "./tariffs";
import { scheduleEvent } from "./events/schedule";
import { withEndingCheck, withFinalCheck } from "./endings";

const lastLedger = (state: GameState): MonthlyLedger | undefined =>
  state.finance.monthlyHistory[state.finance.monthlyHistory.length - 1];

const privateTariffs = (state: GameState): GameState["tariffs"] => {
  if (state.policy.priceCap) return state.tariffs;
  const [t1, t2, t3, t4, t5, t6] = state.tariffs.tiers;

  return {
    ...state.tariffs,
    tiers: [t1 * 1.025, t2 * 1.025, t3 * 1.025, t4 * 1.025, t5 * 1.025, t6 * 1.025],
    industrial: state.tariffs.industrial * 1.02,
  };
};

export const advanceMonth = (state: GameState): Result<TickOutcome> => {
  if (state.phase !== "playing") return err("tick.not-playing");

  if (state.events.activeId !== null) return err("tick.event-pending");

  if (state.approval !== null) return err("tick.approval-pending");

  const projectStep = advanceProjects(state);
  const reformStep = advanceReforms(projectStep.state.policy);
  const stateWithReforms = { ...projectStep.state, policy: reformStep.policy };
  const mediaActive = stateWithReforms.media.activeMonths > 0;

  const mediaState = {
    ...stateWithReforms.media,
    activeMonths: Math.max(0, stateWithReforms.media.activeMonths - 1),
    cooldown: Math.max(0, stateWithReforms.media.cooldown - 1),
  };

  const tariffs = privateTariffs(stateWithReforms);

  const marketStep = advanceMarket(
    stateWithReforms.market,
    stateWithReforms.clock.month,
    stateWithReforms.metrics,
    stateWithReforms.seed,
  );

  const market = marketStep.market;
  const base = { ...stateWithReforms, tariffs, market };
  const demand = zoneDemand(base.zones, market, base.metrics);

  const dispatch = dispatchWithinCaps(
    base.operations.dispatch,
    base.generation,
    market,
    base.operations.supplierId,
  );

  const supplier =
    market.suppliers.find((row) => row.id === base.operations.supplierId) ?? market.suppliers[0];

  if (supplier === undefined) return err("market.no-supplier");

  const supplyStep = computeSupply(
    base.generation,
    dispatch,
    market,
    supplier.priceVndPerKwh,
    supplier.capacityMw,
  );

  // Private operators throttle unprofitable rural service in the counterfactual branch.
  const serviceableDemand =
    base.policy.branch === "private" ? demand.total - demand.rural * 0.5 : demand.total;

  const servedMw = Math.min(serviceableDemand, supplyStep.supplyMw);
  const shortageMw = Math.max(0, demand.total - servedMw);
  const reliability = demand.total > 0 ? (servedMw / demand.total) * 100 : 100;
  const peak = peakDemandMw(demand.total);
  const reserve = reserveMargin(base.generation, market, peak, dispatch.importMw);
  const loss = lossFactor(base.infrastructure.gridStrength);
  const delivered = (servedMw * 720 * (1 - loss)) / 1_000;

  const residentialShare = demand.total > 0 ? (demand.urban + demand.rural) / demand.total : 1;

  const residentialEnergy = delivered * residentialShare;
  const industrialEnergy = delivered * (1 - residentialShare);
  const average = averageHouseholdTariff(tariffs);

  const revenueElectricity =
    residentialRevenue(residentialEnergy, average) +
    industrialRevenue(industrialEnergy, tariffs.industrial);

  const recovery = recoveryOf(base.finance, base.clock.year, base.policy);
  const wheeling = reformRevenue(base.policy);
  const revenueOther = recovery.monthlyCredit + wheeling.total;
  const revenueTotal = revenueElectricity + revenueOther;
  const generatedEnergy = (supplyStep.output.totalMw * 720) / 1_000;
  const costSupply = supplyStep.costSupplyVariable + transmissionCost(generatedEnergy);

  const capacityMw =
    base.generation.hydroCapacityMw +
    base.generation.thermalCapacityMw +
    base.generation.renewableCapacityMw;

  const costManagement =
    managementCost(capacityMw) + interestForMonth(base.finance.debt, base.finance.interestRate);

  const costTotal = costManagement + costSupply;
  const netResult = revenueTotal - costTotal;
  const settled = settleDebt(base.finance.cash, base.finance.debt, netResult);

  const accumulatedLoss =
    netResult < 0
      ? base.finance.accumulatedLoss - netResult
      : Math.max(0, base.finance.accumulatedLoss - netResult);

  const missionBase: GameState = {
    ...base,
    finance: { ...base.finance, cash: settled.cash, debt: settled.debt },
    metrics: { ...base.metrics, reliability, reserveMargin: reserve },
    media: mediaState,
  };

  const missionStep = advanceMissions(missionBase, reserve, reliability);

  const missionState: GameState = {
    ...missionBase,
    missions: {
      ...missionStep.missions,
      privateMonths: base.policy.branch === "private" ? base.missions.privateMonths + 1 : 0,
    },
  };

  const missionBonuses = missionStep.completed.length;

  const previousMetrics = {
    ...missionState.metrics,
    citizenTrust: clamp(missionState.metrics.citizenTrust + missionBonuses * 3, 0, 100),
    institutionalTrust: clamp(missionState.metrics.institutionalTrust + missionBonuses * 6, 0, 100),
  };

  const metricStep = advanceMetrics({
    previous: previousMetrics,
    reliability,
    reserveMargin: reserve,
    coverage:
      (base.zones.urban.coverage + base.zones.industrial.coverage + base.zones.rural.coverage) / 3,
    averageTariff: average,
    previousAverageTariff: lastLedger(base)?.averageRetailTariff ?? average,
    industrialTariff: tariffs.industrial,
    fuelPriceIndex: market.fuelPriceIndex,
    previousFuelPriceIndex: projectStep.state.market.fuelPriceIndex,
    mediaActive,
    branch: base.policy.branch,
    completedMissions: missionState.missions.completed.length,
    missionProgress: missionProgressScore(missionState),
    netResult,
    debt: settled.debt,
    policy: base.policy,
  });

  const ledger: MonthlyLedger = {
    year: base.clock.year,
    month: base.clock.month,
    tick: base.clock.tick,
    demandMw: demand.total,
    connectedDemandMw: demand.total,
    supplyMw: supplyStep.supplyMw,
    shortageMw,
    energySoldMillionKwh: delivered,
    hydroMillionKwh: supplyStep.output.hydroMillionKwh,
    thermalMillionKwh: supplyStep.output.thermalMillionKwh,
    renewableMillionKwh: supplyStep.output.renewableMillionKwh,
    importMillionKwh: supplyStep.output.importMillionKwh,
    revenueElectricity,
    revenueOther,
    revenueTotal,
    costManagement,
    costSupply,
    costTotal,
    netResult,
    cash: settled.cash,
    debt: settled.debt,
    accumulatedLoss,
    averageRetailTariff: average,
    industrialTariff: tariffs.industrial,
    reliability,
    reserveMargin: reserve,
    citizenTrust: metricStep.metrics.citizenTrust,
    institutionalTrust: metricStep.metrics.institutionalTrust,
    inflation: metricStep.metrics.inflation,
    coverage:
      (base.zones.urban.coverage + base.zones.industrial.coverage + base.zones.rural.coverage) / 3,
    mediaActive,
  };

  const monthlyHistory = pushLedger(base.finance.monthlyHistory, ledger);

  const annualHistory =
    base.clock.month === MONTHS_PER_YEAR
      ? pushAnnual(base.finance.annualHistory, aggregateAnnual(base.clock.year, monthlyHistory))
      : base.finance.annualHistory;

  const nextState: GameState = {
    ...missionState,
    seed: marketStep.seed,
    market,
    tariffs,
    media: mediaState,
    metrics: metricStep.metrics,
    finance: {
      ...base.finance,
      cash: settled.cash,
      debt: settled.debt,
      accumulatedLoss,
      recoveredTotal: base.finance.recoveredTotal + recovery.monthlyCredit,
      recoveredYears:
        recovery.monthlyCredit > 0
          ? [
              ...base.finance.recoveredYears.filter((row) => row.year !== recovery.eligibleYear),
              {
                year: recovery.eligibleYear,
                amount:
                  (base.finance.recoveredYears.find((row) => row.year === recovery.eligibleYear)
                    ?.amount ?? 0) + recovery.monthlyCredit,
              },
            ]
          : base.finance.recoveredYears,
      monthlyHistory,
      annualHistory,
    },
  };

  const notices = [
    ...buildNotices(nextState, ledger, projectStep.completed, missionStep.completed),
    ...reformStep.completed.map((key) => `notice.reform:${key}`),
  ];

  const ended = withEndingCheck(nextState);

  if (ended.ending !== null) {
    return ok({ state: ended, ledger, notices });
  }

  if (base.clock.year === 2026 && base.clock.month === 12) {
    return ok({ state: withFinalCheck(ended), ledger, notices });
  }

  const clock = nextClock(base.clock);

  const scheduled = scheduleEvent({
    ...ended,
    clock,
    act: actOf(clock.year, clock.month),
    tariffs: { ...ended.tariffs, ceiling: ceilingFor(clock.year) },
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

export const buildNotices = (
  state: GameState,
  ledger: MonthlyLedger,
  projects: readonly Project[],
  missions: readonly MissionId[],
): readonly string[] => {
  const notices: string[] = [];

  if (ledger.shortageMw > 1) notices.push("notice.shortage");

  if (ledger.reliability < 90) notices.push("notice.blackout");

  if (ledger.reserveMargin < 5) notices.push("notice.reserve");

  if (state.finance.debt > 80_000) notices.push("notice.debt");

  if (ledger.mediaActive) notices.push("notice.media");

  if (state.policy.branch === "private") notices.push("notice.privatization");

  for (const mission of missions) notices.push(`notice.mission:${mission}`);

  for (const project of projects)
    notices.push(`notice.project:${project.kind}:${project.targetId}`);

  return notices;
};
