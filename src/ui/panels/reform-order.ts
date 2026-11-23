import type { PolicyKey, ReformProject } from "~/domain";

export type ReformEntry = {
  readonly key: PolicyKey;
};

const progressRatio = (project: ReformProject): number =>
  (project.totalMonths - project.monthsLeft) / Math.max(1, project.totalMonths);

export const orderReforms = <T extends ReformEntry>(
  entries: readonly T[],
  projects: readonly ReformProject[],
  isEnabled: (key: PolicyKey) => boolean,
): readonly T[] => {
  const pending = new Map(projects.map((project) => [project.key, project]));

  const rank = (key: PolicyKey): number => (pending.has(key) ? 0 : isEnabled(key) ? 2 : 1);

  return entries.toSorted((left, right) => {
    const difference = rank(left.key) - rank(right.key);

    if (difference !== 0) return difference;

    const leftProject = pending.get(left.key);
    const rightProject = pending.get(right.key);

    if (leftProject === undefined || rightProject === undefined) return 0;

    return progressRatio(rightProject) - progressRatio(leftProject);
  });
};
