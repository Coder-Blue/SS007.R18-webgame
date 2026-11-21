import { describe, expect, it } from "vitest";
import { createInitialState } from "../../src/domain/constants";
import {
  decodeSaveFile,
  parseGameState,
  safeParseText,
  type JsonValue,
} from "../../src/domain/validation";

const initial = createInitialState();
const asJson = <T extends object>(value: T): JsonValue => JSON.parse(JSON.stringify(value));

const save = {
  format: "dqkt-save",
  version: 1,
  savedAt: "2026-11-21T00:00:00.000Z",
  state: initial,
};

describe("validation", () => {
  it("accepts the initial state", () => {
    expect(parseGameState(asJson(initial)).ok).toBe(true);
  });

  it("rejects malformed state data", () => {
    expect(parseGameState(asJson({ ...initial, version: 2 }))).toEqual({
      ok: false,
      error: "save.invalid-state",
    });
    expect(parseGameState(null)).toEqual({
      ok: false,
      error: "save.invalid-state",
    });
    expect(
      parseGameState(asJson({ ...initial, tariffs: { ...initial.tariffs, tiers: [1, 2] } })),
    ).toEqual({
      ok: false,
      error: "save.invalid-state",
    });
  });

  it("decodes a valid save file", () => {
    const decoded = decodeSaveFile(JSON.stringify(save));
    expect(decoded.ok).toBe(true);

    if (decoded.ok) expect(decoded.value.format).toBe("dqkt-save");
  });

  it("rejects invalid JSON and invalid save envelopes", () => {
    expect(decodeSaveFile("{")).toEqual({ ok: false, error: "save.invalid-json" });
    expect(decodeSaveFile("{}")).toEqual({ ok: false, error: "save.invalid-format" });
    expect(decodeSaveFile(JSON.stringify({ ...save, version: 99 }))).toEqual({
      ok: false,
      error: "save.invalid-format",
    });
    expect(
      decodeSaveFile(
        JSON.stringify({
          ...save,
          state: { ...initial, metrics: { ...initial.metrics, trust: 200 } },
        }),
      ),
    ).toEqual({ ok: false, error: "save.invalid-format" });
  });

  it("parses arbitrary text safely", () => {
    expect(safeParseText('{"a":1}')).toEqual({ ok: true, value: { a: 1 } });
    expect(safeParseText("nope")).toEqual({ ok: false, error: "save.invalid-json" });
  });
});
