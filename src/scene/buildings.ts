import * as THREE from "three";
import { PALETTE } from "./palette";

export interface BuildingsBuild {
  readonly group: THREE.Group;
  readonly selectables: readonly THREE.Object3D[];
  readonly smokeStacks: readonly THREE.Object3D[];
}

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

const workshop = (x: number, z: number): THREE.Group => {
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
  chimney.position.set(0.85, 2.32, -0.45);
  chimney.castShadow = true;
  const smoke = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 6, 6),
    new THREE.MeshBasicMaterial({ color: 0xe8e1d3, transparent: true, opacity: 0.55 }),
  );
  smoke.position.set(0.85, 3.1, -0.45);
  group.add(body, roof, chimney, smoke);
  group.position.set(x, 0.72, z);
  group.userData.selection = "workshop";
  group.userData.smoke = smoke;
  return group;
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
  const smokeStacks: THREE.Object3D[] = [];
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

  const workshops = [workshop(7.2, 4.1), workshop(9.8, 2.2), workshop(6.2, -3.9)];
  for (const w of workshops) {
    group.add(w);
    selectables.push(w);
    const smoke = w.userData.smoke;
    if (smoke instanceof THREE.Object3D) smokeStacks.push(smoke);
  }
  const store = warehouse(0.2, 4.8);
  group.add(store);
  selectables.push(store);
  const warehouse2 = warehouse(-2.7, 4.2);
  group.add(warehouse2);
  selectables.push(warehouse2);

  return { group, selectables, smokeStacks };
};
