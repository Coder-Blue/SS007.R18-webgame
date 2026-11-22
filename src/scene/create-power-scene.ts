import * as THREE from "three";
import type { GameState } from "~/domain";
import { createCameraRig, type CameraRig } from "./camera-rig";
import { createTerrain } from "./terrain";
import { createPlants, type SceneSelection } from "./plants";
import { createGrid } from "./grid-lines";
import { createWeather } from "./weather";

export type { SceneSelection } from "./plants";

export type PowerScene = {
  readonly update: (state: GameState) => void;
  readonly resize: () => void;
  readonly resetView: () => void;
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
  scene.add(terrain.group, plants.group, grid.group);
  scene.add(new THREE.AmbientLight(0xffffff, 0.18));

  const raycaster = new THREE.Raycaster();
  const selectables: THREE.Object3D[] = [...plants.selectables, ...grid.selectables];

  let currentState: GameState | null = null;
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

  const update = (state: GameState): void => {
    currentState = state;
    weather.update(state, options.reducedMotion());

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
    elapsed += delta;

    if (currentState !== null) {
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
