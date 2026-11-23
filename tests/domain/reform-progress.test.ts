import { describe, expect, it } from "vitest";
import { advanceReforms, isReformPending, startReform } from "../../src/domain/reform-progress";
import { baseState } from "./test-helpers";
import type { PolicyKey } from "../../src/domain/types";
import { REFORM_MONTHS } from "../../src/domain/constants";

const keys: readonly PolicyKey[] = ["n2", "nsmo", "dppa", "vrem", "twoPart"];

describe("reform progress", () => {
  it("starts a reform and marks it pending", () => {
    const policy = baseState().policy;
    const started = startReform(policy, "n2");

    expect(isReformPending(started, "n2")).toBe(true);
    expect(started.reformProgress).toHaveLength(1);
  });

  it("counts down and enables every reform on completion", () => {
    for (const key of keys) {
      let policy = startReform(baseState().policy, key);

      for (let month = 0; month < 10; month += 1) {
        const step = advanceReforms(policy);

        policy = step.policy;

        if (step.completed.length > 0) break;
      }

      expect(policy.reformProgress).toHaveLength(0);
      expect(
        key === "n2"
          ? policy.n2Enabled
          : key === "nsmo"
            ? policy.nsmo
            : key === "dppa"
              ? policy.dppa
              : key === "vrem"
                ? policy.vrem
                : policy.twoPartTariff,
      ).toBe(true);
    }
  });

  it("keeps a project when more than one month remains", () => {
    const started = startReform(baseState().policy, "vrem");
    const step = advanceReforms(started);

    expect(step.completed).toHaveLength(0);
    expect(step.policy.reformProgress[0]?.monthsLeft).toBe(REFORM_MONTHS.vrem - 1);
  });
});
