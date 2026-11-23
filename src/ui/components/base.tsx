import type { JSX } from "@solidjs/web";
import {
  Slider,
  SliderControl,
  SliderIndicator,
  SliderThumb,
  SliderTrack,
} from "@ui-sdk/solid/slider";
import { Icon, type IconName } from "./icons";

export const cx = (...values: readonly (string | false | null | undefined)[]): string =>
  values
    .filter(
      (value): value is string =>
        value !== false && value !== null && value !== undefined && value !== "",
    )
    .join(" ");

export const Panel = (props: {
  readonly title?: string;
  readonly kicker?: string;
  readonly icon?: IconName;
  readonly actions?: JSX.Element;
  readonly class?: string;
  readonly bodyClass?: string;
  readonly children: JSX.Element;
}): JSX.Element => (
  <section class={cx("panel", props.class)}>
    {props.title === undefined ? null : (
      <header class="panel-head">
        <div class="panel-heading">
          {props.icon === undefined ? null : (
            <Icon icon={props.icon} size={18} class="panel-icon" />
          )}
          <div>
            {props.kicker === undefined ? null : <p class="panel-kicker">{props.kicker}</p>}
            <h2 class="panel-title">{props.title}</h2>
          </div>
        </div>
        {props.actions === undefined ? null : <div class="panel-actions">{props.actions}</div>}
      </header>
    )}
    <div class={cx("panel-body", props.bodyClass)}>{props.children}</div>
  </section>
);

export const Stat = (props: {
  readonly label: string;
  readonly value: string;
  readonly hint?: string;
  readonly tone?: "neutral" | "good" | "warn" | "bad" | "gold";
  readonly icon?: IconName;
  readonly class?: string;
}): JSX.Element => (
  <div class={cx("stat", props.class)} data-tone={props.tone ?? "neutral"}>
    <div class="stat-top">
      <span class="stat-label">{props.label}</span>
    </div>
    <span class="stat-value">{props.value}</span>
    {props.hint === undefined ? null : <span class="stat-hint">{props.hint}</span>}
  </div>
);

export const Bar = (props: {
  readonly value: number;
  readonly max?: number;
  readonly tone?: "good" | "warn" | "bad" | "gold" | "green" | "electric";
  readonly label?: string;
  readonly class?: string;
  readonly pulse?: boolean;
}): JSX.Element => {
  const max = props.max ?? 100;
  const ratio = () => (max <= 0 ? 0 : Math.max(0, Math.min(1, props.value / max)));
  const current = () => Math.round(Math.max(0, Math.min(props.value, max)));

  return (
    <div
      class={cx("bar", props.class)}
      data-tone={props.tone ?? "electric"}
      data-pulse={props.pulse ? "true" : undefined}
      role="meter"
      aria-label={props.label ?? "Chỉ số"}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={current()}
      aria-valuetext={`${current()} trên ${max}`}
    >
      <span class="bar-fill" style={{ transform: `scaleX(${ratio()})` }} />
    </div>
  );
};

export const Badge = (props: {
  readonly children: JSX.Element;
  readonly tone?: "neutral" | "good" | "warn" | "bad" | "gold" | "dark" | "electric";
  readonly class?: string;
  readonly pulse?: boolean;
  readonly label?: string;
}): JSX.Element => (
  <span
    class={cx("badge", props.class)}
    data-tone={props.tone ?? "neutral"}
    data-pulse={props.pulse ? "true" : undefined}
    aria-label={props.label}
    role={props.label === undefined ? undefined : "status"}
  >
    {props.children}
  </span>
);

export const IconButton = (props: {
  readonly icon: IconName;
  readonly label: string;
  readonly onClick?: () => void;
  readonly class?: string;
  readonly disabled?: boolean;
  readonly pressed?: boolean;
}): JSX.Element => (
  <button
    type="button"
    class={cx("icon-btn", props.class)}
    aria-label={props.label}
    aria-pressed={props.pressed === undefined ? undefined : props.pressed ? "true" : "false"}
    title={props.label}
    onClick={props.onClick}
    disabled={props.disabled}
  >
    <Icon icon={props.icon} size={18} />
  </button>
);

export const ActionButton = (props: {
  readonly children: JSX.Element;
  readonly onClick?: () => void;
  readonly variant?: "primary" | "secondary" | "ghost" | "danger" | "gold";
  readonly size?: "sm" | "md" | "lg";
  readonly icon?: IconName;
  readonly disabled?: boolean;
  readonly class?: string;
  readonly ariaLabel?: string;
  readonly type?: "button" | "submit";
  readonly pressed?: boolean;
}): JSX.Element => (
  <button
    type={props.type ?? "button"}
    class={cx("btn", props.class)}
    data-variant={props.variant ?? "secondary"}
    data-size={props.size ?? "md"}
    onClick={props.onClick}
    disabled={props.disabled}
    aria-label={props.ariaLabel}
    aria-pressed={props.pressed === undefined ? undefined : props.pressed ? "true" : "false"}
  >
    {props.icon === undefined ? null : (
      <Icon icon={props.icon} size={props.size === "sm" ? 15 : 18} />
    )}
    <span>{props.children}</span>
  </button>
);

export const SectionHeading = (props: {
  readonly title: string;
  readonly hint?: string;
  readonly action?: JSX.Element;
}): JSX.Element => (
  <div class="section-heading">
    <div>
      <h3>{props.title}</h3>
      {props.hint === undefined ? null : <p>{props.hint}</p>}
    </div>
    {props.action}
  </div>
);

export const EmptyState = (props: {
  readonly title: string;
  readonly body?: string;
  readonly icon?: IconName;
}): JSX.Element => (
  <div class="empty-state">
    <Icon icon={props.icon ?? "lucide:info"} size={26} />
    <strong>{props.title}</strong>
    {props.body === undefined ? null : <span>{props.body}</span>}
  </div>
);

export const Divider = (): JSX.Element => <div class="divider" role="separator" />;

export const ProgressRing = (props: {
  readonly value: number;
  readonly max?: number;
  readonly size?: number;
  readonly stroke?: number;
  readonly label?: string;
  readonly tone?: "good" | "warn" | "bad" | "gold" | "electric";
}): JSX.Element => {
  const size = props.size ?? 56;
  const stroke = props.stroke ?? 5;
  const max = props.max ?? 100;
  const ratio = () => (max <= 0 ? 0 : Math.max(0, Math.min(1, props.value / max)));
  const current = () => Math.round(Math.max(0, Math.min(props.value, max)));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <span
      class="ring"
      data-tone={props.tone ?? "electric"}
      role="meter"
      aria-label={props.label ?? "Chỉ số"}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={current()}
      aria-valuetext={`${current()} trên ${max}`}
    >
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          class="ring-track"
          stroke-width={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          class="ring-value"
          stroke-width={stroke}
          fill="none"
          stroke-dasharray={`${circumference}`}
          stroke-dashoffset={`${circumference * (1 - ratio())}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span class="ring-label">{Math.round(props.value)}</span>
    </span>
  );
};

export const RangeSlider = (props: {
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step?: number;
  readonly label: string;
  readonly onInput: (value: number) => void;
  readonly class?: string;
}): JSX.Element => (
  <Slider
    class={cx("slider", props.class)}
    value={props.value}
    min={props.min}
    max={props.max}
    step={props.step ?? 1}
    onValueChange={(value) => props.onInput(value)}
  >
    <SliderControl class="slider-control">
      <SliderTrack class="slider-track">
        <SliderIndicator class="slider-indicator" />
        <SliderThumb class="slider-thumb" aria-label={props.label} />
      </SliderTrack>
    </SliderControl>
  </Slider>
);
