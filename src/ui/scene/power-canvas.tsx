import { createSignal, createTrackedEffect, onSettled, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useGame } from "../game-context";
import { Icon } from "../components/icons";
import type { PowerScene, SceneSelection } from "~/scene/create-power-scene";
import { seasonOf } from "~/domain";

type SceneModule = typeof import("~/scene/create-power-scene");

const IDLE_TIMEOUT_MS = 1_500;
const FALLBACK_DELAY_MS = 200;

const reduced = (): boolean => {
  if (typeof document === "undefined") return false;

  return document.documentElement.dataset.motion === "reduced";
};

export const PowerCanvas = (props: {
  readonly onSelect: (selection: SceneSelection) => void;
}): JSX.Element => {
  const { store } = useGame();
  const state = store.state;
  const [ready, setReady] = createSignal(false);
  const [loadFailed, setLoadFailed] = createSignal(false);
  const [unavailable, setUnavailable] = createSignal(false);
  let canvas: HTMLCanvasElement | undefined;
  let container: HTMLDivElement | undefined;
  let controller: PowerScene | null = null;
  let tourTarget: SceneSelection | null = null;

  createTrackedEffect(() => {
    if (!ready()) return;

    controller?.update(state(), store.running());
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

      void import("~/scene/create-power-scene")
        .then(({ createPowerScene }: SceneModule) => {
          if (cancelled || canvas === undefined || container === undefined) return;

          const next = createPowerScene({
            canvas,
            container,
            onSelect: props.onSelect,
            reducedMotion: reduced,
          });

          try {
            next.update(state(), store.running());
          } catch {
            next.dispose();
            throw new Error("power scene failed to initialise");
          }

          controller = next;
          setReady(true);

          if (tourTarget !== null) next.focusSelection(tourTarget);
        })
        .catch((error) => {
          if (cancelled) return;

          if (String(error).includes("WebGL")) {
            setUnavailable(true);

            return;
          }

          setLoadFailed(true);
        })
        .finally(() => {
          loading = false;
        });
    };

    const schedule = (): void => {
      if ("requestIdleCallback" in window) {
        idleHandle = window.requestIdleCallback(load, { timeout: IDLE_TIMEOUT_MS });

        return;
      }

      timer = setTimeout(load, FALLBACK_DELAY_MS);
    };

    const onTour = (event: Event): void => {
      // SAFETY: only the tutorial dispatches this event, always with a SceneSelection or null.
      const selection = (event as CustomEvent<SceneSelection | null>).detail ?? null;

      tourTarget = selection;
      controller?.focusSelection(selection);
    };

    window.addEventListener("grid:tour-focus", onTour);
    frame = requestAnimationFrame(schedule);

    return () => {
      cancelled = true;
      window.removeEventListener("grid:tour-focus", onTour);

      if (frame !== undefined) cancelAnimationFrame(frame);

      if (idleHandle !== undefined) window.cancelIdleCallback(idleHandle);

      if (timer !== undefined) clearTimeout(timer);

      controller?.dispose();
      controller = null;
    };
  });

  const weatherLabel = (): string => {
    if (state().market.drought > 0.6) return "Hạn hán El Niño";

    if (state().market.fuelPriceIndex > 1.3) return "Khủng hoảng nhiên liệu";

    const season = seasonOf(state().clock.month);

    if (season === "summer") return "Cao điểm mùa hè";

    if (season === "winter") return "Phụ tải mùa đông";

    return "Vận hành bình thường";
  };

  const coverage = () =>
    (state().zones.urban.coverage +
      state().zones.industrial.coverage +
      state().zones.rural.coverage) /
    3;

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
        class="power-canvas"
        aria-label="Bản đồ lưới điện quốc gia"
        role="img"
      />
      <div class="scene-vignette" />
      <div class="scene-badges">
        <span class="scene-badge">
          <Icon
            icon={
              state().market.drought > 0.6
                ? "lucide:thermometer-sun"
                : state().market.fuelPriceIndex > 1.3
                  ? "tabler:flame"
                  : "lucide:cloud-sun"
            }
            size={14}
          />
          {weatherLabel()}
        </span>
        <span class="scene-badge">
          <Icon icon="lucide:utility-pole" size={14} />
          {Math.round(coverage())}% phủ điện
        </span>
        <Show when={state().policy.branch === "private"}>
          <span class="scene-badge" data-tone="bad">
            <Icon icon="tabler:plug-x" size={14} />
            Lưới tư nhân phân mảnh
          </span>
        </Show>
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
      <p class="scene-hint">Kéo để di chuyển · Lăn chuột để phóng · Chạm công trình để xem</p>
      <Show when={!ready() && !loadFailed() && !unavailable()}>
        <div class="scene-loading" role="status" aria-live="polite">
          Đang dựng bản đồ lưới điện…
        </div>
      </Show>
      <Show when={unavailable()}>
        <div class="scene-empty" role="status">
          <Icon icon="lucide:map" size={18} />
          <span>Bản đồ 3D cần WebGL. Bảng điều hành vẫn hoạt động đầy đủ.</span>
        </div>
      </Show>
      <Show when={loadFailed()}>
        <div class="scene-error" role="alert">
          <span>Không tải được bản đồ lưới điện.</span>
          <button type="button" class="scene-reset" onClick={() => window.location.reload()}>
            Thử lại
          </button>
        </div>
      </Show>
    </div>
  );
};
