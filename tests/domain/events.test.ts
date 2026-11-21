import { describe, expect, it } from "vitest";
import { createInitialState } from "../../src/domain/constants";
import {
  ALL_EVENTS,
  EVENT_SCHEDULE,
  activeEvent,
  dueEventIds,
  eventById,
  scheduleEvents,
} from "../../src/domain/events";
import { resolveEvent } from "../../src/domain/events/resolve";
import { appendFlags, applyCashDebt, applyUnlocks } from "../../src/domain/events/effects";
import { DEBT_WARNING_EVENT } from "../../src/domain/events/conditional";

const initial = createInitialState();
const june = { ...initial, clock: { year: 2022, month: 6, tick: 5 } };

describe("events", () => {
  it("catalogues all scheduled and conditional events", () => {
    expect(EVENT_SCHEDULE.length).toBeGreaterThan(10);
    expect(ALL_EVENTS.length).toBe(EVENT_SCHEDULE.length + 1);
    expect(eventById("drought_2022")?.id).toBe("drought_2022");
    expect(eventById("missing")).toBeUndefined();
  });

  it("schedules the drought in June 2022", () => {
    expect(dueEventIds(june)).toContain("drought_2022");
    const scheduled = scheduleEvents(june);
    expect(scheduled.events.activeId).toBe("drought_2022");
    expect(activeEvent(scheduled)?.id).toBe("drought_2022");
  });

  it("handles duplicate queue entries and unknown active ids", () => {
    const queued = {
      ...june,
      events: { ...june.events, queue: ["drought_2022"] },
    };
    const scheduled = scheduleEvents(queued);
    expect(scheduled.events.activeId).toBe("drought_2022");
    expect(scheduled.events.queue).toEqual([]);
    expect(activeEvent({ ...june, events: { ...june.events, activeId: "missing" } })).toBeNull();
    expect(activeEvent(initial)).toBeNull();
  });

  it("does not reschedule resolved or active events", () => {
    const resolved = { ...june, events: { ...june.events, resolved: ["drought_2022"] } };
    expect(dueEventIds(resolved)).not.toContain("drought_2022");
    const active = { ...june, events: { ...june.events, activeId: "drought_2022" } };
    expect(dueEventIds(active)).not.toContain("drought_2022");
    expect(activeEvent(active)?.id).toBe("drought_2022");
  });

  it("queues every due event and activates the earliest unresolved", () => {
    const state = { ...initial, clock: { year: 2023, month: 10, tick: 21 } };
    const scheduled = scheduleEvents(state);
    expect(scheduled.events.activeId).toBe("drought_2022");
    expect(scheduled.events.queue).toContain("debate_sunk_cost");
    const cleared = scheduleEvents({
      ...state,
      events: {
        ...state.events,
        resolved: ["drought_2022", "fertilizer_2022", "currency_2023"],
      },
    });
    expect(cleared.events.activeId).toBe("debate_sunk_cost");
  });

  it("raises a debt warning after month six", () => {
    const state = {
      ...june,
      clock: { year: 2022, month: 8, tick: 7 },
      finance: { ...june.finance, debt: 50_000 },
    };
    expect(dueEventIds(state)).toContain("debt_warning");
    const resolved = scheduleEvents({
      ...state,
      events: { ...state.events, resolved: ["debt_warning"] },
    });
    expect(activeEvent(resolved)?.id).toBe("drought_2022");
  });

  it("applies cash, debt and flags while keeping flags unique", () => {
    const spent = applyCashDebt(
      { ...initial, finance: { ...initial.finance, cash: 100 } },
      -500,
      0,
    );
    expect(spent.finance.cash).toBe(0);
    expect(spent.finance.debt).toBe(14_400);
    expect(appendFlags(["a"], ["a", "b", "b"])).toEqual(["a", "b"]);
    const unlocked = applyUnlocks(initial.policy, ["dppa", "vrem", "nsmo", "antiSmuggling"], true);
    expect(unlocked).toMatchObject({
      dppa: true,
      vrem: true,
      nsmo: true,
      antiSmuggling: true,
      n2Enabled: true,
    });
  });

  it("rejects resolving without an active or valid choice", () => {
    expect(resolveEvent(initial, "import")).toEqual({
      ok: false,
      error: "event.none-active",
    });
    expect(resolveEvent(scheduleEvents(june), "missing")).toEqual({
      ok: false,
      error: "event.unknown-choice",
    });
  });

  it("resolves the drought import and records it", () => {
    const state = scheduleEvents(june);
    const resolved = resolveEvent(state, "import");
    expect(resolved.ok).toBe(true);
    if (resolved.ok) {
      expect(resolved.value.production.riceInventory).toBe(state.production.riceInventory + 80);
      expect(resolved.value.events.resolved).toContain("drought_2022");
      expect(resolved.value.events.activeId).toBeNull();
      expect(resolved.value.finance.cash).toBeLessThan(state.finance.cash);
    }
  });

  it("applies event unlocks and crisis endings", () => {
    const dppa = {
      ...initial,
      clock: { year: 2024, month: 4, tick: 27 },
      events: { ...initial.events, activeId: "dppa_petition" },
    };
    const approved = resolveEvent(dppa, "pilot");
    expect(approved.ok).toBe(true);
    if (approved.ok) expect(approved.value.policy.dppa).toBe(true);

    const california = {
      ...initial,
      clock: { year: 2023, month: 11, tick: 22 },
      events: { ...initial.events, activeId: "california_2001" },
    };
    const collapse = resolveEvent(california, "freeze");
    expect(collapse.ok).toBe(true);
    if (collapse.ok) {
      expect(collapse.value.phase).toBe("ended");
      expect(collapse.value.ending?.reason).toBe("california");
    }
  });

  it("collapses after the privatization choice", () => {
    const state = {
      ...initial,
      clock: { year: 2023, month: 10, tick: 21 },
      events: { ...initial.events, activeId: "debate_sunk_cost" },
    };
    const resolved = resolveEvent(state, "privatize");
    expect(resolved.ok).toBe(true);
    if (resolved.ok) {
      expect(resolved.value.ending?.reason).toBe("privatization");
      expect(resolved.value.phase).toBe("ended");
    }
  });

  it("resolves the conditional debt warning", () => {
    const state = {
      ...initial,
      clock: { year: 2022, month: 8, tick: 7 },
      finance: { ...initial.finance, debt: 50_000 },
      events: { ...initial.events, activeId: DEBT_WARNING_EVENT.id },
    };
    const resolved = resolveEvent(state, "bailout");
    expect(resolved.ok).toBe(true);
    if (resolved.ok) {
      expect(resolved.value.finance.debt).toBe(42_000);
      expect(resolved.value.events.flags).toContain("bailout_taken");
    }
  });
});
