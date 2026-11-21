import * as THREE from "three";
import { gsap } from "gsap";
import type { GameState } from "~/domain";
import { seasonOf } from "~/domain";
import { PALETTE } from "./palette";

export interface WeatherBuild {
  readonly update: (state: GameState, reduced: boolean) => void;
  readonly tick: (delta: number) => void;
  readonly dispose: () => void;
  readonly rain: THREE.Points;
}

const skyFor = (state: GameState): number => {
  if (state.market.drought > 0.6) return PALETTE.skyDrought;
  const season = seasonOf(state.clock.month);
  if (season === "summer") return PALETTE.skySummer;
  if (season === "autumn") return PALETTE.skyAutumn;
  if (season === "winter") return PALETTE.skyWinter;
  return PALETTE.skySpring;
};

export const createWeather = (scene: THREE.Scene): WeatherBuild => {
  scene.background = new THREE.Color(PALETTE.skySpring);
  scene.fog = new THREE.Fog(PALETTE.fog, 48, 108);
  const ambient = new THREE.AmbientLight(0xfff2d9, 0.75);
  const hemisphere = new THREE.HemisphereLight(0xe8f4e2, 0x556b45, 1.1);
  const sun = new THREE.DirectionalLight(0xffe7b0, 2.1);
  sun.position.set(12, 20, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -20;
  sun.shadow.camera.right = 20;
  sun.shadow.camera.top = 20;
  sun.shadow.camera.bottom = -20;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 60;
  scene.add(ambient, hemisphere, sun);

  const rainCount = 420;
  const positions = new Float32Array(rainCount * 3);
  for (let index = 0; index < rainCount; index += 1) {
    positions[index * 3] = (index % 30) - 15 + (index % 3) * 0.4;
    positions[index * 3 + 1] = (index % 17) * 1.2;
    positions[index * 3 + 2] = ((index * 7) % 28) - 14;
  }
  const rainGeometry = new THREE.BufferGeometry();
  rainGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const rain = new THREE.Points(
    rainGeometry,
    new THREE.PointsMaterial({ color: 0x8fb8c2, size: 0.07, transparent: true, opacity: 0 }),
  );
  scene.add(rain);

  let lastUpdateKey = "";
  let rainIntensity = 0;

  const update = (state: GameState, reduced: boolean): void => {
    const season = seasonOf(state.clock.month);
    const key = `${season}:${state.market.drought.toFixed(2)}:${reduced}`;
    if (key === lastUpdateKey) return;
    lastUpdateKey = key;
    const sky = new THREE.Color(skyFor(state));
    const fog = new THREE.Color(PALETTE.fog).lerp(new THREE.Color(sky), 0.25);
    const background = scene.background;
    if (background instanceof THREE.Color) {
      gsap.to(background, {
        r: sky.r,
        g: sky.g,
        b: sky.b,
        duration: reduced ? 0 : 1.4,
        overwrite: "auto",
      });
    }
    const fogObject = scene.fog;
    if (fogObject !== null && fogObject !== undefined) {
      gsap.to(fogObject.color, {
        r: fog.r,
        g: fog.g,
        b: fog.b,
        duration: reduced ? 0 : 1.4,
        overwrite: "auto",
      });
    }
    const isWet = season === "summer" && state.market.drought < 0.45;
    const sunTarget =
      state.market.drought > 0.6 ? 2.5 : season === "winter" ? 1.25 : isWet ? 1.6 : 2.1;
    gsap.to(sun, { intensity: sunTarget, duration: reduced ? 0 : 1.2, overwrite: "auto" });
    gsap.to(ambient, {
      intensity: season === "winter" ? 0.55 : 0.78,
      duration: reduced ? 0 : 1.2,
      overwrite: "auto",
    });
    rainIntensity = isWet ? 0.55 : 0;
    const rainMaterial = rain.material;
    if (rainMaterial instanceof THREE.PointsMaterial) {
      gsap.to(rainMaterial, {
        opacity: rainIntensity,
        duration: reduced ? 0 : 1.1,
        overwrite: "auto",
      });
    }
    sun.color.setHex(state.market.drought > 0.6 ? 0xffc46b : 0xffe7b0);
  };

  const tick = (delta: number): void => {
    if (rainIntensity <= 0) return;
    const attribute = rain.geometry.getAttribute("position");
    if (!(attribute instanceof THREE.BufferAttribute)) return;
    for (let index = 0; index < attribute.count; index += 1) {
      const y = attribute.getY(index) - delta * (10 + (index % 5));
      attribute.setY(index, y < 0.6 ? 16 : y);
    }
    attribute.needsUpdate = true;
  };

  const dispose = (): void => {
    gsap.killTweensOf(scene.background as object);
    if (scene.fog !== null && scene.fog !== undefined) gsap.killTweensOf(scene.fog.color);
    gsap.killTweensOf(sun);
    gsap.killTweensOf(ambient);
    gsap.killTweensOf(rain.material as object);
  };

  return { update, tick, dispose, rain };
};
