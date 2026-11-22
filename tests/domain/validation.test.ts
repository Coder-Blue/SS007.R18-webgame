import { describe, expect, it } from "vitest";
import { decodeSaveFile, parseGameState, safeParseText } from "../../src/domain/validation";
import { SAVE_VERSION, createInitialState } from "../../src/domain/constants";
import type { JsonValue, SaveFile } from "../../src/domain/validation";
import type { GameState } from "../../src/domain/types";

// SAFETY: JSON.parse receives a string produced by JSON.stringify from an already typed game value.
const json = (value: GameState | SaveFile): JsonValue =>
  JSON.parse(JSON.stringify(value)) as JsonValue;

describe("validation", () => {
  it("round-trips the initial state", () => {
    const state = createInitialState(3);
    const result = parseGameState(json(state));

    expect(result.ok).toBe(true);

    if (result.ok) expect(result.value.seed).toBe(3);
  });

  it("accepts an older save without recoveredYears", () => {
    const initial = createInitialState();

    const { reformProgress: _reformProgress, ...legacyPolicy } = initial.policy;

    const legacy = {
      ...initial,
      policy: legacyPolicy,
      finance: {
        cash: initial.finance.cash,
        debt: initial.finance.debt,
        debtLimit: initial.finance.debtLimit,
        accumulatedLoss: initial.finance.accumulatedLoss,
        interestRate: initial.finance.interestRate,
        recoveredTotal: initial.finance.recoveredTotal,
        monthlyHistory: initial.finance.monthlyHistory,
        annualHistory: initial.finance.annualHistory,
      },
    };

    // SAFETY: the fixture deliberately omits recoveredYears to model a version-2 save.
    const result = parseGameState(json(legacy as GameState));

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.finance.recoveredYears).toEqual([]);
      expect(result.value.policy.reformProgress).toEqual([]);
    }
  });

  it("rejects a malformed state", () => {
    expect(parseGameState({ version: 1 }).ok).toBe(false);
    const initial = createInitialState();

    expect(
      parseGameState(json({ ...initial, metrics: { ...initial.metrics, citizenTrust: 200 } })).ok,
    ).toBe(false);
  });

  it("rejects impossible reform progress", () => {
    const initial = createInitialState();

    const reform = (monthsLeft: number, totalMonths: number) =>
      json({
        ...initial,
        policy: {
          ...initial.policy,
          reformProgress: [{ key: "n2" as const, monthsLeft, totalMonths }],
        },
      });

    expect(parseGameState(reform(2, 0)).ok).toBe(false);
    expect(parseGameState(reform(5, 4)).ok).toBe(false);
    expect(parseGameState(reform(1.5, 4)).ok).toBe(false);
  });

  it("decodes a valid save file", () => {
    const file: SaveFile = {
      format: "grid-save",
      version: SAVE_VERSION,
      savedAt: "2026-01-01T00:00:00.000Z",
      state: createInitialState(),
    };

    const result = decodeSaveFile(JSON.stringify(file));

    expect(result.ok).toBe(true);
  });

  it("fails closed on bad JSON and bad envelopes", () => {
    expect(decodeSaveFile("{").ok).toBe(false);
    expect(decodeSaveFile(JSON.stringify({ format: "bad-save" })).ok).toBe(false);
    expect(safeParseText("{").ok).toBe(false);
    expect(safeParseText('{"ok":true}').ok).toBe(true);
  });
});
