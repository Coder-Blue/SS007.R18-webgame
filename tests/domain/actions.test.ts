import { describe, expect, it } from "vitest";
import { createInitialState } from "../../src/domain/constants";
import type { GameState } from "../../src/domain/types";
import { buildRoadAction } from "../../src/domain/actions/roads";
import { investAction, investmentCost } from "../../src/domain/actions/investments";
import { importRiceAction } from "../../src/domain/actions/stock";
import { setTariffsAction } from "../../src/domain/actions/tariffs";
import {
  enableDppaAction,
  enableNsmoAction,
  enableTwoPartAction,
  enableVremAction,
  enactRecoveryAction,
  requestBailoutAction,
  setRecoveryRateAction,
} from "../../src/domain/actions/policy";
import { finishAction, pay, requirePlaying } from "../../src/domain/actions/helpers";

const initial = createInitialState();

const rich: GameState = {
  ...initial,
  finance: { ...initial.finance, cash: 50_000, debt: 0 },
};

const ended: GameState = {
  ...rich,
  phase: "ended",
  ending: { id: "collapse", reason: "debt", year: 2022, month: 1 },
};

describe("actions", () => {
  it("guards actions outside a playing game", () => {
    expect(requirePlaying(ended)?.ok).toBe(false);
    expect(requirePlaying({ ...rich, ending: ended.ending })?.ok).toBe(false);
    expect(requirePlaying(rich)).toBeNull();
    expect(buildRoadAction(ended, "dirt").ok).toBe(false);
  });

  it("guards every action factory against an ended game", () => {
    expect(investAction(ended, "rnd").ok).toBe(false);
    expect(
      investAction({ ...rich, policy: { ...rich.policy, campaignCooldown: 2 } }, "rnd").ok,
    ).toBe(true);
    expect(enableNsmoAction(ended).ok).toBe(false);
    expect(enableDppaAction(ended).ok).toBe(false);
    expect(enableVremAction(ended).ok).toBe(false);
    expect(enableTwoPartAction(ended).ok).toBe(false);
    expect(enactRecoveryAction(ended).ok).toBe(false);
    expect(setRecoveryRateAction(ended, 0.5).ok).toBe(false);
    expect(importRiceAction(ended).ok).toBe(false);
  });

  it("rejects an unaffordable investment", () => {
    const poor = { ...initial, finance: { ...initial.finance, cash: 0, debt: 59_999 } };
    expect(investAction(poor, "hydro").ok).toBe(false);
  });

  it("borrows to pay for a policy when cash is short", () => {
    const tight = { ...initial, finance: { ...initial.finance, cash: 100, debt: 0 } };
    const result = enableDppaAction(tight);
    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.finance.cash).toBe(0);
      expect(result.value.finance.debt).toBe(300);
    }
  });

  it("pays from cash or rejects unaffordable actions", () => {
    expect(pay(rich, 1_000).ok).toBe(true);
    expect(pay(rich, 200_000)).toEqual({
      ok: false,
      error: { code: "finance.insufficient", detail: "200000" },
    });
    expect(pay(rich, -1).ok).toBe(false);
    expect(finishAction(rich).ok).toBe(true);
  });

  it.each(["dirt", "cobble", "asphalt"] as const)("builds a %s road", (grade) => {
    const result = buildRoadAction(rich, grade);
    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.infrastructure.coverage).toBeGreaterThan(rich.infrastructure.coverage);
      expect(result.value.finance.cash).toBeLessThan(rich.finance.cash);
    }
  });

  it("rejects an unaffordable road", () => {
    const poor = { ...initial, finance: { ...initial.finance, cash: 0, debt: 59_999 } };
    expect(buildRoadAction(poor, "asphalt").ok).toBe(false);
  });

  it("invests in every production asset and the fleet", () => {
    const hydro = investAction(rich, "hydro");
    expect(hydro.ok && hydro.value.production.hydroPaddies).toBe(6);
    const mechanized = investAction(rich, "mechanized");
    expect(mechanized.ok && mechanized.value.production.mechanizedPaddies).toBe(4);
    const irrigation = investAction(rich, "irrigation");
    expect(irrigation.ok && irrigation.value.production.irrigationLevel).toBe(2);
    const rnd = investAction(rich, "rnd");
    expect(rnd.ok && rnd.value.production.rndLevel).toBe(1);
    const fleet = investAction(rich, "fleet");
    expect(fleet.ok && fleet.value.infrastructure.fleet).toBe(140);
  });

  it("runs a campaign and anti-smuggling crackdown", () => {
    const campaign = investAction(rich, "campaign");
    expect(campaign.ok).toBe(true);

    if (campaign.ok) {
      expect(campaign.value.policy.campaignCooldown).toBe(6);
      expect(campaign.value.metrics.trust).toBeGreaterThan(rich.metrics.trust);
    }

    const crackdown = investAction(rich, "crackdown");
    expect(crackdown.ok).toBe(true);

    if (crackdown.ok) {
      expect(crackdown.value.policy.antiSmuggling).toBe(true);
      expect(crackdown.value.events.flags).toContain("smuggling_cracked");
    }
  });

  it("rejects capped assets and repeated actions", () => {
    const capped = {
      ...rich,
      production: {
        ...rich.production,
        hydroPaddies: 12,
        mechanizedPaddies: 10,
        irrigationLevel: 6,
        rndLevel: 5,
      },
      infrastructure: { ...rich.infrastructure, fleet: 320 },
      policy: { ...rich.policy, campaignCooldown: 2, antiSmuggling: true },
    };

    for (const kind of [
      "hydro",
      "mechanized",
      "irrigation",
      "rnd",
      "fleet",
      "campaign",
      "crackdown",
    ] as const) {
      expect(investAction(capped, kind)).toEqual({
        ok: false,
        error: { code: "action.at-cap" },
      });
    }
  });

  it("exposes investment costs that scale with the asset", () => {
    expect(investmentCost(initial, "hydro")).toBe(1_400);
    expect(
      investmentCost(
        { ...initial, production: { ...initial.production, hydroPaddies: 8 } },
        "hydro",
      ),
    ).toBe(1_940);
  });

  it("imports rice and rejects a full or unaffordable store", () => {
    const imported = importRiceAction(rich);
    expect(imported.ok).toBe(true);

    if (imported.ok) {
      expect(imported.value.production.riceInventory).toBe(rich.production.riceInventory + 100);
    }

    expect(
      importRiceAction({ ...rich, production: { ...rich.production, riceInventory: 600 } }),
    ).toEqual({ ok: false, error: { code: "action.stock-full" } });
    expect(
      importRiceAction({
        ...initial,
        finance: { ...initial.finance, cash: 0, debt: 59_999 },
      }).ok,
    ).toBe(false);
  });

  it("validates and applies tariffs", () => {
    const applied = setTariffsAction(rich, [8.2, 10.4, 13.6, 17], 7.4);
    expect(applied.ok).toBe(true);
    const invalid = setTariffsAction(rich, [10.2, 13.2, 18.0, 26.0], 9.2);
    expect(invalid).toEqual({ ok: false, error: { code: "tariff.above-ceiling" } });
    expect(setTariffsAction(ended, [8.2, 10.4, 13.6, 17], 7.4).ok).toBe(false);
  });

  it("unlocks N-2 recovery from 2024 and controls the rate", () => {
    const early = enactRecoveryAction(rich);
    expect(early).toEqual({ ok: false, error: { code: "policy.too-early" } });
    const ready = { ...rich, clock: { year: 2024, month: 1, tick: 24 } };
    const enacted = enactRecoveryAction(ready);
    expect(enacted.ok).toBe(true);

    if (enacted.ok) expect(enacted.value.policy.n2Enabled).toBe(true);
    expect(enactRecoveryAction({ ...ready, policy: { ...ready.policy, n2Enabled: true } })).toEqual(
      {
        ok: false,
        error: { code: "policy.already-enabled" },
      },
    );
    expect(setRecoveryRateAction(ready, 0.5)).toEqual({
      ok: false,
      error: { code: "policy.not-enabled" },
    });
    const enabled = { ...ready, policy: { ...ready.policy, n2Enabled: true } };
    expect(setRecoveryRateAction(enabled, 0.5).ok).toBe(true);
    expect(setRecoveryRateAction(enabled, 0.1).ok).toBe(false);
    expect(setRecoveryRateAction(enabled, 0.9).ok).toBe(false);
  });

  it("enables NSMO, DPPA, VREM and two-part tariffs", () => {
    expect(enableNsmoAction(rich).ok).toBe(true);
    expect(enableDppaAction(rich).ok).toBe(true);
    const vrem = enableVremAction(rich);
    expect(vrem.ok).toBe(true);

    const twoPart = enableTwoPartAction(
      vrem.ok ? vrem.value : { ...rich, policy: { ...rich.policy, vrem: true } },
    );

    expect(twoPart.ok).toBe(true);
    expect(enableTwoPartAction(rich)).toEqual({
      ok: false,
      error: { code: "policy.requires-vrem" },
    });

    const enabled = {
      ...rich,
      policy: { ...rich.policy, nsmo: true, dppa: true, vrem: true, twoPartTariff: true },
    };

    expect(enableNsmoAction(enabled).ok).toBe(false);
    expect(enableDppaAction(enabled).ok).toBe(false);
    expect(enableVremAction(enabled).ok).toBe(false);
    expect(enableTwoPartAction(enabled).ok).toBe(false);
    expect(
      enableNsmoAction({
        ...initial,
        finance: { ...initial.finance, cash: 0, debt: 60_000 },
      }).ok,
    ).toBe(false);
  });

  it("requests the one-time bailout", () => {
    const bailout = requestBailoutAction(rich);
    expect(bailout.ok).toBe(true);

    if (bailout.ok) {
      expect(bailout.value.policy.bailoutUsed).toBe(true);
      expect(bailout.value.finance.debt).toBe(0);
    }

    expect(requestBailoutAction(rich).ok).toBe(true);
    const used = { ...rich, policy: { ...rich.policy, bailoutUsed: true } };
    expect(requestBailoutAction(used)).toEqual({
      ok: false,
      error: { code: "policy.bailout-used" },
    });
    expect(requestBailoutAction(ended).ok).toBe(false);
  });
});
