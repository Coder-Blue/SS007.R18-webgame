import { describe, expect, it } from "vitest";
import { orderReforms } from "../src/ui/panels/reform-order";
import type { PolicyKey, ReformProject } from "../src/domain/types";

const entries: readonly { readonly key: PolicyKey }[] = [
  { key: "n2" },
  { key: "nsmo" },
  { key: "dppa" },
  { key: "vrem" },
  { key: "twoPart" },
];

const project = (key: PolicyKey, monthsLeft: number, totalMonths: number): ReformProject => ({
  key,
  monthsLeft,
  totalMonths,
});

describe("reform ordering", () => {
  it("puts active reforms first, then available, then enabled", () => {
    const ordered = orderReforms(
      entries,
      [project("nsmo", 3, 4), project("dppa", 2, 4)],
      (key) => key === "n2",
    );

    expect(ordered.map((entry) => entry.key)).toEqual(["dppa", "nsmo", "vrem", "twoPart", "n2"]);
  });

  it("keeps the catalog order without active projects", () => {
    expect(orderReforms(entries, [], () => false).map((entry) => entry.key)).toEqual([
      "n2",
      "nsmo",
      "dppa",
      "vrem",
      "twoPart",
    ]);
  });

  it("keeps equal progress stable", () => {
    const ordered = orderReforms(
      entries,
      [project("vrem", 3, 4), project("dppa", 3, 4)],
      () => false,
    );

    expect(ordered.slice(0, 2).map((entry) => entry.key)).toEqual(["dppa", "vrem"]);
  });
});
