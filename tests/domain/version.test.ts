import { describe, expect, it } from "vitest";
import { GAME_VERSION } from "../../src/domain/constants";

describe("game version", () => {
  it("exposes the release shown in the title footer", () => {
    expect(GAME_VERSION).toBe("1.0.0");
  });
});
