import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { createInitialState } from "../../src/domain/constants";
import { createFleet } from "../../src/scene/fleet";

const maxFrameStep = (fps: number): number => {
  const fleet = createFleet();
  const state = createInitialState();
  const previous = new Map<THREE.Object3D, THREE.Vector3>();
  let maxStep = 0;

  for (let frame = 0; frame < fps * 80; frame += 1) {
    fleet.update(state, 1 / fps);

    for (const truck of fleet.selectables) {
      if (!truck.visible) {
        previous.delete(truck);
        continue;
      }

      const last = previous.get(truck);

      if (last === undefined) {
        previous.set(truck, truck.position.clone());
        continue;
      }

      maxStep = Math.max(maxStep, last.distanceTo(truck.position));
      last.copy(truck.position);
    }
  }

  return maxStep;
};

describe("fleet motion", () => {
  it("keeps the lane offset stable through the hairpin at 30 and 60 fps", () => {
    const thirty = maxFrameStep(30);
    const sixty = maxFrameStep(60);

    expect(thirty).toBeLessThan(0.04);
    expect(sixty).toBeLessThan(0.02);
  });
});
