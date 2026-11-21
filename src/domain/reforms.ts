import type { Policy, Village } from "./types";

export interface ReformRevenue {
  readonly dppa: number;
  readonly vrem: number;
  readonly twoPart: number;
  readonly total: number;
}

export const reformRevenue = (policy: Policy, village: Village): ReformRevenue => {
  const dppa = policy.dppa ? village.workshopsThousand * 20 : 0;
  const vrem = policy.vrem ? village.householdsThousand * 0.6 : 0;
  const twoPart = policy.twoPartTariff ? village.workshopsThousand * 4 : 0;

  return { dppa, vrem, twoPart, total: dppa + vrem + twoPart };
};
