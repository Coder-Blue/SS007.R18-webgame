import { describe, expect, it } from "vitest";
import type { GameState } from "../../src/domain/types";
import {
  advanceMonth,
  buildRoadAction,
  createInitialState,
  enableDppaAction,
  enableVremAction,
  enactRecoveryAction,
  investAction,
  resolveEvent,
  setRecoveryRateAction,
  setTariffsAction,
} from "../../src/domain";

interface ChoiceMap {
  readonly [eventId: string]: string;
}

const choices: ChoiceMap = {
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

const resolve = (state: GameState): GameState => {
  if (state.events.activeId === null) return state;
  const result = resolveEvent(state, choices[state.events.activeId] ?? "bailout");

  return result.ok ? result.value : state;
};

const applyTariffs = (state: GameState): GameState => {
  const ceiling = state.tariffs.ceiling;

  const tiers = [
    Number((ceiling * 0.7).toFixed(2)),
    Number((ceiling * 0.94).toFixed(2)),
    Number((ceiling * 1.28).toFixed(2)),
    Number((ceiling * 1.95).toFixed(2)),
  ] as const;

  const result = setTariffsAction(state, tiers, 8.6);

  return result.ok ? result.value : state;
};

const act = (state: GameState, tick: number): GameState => {
  let next = applyTariffs(state);

  if (next.infrastructure.coverage < 100) {
    const road = buildRoadAction(next, "asphalt");

    if (road.ok) next = road.value;
  }

  if (tick % 6 === 0) {
    const irrigation = investAction(next, "irrigation");

    if (irrigation.ok) next = irrigation.value;
  }

  if (tick % 5 === 0 && next.finance.debt < next.finance.debtLimit * 0.8) {
    const mechanized = investAction(next, "mechanized");

    if (mechanized.ok) next = mechanized.value;
  }

  if (tick % 3 === 0) {
    const hydro = investAction(next, "hydro");

    if (hydro.ok) next = hydro.value;
  }

  if (tick % 4 === 0) {
    const rnd = investAction(next, "rnd");

    if (rnd.ok) next = rnd.value;
  }

  if (next.clock.year >= 2024) {
    const n2 = enactRecoveryAction(next);

    if (n2.ok) next = n2.value;
    const rate = setRecoveryRateAction(next, 0.8);

    if (rate.ok) next = rate.value;
    const dppa = enableDppaAction(next);

    if (dppa.ok) next = dppa.value;
    const vrem = enableVremAction(next);

    if (vrem.ok) next = vrem.value;
  }

  return next;
};

describe("playthrough", () => {
  it("can reach the architect ending with disciplined in-ceiling tariffs", () => {
    let state = createInitialState(7);

    for (let tick = 0; tick < 60; tick += 1) {
      state = resolve(state);
      state = act(state, tick);
      const result = advanceMonth(state);
      expect(result.ok).toBe(true);

      if (!result.ok) return;
      state = result.value.state;

      if (state.phase === "ended") break;
    }

    expect(state.phase).toBe("ended");
    expect(state.ending?.id).toBe("architect");
    expect(state.finance.debt).toBeLessThanOrEqual(25_000);
    expect(state.infrastructure.coverage).toBe(100);
    expect(state.policy.n2Enabled).toBe(true);
    expect(state.policy.dppa).toBe(true);
    expect(state.policy.vrem).toBe(true);
  });
});
