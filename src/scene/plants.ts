import * as THREE from "three";
import type { GameState } from "~/domain";
import { clamp, puffFade, puffProgress, puffScale, wrapUnit } from "./motion";
import { PALETTE } from "./palette";

export type SceneSelection =
  | "hydro"
  | "thermal"
  | "renewable"
  | "substation"
  | "urban"
  | "industrial"
  | "rural";

type Puff = {
  readonly root: THREE.Group;
  readonly material: THREE.MeshBasicMaterial;
  readonly phase: number;
};

type Stack = {
  readonly puffs: readonly Puff[];
  readonly color: number;
};

export type PlantBuild = {
  readonly group: THREE.Group;
  readonly selectables: readonly THREE.Object3D[];
  readonly update: (state: GameState, time: number, delta: number) => void;
};

const material = (color: number, options: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.12, ...options });

const box = (
  width: number,
  height: number,
  depth: number,
  color: number,
  x: number,
  y: number,
  z: number,
  options: THREE.MeshStandardMaterialParameters = {},
): THREE.Mesh => {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    material(color, options),
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
};

const smokeStack = (
  group: THREE.Group,
  geometry: THREE.SphereGeometry,
  x: number,
  y: number,
  z: number,
  phaseOffset: number,
): Stack => {
  const puffs: Puff[] = [];

  for (let index = 0; index < 4; index += 1) {
    const puffMaterial = new THREE.MeshBasicMaterial({
      color: 0x9aa6a8,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });

    const root = new THREE.Group();
    const mesh = new THREE.Mesh(geometry, puffMaterial);

    root.position.set(x, y, z);
    root.add(mesh);
    group.add(root);
    puffs.push({ root, material: puffMaterial, phase: wrapUnit(phaseOffset + index / 4) });
  }

  return { puffs, color: 0x9aa6a8 };
};

const hydro = () => {
  const group = new THREE.Group();
  const wall = box(5.2, 1.5, 1.4, PALETTE.concrete, -9, 1.2, -3.5);
  const crest = box(5.4, 0.18, 0.5, PALETTE.steel, -9, 2.05, -3.5);
  const house = box(1.6, 1.1, 1.2, PALETTE.concrete, -6.2, 0.9, -3.4);
  const turbines: THREE.Object3D[] = [];

  for (let index = 0; index < 3; index += 1) {
    const turbine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.2, 10),
      material(PALETTE.steelDark, { metalness: 0.5 }),
    );

    turbine.position.set(-10.3 + index * 1.3, 1.05, -2.9);
    turbine.rotation.x = Math.PI / 2;
    group.add(turbine);
    turbines.push(turbine);
  }

  group.add(wall, crest, house);
  group.userData.selection = "hydro";

  return { group, turbines };
};

const thermal = (smokeGeometry: THREE.SphereGeometry) => {
  const group = new THREE.Group();
  const hall = box(4.6, 1.8, 3, PALETTE.concrete, -1.5, 1.2, -7.2);
  const turbineHall = box(2.4, 1.2, 2.2, PALETTE.steelDark, 1.6, 0.9, -7.4);

  const windowMaterial = material(PALETTE.factoryWindow, {
    emissive: PALETTE.factoryWindow,
    emissiveIntensity: 0.8,
  });

  const windowMesh = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.28, 0.06), windowMaterial);

  windowMesh.position.set(-1.5, 1.35, -5.68);
  const stacks: Stack[] = [];

  for (let index = 0; index < 2; index += 1) {
    const stack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.32, 3.2, 10),
      material(PALETTE.steelDark),
    );

    stack.position.set(-2.7 + index * 1.6, 3.2, -7.2);
    stack.castShadow = true;
    group.add(stack);
    stacks.push(smokeStack(group, smokeGeometry, -2.7 + index * 1.6, 4.9, -7.2, index * 0.34));
  }

  group.add(hall, turbineHall, windowMesh);
  group.userData.selection = "thermal";

  return { group, stacks, windows: [windowMaterial] };
};

const renewable = () => {
  const group = new THREE.Group();
  const rotors: THREE.Object3D[] = [];
  const panelMaterials: THREE.MeshStandardMaterial[] = [];

  const panelMaterial = material(PALETTE.solar, { metalness: 0.35, roughness: 0.4 });

  panelMaterials.push(panelMaterial);

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 1.5), panelMaterial);

      panel.position.set(4 + column * 1.15, 1, 2.2 + row * 1.8);
      panel.rotation.x = -0.38;
      panel.castShadow = true;
      group.add(panel);
    }
  }

  for (let index = 0; index < 3; index += 1) {
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.12, 3.2, 7),
      material(PALETTE.turbine),
    );

    const rotor = new THREE.Group();
    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), material(PALETTE.steelDark));

    rotor.add(hub);

    for (let blade = 0; blade < 3; blade += 1) {
      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 1.25, 0.04),
        material(PALETTE.turbine),
      );

      arm.position.y = 0.6;
      arm.rotation.z = (blade / 3) * Math.PI * 2;
      rotor.add(arm);
    }

    mast.position.set(9.4 + index * 1.1, 2.2, -1.6 - index * 0.9);
    rotor.position.set(9.4 + index * 1.1, 3.9, -1.6 - index * 0.9);
    group.add(mast, rotor);
    rotors.push(rotor);
  }

  group.userData.selection = "renewable";

  return { group, rotors, panelMaterials };
};

const substation = () => {
  const group = new THREE.Group();
  const yard = box(3.8, 0.2, 3, PALETTE.steelDark, 0, 0.75, 0.3);
  const insulators: THREE.MeshStandardMaterial[] = [];

  for (let index = 0; index < 3; index += 1) {
    const transformer = box(0.75, 0.9, 0.7, PALETTE.steel, -1.1 + index * 1.1, 1.25, 0.2);

    const capMaterial = material(PALETTE.electricSoft, {
      emissive: PALETTE.electric,
      emissiveIntensity: 0.5,
    });

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.7, 7), capMaterial);

    cap.position.set(-1.1 + index * 1.1, 2.05, 0.2);
    group.add(transformer, cap);
    insulators.push(capMaterial);
  }

  group.add(yard);
  group.userData.selection = "substation";

  return { group, insulators };
};

const loadCenters = (smokeGeometry: THREE.SphereGeometry) => {
  const group = new THREE.Group();
  const cityWindows: THREE.MeshStandardMaterial[] = [];
  const factoryWindows: THREE.MeshStandardMaterial[] = [];
  const ruralWindows: THREE.MeshStandardMaterial[] = [];

  for (let index = 0; index < 6; index += 1) {
    const height = 1.2 + (index % 3) * 0.7;
    const width = 0.9 + (index % 2) * 0.3;
    const x = 2.6 + (index % 3) * 1.5;
    const z = 4.2 + Math.floor(index / 3) * 1.6;

    const windowMaterial = material(PALETTE.cityWindow, {
      emissive: PALETTE.cityWindow,
      emissiveIntensity: 0.7,
    });

    group.add(box(width, height, width, PALETTE.concrete, x, height / 2 + 0.5, z));
    const strip = new THREE.Mesh(new THREE.BoxGeometry(width * 0.7, 0.12, 0.04), windowMaterial);

    strip.position.set(x, height * 0.65 + 0.5, z + width / 2 + 0.03);
    group.add(strip);
    cityWindows.push(windowMaterial);
  }

  const factoryWindow = material(PALETTE.factoryWindow, {
    emissive: PALETTE.factoryWindow,
    emissiveIntensity: 0.7,
  });

  group.add(box(2.4, 1.4, 1.8, PALETTE.concrete, 8.3, 1.2, -1.4));
  group.add(box(1.2, 0.9, 1.2, PALETTE.steelDark, 6.8, 1, -0.6));
  const factoryStrip = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.18, 0.05), factoryWindow);

  factoryStrip.position.set(8.3, 1.45, -0.48);
  group.add(factoryStrip);
  factoryWindows.push(factoryWindow);

  const stacks: Stack[] = [];

  for (let index = 0; index < 2; index += 1) {
    const stack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.14, 1.6, 8),
      material(PALETTE.steelDark),
    );

    stack.position.set(8.9 + index * 0.55, 2.5, -1.7);
    group.add(stack);
    stacks.push(smokeStack(group, smokeGeometry, 8.9 + index * 0.55, 3.4, -1.7, 0.2 + index * 0.3));
  }

  for (let index = 0; index < 7; index += 1) {
    const x = -7.8 + (index % 3) * 1.2;
    const z = 4.6 + Math.floor(index / 3) * 1.3;

    const windowMaterial = material(PALETTE.cityWindow, {
      emissive: PALETTE.cityWindow,
      emissiveIntensity: 0.4,
    });

    group.add(box(0.8, 0.55, 0.7, PALETTE.concrete, x, 0.95, z));
    const light = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.04), windowMaterial);

    light.position.set(x, 1.02, z + 0.36);
    group.add(light);
    ruralWindows.push(windowMaterial);
  }

  group.userData.selection = "urban";

  return { group, cityWindows, factoryWindows, ruralWindows, stacks };
};

export const createPlants = (): PlantBuild => {
  const group = new THREE.Group();
  const smokeGeometry = new THREE.SphereGeometry(0.3, 6, 6);
  const hydroBuild = hydro();
  const thermalBuild = thermal(smokeGeometry);
  const renewableBuild = renewable();
  const substationBuild = substation();
  const centers = loadCenters(smokeGeometry);

  group.add(
    hydroBuild.group,
    thermalBuild.group,
    renewableBuild.group,
    substationBuild.group,
    centers.group,
  );

  const selectables: THREE.Object3D[] = [
    hydroBuild.group,
    thermalBuild.group,
    renewableBuild.group,
    substationBuild.group,
    centers.group,
  ];

  const updatePuffs = (
    stacks: readonly Stack[],
    time: number,
    opacity: number,
    color: number,
  ): void => {
    for (const stack of stacks) {
      for (const puff of stack.puffs) {
        const progress = puffProgress(time, puff.phase, 3.4);

        puff.material.color.setHex(color);
        puff.material.opacity = puffFade(progress) * opacity;
        puff.root.scale.setScalar(puffScale(progress, 0.45, 1.8));
      }
    }
  };

  const update = (state: GameState, time: number, delta: number): void => {
    const crisis = state.market.fuelPriceIndex > 1.25;
    const drought = state.market.drought > 0.55;
    const blackout = state.ending !== null && state.ending.id === "collapse";
    const privateBranch = state.policy.branch === "private";
    const renewableSpin = delta * (0.6 + state.market.renewableFactor * 2.2);
    const reservoirRatio = clamp(state.generation.reservoir / 100, 0, 1);

    for (const rotor of renewableBuild.rotors) rotor.rotation.z += renewableSpin;

    for (const turbine of hydroBuild.turbines)
      turbine.rotation.z += delta * (0.8 + reservoirRatio * 2.4);

    updatePuffs(thermalBuild.stacks, time, crisis ? 1.15 : 0.6, crisis ? 0x41403c : 0x9aa6a8);
    updatePuffs(centers.stacks, time, 0.35, drought ? 0x7a5a3a : 0x9aa6a8);

    const coverage =
      (state.zones.urban.coverage + state.zones.industrial.coverage + state.zones.rural.coverage) /
      300;

    for (const window of centers.cityWindows) {
      window.emissiveIntensity = blackout ? 0 : 0.35 + coverage * 0.7;
    }

    for (const window of centers.factoryWindows) {
      window.emissiveIntensity = blackout ? 0 : 0.3 + (state.metrics.industrialOutput / 100) * 0.6;
    }

    for (const window of centers.ruralWindows) {
      const rural = state.zones.rural.coverage / 100;
      const flicker = privateBranch && Math.sin(time * 9) > 0.6 ? 0.2 : 1;

      window.emissiveIntensity = blackout ? 0 : rural * 0.9 * flicker;
    }

    for (const insulator of substationBuild.insulators) {
      insulator.emissiveIntensity = blackout ? 0 : 0.4 + Math.sin(time * 3) * 0.15;
    }

    for (const panel of renewableBuild.panelMaterials) {
      panel.emissiveIntensity = state.policy.dppa ? 0.25 + Math.sin(time * 2) * 0.08 : 0.05;
    }
  };

  return { group, selectables, update };
};
