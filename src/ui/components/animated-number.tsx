import { createSignal, createTrackedEffect } from "solid-js";
import type { JSX } from "@solidjs/web";

const DURATION_MS = 550;
const easeOutCubic = (progress: number): number => 1 - (1 - progress) ** 3;

export const AnimatedNumber = (props: {
  readonly value: () => number;
  readonly format: (value: number) => string;
  readonly class?: string;
}): JSX.Element => {
  const [display, setDisplay] = createSignal(0);
  let current = 0;
  let frame: number | undefined;

  createTrackedEffect(() => {
    const target = props.value();

    const reduced =
      "document" in globalThis && document.documentElement.dataset.motion === "reduced";

    if (frame !== undefined) {
      cancelAnimationFrame(frame);
      frame = undefined;
    }

    if (reduced) {
      current = target;
      setDisplay(target);

      return;
    }

    const from = current;
    let startedAt: number | undefined;

    const step = (timestamp: number): void => {
      startedAt ??= timestamp;
      const progress = Math.min(1, (timestamp - startedAt) / DURATION_MS);
      const value = from + (target - from) * easeOutCubic(progress);

      current = value;
      setDisplay(value);
      frame = progress < 1 ? requestAnimationFrame(step) : undefined;
    };

    frame = requestAnimationFrame(step);

    return () => {
      if (frame !== undefined) {
        cancelAnimationFrame(frame);
        frame = undefined;
      }
    };
  });

  return <span class={props.class}>{props.format(display())}</span>;
};
