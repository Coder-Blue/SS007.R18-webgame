import type { Policy, PolicyKey } from "./types";
import { REFORM_MONTHS } from "./constants";

export type ReformStep = {
  readonly policy: Policy;
  readonly completed: readonly PolicyKey[];
};

export const isReformPending = (policy: Policy, key: PolicyKey): boolean =>
  policy.reformProgress.some((project) => project.key === key);

export const startReform = (policy: Policy, key: PolicyKey): Policy => ({
  ...policy,
  reformProgress: [
    ...policy.reformProgress,
    { key, monthsLeft: REFORM_MONTHS[key], totalMonths: REFORM_MONTHS[key] },
  ],
});

const enable = (policy: Policy, key: PolicyKey): Policy => ({
  ...policy,
  n2Enabled: policy.n2Enabled || key === "n2",
  nsmo: policy.nsmo || key === "nsmo",
  dppa: policy.dppa || key === "dppa",
  vrem: policy.vrem || key === "vrem",
  twoPartTariff: policy.twoPartTariff || key === "twoPart",
});

export const advanceReforms = (policy: Policy): ReformStep => {
  const completed: PolicyKey[] = [];
  const remaining: Policy["reformProgress"][number][] = [];

  for (const project of policy.reformProgress) {
    if (project.monthsLeft > 1) {
      remaining.push({ ...project, monthsLeft: project.monthsLeft - 1 });
    } else {
      completed.push(project.key);
    }
  }

  let next = policy;

  for (const key of completed) next = enable(next, key);

  return {
    policy: { ...next, reformProgress: remaining },
    completed,
  };
};
