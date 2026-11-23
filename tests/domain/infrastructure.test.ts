import { describe, expect, it } from "vitest";
import { advanceProjects, completeProject } from "../../src/domain/infrastructure";
import { applyEffects, completeDecision } from "../../src/domain/events/effects";
import { baseState, effects } from "./test-helpers";

const project = (
  kind: "line" | "hydro" | "thermal" | "renewable" | "substation" | "decision",
  targetId: string,
  monthsLeft = 1,
) => ({
  id: `${kind}-${targetId}`,
  kind,
  targetId,
  monthsLeft,
  totalMonths: monthsLeft,
});

describe("infrastructure", () => {
  it("completes a line into a zone", () => {
    const state = baseState();
    const next = completeProject(state, project("line", "rural"));

    expect(next.zones.rural.coverage).toBeGreaterThan(state.zones.rural.coverage);
    expect(next.infrastructure.lineKm500).toBeGreaterThan(state.infrastructure.lineKm500);
  });

  it("completes each plant kind", () => {
    const state = baseState();

    expect(
      completeProject(state, project("hydro", "hydro")).generation.hydroCapacityMw,
    ).toBeGreaterThan(state.generation.hydroCapacityMw);
    expect(
      completeProject(state, project("thermal", "thermal")).generation.thermalCapacityMw,
    ).toBeGreaterThan(state.generation.thermalCapacityMw);
    expect(
      completeProject(state, project("renewable", "renewable")).generation.renewableCapacityMw,
    ).toBeGreaterThan(state.generation.renewableCapacityMw);
  });

  it("completes a substation and ignores unknown lines and decisions", () => {
    const state = baseState();
    const next = completeProject(state, project("substation", "substation"));

    expect(next.infrastructure.substations).toBe(state.infrastructure.substations + 1);
    expect(next.infrastructure.gridStrength).toBeGreaterThan(state.infrastructure.gridStrength);
    expect(completeProject(state, project("line", "unknown"))).toBe(state);
    expect(completeProject(state, project("decision", "unknown"))).toBe(state);
  });

  it("advances a queue and completes finished work", () => {
    const state = baseState();

    const queued = {
      ...state,
      operations: {
        ...state.operations,
        projects: [project("line", "urban", 2), project("hydro", "hydro", 1)],
      },
    };

    const step = advanceProjects(queued);

    expect(step.completed).toHaveLength(1);
    expect(step.state.operations.projects).toHaveLength(1);
    expect(step.state.operations.projects[0]?.monthsLeft).toBe(1);
  });
});

describe("event effects", () => {
  it("applies every economic effect and clamps bounds", () => {
    const state = baseState();

    const next = applyEffects(
      state,
      effects({
        cashDelta: 100,
        debtDelta: 200,
        citizenTrustDelta: 100,
        institutionalTrustDelta: -100,
        inflationDelta: 50,
        fuelPriceDelta: 1,
        reservoirDelta: -100,
        hydroCapacityDelta: 100,
        thermalCapacityDelta: 100,
        renewableCapacityDelta: 100,
        coverageDelta: 100,
        demandDelta: 1,
        mediaMonths: 3,
        unlockDecisions: ["keep-fuel"],
        setBranch: "private",
        disablePriceCap: true,
      }),
    );

    expect(next.finance.cash).toBe(state.finance.cash + 100);
    expect(next.finance.debt).toBe(state.finance.debt + 200);
    expect(next.metrics.citizenTrust).toBe(100);
    expect(next.metrics.institutionalTrust).toBe(0);
    expect(next.metrics.inflation).toBe(30);
    expect(next.market.fuelPriceIndex).toBe(2);
    expect(next.generation.reservoir).toBe(0);
    expect(next.zones.rural.coverage).toBe(100);
    expect(next.media.activeMonths).toBe(3);
    expect(next.events.decisions).toContain("keep-fuel");
    expect(next.policy.branch).toBe("private");
    expect(next.policy.priceCap).toBe(false);
  });

  it("completes a known decision and marks the petition", () => {
    const state = {
      ...baseState(),
      events: { ...baseState().events, decisions: ["policy-petition" as const] },
    };

    const next = completeDecision(state, "policy-petition");

    expect(next.events.completedDecisions).toContain("policy-petition");
    expect(next.policy.petitionDone).toBe(true);
  });
});
