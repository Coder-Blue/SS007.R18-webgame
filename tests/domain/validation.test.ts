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

  it("rejects a malformed state", () => {
    expect(parseGameState({ version: 1 }).ok).toBe(false);
    const initial = createInitialState();

    expect(
      parseGameState(json({ ...initial, metrics: { ...initial.metrics, citizenTrust: 200 } })).ok,
    ).toBe(false);
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
