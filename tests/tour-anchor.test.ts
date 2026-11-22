import { describe, expect, it } from "vitest";
import { tourAnchor } from "../src/ui/scene/tour-anchor";
import { focusShift } from "../src/scene/camera-rig";

const inside = (value: { x: number; y: number }, width: number, height: number) => ({
  x: (value.x + 0.5) * width,
  y: (value.y + 0.5) * height,
});

describe("tour anchor", () => {
  it("places the focus left of a wide desktop drawer", () => {
    const anchor = tourAnchor(1440, 900, {
      drawer: { left: 460, top: 0, right: 1440, bottom: 900 },
      tutorial: { left: 24, top: 518, right: 464, bottom: 804 },
    });

    const point = inside(anchor, 1440, 900);

    expect(point.x).toBeLessThan(460);
    expect(point.y).toBeGreaterThan(150);
    expect(point.y).toBeLessThan(518);
  });

  it("places the focus below a full-width mobile tutorial", () => {
    const anchor = tourAnchor(390, 844, {
      tutorial: { left: 10, top: 158, right: 380, bottom: 444 },
    });

    const point = inside(anchor, 390, 844);

    expect(point.y).toBeGreaterThan(444);
    expect(point.y).toBeLessThan(748);
  });

  it("falls back to the free upper band when the lower scene is covered", () => {
    const anchor = tourAnchor(1440, 900, {
      drawer: { left: 460, top: 0, right: 1440, bottom: 900 },
      tutorial: { left: 24, top: 320, right: 464, bottom: 804 },
    });

    const point = inside(anchor, 1440, 900);

    expect(point.x).toBeLessThan(460);
    expect(point.y).toBeLessThan(320);
  });

  it("keeps the centre when no overlay covers it", () => {
    expect(tourAnchor(1440, 900, {})).toEqual({ x: 0, y: 0 });
  });

  it("pans the camera opposite the safe anchor", () => {
    const left = focusShift(24, 1.6, { x: -0.34, y: 0 });
    const below = focusShift(34, 0.46, { x: 0, y: 0.2 });

    expect(left.offsetX).toBeGreaterThan(8);
    expect(left.lift).toBeCloseTo(0);
    expect(below.offsetX).toBeCloseTo(0);
    expect(below.lift).toBeGreaterThan(4);
  });
});
