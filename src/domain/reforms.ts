import type { Policy } from "./types";

export type ReformRevenue = {
  readonly dppa: number;
  readonly vrem: number;
  readonly nsmo: number;
  readonly twoPart: number;
  readonly total: number;
};

export const reformRevenue = (policy: Policy): ReformRevenue => {
  if (policy.branch === "private" || !policy.priceCap) {
    return { dppa: 0, vrem: 0, nsmo: 0, twoPart: 0, total: 0 };
  }

  const dppa = policy.dppa ? 140 : 0;
  const vrem = policy.vrem ? 190 : 0;
  const nsmo = policy.nsmo ? 90 : 0;
  const twoPart = policy.twoPartTariff ? 70 : 0;

  return { dppa, vrem, nsmo, twoPart, total: dppa + vrem + nsmo + twoPart };
};
