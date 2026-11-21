import { createSignal, createTrackedEffect, onSettled, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useGame } from "../game-context";
import { Icon } from "../components/icons";
import type { SceneSelection, VillageScene } from "~/scene/create-village-scene";
import { seasonOf } from "~/domain";

type SceneModule = typeof import("~/scene/create-village-scene");

const IDLE_TIMEOUT_MS = 1_500;
const FALLBACK_DELAY_MS = 200;

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
  const [loadFailed, setLoadFailed] = createSignal(false);
  let canvas: HTMLCanvasElement | undefined;
  let container: HTMLDivElement | undefined;
  let controller: VillageScene | null = null;
  let requestLoad: (() => void) | undefined;
  createTrackedEffect(() => {
    if (!ready()) return;
    controller?.update(state());
  });
  onSettled(() => {
    if (canvas === undefined || container === undefined) return;

    let cancelled = false;
    let loading = false;
    let frame: number | undefined;
    let idleHandle: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const load = (): void => {
      if (cancelled || loading || controller !== null) return;
      loading = true;

      void import("~/scene/create-village-scene")
        .then(({ createVillageScene }: SceneModule) => {
          if (cancelled || canvas === undefined || container === undefined) return;

          const next = createVillageScene({
            canvas,
            container,
            onSelect: props.onSelect,
            reducedMotion: reduced,
          });

          try {
            next.update(state());
          } catch {
            next.dispose();
            throw new Error("village scene failed to initialise");
          }

          controller = next;
          setReady(true);
        })
        .catch(() => {
          if (!cancelled) setLoadFailed(true);
        })
        .finally(() => {
          loading = false;
        });
    };

    requestLoad = () => {
      setLoadFailed(false);
      load();
    };

    const schedule = (): void => {
      if ("requestIdleCallback" in window) {
        idleHandle = window.requestIdleCallback(load, { timeout: IDLE_TIMEOUT_MS });

        return;
      }

      timer = setTimeout(load, FALLBACK_DELAY_MS);
    };

    frame = requestAnimationFrame(schedule);

    return () => {
      cancelled = true;

      if (frame !== undefined) cancelAnimationFrame(frame);

      if (idleHandle !== undefined) window.cancelIdleCallback(idleHandle);

      if (timer !== undefined) clearTimeout(timer);

      controller?.dispose();
      controller = null;
    };
  });

  const weatherLabel = (): string => {
    if (state().market.drought > 0.6) return "Hạn hán";
    const season = seasonOf(state().clock.month);

    if (season === "summer") return "Mùa mưa";

    if (season === "winter") return "Rét đậm";

    return "Trời quang";
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
        aria-label="Độc Quyền Kinh Tế"
        role="img"
      />
      <div class="scene-vignette" />
      <div class="scene-badges">
        <span class="scene-badge">
          <Icon
            icon={state().market.drought > 0.6 ? "lucide:sun" : "lucide:cloud-rain"}
            size={14}
          />
          {weatherLabel()}
        </span>
        <span class="scene-badge">
          <Icon icon="lucide:map-pin" size={14} />
          {Math.round(state().infrastructure.coverage)}%
        </span>
      </div>
      <div class="scene-controls">
        <button
          type="button"
          class="scene-reset"
          onClick={() => controller?.resetView()}
          aria-label="Căn lại góc nhìn"
        >
          <Icon icon="lucide:map-pin" size={16} />
          <span>Căn lại góc nhìn</span>
        </button>
      </div>
      <p class="scene-hint">Kéo để di chuyển · Lăn chuột để phóng · Chạm để xem</p>
      <Show when={!ready() && !loadFailed()}>
        <div class="scene-loading" role="status" aria-live="polite">
          Đang dựng làng…
        </div>
      </Show>
      <Show when={loadFailed()}>
        <div class="scene-loading" role="alert">
          <span>Không dựng được cảnh làng.</span>
          <button type="button" class="scene-reset" onClick={() => requestLoad?.()}>
            Thử lại
          </button>
        </div>
      </Show>
    </div>
  );
};
