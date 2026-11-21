import { createSignal, createTrackedEffect, onSettled, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useGame } from "../game-context";
import { Icon } from "../components/icons";
import { t } from "../localization";
import {
  createVillageScene,
  type SceneSelection,
  type VillageScene,
} from "~/scene/create-village-scene";
import { seasonOf } from "~/domain";

const reduced = (): boolean => {
  if (typeof document === "undefined") return false;
  return document.documentElement.dataset.motion === "reduced";
};

export const VillageCanvas = (props: {
  readonly onSelect: (selection: SceneSelection) => void;
}): JSX.Element => {
  const { store } = useGame();
  const state = store.state;
  const [ready, setReady] = createSignal(false);
  let canvas: HTMLCanvasElement | undefined;
  let container: HTMLDivElement | undefined;
  let controller: VillageScene | null = null;
  createTrackedEffect(() => {
    if (!ready()) return;
    controller?.update(state());
  });
  onSettled(() => {
    if (canvas === undefined || container === undefined) return;
    controller = createVillageScene({
      canvas,
      container,
      onSelect: props.onSelect,
      reducedMotion: reduced,
    });
    controller.update(state());
    setReady(true);
    return () => {
      controller?.dispose();
      controller = null;
    };
  });
  const weatherLabel = (): string => {
    if (state().market.drought > 0.6) return t("scene.weatherDrought");
    const season = seasonOf(state().clock.month);
    if (season === "summer") return t("scene.weatherMonsoon");
    if (season === "winter") return t("scene.weatherWinter");
    return t("scene.weatherClear");
  };
  return (
    <div
      class="scene-wrap"
      ref={(element) => {
        container = element;
      }}
    >
      <canvas
        ref={(element) => {
          canvas = element;
        }}
        class="village-canvas"
        aria-label={t("app.title")}
        role="img"
      />
      <div class="scene-vignette" />
      <div class="scene-badges">
        <span class="scene-badge">
          <Icon name={state().market.drought > 0.6 ? "sun" : "rain"} size={14} />
          {weatherLabel()}
        </span>
        <span class="scene-badge">
          <Icon name="map-pin" size={14} />
          {Math.round(state().infrastructure.coverage)}%
        </span>
      </div>
      <div class="scene-controls">
        <button
          type="button"
          class="scene-reset"
          onClick={() => controller?.resetView()}
          aria-label={t("scene.resetView")}
        >
          <Icon name="map-pin" size={16} />
          <span>{t("scene.resetView")}</span>
        </button>
      </div>
      <p class="scene-hint">{t("scene.hint")}</p>
      <Show when={!ready()}>
        <div class="scene-loading">{t("scene.loading")}</div>
      </Show>
    </div>
  );
};
