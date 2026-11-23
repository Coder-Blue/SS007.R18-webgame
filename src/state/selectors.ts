import type { GameState } from "../domain";
import { missionStatus, recoveryOf } from "../domain";

export type Projection = {
  readonly monthlyNet: number;
  readonly runwayMonths: number;
  readonly debtRatio: number;
  readonly isDanger: boolean;
  readonly recovery: number;
};

export const projectFinance = (state: GameState): Projection => {
  const last = state.finance.monthlyHistory[state.finance.monthlyHistory.length - 1];
  const monthlyNet = last?.netResult ?? 0;
  const debtRatio = state.finance.debtLimit > 0 ? state.finance.debt / state.finance.debtLimit : 1;

  const runwayMonths =
    monthlyNet >= 0
      ? 99
      : Math.max(0, (state.finance.debtLimit - state.finance.debt) / Math.abs(monthlyNet));

  return {
    monthlyNet,
    runwayMonths,
    debtRatio,
    isDanger: debtRatio > 0.82,
    recovery: recoveryOf(state.finance, state.clock.year, state.policy).monthlyCredit,
  };
};

export const totalCoverage = (state: GameState): number =>
  (state.zones.urban.coverage + state.zones.industrial.coverage + state.zones.rural.coverage) / 3;

export const missionOverview = (state: GameState) => missionStatus(state);

export const isModalOpen = (state: GameState): boolean =>
  state.events.activeId !== null || state.approval !== null || state.ending !== null;

export type QuarterReport = {
  readonly year: number;
  readonly quarter: number;
  readonly startMonth: number;
  readonly endMonth: number;
  readonly energyMillionKwh: number;
  readonly hydroMillionKwh: number;
  readonly thermalMillionKwh: number;
  readonly renewableMillionKwh: number;
  readonly importMillionKwh: number;
  readonly revenueBillionVnd: number;
  readonly costSupplyBillionVnd: number;
  readonly costManagementBillionVnd: number;
  readonly costTotalBillionVnd: number;
  readonly netBillionVnd: number;
  readonly averageRetailTariffVndPerKwh: number;
  readonly debtBillionVnd: number;
  readonly accumulatedLossBillionVnd: number;
  readonly cashBillionVnd: number;
  readonly citizenTrust: number;
  readonly institutionalTrust: number;
  readonly reliability: number;
  readonly mediaActive: boolean;
  readonly previousEnergyMillionKwh: number | null;
  readonly previousNetBillionVnd: number | null;
};

export const quarterReport = (state: GameState): QuarterReport | null => {
  const history = state.finance.monthlyHistory;

  if (history.length < 3) return null;

  const months = history.slice(-3);
  const previousMonths = history.length >= 6 ? history.slice(-6, -3) : [];
  const last = months[2];
  const previousLast = previousMonths[2];

  if (last === undefined) return null;

  const sum = (field: keyof typeof last) =>
    months.reduce((total, row) => total + Number(row[field] ?? 0), 0);

  const previousSum = (field: keyof typeof last) =>
    previousMonths.reduce((total, row) => total + Number(row[field] ?? 0), 0);

  const energyMillionKwh = sum("energySoldMillionKwh");

  const previousEnergyMillionKwh =
    previousMonths.length === 3 ? previousSum("energySoldMillionKwh") : null;

  const averageRetailTariffVndPerKwh =
    energyMillionKwh > 0
      ? months.reduce(
          (total, row) => total + row.averageRetailTariff * row.energySoldMillionKwh,
          0,
        ) / energyMillionKwh
      : last.averageRetailTariff;

  return {
    year: last.year,
    quarter: Math.ceil(last.month / 3),
    startMonth: months[0]?.month ?? last.month,
    endMonth: last.month,
    energyMillionKwh,
    hydroMillionKwh: sum("hydroMillionKwh"),
    thermalMillionKwh: sum("thermalMillionKwh"),
    renewableMillionKwh: sum("renewableMillionKwh"),
    importMillionKwh: sum("importMillionKwh"),
    revenueBillionVnd: sum("revenueTotal"),
    costSupplyBillionVnd: sum("costSupply"),
    costManagementBillionVnd: sum("costManagement"),
    costTotalBillionVnd: sum("costTotal"),
    netBillionVnd: sum("netResult"),
    averageRetailTariffVndPerKwh,
    debtBillionVnd: last.debt,
    accumulatedLossBillionVnd: last.accumulatedLoss,
    cashBillionVnd: last.cash,
    citizenTrust: last.citizenTrust,
    institutionalTrust: last.institutionalTrust,
    reliability: last.reliability,
    mediaActive: months.some((row) => row.mediaActive),
    previousEnergyMillionKwh,
    previousNetBillionVnd:
      previousLast !== undefined && previousMonths.length === 3 ? previousSum("netResult") : null,
  };
};
