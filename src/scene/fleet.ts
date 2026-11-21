import * as THREE from "three";
import type { GameState } from "~/domain";
import { PALETTE } from "./palette";
import {
  approach,
  approachAngle,
  clamp,
  curvatureSpeedFactor,
  laneFactor,
  planarTurnAngle,
  wrapUnit,
} from "./motion";

export interface FleetBuild {
  readonly group: THREE.Group;
  readonly selectables: readonly THREE.Object3D[];
  readonly update: (state: GameState, delta: number) => void;
}

interface TruckVisual {
  readonly group: THREE.Group;
  readonly wheels: readonly THREE.Group[];
  readonly materials: readonly THREE.MeshStandardMaterial[];
  readonly shadowCasters: readonly THREE.Mesh[];
}

interface TruckMotion {
  readonly visual: TruckVisual;
  readonly phase: number;
  readonly speedMultiplier: number;
  readonly laneOffset: number;
  progress: number;
  distance: number;
  presence: number;
  laneScale: number;
  heading: number;
  lean: number;
  hasPose: boolean;
}

const MAX_TRUCKS = 12;
const MIN_TRUCKS = 3;
const FLEET_UNIT = 22;
const WHEEL_RADIUS = 0.13;
const TURN_LOOKAHEAD = 0.02;
const PRESENCE_RATE = 2.8;
const LANE_SCALE_RATE = 5;
const SHADOW_PRESENCE_THRESHOLD = 0.5;
const HEADING_RATE = 7;
const LEAN_RATE = 6;
const GOLDEN_RATIO = 0.618033988749895;

const makeTruck = (): TruckVisual => {
  const group = new THREE.Group();

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: PALETTE.truck,
    roughness: 0.7,
    transparent: true,
    opacity: 0,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.42, 0.5), bodyMaterial);

  body.position.y = 0.3;
  body.castShadow = true;

  const cargoMaterial = new THREE.MeshStandardMaterial({
    color: PALETTE.truckCargo,
    roughness: 0.9,
    transparent: true,
    opacity: 0,
  });

  const cargo = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.54), cargoMaterial);

  cargo.position.set(-0.22, 0.58, 0);
  cargo.castShadow = true;

  const cabMaterial = new THREE.MeshStandardMaterial({
    color: 0x8e5b3a,
    roughness: 0.6,
    transparent: true,
    opacity: 0,
  });

  const cab = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.32, 0.46), cabMaterial);

  cab.position.set(0.42, 0.46, 0);

  const wheelGeometry = new THREE.CylinderGeometry(0.13, 0.13, 0.12, 8);

  const wheelMaterial = new THREE.MeshStandardMaterial({
    color: 0x302d29,
    roughness: 1,
    transparent: true,
    opacity: 0,
  });

  const wheels: THREE.Group[] = [];

  for (const x of [-0.28, 0.3]) {
    for (const z of [-0.28, 0.28]) {
      const pivot = new THREE.Group();

      pivot.position.set(x, 0.16, z);
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);

      wheel.rotation.x = Math.PI / 2;
      pivot.add(wheel);
      group.add(pivot);
      wheels.push(pivot);
    }
  }

  group.add(body, cargo, cab);
  group.userData.selection = "fleet";
  group.rotation.order = "YXZ";

  return {
    group,
    wheels,
    materials: [bodyMaterial, cargoMaterial, cabMaterial, wheelMaterial],
    shadowCasters: [body, cargo],
  };
};

const laneOffsetFor = (index: number): number => ((index % 3) - 1) * 0.16;

const speedMultiplierFor = (index: number): number => 0.94 + ((index * 3) % 5) * 0.03;

export const createFleet = (): FleetBuild => {
  const group = new THREE.Group();
  const trucks: TruckMotion[] = [];
  const selectables: THREE.Object3D[] = [];

  const curve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-3, 0.7, 2),
      new THREE.Vector3(0.5, 0.7, 0.5),
      new THREE.Vector3(7.2, 0.7, 3.9),
      new THREE.Vector3(9.8, 0.7, 2.2),
      new THREE.Vector3(6, 0.7, -3.7),
      new THREE.Vector3(0.2, 0.7, 4.7),
      new THREE.Vector3(-2.7, 0.7, 4.1),
      new THREE.Vector3(-8.4, 0.7, 1.2),
    ],
    true,
    "catmullrom",
    0.25,
  );

  const curveLength = curve.getLength();
  const point = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const tangentAhead = new THREE.Vector3();
  const normal = new THREE.Vector3();

  for (let index = 0; index < MAX_TRUCKS; index += 1) {
    const visual = makeTruck();

    visual.group.visible = false;
    group.add(visual.group);
    selectables.push(visual.group);
    trucks.push({
      visual,
      phase: wrapUnit(index * GOLDEN_RATIO),
      progress: wrapUnit(index * GOLDEN_RATIO),
      speedMultiplier: speedMultiplierFor(index),
      laneOffset: laneOffsetFor(index),
      distance: 0,
      presence: 0,
      laneScale: 1,
      heading: 0,
      lean: 0,
      hasPose: false,
    });
  }

  const update = (state: GameState, delta: number): void => {
    const count = Math.round(
      clamp(state.infrastructure.fleet / FLEET_UNIT, MIN_TRUCKS, MAX_TRUCKS),
    );

    const baseSpeed = clamp(0.014 + (state.metrics.industrialOutput - 100) * 0.0001, 0.008, 0.024);
    const step = clamp(delta, 0, 0.05);

    for (let index = 0; index < trucks.length; index += 1) {
      const truck = trucks[index];

      if (truck === undefined) continue;
      const targetPresence = index < count ? 1 : 0;

      truck.presence = approach(truck.presence, targetPresence, PRESENCE_RATE, step);
      const isVisible = truck.presence > 0.003;
      const castsShadow = truck.presence >= SHADOW_PRESENCE_THRESHOLD;

      truck.visual.group.visible = isVisible;

      for (let casterIndex = 0; casterIndex < truck.visual.shadowCasters.length; casterIndex += 1) {
        const caster = truck.visual.shadowCasters[casterIndex];

        if (caster !== undefined) caster.castShadow = castsShadow;
      }

      if (!isVisible) continue;
      const t = truck.progress;

      curve.getTangentAt(t, tangent);
      curve.getTangentAt(wrapUnit(t + TURN_LOOKAHEAD), tangentAhead);
      const turn = planarTurnAngle(tangent.x, tangent.z, tangentAhead.x, tangentAhead.z);
      const advance = baseSpeed * truck.speedMultiplier * curvatureSpeedFactor(turn) * step;

      truck.laneScale = approach(truck.laneScale, laneFactor(turn), LANE_SCALE_RATE, step);
      truck.progress = wrapUnit(t + advance);
      truck.distance += advance * curveLength;
      curve.getPointAt(truck.progress, point);

      const xzLength = Math.hypot(tangent.x, tangent.z);

      if (xzLength > 1e-5) {
        normal.set(-tangent.z / xzLength, 0, tangent.x / xzLength);
      } else {
        normal.set(1, 0, 0);
      }

      const bob =
        Math.sin(truck.distance * 16 + truck.phase * Math.PI * 2) * 0.008 * truck.presence;

      const targetHeading = Math.atan2(-tangent.z, tangent.x);
      const leanTarget = clamp(-turn * 0.2, -0.04, 0.04);
      const laneOffset = truck.laneOffset * truck.laneScale;

      truck.visual.group.position.set(
        point.x + normal.x * laneOffset,
        point.y + bob,
        point.z + normal.z * laneOffset,
      );

      if (truck.hasPose) {
        truck.heading = approachAngle(truck.heading, targetHeading, HEADING_RATE, step);
      } else {
        truck.heading = targetHeading;
        truck.hasPose = true;
      }

      truck.lean = approach(truck.lean, leanTarget, LEAN_RATE, step);
      truck.visual.group.rotation.set(truck.lean, truck.heading, 0);
      truck.visual.group.scale.setScalar(0.72 + 0.28 * truck.presence);

      for (
        let materialIndex = 0;
        materialIndex < truck.visual.materials.length;
        materialIndex += 1
      ) {
        const material = truck.visual.materials[materialIndex];

        if (material !== undefined) material.opacity = truck.presence;
      }

      const wheelSpin = -((truck.distance / WHEEL_RADIUS) % (Math.PI * 2));

      for (let wheelIndex = 0; wheelIndex < truck.visual.wheels.length; wheelIndex += 1) {
        const wheel = truck.visual.wheels[wheelIndex];

        if (wheel !== undefined) wheel.rotation.z = wheelSpin;
      }
    }
  };

  return { group, selectables, update };
};
