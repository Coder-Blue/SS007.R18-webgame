import * as THREE from "three";
import type { GameState } from "~/domain";
import { PALETTE } from "./palette";
import { clamp } from "./motion";

type Corridor = {
  readonly zone: "urban" | "industrial" | "rural";
  readonly curve: THREE.CatmullRomCurve3;
  readonly segments: readonly THREE.Object3D[];
  readonly thresholds: readonly number[];
  readonly pulse: THREE.Mesh;
};

type PrivateLine = {
  readonly line: THREE.Line;
  readonly pulse: THREE.Mesh;
  readonly curve: THREE.CatmullRomCurve3;
};

export type GridBuild = {
  readonly group: THREE.Group;
  readonly selectables: readonly THREE.Object3D[];
  readonly update: (state: GameState, time: number) => void;
};

const material = (color: number, options: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.35, ...options });

const pylon = (x: number, z: number, height: number): THREE.Group => {
  const group = new THREE.Group();
  const metal = material(PALETTE.steel);

  for (const offset of [
    [-0.34, -0.34],
    [-0.34, 0.34],
    [0.34, -0.34],
    [0.34, 0.34],
  ] as const) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, height, 0.07), metal);

    leg.position.set(offset[0], height / 2, offset[1]);
    leg.rotation.z = offset[0] * 0.06;
    leg.rotation.x = -offset[1] * 0.06;
    group.add(leg);
  }

  for (let level = 0; level < 3; level += 1) {
    const brace = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.06, 0.95), metal);

    brace.position.y = height * (0.35 + level * 0.24);
    group.add(brace);
  }

  for (const side of [-0.5, 0.5]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 0.08), metal);

    arm.position.set(0, height - 0.15, side);
    group.add(arm);
  }

  group.position.set(x, 0.7, z);
  group.castShadow = true;

  return group;
};

const cable = (points: readonly THREE.Vector3[]): THREE.Line => {
  const curve = new THREE.CatmullRomCurve3([...points]);
  const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(24));

  return new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({ color: PALETTE.electric, transparent: true, opacity: 0.75 }),
  );
};

const makePulse = (color: number, size = 0.13): THREE.Mesh =>
  new THREE.Mesh(
    new THREE.SphereGeometry(size, 8, 8),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 }),
  );

const buildCorridor = (
  group: THREE.Group,
  zone: "urban" | "industrial" | "rural",
  from: readonly [number, number],
  to: readonly [number, number],
  thresholds: readonly number[],
): Corridor => {
  const segments: THREE.Object3D[] = [];
  const points: THREE.Vector3[] = [];

  for (let index = 0; index <= thresholds.length; index += 1) {
    const ratio = index / thresholds.length;
    const x = from[0] + (to[0] - from[0]) * ratio;
    const z = from[1] + (to[1] - from[1]) * ratio;
    const tower = pylon(x, z, 2.4);

    group.add(tower);
    segments.push(tower);
    points.push(new THREE.Vector3(x, 3.1, z));
  }

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];

    if (start === undefined || end === undefined) continue;
    const mid = start.clone().lerp(end, 0.5);

    mid.y -= 0.55;
    const line = cable([start, mid, end]);

    group.add(line);
  }

  const start = new THREE.Vector3(from[0], 3.1, from[1]);
  const end = new THREE.Vector3(to[0], 3.1, to[1]);

  const curve = new THREE.CatmullRomCurve3([start, start.clone().lerp(end, 0.5).setY(2.4), end]);

  const pulse = makePulse(PALETTE.electric);

  group.add(pulse);

  return { zone, curve, segments, thresholds, pulse };
};

const privateLine = (
  group: THREE.Group,
  from: readonly [number, number],
  to: readonly [number, number],
): PrivateLine => {
  const start = new THREE.Vector3(from[0], 1.2, from[1]);
  const end = new THREE.Vector3(to[0], 1.2, to[1]);

  const curve = new THREE.CatmullRomCurve3([
    start,
    new THREE.Vector3((from[0] + to[0]) / 2, 4.6, (from[1] + to[1]) / 2),
    end,
  ]);

  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(curve.getPoints(32)),
    new THREE.LineBasicMaterial({ color: PALETTE.privateLine, transparent: true, opacity: 0 }),
  );

  const pulse = makePulse(PALETTE.privateLine, 0.11);

  group.add(line, pulse);

  return { line, pulse, curve };
};

export const createGrid = (): GridBuild => {
  const group = new THREE.Group();

  const corridors = [
    buildCorridor(group, "urban", [0, 0.4], [4.2, 5.4], [82, 90, 98]),
    buildCorridor(group, "industrial", [0, 0.4], [8.2, -1.2], [68, 80, 92]),
    buildCorridor(group, "rural", [0, 0.4], [-7.2, 6.2], [45, 58, 70, 84, 96]),
  ] as const;

  const privateLines = [
    privateLine(group, [-9, -3.5], [8.2, -1.2]),
    privateLine(group, [-9, -3.5], [4.2, 5.4]),
    privateLine(group, [9.4, -1.6], [-7.2, 6.2]),
  ];

  const dppaCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(9.4, 2.4, -1.6),
    new THREE.Vector3(9.2, 3.4, -0.4),
    new THREE.Vector3(8.3, 2.2, -1.2),
  ]);

  const dppa = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(dppaCurve.getPoints(16)),
    new THREE.LineBasicMaterial({ color: PALETTE.lime, transparent: true, opacity: 0 }),
  );

  const dppaPulse = makePulse(PALETTE.lime, 0.1);

  group.add(dppa, dppaPulse);

  const selectables: THREE.Object3D[] = [];

  for (const corridor of corridors) {
    for (const segment of corridor.segments) {
      segment.userData.selection = corridor.zone;
      selectables.push(segment);
    }
  }

  const update = (state: GameState, time: number): void => {
    const privateBranch = state.policy.branch === "private";
    const collapse = state.ending !== null && state.ending.id === "collapse";
    const stress = state.metrics.reliability < 95 || state.market.fuelPriceIndex > 1.3;

    const color = collapse
      ? 0x24343a
      : privateBranch
        ? PALETTE.privateLine
        : stress
          ? PALETTE.amber
          : PALETTE.electric;

    for (const corridor of corridors) {
      const coverage = state.zones[corridor.zone].coverage;

      for (let index = 0; index < corridor.segments.length; index += 1) {
        const segment = corridor.segments[index];
        const threshold = corridor.thresholds[index] ?? 90;

        if (segment !== undefined) segment.visible = coverage >= threshold || index === 0;
      }

      corridor.pulse.visible = !collapse && coverage > 50;
      const pulsePosition = corridor.curve.getPointAt((time * 0.08 + coverage * 0.01) % 1);

      corridor.pulse.position.copy(pulsePosition);
      const pulseMaterial = corridor.pulse.material;

      if (pulseMaterial instanceof THREE.MeshBasicMaterial) pulseMaterial.color.setHex(color);
    }

    for (const line of privateLines) {
      const visible = privateBranch && !collapse;

      line.line.visible = visible;
      line.pulse.visible = visible;

      if (visible) {
        line.pulse.position.copy(line.curve.getPointAt((time * 0.18 + 0.2) % 1));
      }
    }

    dppa.visible = state.policy.dppa && !collapse;
    dppaPulse.visible = state.policy.dppa && !collapse;

    if (dppaPulse.visible) {
      dppaPulse.position.copy(dppaCurve.getPointAt((time * 0.22) % 1));
    }

    const opacity = clamp((state.metrics.reserveMargin + 20) / 60, 0.15, 0.9);

    for (const corridor of corridors) {
      const lineMaterial =
        corridor.pulse.material instanceof THREE.MeshBasicMaterial ? corridor.pulse.material : null;

      if (lineMaterial !== null) lineMaterial.opacity = collapse ? 0.2 : opacity;
    }
  };

  return { group, selectables, update };
};
