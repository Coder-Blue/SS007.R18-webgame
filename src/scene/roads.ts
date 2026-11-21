import * as THREE from "three";
import { gsap } from "gsap";
import type { GameState } from "~/domain";
import { PALETTE } from "./palette";

interface Segment {
  readonly mesh: THREE.Mesh;
  readonly threshold: number;
  readonly remote: boolean;
}

export interface RoadsBuild {
  readonly group: THREE.Group;
  readonly selectables: readonly THREE.Object3D[];
  readonly update: (state: GameState, animate: boolean) => void;
  readonly dispose: () => void;
}

const roadMaterial = (color: number): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.95, metalness: 0 });

const addSegment = (
  group: THREE.Group,
  segments: Segment[],
  from: readonly [number, number],
  to: readonly [number, number],
  threshold: number,
  remote: boolean,
): void => {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const length = Math.hypot(dx, dz);
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(length, 0.08, remote ? 0.42 : 0.68),
    roadMaterial(PALETTE.roadDirt),
  );
  mesh.position.set((from[0] + to[0]) / 2, 0.69, (from[1] + to[1]) / 2);
  mesh.rotation.y = -Math.atan2(dz, dx);
  mesh.receiveShadow = true;
  mesh.userData.selection = "road";
  mesh.userData.baseScale = 1;
  group.add(mesh);
  segments.push({ mesh, threshold, remote });
};

const roadColor = (state: GameState): number => {
  const total =
    state.infrastructure.dirtKm + state.infrastructure.cobbleKm + state.infrastructure.asphaltKm;
  if (total <= 0) return PALETTE.roadDirt;
  const asphaltShare = state.infrastructure.asphaltKm / total;
  if (asphaltShare > 0.42) return PALETTE.roadAsphalt;
  if (state.infrastructure.cobbleKm / total > 0.22) return PALETTE.roadCobble;
  return PALETTE.roadDirt;
};

export const createRoads = (): RoadsBuild => {
  const group = new THREE.Group();
  const segments: Segment[] = [];
  const selectables: THREE.Object3D[] = [];
  addSegment(group, segments, [-3, 2], [0.5, 0.5], 0, false);
  addSegment(group, segments, [0.5, 0.5], [7, 3.8], 0, false);
  addSegment(group, segments, [0.5, 0.5], [9.5, 2], 0, false);
  addSegment(group, segments, [0.5, 0.5], [5.8, -3.6], 0, false);
  addSegment(group, segments, [0.5, 0.5], [2.5, -1.5], 0, false);
  addSegment(group, segments, [0.5, 0.5], [4.5, 2.1], 0, false);
  addSegment(group, segments, [-11, -4.5], [-8.6, -3.8], 20, true);
  addSegment(group, segments, [-8.6, -3.8], [-6.2, -1.6], 20, true);
  addSegment(group, segments, [10.2, -2.3], [7.4, -0.8], 36, true);
  addSegment(group, segments, [7.4, -0.8], [5.7, 0.2], 36, true);
  addSegment(group, segments, [8.4, 6.8], [5.6, 5.6], 52, true);
  addSegment(group, segments, [5.6, 5.6], [2.4, 5.7], 52, true);
  addSegment(group, segments, [-8.4, 7.7], [-5.4, 6.1], 68, true);
  addSegment(group, segments, [-5.4, 6.1], [-1.2, 5.5], 68, true);
  addSegment(group, segments, [-11.5, -4.8], [-9.2, -6.7], 84, true);
  addSegment(group, segments, [10.8, -2.5], [12.2, -4.8], 100, true);

  const update = (state: GameState, animate: boolean): void => {
    const color = roadColor(state);
    for (const segment of segments) {
      const materialInstance = segment.mesh.material;
      if (materialInstance instanceof THREE.MeshStandardMaterial) {
        materialInstance.color.setHex(color);
      }
      const visible = segment.remote
        ? state.infrastructure.remoteCoverage >= segment.threshold
        : true;
      if (segment.mesh.visible === visible) continue;
      segment.mesh.visible = visible;
      if (visible && animate) {
        gsap.fromTo(
          segment.mesh.scale,
          { x: 0.1, y: 1, z: 1 },
          { x: 1, y: 1, z: 1, duration: 0.45, ease: "power2.out" },
        );
      } else if (visible) {
        segment.mesh.scale.set(1, 1, 1);
      }
    }
    if (selectables.length === 0) {
      for (const segment of segments) selectables.push(segment.mesh);
    }
  };

  const dispose = (): void => {
    for (const segment of segments) gsap.killTweensOf(segment.mesh.scale);
  };

  return { group, selectables, update, dispose };
};
