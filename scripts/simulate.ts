import type { GameState } from "../src/domain/types";
import {
  advanceMonth,
  buildRoadAction,
  createInitialState,
  enableDppaAction,
  enableVremAction,
  enactRecoveryAction,
  investAction,
  requestBailoutAction,
  resolveEvent,
  setRecoveryRateAction,
  setTariffsAction,
} from "../src/domain";

const STRATEGIES = ["passive", "balanced", "maxTariff", "lean"] as const;

type Strategy = (typeof STRATEGIES)[number];

interface ChoiceMap {
  readonly [eventId: string]: string;
}

const args = process.argv.slice(2);
const strategyIndex = args.indexOf("--strategy");

const strategy: Strategy =
  STRATEGIES.find((candidate) => candidate === args[strategyIndex + 1]) ?? "balanced";

const monthsIndex = args.indexOf("--months");
const months = monthsIndex >= 0 ? Number(args[monthsIndex + 1]) : 60;

const safeChoice: ChoiceMap = {
  drought_2022: "import",
  fertilizer_2022: "absorb",
  currency_2023: "hedge",
  debate_sunk_cost: "evidence",
  california_2001: "regulate",
  texas_2021: "reserve",
  debate_trust: "compensate",
  dppa_petition: "pilot",
  nsmo_petition: "spin",
  smugglers: "crackdown",
  bribe: "refuse",
  vrem_petition: "pilot",
  farmer_lobby: "contract",
  final_audit: "publish",
  debt_warning: "bailout",
};

const resolveActive = (state: GameState): GameState => {
  if (state.events.activeId === null) return state;
  const choice = safeChoice[state.events.activeId] ?? "1";
  const resolved = resolveEvent(state, choice);

  return resolved.ok ? resolved.value : state;
};

const tariffsForCeiling = (state: GameState): GameState => {
  if (strategy === "passive") return state;
  const ceiling = state.tariffs.ceiling;
  const scale = strategy === "balanced" ? 0.9 : 1;

  const tiers = [
    Number((ceiling * 0.7 * scale).toFixed(2)),
    Number((ceiling * 0.94 * scale).toFixed(2)),
    Number((ceiling * 1.28 * scale).toFixed(2)),
    Number((ceiling * 1.95 * scale).toFixed(2)),
  ] as const;

  const average = tiers[0] * 0.45 + tiers[1] * 0.28 + tiers[2] * 0.18 + tiers[3] * 0.09;

  if (average > ceiling) return state;
  const result = setTariffsAction(state, tiers, Math.min(9.2, state.tariffs.workshop + 0.4));

  return result.ok ? result.value : state;
};

const investIfAffordable = (
  state: GameState,
  kind: Parameters<typeof investAction>[1],
): GameState => {
  const result = investAction(state, kind);

  return result.ok ? result.value : state;
};

const act = (state: GameState, tick: number): GameState => {
  if (strategy === "passive") return state;
  let next = tariffsForCeiling(state);

  if (strategy === "lean") {
    if (next.infrastructure.coverage < 100) {
      const road = buildRoadAction(next, "asphalt");

      if (road.ok) next = road.value;
    }

    if (next.clock.year >= 2024) {
      const n2 = enactRecoveryAction(next);

      if (n2.ok) next = n2.value;
      const rate = setRecoveryRateAction(next, 0.55);

      if (rate.ok) next = rate.value;
      const dppa = enableDppaAction(next);

      if (dppa.ok) next = dppa.value;
      const vrem = enableVremAction(next);

      if (vrem.ok) next = vrem.value;
    }

    return next;
  }

  if (tick % 2 === 0 && next.infrastructure.coverage < 100) {
    const road = buildRoadAction(next, "asphalt");

    if (road.ok) next = road.value;
  }

  if (tick % 3 === 0) next = investIfAffordable(next, "hydro");

  if (tick % 4 === 0) next = investIfAffordable(next, "rnd");

  if (tick % 6 === 0) next = investIfAffordable(next, "irrigation");

  if (tick % 5 === 0 && next.finance.debt < next.finance.debtLimit * 0.8) {
    next = investIfAffordable(next, "mechanized");
  }

  if (next.clock.year >= 2024) {
    const n2 = enactRecoveryAction(next);

    if (n2.ok) next = n2.value;
    const rate = setRecoveryRateAction(next, strategy === "maxTariff" ? 0.8 : 0.55);

    if (rate.ok) next = rate.value;
    const dppa = enableDppaAction(next);

    if (dppa.ok) next = dppa.value;
    const vrem = enableVremAction(next);

    if (vrem.ok) next = vrem.value;
  }

  if (next.finance.debt > next.finance.debtLimit * 0.92) {
    const bailout = requestBailoutAction(next);

    if (bailout.ok) next = bailout.value;
  }

  return next;
};

let state = createInitialState(7);
const reports: string[] = [];

for (let index = 0; index < months; index += 1) {
  state = resolveActive(state);
  state = act(state, index);
  const result = advanceMonth(state);

  if (!result.ok) {
    reports.push(`tick ${index}: ${result.error}`);
    break;
  }

  state = result.value.state;

  if (state.events.activeId !== null) {
    state = resolveActive(state);
  }

  if (state.clock.month === 1 || index === months - 1) {
    const ledger = result.value.ledger;
    reports.push(
      `${ledger.year}-${String(ledger.month).padStart(2, "0")} net ${ledger.netResult.toFixed(0)} debt ${ledger.debt.toFixed(0)} cash ${ledger.cash.toFixed(0)} coverage ${ledger.coverage.toFixed(0)} sat ${ledger.satisfaction.toFixed(0)} trust ${ledger.trust.toFixed(0)}`,
    );
  }

  if (state.phase === "ended") break;
}

for (const report of reports) console.log(report);

console.log("---");

console.log(
  JSON.stringify(
    {
      strategy,
      clock: state.clock,
      phase: state.phase,
      ending: state.ending,
      cash: Math.round(state.finance.cash),
      debt: Math.round(state.finance.debt),
      coverage: state.infrastructure.coverage,
      trust: Math.round(state.metrics.trust),
      satisfaction: Math.round(state.metrics.satisfaction),
      inflation: Number(state.metrics.inflation.toFixed(1)),
      n2: state.policy.n2Enabled,
      dppa: state.policy.dppa,
      vrem: state.policy.vrem,
      flags: state.events.flags,
      annual: state.finance.annualHistory.map((row) => ({
        year: row.year,
        net: Math.round(row.netResult),
        debt: Math.round(row.debtEnd),
      })),
    },
    null,
    2,
  ),
);
