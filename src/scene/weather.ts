import * as THREE from "three";
import { gsap } from "gsap";
import type { GameState } from "~/domain";
import { seasonOf } from "~/domain";
import { PALETTE } from "./palette";
import { wrapRange } from "./motion";

export type WeatherBuild = {
  readonly update: (state: GameState, reduced: boolean) => void;
  readonly tick: (delta: number) => void;
  readonly dispose: () => void;
  readonly water: THREE.Mesh;
};

const skyFor = (state: GameState): number => {
  if (state.ending !== null) return 0x05090d;

  if (state.market.drought > 0.6) return 0x1a1a16;

  if (state.market.fuelPriceIndex > 1.3) return 0x151a1d;

  return PALETTE.background;
};

export const createWeather = (scene: THREE.Scene, water: THREE.Mesh): WeatherBuild => {
  scene.background = new THREE.Color(PALETTE.background);
  scene.fog = new THREE.Fog(PALETTE.fog, 52, 120);

  const ambient = new THREE.AmbientLight(0xbcd8e2, 0.7);
  const hemisphere = new THREE.HemisphereLight(0x8fd4e0, 0x10201d, 1);
  const sun = new THREE.DirectionalLight(0xdff5ff, 2);
  sun.position.set(16, 24, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -24;
  sun.shadow.camera.right = 24;
  sun.shadow.camera.top = 24;
  sun.shadow.camera.bottom = -24;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 80;
  scene.add(ambient, hemisphere, sun);

  const rainCount = 360;
  const positions = new Float32Array(rainCount * 3);
  const speeds = new Float32Array(rainCount);

  for (let index = 0; index < rainCount; index += 1) {
    positions[index * 3] = ((index * 13) % 36) - 18;
    positions[index * 3 + 1] = ((index * 7) % 20) + 1;
    positions[index * 3 + 2] = ((index * 5) % 30) - 15;
    speeds[index] = 7 + ((index * 3) % 7) * 0.5;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const rain = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: 0x8fd4e0, size: 0.06, transparent: true, opacity: 0 }),
  );

  scene.add(rain);

  let lastKey = "";
  let intensity = 0;

  const update = (state: GameState, reduced: boolean): void => {
    const season = seasonOf(state.clock.month);
    const key = `${season}:${state.market.drought.toFixed(2)}:${state.market.fuelPriceIndex.toFixed(2)}:${state.ending === null ? "play" : "end"}:${reduced}`;

    if (key === lastKey) return;
    lastKey = key;
    const sky = new THREE.Color(skyFor(state));
    const background = scene.background;

    if (background instanceof THREE.Color) {
      gsap.to(background, {
        r: sky.r,
        g: sky.g,
        b: sky.b,
        duration: reduced ? 0 : 1.6,
        overwrite: "auto",
      });
    }

    const fogObject = scene.fog;

    if (fogObject !== null && fogObject !== undefined) {
      gsap.to(fogObject.color, {
        r: sky.r * 1.2,
        g: sky.g * 1.2,
        b: sky.b * 1.2,
        duration: reduced ? 0 : 1.6,
        overwrite: "auto",
      });
    }

    const drought = state.market.drought > 0.6;
    const crisis = state.market.fuelPriceIndex > 1.3;
    const ending = state.ending !== null;

    gsap.to(sun, {
      intensity: ending ? 0.35 : drought ? 2.8 : crisis ? 1.5 : 2.1,
      duration: reduced ? 0 : 1.4,
      overwrite: "auto",
    });
    gsap.to(ambient, {
      intensity: ending ? 0.18 : crisis ? 0.55 : 0.72,
      duration: reduced ? 0 : 1.4,
      overwrite: "auto",
    });
    sun.color.setHex(drought ? 0xffb060 : crisis ? 0xffc98a : 0xdff5ff);

    const wet = season === "summer" && state.market.drought < 0.5;

    intensity = wet ? 0.45 : 0;

    if (water.material instanceof THREE.MeshStandardMaterial) {
      const level = state.generation.reservoir / 100;

      gsap.to(water.position, {
        y: 0.78 - (1 - level) * 0.35,
        duration: reduced ? 0 : 1.6,
        overwrite: "auto",
      });
      gsap.to(water.material, {
        opacity: 0.35 + level * 0.55,
        duration: reduced ? 0 : 1.2,
        overwrite: "auto",
      });
    }
  };

  const tick = (delta: number): void => {
    if (intensity <= 0) return;
    const step = Math.min(0.05, Math.max(0, delta));

    if (step <= 0) return;
    const attribute = rain.geometry.getAttribute("position");

    if (!(attribute instanceof THREE.BufferAttribute)) return;

    for (let index = 0; index < attribute.count; index += 1) {
      const x = wrapRange(attribute.getX(index) + 0.15 * step, -18, 18);
      const y = wrapRange(attribute.getY(index) - (speeds[index] ?? 7) * step, 1, 21);
      const z = wrapRange(attribute.getZ(index) - 0.1 * step, -15, 15);

      attribute.setXYZ(index, x, y, z);
    }

    attribute.needsUpdate = true;
  };

  const dispose = (): void => {
    gsap.killTweensOf(sun);
    gsap.killTweensOf(ambient);
    gsap.killTweensOf(water.position);

    if (water.material instanceof THREE.Material) gsap.killTweensOf(water.material);
  };

  return { update, tick, dispose, water };
};
