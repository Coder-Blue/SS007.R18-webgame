import * as THREE from "three";
import type { GameState } from "~/domain";
import { createCameraRig, type CameraRig, type ScreenAnchor } from "./camera-rig";
import { createTerrain } from "./terrain";
import { createPlants, type SceneSelection } from "./plants";
import { createGrid } from "./grid-lines";
import { createWeather } from "./weather";

export type { SceneSelection } from "./plants";

export type PowerScene = {
  readonly update: (state: GameState, running: boolean) => void;
  readonly resize: () => void;
  readonly resetView: () => void;
  readonly focusSelection: (selection: SceneSelection | null, anchor?: ScreenAnchor) => void;
  readonly dispose: () => void;
  readonly selected: () => SceneSelection | null;
};

export type PowerSceneOptions = {
  readonly canvas: HTMLCanvasElement;
  readonly container: HTMLElement;
  readonly onSelect?: (selection: SceneSelection) => void;
  readonly reducedMotion: () => boolean;
};

const SELECTIONS = [
  "hydro",
  "thermal",
  "renewable",
  "substation",
  "urban",
  "industrial",
  "rural",
] as const satisfies readonly SceneSelection[];

const isSelection = (value: unknown): value is SceneSelection =>
  SELECTIONS.some((selection) => selection === value);

const selectionOf = (object: THREE.Object3D): SceneSelection | null => {
  let current: THREE.Object3D | null = object;

  while (current !== null) {
    const value = current.userData.selection;

    if (isSelection(value)) return value;
    current = current.parent;
  }

  return null;
};

const visibleInHierarchy = (object: THREE.Object3D): boolean => {
  let current: THREE.Object3D | null = object;

  while (current !== null) {
    if (!current.visible) return false;
    current = current.parent;
  }

  return true;
};

export const createPowerScene = (options: PowerSceneOptions): PowerScene => {
  const renderer = new THREE.WebGLRenderer({
    canvas: options.canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });

  renderer.setPixelRatio(
    Math.min(
      window.devicePixelRatio || 1,
      window.matchMedia("(pointer: coarse)").matches ? 1.5 : 2,
    ),
  );
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();

  const cameraRig: CameraRig = createCameraRig({
    canvas: options.canvas,
    onTap: (x, y) => pick(x, y),
  });

  const terrain = createTerrain();
  const plants = createPlants();
  const grid = createGrid();
  const weather = createWeather(scene, terrain.water);

  const tourRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.08, 8, 36),
    new THREE.MeshBasicMaterial({ color: 0x8fe9ff, transparent: true, opacity: 0.9 }),
  );

  tourRing.rotation.x = -Math.PI / 2;
  tourRing.visible = false;
  scene.add(tourRing);

  const reformBeacon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.28, 1, 10),
    new THREE.MeshBasicMaterial({ color: 0xffc857, transparent: true, opacity: 0.85 }),
  );

  reformBeacon.visible = false;
  scene.add(reformBeacon);

  const progressBeacons = Array.from({ length: 3 }, () => {
    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 1, 6),
      new THREE.MeshBasicMaterial({ color: 0x39d7ff, transparent: true, opacity: 0.9 }),
    );

    beacon.visible = false;
    scene.add(beacon);

    return beacon;
  });

  scene.add(terrain.group, plants.group, grid.group);
  scene.add(new THREE.AmbientLight(0xffffff, 0.18));

  const raycaster = new THREE.Raycaster();
  const selectables: THREE.Object3D[] = [...plants.selectables, ...grid.selectables];

  let currentState: GameState | null = null;
  let currentRunning = false;
  let selected: SceneSelection | null = null;
  let selectedObject: THREE.Object3D | null = null;
  let frame = 0;
  let lastTime = performance.now();
  let elapsed = 0;
  let lastAct = 0;
  let lastBranch = "state";
  let lastEnding = false;
  let disposed = false;

  const resize = (): void => {
    const width = Math.max(1, options.container.clientWidth);
    const height = Math.max(1, options.container.clientHeight);

    renderer.setSize(width, height, false);
    cameraRig.resize(width, height);
  };

  const highlight = (object: THREE.Object3D | null): void => {
    if (selectedObject !== null && selectedObject !== object) selectedObject.scale.set(1, 1, 1);
    selectedObject = object;

    if (object !== null) object.scale.set(1.035, 1.035, 1.035);
  };

  const pick = (clientX: number, clientY: number): void => {
    const rect = options.canvas.getBoundingClientRect();

    const pointer = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );

    raycaster.setFromCamera(pointer, cameraRig.camera);
    const hits = raycaster.intersectObjects(selectables, true);
    const hit = hits.find((candidate) => visibleInHierarchy(candidate.object));

    if (hit === undefined) return;
    const selection = selectionOf(hit.object);

    if (selection === null) return;
    selected = selection;
    highlight(hit.object);
    cameraRig.focus(hit.point, options.reducedMotion());
    options.onSelect?.(selection);
  };

  const selectionPoint = (selection: SceneSelection): THREE.Vector3 => {
    if (selection === "hydro") return new THREE.Vector3(-9, 1.2, -3.5);

    if (selection === "thermal") return new THREE.Vector3(-1.5, 1.2, -7.2);

    if (selection === "renewable") return new THREE.Vector3(7, 1.2, 2.6);

    if (selection === "urban") return new THREE.Vector3(4.2, 1.2, 5.4);

    if (selection === "industrial") return new THREE.Vector3(8.2, 1.2, -1.2);

    if (selection === "rural") return new THREE.Vector3(-7.2, 1.2, 6.2);

    return new THREE.Vector3(0, 1.2, 0.4);
  };

  const focusForEvent = (state: GameState): void => {
    if (options.reducedMotion()) return;
    const event = state.events.activeId;

    if (event === "fuel-crisis") {
      cameraRig.focus(new THREE.Vector3(-1.5, 1.5, -7.2), false);

      return;
    }

    if (event === "summer-drought") {
      cameraRig.focus(new THREE.Vector3(-9, 1, -3.5), false);

      return;
    }

    if (event === "revised-law") {
      cameraRig.focus(new THREE.Vector3(7, 1, 0), false);

      return;
    }

    if (event === "public-skepticism") {
      cameraRig.reset(false);
    }
  };

  const beaconPoint = (kind: string, targetId: string): readonly [number, number] => {
    if (kind === "line") {
      if (targetId === "urban") return [4.2, 5.4];

      if (targetId === "industrial") return [8.2, -1.2];

      return [-7.2, 6.2];
    }

    if (kind === "hydro") return [-9, -3.5];

    if (kind === "thermal") return [-1.5, -7.2];

    if (kind === "renewable") return [7, 2.6];

    return [0, 0.4];
  };

  const update = (state: GameState, running: boolean): void => {
    currentState = state;
    currentRunning = running;
    weather.update(state, options.reducedMotion());

    for (let index = 0; index < progressBeacons.length; index += 1) {
      const beacon = progressBeacons[index];
      const project = state.operations.projects[index];

      if (beacon === undefined) continue;
      beacon.visible = project !== undefined;

      if (project === undefined) continue;
      const [x, z] = beaconPoint(project.kind, project.targetId);

      const progress =
        (project.totalMonths - project.monthsLeft + 1) / Math.max(1, project.totalMonths);

      beacon.position.set(x, 2.1 + progress / 2, z);
      beacon.scale.set(0.8, Math.max(0.15, progress), 0.8);
      beacon.material.color.setHex(project.kind === "decision" ? 0xffb347 : 0x39d7ff);
    }

    const reforms = state.policy.reformProgress;

    if (reforms.length > 0) {
      const progress =
        reforms.reduce(
          (sum, project) => sum + (project.totalMonths - project.monthsLeft) / project.totalMonths,
          0,
        ) / reforms.length;

      reformBeacon.position.set(4.2, 1.5 + progress * 0.9, 5.4);
      reformBeacon.scale.set(1, Math.max(0.2, progress * 1.8), 1);
      reformBeacon.material.opacity = currentRunning ? 0.65 + Math.sin(elapsed * 3) * 0.2 : 0.85;
      reformBeacon.visible = true;
    } else {
      reformBeacon.visible = false;
    }

    if (state.act !== lastAct) {
      lastAct = state.act;
      focusForEvent(state);
    }

    if (state.policy.branch !== lastBranch) {
      lastBranch = state.policy.branch;
      cameraRig.reset(options.reducedMotion());
    }

    if (state.ending !== null && !lastEnding) {
      lastEnding = true;
      cameraRig.reset(options.reducedMotion());
    }

    if (state.events.activeId !== null) focusForEvent(state);
  };

  const loop = (time: number): void => {
    if (disposed) return;
    const delta = Math.min(0.05, (time - lastTime) / 1000);

    lastTime = time;

    if (currentState !== null && currentRunning) {
      elapsed += delta;
      plants.update(currentState, elapsed, delta);
      grid.update(currentState, elapsed);
      weather.tick(delta);
    }

    renderer.render(scene, cameraRig.camera);
    frame = requestAnimationFrame(loop);
  };

  const observer = new ResizeObserver(() => resize());
  observer.observe(options.container);
  resize();
  frame = requestAnimationFrame(loop);

  return {
    update,
    resize,
    resetView: () => {
      cameraRig.reset(options.reducedMotion());
      highlight(null);
      selected = null;
      tourRing.visible = false;
    },
    focusSelection: (selection, anchor) => {
      if (selection === null) {
        tourRing.visible = false;

        return;
      }

      const point = selectionPoint(selection);

      tourRing.position.set(point.x, 1.1, point.z);
      tourRing.visible = true;
      cameraRig.focus(point, options.reducedMotion(), anchor);
    },
    selected: () => selected,
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      cameraRig.dispose();
      weather.dispose();
      scene.traverse((object) => {
        if (
          object instanceof THREE.Mesh ||
          object instanceof THREE.Points ||
          object instanceof THREE.Line
        ) {
          object.geometry.dispose();
          const materialValue = object.material;

          if (Array.isArray(materialValue)) {
            for (const item of materialValue) item.dispose();
          } else {
            materialValue.dispose();
          }
        }
      });
      renderer.dispose();
      renderer.forceContextLoss();
      scene.clear();
    },
  };
};
