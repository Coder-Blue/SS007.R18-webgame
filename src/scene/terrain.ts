import * as THREE from "three";
import { PALETTE } from "./palette";

export type TerrainBuild = {
  readonly group: THREE.Group;
  readonly water: THREE.Mesh;
  readonly waterMaterial: THREE.MeshStandardMaterial;
};

const material = (color: number, options: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0.04, ...options });

const box = (
  width: number,
  height: number,
  depth: number,
  color: number,
  x: number,
  y: number,
  z: number,
): THREE.Mesh => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material(color));

  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
};

const cone = (radius: number, height: number, color: number, x: number, z: number, y: number) => {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 6), material(color));

  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
};

const tower = (x: number, z: number, height: number, width: number): THREE.Group => {
  const group = new THREE.Group();
  const body = box(width, height, width, PALETTE.concrete, 0, height / 2, 0);
  const crown = box(width * 0.7, 0.5, width * 0.7, PALETTE.steelDark, 0, height + 0.2, 0);

  group.add(body, crown);
  group.position.set(x, 0, z);

  return group;
};

export const createTerrain = (): TerrainBuild => {
  const group = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(19, 20, 1.8, 7),
    material(PALETTE.groundDark),
  );

  base.position.y = -0.9;
  base.receiveShadow = true;
  group.add(base);

  const plateau = new THREE.Mesh(
    new THREE.CylinderGeometry(18.2, 19, 0.6, 7),
    material(PALETTE.plateau),
  );

  plateau.position.y = 0.3;
  plateau.receiveShadow = true;
  group.add(plateau);

  const coast = new THREE.Mesh(
    new THREE.BoxGeometry(8, 0.4, 30),
    material(PALETTE.waterDeep, { transparent: true, opacity: 0.9 }),
  );

  coast.position.set(17, 0.2, 0);
  coast.receiveShadow = true;
  group.add(coast);

  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(4.6, 4.9, 0.28, 24),
    material(PALETTE.water, { transparent: true, opacity: 0.9, roughness: 0.25 }),
  );

  water.position.set(-9, 0.78, -3.5);
  water.receiveShadow = true;
  group.add(water);

  const waterMaterial = water.material;

  const river = new THREE.Mesh(
    new THREE.BoxGeometry(16, 0.06, 0.5),
    material(PALETTE.waterDeep, { transparent: true, opacity: 0.7 }),
  );

  river.position.set(0.5, 0.66, -0.3);
  river.rotation.y = -0.18;
  group.add(river);

  const mountains = [
    [-13, -8, 1.25],
    [-8, -10, 0.95],
    [-3, -11, 1.1],
    [-16, -2, 0.8],
    [2, -9, 0.75],
  ] as const;

  for (const [x, z, scale] of mountains) {
    group.add(
      cone(
        3.1 * scale,
        4.6 * scale,
        z < -6 ? PALETTE.mountain : PALETTE.mountainDark,
        x,
        z,
        2.2 * scale + 0.5,
      ),
    );
  }

  const city = [
    [4.5, 5.2, 1.5, 0.9],
    [6.2, 6.4, 2.2, 1.1],
    [3.2, 7.1, 1.1, 0.8],
    [7.5, 4.9, 1.8, 1],
    [5.6, 3.9, 2.6, 1.2],
  ] as const;

  for (const [x, z, height, width] of city) group.add(tower(x, z, height, width));

  const ruralHomes = [
    [-4.4, 6.2],
    [-6.2, 5.2],
    [-5.2, 7.8],
    [-7.6, 7.1],
    [-3.2, 8.2],
  ] as const;

  for (const [x, z] of ruralHomes) {
    const house = box(1.5, 1, 1.4, PALETTE.concrete, x, 1.1, z);
    const roof = cone(1.15, 0.7, PALETTE.mountainDark, x, z, 1.95);

    group.add(house, roof);
  }

  const treePositions = [
    [-10.5, 5.5, 0.8],
    [-12, 2.5, 0.7],
    [-1.8, 4.5, 0.9],
    [10.5, -5.5, 0.7],
    [12, 2.5, 0.8],
    [0.5, 9.5, 0.7],
    [-9, 10, 0.9],
    [9, 9, 0.7],
  ] as const;

  for (const [x, z, scale] of treePositions) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.6, 5), material(0x4a3a2a));

    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.2, 5), material(PALETTE.mountain));

    trunk.position.set(x, 0.9, z);
    crown.position.set(x, 1.7, z);
    crown.scale.setScalar(scale);
    crown.castShadow = true;
    group.add(trunk, crown);
  }

  return { group, water, waterMaterial };
};
