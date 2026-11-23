export type ScreenRect = {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
};

export type TourAnchor = {
  readonly x: number;
  readonly y: number;
};

export type TourOverlays = {
  readonly drawer?: ScreenRect | null;
  readonly tutorial?: ScreenRect | null;
  readonly rail?: ScreenRect | null;
};

const contains = (rect: ScreenRect, x: number, y: number): boolean =>
  x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * Returns a centre-relative anchor inside the part of the scene that the tutorial
 * and workspace drawer leave uncovered. The scene pans its focus point there.
 */
export const tourAnchor = (
  width: number,
  height: number,
  overlays: TourOverlays,
  bottomInset = 96,
): TourAnchor => {
  const drawer = overlays.drawer ?? null;
  const tutorial = overlays.tutorial ?? null;
  const rail = overlays.rail ?? null;
  const margin = 24;
  const candidates: TourAnchor[] = [];

  if (drawer !== null && rail !== null && drawer.left - rail.right > 120) {
    const gapX = (rail.right + drawer.left) / 2;

    candidates.push({ x: gapX, y: height / 2 });

    if (tutorial !== null) candidates.push({ x: gapX, y: tutorial.top / 2 });
  }

  if (drawer !== null && drawer.left > 320) {
    candidates.push(
      { x: drawer.left / 2, y: height / 2 },
      { x: drawer.left / 2, y: clamp(height * 0.7, margin, height - bottomInset) },
    );
  }

  if (tutorial !== null) {
    candidates.push(
      { x: width / 2, y: (tutorial.bottom + height - bottomInset) / 2 },
      { x: width / 2, y: tutorial.top / 2 },
    );

    if (drawer !== null && drawer.left > 320) {
      candidates.push({ x: drawer.left / 2, y: tutorial.top / 2 });
    }
  }

  candidates.push({ x: width / 2, y: height / 2 });

  const free = candidates.find((candidate) => {
    if (
      candidate.x < margin ||
      candidate.x > width - margin ||
      candidate.y < margin ||
      candidate.y > height - margin
    ) {
      return false;
    }

    const blockedByDrawer = drawer !== null && contains(drawer, candidate.x, candidate.y);

    const blockedByTutorial = tutorial !== null && contains(tutorial, candidate.x, candidate.y);

    const blockedByRail = rail !== null && contains(rail, candidate.x, candidate.y);

    return !blockedByDrawer && !blockedByTutorial && !blockedByRail;
  });

  const point = free ?? { x: width / 2, y: height / 2 };

  return { x: point.x / width - 0.5, y: point.y / height - 0.5 };
};
