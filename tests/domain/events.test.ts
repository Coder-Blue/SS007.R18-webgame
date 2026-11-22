import { describe, expect, it } from "vitest";
import { EVENTS, findEvent } from "../../src/domain/events/catalog";
import {
  mediaShouldTrigger,
  scheduleEvent,
  scriptedEventFor,
} from "../../src/domain/events/schedule";
import { resolveEvent } from "../../src/domain/events/resolve";
import { baseState, ledger } from "./test-helpers";
import type { EventId } from "../../src/domain/types";

const atTick = (tick: number) => ({
  ...baseState(),
  clock: { year: 2022, month: 1, tick },
});

describe("event catalog", () => {
  it("exposes every scripted event", () => {
    expect(EVENTS).toHaveLength(5);
    expect(findEvent("fuel-crisis")?.choices).toHaveLength(2);
    expect(findEvent("media-losses")?.choices).toHaveLength(1);
    // SAFETY: the unknown id exercises the defensive lookup branch; the cast is never a valid domain id.
    expect(findEvent("missing" as EventId)).toBeNull();
  });
});

describe("event scheduling", () => {
  it("places the four scripted milestones on the timeline", () => {
    expect(scriptedEventFor(atTick(9))).toBe("fuel-crisis");
    expect(scriptedEventFor(atTick(16))).toBe("summer-drought");
    expect(scriptedEventFor(atTick(36))).toBe("public-skepticism");
    expect(scriptedEventFor(atTick(40))).toBeNull();
    expect(scriptedEventFor(atTick(44))).toBeNull();
  });

  it("schedules the revised law only on the reform branch", () => {
    const reform = {
      ...atTick(44),
      events: {
        ...atTick(44).events,
        flags: ["event:public-skepticism:reform-path"],
      },
    };

    expect(scriptedEventFor(reform)).toBe("revised-law");
  });

  it("queues a scripted event once", () => {
    const scheduled = scheduleEvent(atTick(9));

    expect(scheduled.events.activeId).toBe("fuel-crisis");
    expect(scheduled.events.queue).toHaveLength(0);
    expect(scheduleEvent(scheduled).events.activeId).toBe("fuel-crisis");
  });

  it("does not schedule an event that already resolved", () => {
    const state = atTick(9);

    expect(
      scheduleEvent({
        ...state,
        events: { ...state.events, resolved: ["fuel-crisis"] },
      }).events.activeId,
    ).toBeNull();
  });

  it("triggers media pressure on losses, debt or a tariff jump", () => {
    const base = baseState();

    const loss = {
      ...base,
      finance: { ...base.finance, monthlyHistory: [ledger({ netResult: -500 })] },
    };

    const debt = {
      ...base,
      finance: {
        ...base.finance,
        debt: 70_000,
        monthlyHistory: [ledger({ netResult: 100 })],
      },
    };

    const hike = {
      ...base,
      finance: {
        ...base.finance,
        monthlyHistory: [
          ledger({ averageRetailTariff: 2_000, netResult: 100 }),
          ledger({ averageRetailTariff: 2_100, netResult: 100 }),
        ],
      },
    };

    expect(mediaShouldTrigger(loss)).toBe(true);
    expect(mediaShouldTrigger(debt)).toBe(true);
    expect(mediaShouldTrigger(hike)).toBe(true);
    expect(mediaShouldTrigger(base)).toBe(false);
    expect(mediaShouldTrigger({ ...loss, media: { ...loss.media, cooldown: 2 } })).toBe(false);
    expect(mediaShouldTrigger({ ...loss, media: { ...loss.media, activeMonths: 2 } })).toBe(false);
  });

  it("queues media behind an active event", () => {
    const state = atTick(1);

    const withLoss = {
      ...state,
      finance: { ...state.finance, monthlyHistory: [ledger({ netResult: -500 })] },
    };

    const scheduled = scheduleEvent(withLoss);

    expect(scheduled.events.activeId).toBe("media-losses");
  });
});

describe("event resolution", () => {
  it("rejects a choice when no event is active", () => {
    expect(resolveEvent(baseState(), "hedge-crisis").ok).toBe(false);
  });

  it("resolves a known choice and opens the next queued event", () => {
    const state = {
      ...atTick(9),
      events: {
        ...atTick(9).events,
        activeId: "fuel-crisis" as const,
        queue: ["media-losses" as const],
      },
    };

    const result = resolveEvent(state, "hedge-crisis");

    expect(result.ok).toBe(true);

    if (!result.ok) return;
    expect(result.value.events.activeId).toBe("media-losses");
    expect(result.value.events.resolved).toContain("fuel-crisis");
    expect(result.value.events.decisions).toContain("keep-fuel");
  });

  it("rejects an unknown choice and an unknown active event", () => {
    const active = {
      ...baseState(),
      events: { ...baseState().events, activeId: "fuel-crisis" as const },
    };

    expect(resolveEvent(active, "missing").ok).toBe(false);
  });

  it("unlocks the revised-law reforms without enabling them instantly", () => {
    const state = {
      ...baseState(),
      events: { ...baseState().events, activeId: "revised-law" as const },
    };

    const result = resolveEvent(state, "enact-law");

    expect(result.ok).toBe(true);

    if (!result.ok) return;
    expect(result.value.events.flags).toContain("event:revised-law:enact-law");
    expect(result.value.policy.n2Enabled).toBe(false);
    expect(result.value.policy.nsmo).toBe(false);
    expect(result.value.policy.dppa).toBe(false);
    expect(result.value.policy.vrem).toBe(false);
    expect(result.value.policy.reformProgress).toEqual([]);
  });

  it("sets media cooldown when acknowledging the media event", () => {
    const state = {
      ...baseState(),
      events: { ...baseState().events, activeId: "media-losses" as const },
    };

    const result = resolveEvent(state, "acknowledge-media");

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.media.activeMonths).toBe(3);
      expect(result.value.media.cooldown).toBe(8);
    }
  });

  it("ends the run immediately if an event pushes trust to zero", () => {
    const state = {
      ...baseState(),
      metrics: { ...baseState().metrics, citizenTrust: 5 },
      events: { ...baseState().events, activeId: "public-skepticism" as const },
    };

    const result = resolveEvent(state, "privatize-grid");

    expect(result.ok).toBe(true);

    if (result.ok) expect(result.value.ending?.reason).toBe("citizen-trust");
  });
});
