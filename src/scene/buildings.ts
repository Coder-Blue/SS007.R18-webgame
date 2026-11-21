import * as THREE from "three";
import { clamp, puffFade, puffProgress, puffScale, wrapUnit } from "./motion";
import { PALETTE } from "./palette";

export interface SmokePuff {
  readonly mesh: THREE.Object3D;
  readonly material: THREE.MeshBasicMaterial;
  readonly phase: number;
  readonly baseX: number;
  readonly baseY: number;
  readonly baseZ: number;
}

export interface SmokeStack {
  readonly puffs: readonly SmokePuff[];
}

export interface BuildingsBuild {
  readonly group: THREE.Group;
  readonly selectables: readonly THREE.Object3D[];
  readonly smokeStacks: readonly SmokeStack[];
  readonly updateSmoke: (time: number, industrialOutput: number) => void;
}

interface WorkshopBuild {
  readonly group: THREE.Group;
  readonly stack: SmokeStack;
}

const SMOKE_PUFFS_PER_STACK = 3;
const SMOKE_CYCLE_SECONDS = 2.8;
const SMOKE_BASE_X = 0.85;
const SMOKE_BASE_Y = 3.1;
const SMOKE_BASE_Z = -0.45;
const SMOKE_DRIFT_X = 1.35;
const SMOKE_DRIFT_Y = 1.9;
const SMOKE_DRIFT_Z = -0.4;
const SMOKE_GROWTH_FROM = 0.5;
const SMOKE_GROWTH_TO = 1.75;

const material = (color: number): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.04 });

const house = (x: number, z: number, scale = 1): THREE.Group => {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.35, 1.8), material(PALETTE.houseWall));
  body.position.y = 0.68;
  body.castShadow = true;
  body.receiveShadow = true;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.7, 1.1, 4), material(PALETTE.houseRoof));
  roof.rotation.y = Math.PI / 4;
  roof.position.y = 1.9;
  roof.castShadow = true;
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.75, 0.06), material(0x6b4a30));
  door.position.set(0, 0.42, 0.93);
  group.add(body, roof, door);
  group.position.set(x, 0.72, z);
  group.scale.setScalar(scale);

  return group;
};

const addSmoke = (
  group: THREE.Group,
  geometry: THREE.SphereGeometry,
  stackIndex: number,
  puffs: SmokePuff[],
): void => {
  for (let index = 0; index < SMOKE_PUFFS_PER_STACK; index += 1) {
    const puffMaterial = new THREE.MeshBasicMaterial({
      color: 0xe8e1d3,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });

    const root = new THREE.Group();
    const mesh = new THREE.Mesh(geometry, puffMaterial);

    root.position.set(SMOKE_BASE_X, SMOKE_BASE_Y, SMOKE_BASE_Z);
    root.scale.setScalar(SMOKE_GROWTH_FROM);
    root.add(mesh);
    group.add(root);
    puffs.push({
      mesh: root,
      material: puffMaterial,
      phase: wrapUnit(stackIndex * 0.19 + index / SMOKE_PUFFS_PER_STACK),
      baseX: SMOKE_BASE_X,
      baseY: SMOKE_BASE_Y,
      baseZ: SMOKE_BASE_Z,
    });
  }
};

const workshop = (
  x: number,
  z: number,
  stackIndex: number,
  smokeGeometry: THREE.SphereGeometry,
): WorkshopBuild => {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.7, 2.2), material(PALETTE.workshopWall));
  body.position.y = 0.85;
  body.castShadow = true;
  body.receiveShadow = true;

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(3.1, 0.16, 2.5),
    material(PALETTE.workshopRoof),
  );

  roof.position.y = 1.78;
  const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 1.1, 6), material(0x7d6a58));
  chimney.position.set(SMOKE_BASE_X, 2.32, SMOKE_BASE_Z);
  chimney.castShadow = true;

  const puffs: SmokePuff[] = [];

  addSmoke(group, smokeGeometry, stackIndex, puffs);
  group.add(body, roof, chimney);
  group.position.set(x, 0.72, z);
  group.userData.selection = "workshop";

  return { group, stack: { puffs } };
};

const warehouse = (x: number, z: number): THREE.Group => {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 2), material(0xbba57e));
  body.position.y = 0.55;
  body.castShadow = true;

  const roof = new THREE.Mesh(
    new THREE.CylinderGeometry(1.45, 1.45, 2.6, 3, 1, false),
    material(PALETTE.workshopRoof),
  );

  roof.rotation.z = Math.PI / 2;
  roof.rotation.y = Math.PI / 2;
  roof.position.y = 1.35;
  group.add(body, roof);
  group.position.set(x, 0.72, z);
  group.userData.selection = "workshop";

  return group;
};

export const createBuildings = (): BuildingsBuild => {
  const group = new THREE.Group();
  const selectables: THREE.Object3D[] = [];
  const smokeStacks: SmokeStack[] = [];
  const smokeGeometry = new THREE.SphereGeometry(0.32, 6, 6);

  const houses: readonly (readonly [number, number, number])[] = [
    [2.4, -1.6, 1],
    [4.8, -0.8, 0.9],
    [1.4, 1.1, 0.85],
    [4.2, 2.2, 1.1],
    [7.1, 0.8, 0.95],
    [2.2, 3.8, 0.8],
    [-1.2, -2.6, 0.9],
    [-3.4, 0.4, 0.85],
  ];

  for (const [x, z, scale] of houses) group.add(house(x, z, scale));

  const workshops = [
    workshop(7.2, 4.1, 0, smokeGeometry),
    workshop(9.8, 2.2, 1, smokeGeometry),
    workshop(6.2, -3.9, 2, smokeGeometry),
  ];

  for (const built of workshops) {
    group.add(built.group);
    selectables.push(built.group);
    smokeStacks.push(built.stack);
  }

  const store = warehouse(0.2, 4.8);
  group.add(store);
  selectables.push(store);
  const warehouse2 = warehouse(-2.7, 4.2);
  group.add(warehouse2);
  selectables.push(warehouse2);

  const updateSmoke = (time: number, industrialOutput: number): void => {
    const strength = clamp(0.7 + industrialOutput / 300, 0.45, 1.25);

    for (let stackIndex = 0; stackIndex < smokeStacks.length; stackIndex += 1) {
      const stack = smokeStacks[stackIndex];

      if (stack === undefined) continue;

      for (let puffIndex = 0; puffIndex < stack.puffs.length; puffIndex += 1) {
        const puff = stack.puffs[puffIndex];

        if (puff === undefined) continue;
        const progress = puffProgress(time, puff.phase, SMOKE_CYCLE_SECONDS);

        puff.mesh.position.set(
          puff.baseX + progress * SMOKE_DRIFT_X,
          puff.baseY + progress * SMOKE_DRIFT_Y,
          puff.baseZ + progress * SMOKE_DRIFT_Z,
        );
        puff.mesh.scale.setScalar(puffScale(progress, SMOKE_GROWTH_FROM, SMOKE_GROWTH_TO));
        puff.material.opacity = puffFade(progress) * 0.5 * strength;
      }
    }
  };

  return { group, selectables, smokeStacks, updateSmoke };
};
