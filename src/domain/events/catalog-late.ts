import type { ScheduledEvent } from "./catalog";
import { effects } from "./catalog";

export const LATE_EVENTS: readonly ScheduledEvent[] = [
  {
    tick: 27,
    definition: {
      id: "dppa_petition",
      kind: "reform",
      titleKey: "event.dppa.title",
      bodyKey: "event.dppa.body",
      choices: [
        {
          id: "pilot",
          titleKey: "event.dppa.pilot.title",
          bodyKey: "event.dppa.pilot.body",
          outcomeKey: "event.dppa.pilot.outcome",
          effects: effects({
            cashDelta: -400,
            trustDelta: 2,
            industrialDelta: 3,
            unlocks: ["dppa"],
            flags: ["dppa_supported"],
          }),
        },
        {
          id: "delay",
          titleKey: "event.dppa.delay.title",
          bodyKey: "event.dppa.delay.body",
          outcomeKey: "event.dppa.delay.outcome",
          effects: effects({ trustDelta: -2, industrialDelta: -2 }),
        },
        {
          id: "reject",
          titleKey: "event.dppa.reject.title",
          bodyKey: "event.dppa.reject.body",
          outcomeKey: "event.dppa.reject.outcome",
          effects: effects({ satisfactionDelta: -2, trustDelta: -1 }),
        },
      ],
    },
  },
  {
    tick: 29,
    definition: {
      id: "nsmo_petition",
      kind: "reform",
      titleKey: "event.nsmo.title",
      bodyKey: "event.nsmo.body",
      choices: [
        {
          id: "spin",
          titleKey: "event.nsmo.spin.title",
          bodyKey: "event.nsmo.spin.body",
          outcomeKey: "event.nsmo.spin.outcome",
          effects: effects({
            cashDelta: -250,
            trustDelta: 3,
            debateDelta: 4,
            unlocks: ["nsmo"],
            flags: ["nsmo_supported"],
          }),
        },
        {
          id: "keep",
          titleKey: "event.nsmo.keep.title",
          bodyKey: "event.nsmo.keep.body",
          outcomeKey: "event.nsmo.keep.outcome",
          effects: effects({ trustDelta: -3, debateDelta: -3 }),
        },
        {
          id: "study",
          titleKey: "event.nsmo.study.title",
          bodyKey: "event.nsmo.study.body",
          outcomeKey: "event.nsmo.study.outcome",
          effects: effects({ cashDelta: -100, debateDelta: 1 }),
        },
      ],
    },
  },
  {
    tick: 32,
    definition: {
      id: "smugglers",
      kind: "faction",
      titleKey: "event.smugglers.title",
      bodyKey: "event.smugglers.body",
      choices: [
        {
          id: "crackdown",
          titleKey: "event.smugglers.crackdown.title",
          bodyKey: "event.smugglers.crackdown.body",
          outcomeKey: "event.smugglers.crackdown.outcome",
          effects: effects({
            cashDelta: -350,
            trustDelta: 3,
            unlocks: ["antiSmuggling"],
            flags: ["smuggling_cracked"],
          }),
        },
        {
          id: "tolerate",
          titleKey: "event.smugglers.tolerate.title",
          bodyKey: "event.smugglers.tolerate.body",
          outcomeKey: "event.smugglers.tolerate.outcome",
          effects: effects({
            cashDelta: 500,
            satisfactionDelta: -3,
            flags: ["smuggling_rampant"],
          }),
        },
        {
          id: "license",
          titleKey: "event.smugglers.license.title",
          bodyKey: "event.smugglers.license.body",
          outcomeKey: "event.smugglers.license.outcome",
          effects: effects({ cashDelta: 300, inflationDelta: 0.8, satisfactionDelta: -1 }),
        },
      ],
    },
  },
  {
    tick: 34,
    definition: {
      id: "bribe",
      kind: "faction",
      titleKey: "event.bribe.title",
      bodyKey: "event.bribe.body",
      choices: [
        {
          id: "accept",
          titleKey: "event.bribe.accept.title",
          bodyKey: "event.bribe.accept.body",
          outcomeKey: "event.bribe.accept.outcome",
          effects: effects({
            cashDelta: 1_500,
            trustDelta: -5,
            satisfactionDelta: -2,
            flags: ["bribe_accepted"],
          }),
        },
        {
          id: "refuse",
          titleKey: "event.bribe.refuse.title",
          bodyKey: "event.bribe.refuse.body",
          outcomeKey: "event.bribe.refuse.outcome",
          effects: effects({ trustDelta: 4, satisfactionDelta: 2 }),
        },
        {
          id: "expose",
          titleKey: "event.bribe.expose.title",
          bodyKey: "event.bribe.expose.body",
          outcomeKey: "event.bribe.expose.outcome",
          effects: effects({ cashDelta: -100, trustDelta: 6, debateDelta: 3 }),
        },
      ],
    },
  },
  {
    tick: 39,
    definition: {
      id: "vrem_petition",
      kind: "reform",
      titleKey: "event.vrem.title",
      bodyKey: "event.vrem.body",
      choices: [
        {
          id: "pilot",
          titleKey: "event.vrem.pilot.title",
          bodyKey: "event.vrem.pilot.body",
          outcomeKey: "event.vrem.pilot.outcome",
          effects: effects({
            cashDelta: -350,
            trustDelta: 2,
            industrialDelta: 2,
            unlocks: ["vrem"],
            flags: ["vrem_supported"],
          }),
        },
        {
          id: "slow",
          titleKey: "event.vrem.slow.title",
          bodyKey: "event.vrem.slow.body",
          outcomeKey: "event.vrem.slow.outcome",
          effects: effects({ trustDelta: -2, debateDelta: -1 }),
        },
        {
          id: "abandon",
          titleKey: "event.vrem.abandon.title",
          bodyKey: "event.vrem.abandon.body",
          outcomeKey: "event.vrem.abandon.outcome",
          effects: effects({ satisfactionDelta: -3, industrialDelta: -3 }),
        },
      ],
    },
  },
  {
    tick: 42,
    definition: {
      id: "farmer_lobby",
      kind: "faction",
      titleKey: "event.farmers.title",
      bodyKey: "event.farmers.body",
      choices: [
        {
          id: "raise",
          titleKey: "event.farmers.raise.title",
          bodyKey: "event.farmers.raise.body",
          outcomeKey: "event.farmers.raise.outcome",
          effects: effects({
            cashDelta: -700,
            satisfactionDelta: 4,
            flags: ["farmers_helped"],
          }),
        },
        {
          id: "hold",
          titleKey: "event.farmers.hold.title",
          bodyKey: "event.farmers.hold.body",
          outcomeKey: "event.farmers.hold.outcome",
          effects: effects({ satisfactionDelta: -4, trustDelta: 2 }),
        },
        {
          id: "contract",
          titleKey: "event.farmers.contract.title",
          bodyKey: "event.farmers.contract.body",
          outcomeKey: "event.farmers.contract.outcome",
          effects: effects({ cashDelta: -300, satisfactionDelta: 2, industrialDelta: -2 }),
        },
      ],
    },
  },
  {
    tick: 50,
    definition: {
      id: "final_audit",
      kind: "reform",
      titleKey: "event.audit.title",
      bodyKey: "event.audit.body",
      choices: [
        {
          id: "publish",
          titleKey: "event.audit.publish.title",
          bodyKey: "event.audit.publish.body",
          outcomeKey: "event.audit.publish.outcome",
          effects: effects({
            cashDelta: -200,
            trustDelta: 5,
            debateDelta: 5,
            flags: ["audit_clean"],
          }),
        },
        {
          id: "bury",
          titleKey: "event.audit.bury.title",
          bodyKey: "event.audit.bury.body",
          outcomeKey: "event.audit.bury.outcome",
          effects: effects({ trustDelta: -8, flags: ["scandal"] }),
        },
        {
          id: "partial",
          titleKey: "event.audit.partial.title",
          bodyKey: "event.audit.partial.body",
          outcomeKey: "event.audit.partial.outcome",
          effects: effects({ trustDelta: -2, debateDelta: -2 }),
        },
      ],
    },
  },
];
