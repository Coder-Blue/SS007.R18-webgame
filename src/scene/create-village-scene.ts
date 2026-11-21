import * as THREE from "three";
import type { GameState } from "~/domain";
import { createCameraRig, type CameraRig } from "./camera-rig";
import { createTerrain } from "./terrain";
import { createBuildings } from "./buildings";
import { createRoads } from "./roads";
import { createFleet } from "./fleet";
import { createWeather } from "./weather";

export type SceneSelection = "hydro" | "mechanized" | "hut" | "workshop" | "road" | "fleet";

export interface VillageScene {
  readonly update: (state: GameState) => void;
  readonly resize: () => void;
  readonly resetView: () => void;
  readonly dispose: () => void;
  readonly selected: () => SceneSelection | null;
}

export interface VillageSceneOptions {
  readonly canvas: HTMLCanvasElement;
  readonly container: HTMLElement;
  readonly onSelect?: (selection: SceneSelection) => void;
  readonly reducedMotion: () => boolean;
}

const SCENE_SELECTIONS = [
  "hydro",
  "mechanized",
  "hut",
  "workshop",
  "road",
  "fleet",
] as const satisfies readonly SceneSelection[];

const isSceneSelection = (value: unknown): value is SceneSelection =>
  SCENE_SELECTIONS.some((selection) => selection === value);

const selectionOf = (object: THREE.Object3D): SceneSelection | null => {
  let current: THREE.Object3D | null = object;

  while (current !== null) {
    const value = current.userData.selection;

    if (isSceneSelection(value)) return value;
    current = current.parent;
  }

  return null;
};

const isVisibleInHierarchy = (object: THREE.Object3D): boolean => {
  let current: THREE.Object3D | null = object;

  while (current !== null) {
    if (!current.visible) return false;
    current = current.parent;
  }

  return true;
};

export const createVillageScene = (options: VillageSceneOptions): VillageScene => {
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
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();

  const cameraRig: CameraRig = createCameraRig({
    canvas: options.canvas,
    onTap: (x, y) => pick(x, y),
  });

  const terrain = createTerrain();
  const buildings = createBuildings();
  const roads = createRoads();
  const fleet = createFleet();
  const weather = createWeather(scene);
  scene.add(terrain.group, buildings.group, roads.group, fleet.group);
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));

  const raycaster = new THREE.Raycaster();

  const selectables: THREE.Object3D[] = [
    ...terrain.selectables,
    ...buildings.selectables,
    ...roads.selectables,
    ...fleet.selectables,
  ];

  let currentState: GameState | null = null;
  let selected: SceneSelection | null = null;
  let selectedObject: THREE.Object3D | null = null;
  let frame = 0;
  let lastTime = performance.now();
  let elapsed = 0;
  let disposed = false;

  const resize = (): void => {
    const width = Math.max(1, options.container.clientWidth);
    const height = Math.max(1, options.container.clientHeight);
    renderer.setSize(width, height, false);
    cameraRig.resize(width, height);
  };

  const highlight = (object: THREE.Object3D | null): void => {
    if (selectedObject !== null && selectedObject !== object) {
      selectedObject.scale.set(1, 1, 1);
    }

    selectedObject = object;

    if (object !== null) {
      object.scale.set(1.06, 1.06, 1.06);
    }
  };

  const pick = (clientX: number, clientY: number): void => {
    const rect = options.canvas.getBoundingClientRect();

    const pointer = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );

    raycaster.setFromCamera(pointer, cameraRig.camera);
    const hits = raycaster.intersectObjects(selectables, true);
    const hit = hits.find((candidate) => isVisibleInHierarchy(candidate.object));

    if (hit === undefined) return;
    const selection = selectionOf(hit.object);

    if (selection === null) return;
    selected = selection;
    highlight(hit.object);
    cameraRig.focus(hit.point, options.reducedMotion());
    options.onSelect?.(selection);
  };

  const update = (state: GameState): void => {
    currentState = state;
    weather.update(state, options.reducedMotion());
    roads.update(state, !options.reducedMotion());
  };

  const loop = (time: number): void => {
    if (disposed) return;
    const delta = Math.min(0.05, (time - lastTime) / 1000);
    lastTime = time;
    elapsed += delta;

    if (currentState !== null) {
      fleet.update(currentState, delta);
      buildings.updateSmoke(elapsed, currentState.metrics.industrialOutput);
    }

    weather.tick(delta);
    renderer.render(scene, cameraRig.camera);
    frame = requestAnimationFrame(loop);
  };

  const resizeObserver = new ResizeObserver(() => resize());
  resizeObserver.observe(options.container);
  resize();
  frame = requestAnimationFrame(loop);
  scene.userData.dispose = true;

  return {
    update,
    resize,
    resetView: () => {
      cameraRig.reset(options.reducedMotion());
      highlight(null);
      selected = null;
    },
    selected: () => selected,
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      cameraRig.dispose();
      weather.dispose();
      roads.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
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
