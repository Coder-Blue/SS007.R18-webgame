import * as THREE from "three";
import { PALETTE } from "./palette";

export interface TerrainBuild {
  readonly group: THREE.Group;
  readonly selectables: readonly THREE.Object3D[];
}

const material = (
  color: number,
  options: THREE.MeshStandardMaterialParameters = {},
): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.02, ...options });

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

const roof = (
  width: number,
  depth: number,
  height: number,
  color: number,
  x: number,
  y: number,
  z: number,
): THREE.Mesh => {
  const mesh = new THREE.Mesh(
    new THREE.ConeGeometry(Math.max(width, depth) * 0.72, height, 4),
    material(color),
  );

  mesh.rotation.y = Math.PI / 4;
  mesh.position.set(x, y, z);
  mesh.castShadow = true;

  return mesh;
};

const hut = (x: number, z: number): THREE.Group => {
  const group = new THREE.Group();
  const body = box(1.8, 1.2, 1.8, PALETTE.hut, 0, 0.6, 0);
  const roofMesh = roof(2, 2, 1.1, PALETTE.hutRoof, 0, 1.75, 0);
  group.add(body, roofMesh);
  group.position.set(x, 0.8, z);
  group.userData.selection = "hut";

  return group;
};

const tree = (x: number, z: number, scale: number): THREE.Group => {
  const group = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.14, 0.8, 5),
    material(PALETTE.trunk),
  );

  trunk.position.y = 0.4;

  const crown = new THREE.Mesh(
    new THREE.ConeGeometry(0.7, 1.6, 6),
    material(x % 2 === 0 ? PALETTE.tree : PALETTE.treeDark),
  );

  crown.position.y = 1.5;
  crown.castShadow = true;
  group.add(trunk, crown);
  group.scale.setScalar(scale);
  group.position.set(x, 0.8, z);

  return group;
};

const paddy = (x: number, z: number, index: number): THREE.Mesh => {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.16, 2.1),
    material(index % 3 === 0 ? PALETTE.terraceWater : PALETTE.terrace),
  );

  mesh.position.set(x, 0.92, z);
  mesh.receiveShadow = true;
  mesh.userData.selection = index < 6 ? "hydro" : "mechanized";

  return mesh;
};

export const createTerrain = (): TerrainBuild => {
  const group = new THREE.Group();
  const selectables: THREE.Object3D[] = [];

  const island = new THREE.Mesh(
    new THREE.CylinderGeometry(16, 16.8, 1.4, 10),
    material(PALETTE.groundDark),
  );

  island.position.y = -0.35;
  island.receiveShadow = true;
  group.add(island);

  const grass = new THREE.Mesh(
    new THREE.CylinderGeometry(15.4, 16, 0.35, 10),
    material(PALETTE.ground),
  );

  grass.position.y = 0.45;
  grass.receiveShadow = true;
  group.add(grass);

  const mountain = (x: number, z: number, scale: number): void => {
    const peak = new THREE.Mesh(
      new THREE.ConeGeometry(3.4 * scale, 4.6 * scale, 5),
      material(z < 0 ? PALETTE.mountain : PALETTE.mountainDark),
    );

    peak.position.set(x, 2.4 * scale + 0.4, z);
    peak.castShadow = true;
    peak.receiveShadow = true;
    group.add(peak);
  };

  mountain(-10, -8, 1.2);
  mountain(-4, -10, 0.9);
  mountain(4, -9, 1.1);
  mountain(11, -6, 0.8);

  const hutPositions: readonly (readonly [number, number])[] = [
    [-11.5, -4.8],
    [10.8, -2.5],
    [8.8, 7.2],
    [-8.8, 8.1],
  ];

  for (const [x, z] of hutPositions) {
    const h = hut(x, z);
    group.add(h);
    selectables.push(h);
  }

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      const p = paddy(-8.6 + column * 2.35, 1.1 + row * 2.35, row * 4 + column);
      group.add(p);
      selectables.push(p);
    }
  }

  const river = new THREE.Mesh(
    new THREE.BoxGeometry(16, 0.06, 0.9),
    material(PALETTE.river, { transparent: true, opacity: 0.82 }),
  );

  river.position.set(1.5, 0.64, 5.9);
  river.rotation.y = -0.18;
  group.add(river);

  const treePositions: readonly (readonly [number, number, number])[] = [
    [-13, 1, 0.9],
    [-12.4, 6.2, 0.8],
    [-9.8, -6.2, 1],
    [12.2, 3.2, 0.9],
    [13, -7.8, 0.7],
    [2, -11.4, 0.9],
    [-2, 10.2, 1.1],
    [5.4, 9.7, 0.8],
    [-14.1, -1.5, 0.75],
    [14, 6.4, 0.85],
    [7.6, -8.4, 1.05],
    [-6.8, -9.2, 0.8],
    [0.4, 12.1, 0.7],
    [10.2, 9.4, 0.75],
  ];

  for (const [x, z, scale] of treePositions) group.add(tree(x, z, scale));

  return { group, selectables };
};
