import type { DecisionId, EventEffects, GameState, Zone } from "../types";
import { clamp } from "../clock";
import { DECISIONS } from "../constants";

const unique = <T>(items: readonly T[], additions: readonly T[]): readonly T[] => {
  const seen = new Set(items);

  for (const item of additions) seen.add(item);

  return [...seen];
};

const shiftZone = (zone: Zone, amount: number): Zone => ({
  ...zone,
  coverage: clamp(zone.coverage + amount, 0, 100),
});

export const applyEffects = (state: GameState, effects: EventEffects): GameState => ({
  ...state,
  market: {
    ...state.market,
    fuelPriceIndex: clamp(state.market.fuelPriceIndex + effects.fuelPriceDelta, 0.5, 3),
    demandIndex: clamp(state.market.demandIndex + effects.demandDelta, 0.4, 1.6),
  },
  generation: {
    ...state.generation,
    reservoir: clamp(state.generation.reservoir + effects.reservoirDelta, 0, 100),
    hydroCapacityMw: Math.max(0, state.generation.hydroCapacityMw + effects.hydroCapacityDelta),
    thermalCapacityMw: Math.max(
      0,
      state.generation.thermalCapacityMw + effects.thermalCapacityDelta,
    ),
    renewableCapacityMw: Math.max(
      0,
      state.generation.renewableCapacityMw + effects.renewableCapacityDelta,
    ),
  },
  infrastructure: {
    ...state.infrastructure,
    gridStrength: clamp(state.infrastructure.gridStrength + effects.gridStrengthDelta, 0, 100),
  },
  zones: {
    urban: shiftZone(state.zones.urban, effects.coverageDelta),
    industrial: shiftZone(state.zones.industrial, effects.coverageDelta),
    rural: shiftZone(state.zones.rural, effects.coverageDelta),
  },
  finance: {
    ...state.finance,
    cash: state.finance.cash + effects.cashDelta,
    debt: Math.max(0, state.finance.debt + effects.debtDelta),
  },
  metrics: {
    ...state.metrics,
    citizenTrust: clamp(state.metrics.citizenTrust + effects.citizenTrustDelta, 0, 100),
    institutionalTrust: clamp(
      state.metrics.institutionalTrust + effects.institutionalTrustDelta,
      0,
      100,
    ),
    inflation: clamp(state.metrics.inflation + effects.inflationDelta, 0, 30),
  },
  media: {
    ...state.media,
    activeMonths: Math.max(state.media.activeMonths, effects.mediaMonths),
  },
  policy: {
    ...state.policy,
    branch: effects.setBranch ?? state.policy.branch,
    priceCap: effects.disablePriceCap ? false : state.policy.priceCap,
  },
  events: {
    ...state.events,
    decisions: unique(state.events.decisions, effects.unlockDecisions),
  },
});

export const completeDecision = (state: GameState, id: DecisionId): GameState => {
  const definition = DECISIONS.find((candidate) => candidate.id === id);

  if (definition === undefined) return state;
  const applied = applyEffects(state, definition.effects);

  return {
    ...applied,
    events: {
      ...applied.events,
      completedDecisions: unique(applied.events.completedDecisions, [id]),
    },
    policy: id === "policy-petition" ? { ...applied.policy, petitionDone: true } : applied.policy,
  };
};
