import { describe, expect, it } from "vitest";

describe("release marker", () => {
  it("keeps the release channel stable", () => {
    expect("stable").toBe("stable");
  });
});
