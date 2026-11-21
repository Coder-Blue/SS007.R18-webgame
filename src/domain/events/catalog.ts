import type { EventEffects, GameEventDefinition } from "../types";

export const EMPTY_EFFECTS: EventEffects = {
  cashDelta: 0,
  debtDelta: 0,
  trustDelta: 0,
  satisfactionDelta: 0,
  inflationDelta: 0,
  coverageDelta: 0,
  remoteCoverageDelta: 0,
  industrialDelta: 0,
  reliabilityDelta: 0,
  debateDelta: 0,
  riceDelta: 0,
  n2Unlock: false,
  unlocks: [],
  flags: [],
};

export const effects = (partial: Partial<EventEffects>): EventEffects => ({
  ...EMPTY_EFFECTS,
  ...partial,
  flags: partial.flags ?? [],
  unlocks: partial.unlocks ?? [],
});

export interface ScheduledEvent {
  readonly tick: number;
  readonly definition: GameEventDefinition;
}

export const EARLY_EVENTS: readonly ScheduledEvent[] = [
  {
    tick: 5,
    definition: {
      id: "drought_2022",
      kind: "weather",
      titleKey: "event.drought.title",
      bodyKey: "event.drought.body",
      choices: [
        {
          id: "import",
          titleKey: "event.drought.import.title",
          bodyKey: "event.drought.import.body",
          outcomeKey: "event.drought.import.outcome",
          effects: effects({ cashDelta: -1_200, riceDelta: 80, satisfactionDelta: 2 }),
        },
        {
          id: "irrigate",
          titleKey: "event.drought.irrigate.title",
          bodyKey: "event.drought.irrigate.body",
          outcomeKey: "event.drought.irrigate.outcome",
          effects: effects({ cashDelta: -900, reliabilityDelta: 4, flags: ["irrigation_rescue"] }),
        },
        {
          id: "wait",
          titleKey: "event.drought.wait.title",
          bodyKey: "event.drought.wait.body",
          outcomeKey: "event.drought.wait.outcome",
          effects: effects({ reliabilityDelta: -8, satisfactionDelta: -6, trustDelta: -3 }),
        },
      ],
    },
  },
  {
    tick: 9,
    definition: {
      id: "fertilizer_2022",
      kind: "shock",
      titleKey: "event.fertilizer.title",
      bodyKey: "event.fertilizer.body",
      choices: [
        {
          id: "absorb",
          titleKey: "event.fertilizer.absorb.title",
          bodyKey: "event.fertilizer.absorb.body",
          outcomeKey: "event.fertilizer.absorb.outcome",
          effects: effects({ cashDelta: -700, satisfactionDelta: 1 }),
        },
        {
          id: "ration",
          titleKey: "event.fertilizer.ration.title",
          bodyKey: "event.fertilizer.ration.body",
          outcomeKey: "event.fertilizer.ration.outcome",
          effects: effects({ satisfactionDelta: -5, industrialDelta: -4 }),
        },
        {
          id: "subsidize",
          titleKey: "event.fertilizer.subsidize.title",
          bodyKey: "event.fertilizer.subsidize.body",
          outcomeKey: "event.fertilizer.subsidize.outcome",
          effects: effects({ cashDelta: -900, satisfactionDelta: 4, flags: ["farmers_helped"] }),
        },
      ],
    },
  },
  {
    tick: 15,
    definition: {
      id: "currency_2023",
      kind: "shock",
      titleKey: "event.currency.title",
      bodyKey: "event.currency.body",
      choices: [
        {
          id: "hedge",
          titleKey: "event.currency.hedge.title",
          bodyKey: "event.currency.hedge.body",
          outcomeKey: "event.currency.hedge.outcome",
          effects: effects({ cashDelta: -800, inflationDelta: -1 }),
        },
        {
          id: "pass",
          titleKey: "event.currency.pass.title",
          bodyKey: "event.currency.pass.body",
          outcomeKey: "event.currency.pass.outcome",
          effects: effects({ inflationDelta: 1.8, trustDelta: -3 }),
        },
        {
          id: "control",
          titleKey: "event.currency.control.title",
          bodyKey: "event.currency.control.body",
          outcomeKey: "event.currency.control.outcome",
          effects: effects({ inflationDelta: -0.6, satisfactionDelta: -3, reliabilityDelta: -4 }),
        },
      ],
    },
  },
  {
    tick: 21,
    definition: {
      id: "debate_sunk_cost",
      kind: "debate",
      titleKey: "event.debate.title",
      bodyKey: "event.debate.body",
      choices: [
        {
          id: "evidence",
          titleKey: "event.debate.evidence.title",
          bodyKey: "event.debate.evidence.body",
          outcomeKey: "event.debate.evidence.outcome",
          effects: effects({
            debateDelta: 10,
            trustDelta: 4,
            flags: ["debate_evidence", "privatization_rejected"],
          }),
        },
        {
          id: "populist",
          titleKey: "event.debate.populist.title",
          bodyKey: "event.debate.populist.body",
          outcomeKey: "event.debate.populist.outcome",
          effects: effects({ debateDelta: -5, trustDelta: -2, satisfactionDelta: 3 }),
        },
        {
          id: "privatize",
          titleKey: "event.debate.privatize.title",
          bodyKey: "event.debate.privatize.body",
          outcomeKey: "event.debate.privatize.outcome",
          effects: effects({
            trustDelta: -20,
            satisfactionDelta: -10,
            flags: ["privatization_accepted"],
          }),
        },
      ],
    },
  },
  {
    tick: 22,
    definition: {
      id: "california_2001",
      kind: "crisis",
      titleKey: "event.california.title",
      bodyKey: "event.california.body",
      choices: [
        {
          id: "freeze",
          titleKey: "event.california.freeze.title",
          bodyKey: "event.california.freeze.body",
          outcomeKey: "event.california.freeze.outcome",
          effects: effects({ ending: ["collapse", "california"] }),
        },
        {
          id: "regulate",
          titleKey: "event.california.regulate.title",
          bodyKey: "event.california.regulate.body",
          outcomeKey: "event.california.regulate.outcome",
          effects: effects({
            cashDelta: -600,
            debateDelta: 8,
            trustDelta: 3,
            flags: ["california_solved"],
          }),
        },
        {
          id: "unfreeze",
          titleKey: "event.california.unfreeze.title",
          bodyKey: "event.california.unfreeze.body",
          outcomeKey: "event.california.unfreeze.outcome",
          effects: effects({ inflationDelta: 3, trustDelta: -5, satisfactionDelta: -6 }),
        },
      ],
    },
  },
  {
    tick: 23,
    definition: {
      id: "texas_2021",
      kind: "crisis",
      titleKey: "event.texas.title",
      bodyKey: "event.texas.body",
      choices: [
        {
          id: "isolated",
          titleKey: "event.texas.isolated.title",
          bodyKey: "event.texas.isolated.body",
          outcomeKey: "event.texas.isolated.outcome",
          effects: effects({ ending: ["collapse", "texas"] }),
        },
        {
          id: "reserve",
          titleKey: "event.texas.reserve.title",
          bodyKey: "event.texas.reserve.body",
          outcomeKey: "event.texas.reserve.outcome",
          effects: effects({
            cashDelta: -900,
            trustDelta: 3,
            reliabilityDelta: 2,
            flags: ["texas_solved"],
          }),
        },
        {
          id: "scarcity",
          titleKey: "event.texas.scarcity.title",
          bodyKey: "event.texas.scarcity.body",
          outcomeKey: "event.texas.scarcity.outcome",
          effects: effects({ cashDelta: 800, satisfactionDelta: -8, trustDelta: -6 }),
        },
      ],
    },
  },
  {
    tick: 24,
    definition: {
      id: "debate_trust",
      kind: "debate",
      titleKey: "event.debate2.title",
      bodyKey: "event.debate2.body",
      choices: [
        {
          id: "compensate",
          titleKey: "event.debate2.compensate.title",
          bodyKey: "event.debate2.compensate.body",
          outcomeKey: "event.debate2.compensate.outcome",
          effects: effects({ cashDelta: -300, debateDelta: 8, trustDelta: 4 }),
        },
        {
          id: "deny",
          titleKey: "event.debate2.deny.title",
          bodyKey: "event.debate2.deny.body",
          outcomeKey: "event.debate2.deny.outcome",
          effects: effects({ trustDelta: -5, satisfactionDelta: -3 }),
        },
        {
          id: "referendum",
          titleKey: "event.debate2.referendum.title",
          bodyKey: "event.debate2.referendum.body",
          outcomeKey: "event.debate2.referendum.outcome",
          effects: effects({ debateDelta: 2, satisfactionDelta: 3, trustDelta: 1 }),
        },
      ],
    },
  },
];
