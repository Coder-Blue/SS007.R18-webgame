import type { EventEffects, GameState, Result } from "../types";
import { err, ok } from "../types";
import { clamp } from "../clock";
import { activeEvent } from "./index";
import { withEndingCheck } from "../endings";
import { appendFlags, applyCashDebt, applyUnlocks, clampMetric } from "./effects";

const applyEffects = (state: GameState, effect: EventEffects): GameState => {
  const financed = applyCashDebt(state, effect.cashDelta, effect.debtDelta);

  const metrics = {
    ...financed.metrics,
    trust: clampMetric(financed.metrics.trust + effect.trustDelta),
    satisfaction: clampMetric(financed.metrics.satisfaction + effect.satisfactionDelta),
    inflation: clamp(financed.metrics.inflation + effect.inflationDelta, 0, 28),
    industrialOutput: clamp(financed.metrics.industrialOutput + effect.industrialDelta, 65, 175),
    reliability: clampMetric(financed.metrics.reliability + effect.reliabilityDelta),
    debateScore: clampMetric(financed.metrics.debateScore + effect.debateDelta),
  };

  const infrastructure = {
    ...financed.infrastructure,
    coverage: clamp(financed.infrastructure.coverage + effect.coverageDelta, 0, 100),
    remoteCoverage: clamp(
      financed.infrastructure.remoteCoverage + effect.remoteCoverageDelta,
      0,
      100,
    ),
  };

  return {
    ...financed,
    metrics,
    infrastructure,
    production: {
      ...financed.production,
      riceInventory: Math.max(0, financed.production.riceInventory + effect.riceDelta),
    },
    policy: applyUnlocks(financed.policy, effect.unlocks, effect.n2Unlock),
    events: {
      ...financed.events,
      flags: appendFlags(financed.events.flags, effect.flags),
    },
  };
};

export const resolveEvent = (state: GameState, choiceId: string): Result<GameState> => {
  const definition = activeEvent(state);

  if (definition === null) return err("event.none-active");
  const choice = definition.choices.find((item) => item.id === choiceId);

  if (choice === undefined) return err("event.unknown-choice");
  const applied = applyEffects(state, choice.effects);

  const ended =
    choice.effects.ending === undefined
      ? applied
      : {
          ...applied,
          phase: "ended" as const,
          ending: {
            id: choice.effects.ending[0],
            reason: choice.effects.ending[1],
            year: state.clock.year,
            month: state.clock.month,
          },
        };

  return ok(
    withEndingCheck({
      ...ended,
      events: {
        ...ended.events,
        activeId: null,
        resolved: [...ended.events.resolved, definition.id],
      },
    }),
  );
};
