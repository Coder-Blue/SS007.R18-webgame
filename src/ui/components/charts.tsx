import type { JSX } from "@solidjs/web";

export interface Series {
  readonly label: string;
  readonly color: string;
  readonly values: readonly number[];
}

const range = (series: readonly Series[]): readonly [number, number] => {
  const values = series.flatMap((item) => item.values);
  if (values.length === 0) return [0, 1];
  const min = Math.min(0, ...values);
  const max = Math.max(1, ...values);
  const pad = (max - min) * 0.08 || 1;
  return [min - pad, max + pad];
};

const points = (
  values: readonly number[],
  width: number,
  height: number,
  min: number,
  max: number,
): string => {
  if (values.length === 0) return "";
  const step = values.length === 1 ? width : width / (values.length - 1);
  return values
    .map((value, index) => {
      const x = index * step;
      const y = height - ((value - min) / (max - min)) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
};

export const LineChart = (props: {
  readonly series: readonly Series[];
  readonly height?: number;
  readonly ariaLabel: string;
  readonly grid?: number;
}): JSX.Element => {
  const width = 360;
  const height = props.height ?? 140;
  const bounds = () => range(props.series);
  const grid = props.grid ?? 4;
  return (
    <svg
      class="line-chart"
      viewBox={`0 0 ${width} ${height + 18}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={props.ariaLabel}
    >
      {Array.from({ length: grid + 1 }, (_value, index) => {
        const y = (height / grid) * index;
        return <line x1="0" y1={y} x2={width} y2={y} class="chart-grid" />;
      })}
      {props.series.map((item) => (
        <path
          d={points(item.values, width, height, bounds()[0], bounds()[1])}
          fill="none"
          stroke={item.color}
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
          vector-effect="non-scaling-stroke"
        />
      ))}
      <line x1="0" y1={height} x2={width} y2={height} class="chart-axis" />
      {props.series.map((item, index) => (
        <g transform={`translate(${index * 78}, ${height + 14})`}>
          <rect width="7" height="7" x="0" y="-7" fill={item.color} rx="1.5" />
          <text x="12" y="0" class="chart-label">
            {item.label}
          </text>
        </g>
      ))}
    </svg>
  );
};

export const MiniBars = (props: {
  readonly values: readonly number[];
  readonly ariaLabel: string;
  readonly height?: number;
}): JSX.Element => {
  const max = () => Math.max(1, ...props.values.map((value) => Math.abs(value)));
  const width = 120;
  const height = props.height ?? 34;
  const barWidth = () => (props.values.length === 0 ? width : width / props.values.length);
  return (
    <svg
      class="mini-bars"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={props.ariaLabel}
    >
      {props.values.map((value, index) => {
        const ratio = Math.abs(value) / max();
        const barHeight = Math.max(2, ratio * (height - 4));
        return (
          <rect
            x={index * barWidth() + 1}
            y={value >= 0 ? height - barHeight : 2}
            width={Math.max(1, barWidth() - 2)}
            height={barHeight}
            rx="1"
            class={value >= 0 ? "mini-bar-good" : "mini-bar-bad"}
          />
        );
      })}
    </svg>
  );
};
