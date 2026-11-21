import type { GameEventDefinition } from "../types";
import { effects } from "./catalog";

export const DEBT_WARNING_EVENT: GameEventDefinition = {
  id: "debt_warning",
  kind: "faction",
  titleKey: "event.debt.title",
  bodyKey: "event.debt.body",
  choices: [
    {
      id: "bailout",
      titleKey: "event.debt.bailout.title",
      bodyKey: "event.debt.bailout.body",
      outcomeKey: "event.debt.bailout.outcome",
      effects: effects({
        debtDelta: -8_000,
        trustDelta: -9,
        satisfactionDelta: -4,
        flags: ["bailout_taken"],
      }),
    },
    {
      id: "austerity",
      titleKey: "event.debt.austerity.title",
      bodyKey: "event.debt.austerity.body",
      outcomeKey: "event.debt.austerity.outcome",
      effects: effects({
        cashDelta: 600,
        satisfactionDelta: -6,
        trustDelta: 2,
      }),
    },
    {
      id: "emergency_tariff",
      titleKey: "event.debt.emergency.title",
      bodyKey: "event.debt.emergency.body",
      outcomeKey: "event.debt.emergency.outcome",
      effects: effects({
        cashDelta: 1_200,
        inflationDelta: 2.4,
        trustDelta: -4,
        satisfactionDelta: -5,
      }),
    },
  ],
};
