import * as THREE from "three";
import type { GameState } from "~/domain";
import { PALETTE } from "./palette";

export interface FleetBuild {
  readonly group: THREE.Group;
  readonly selectables: readonly THREE.Object3D[];
  readonly update: (state: GameState, elapsed: number) => void;
}

const makeTruck = (): THREE.Group => {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.42, 0.5),
    new THREE.MeshStandardMaterial({ color: PALETTE.truck, roughness: 0.7 }),
  );

  body.position.y = 0.3;
  body.castShadow = true;

  const cargo = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.5, 0.54),
    new THREE.MeshStandardMaterial({ color: PALETTE.truckCargo, roughness: 0.9 }),
  );

  cargo.position.set(-0.22, 0.58, 0);
  cargo.castShadow = true;

  const cab = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.32, 0.46),
    new THREE.MeshStandardMaterial({ color: 0x8e5b3a, roughness: 0.6 }),
  );

  cab.position.set(0.42, 0.46, 0);
  const wheelGeometry = new THREE.CylinderGeometry(0.13, 0.13, 0.12, 8);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x302d29, roughness: 1 });

  for (const x of [-0.28, 0.3]) {
    for (const z of [-0.28, 0.28]) {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, 0.16, z);
      group.add(wheel);
    }
  }

  group.add(body, cargo, cab);
  group.userData.selection = "fleet";

  return group;
};

export const createFleet = (): FleetBuild => {
  const group = new THREE.Group();
  const trucks: THREE.Group[] = [];
  const selectables: THREE.Object3D[] = [];

  const curve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-3, 0.78, 2),
      new THREE.Vector3(0.5, 0.78, 0.5),
      new THREE.Vector3(7.2, 0.78, 3.9),
      new THREE.Vector3(9.8, 0.78, 2.2),
      new THREE.Vector3(6, 0.78, -3.7),
      new THREE.Vector3(0.2, 0.78, 4.7),
      new THREE.Vector3(-2.7, 0.78, 4.1),
      new THREE.Vector3(-8.4, 0.78, 1.2),
    ],
    true,
    "catmullrom",
    0.25,
  );

  for (let index = 0; index < 12; index += 1) {
    const truck = makeTruck();
    truck.visible = false;
    group.add(truck);
    trucks.push(truck);
    selectables.push(truck);
  }

  const update = (state: GameState, elapsed: number): void => {
    const count = Math.max(3, Math.min(12, Math.round(state.infrastructure.fleet / 22)));
    const speed = 0.014 + (state.metrics.industrialOutput - 100) * 0.0001;

    for (let index = 0; index < trucks.length; index += 1) {
      const truck = trucks[index];

      if (truck === undefined) continue;
      truck.visible = index < count;

      if (!truck.visible) continue;
      const rawT = (elapsed * speed + index / count) % 1;
      const t = Math.min(0.9995, Math.max(0, Number.isFinite(rawT) ? rawT : 0));
      const point = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      truck.position.copy(point);
      truck.rotation.y = Math.atan2(tangent.x, tangent.z);
    }
  };

  return { group, selectables, update };
};
