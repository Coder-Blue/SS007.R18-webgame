import { createSignal, createTrackedEffect } from "solid-js";
import type { JSX } from "@solidjs/web";
import { gsap } from "gsap";

export const AnimatedNumber = (props: {
  readonly value: number | (() => number);
  readonly format: (value: number) => string;
  readonly class?: string;
}): JSX.Element => {
  const [display, setDisplay] = createSignal(0);
  let current = 0;
  let tween: gsap.core.Tween | undefined;
  createTrackedEffect(() => {
    const target = typeof props.value === "function" ? props.value() : props.value;
    const reduced =
      typeof document !== "undefined" && document.documentElement.dataset.motion === "reduced";
    if (reduced) {
      current = target;
      setDisplay(target);
      return;
    }
    const state = { value: current };
    tween?.kill();
    tween = gsap.to(state, {
      value: target,
      duration: 0.55,
      ease: "power2.out",
      onUpdate: () => {
        current = state.value;
        setDisplay(state.value);
      },
      overwrite: "auto",
    });
    return () => tween?.kill();
  });
  return <span class={props.class}>{props.format(display())}</span>;
};
