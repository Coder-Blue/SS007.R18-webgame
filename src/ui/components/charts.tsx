import { For, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import type { MonthlyLedger } from "~/domain";

const width = 640;
const height = 220;
const pad = { left: 44, right: 16, top: 16, bottom: 28 };

type Series = {
  readonly key: string;
  readonly label: string;
  readonly color: string;
};

const revenueSeries: readonly Series[] = [
  { key: "revenueElectricity", label: "Doanh thu điện", color: "var(--electric)" },
  { key: "revenueOther", label: "Doanh thu khác", color: "var(--cyan-soft)" },
];

const costSeries: readonly Series[] = [
  { key: "costSupply", label: "Chi phí cung ứng", color: "var(--amber)" },
  { key: "costManagement", label: "Chi phí quản lý", color: "var(--rose)" },
];

const valueOf = (ledger: MonthlyLedger, key: string): number => {
  if (key === "revenueElectricity") return ledger.revenueElectricity;

  if (key === "revenueOther") return ledger.revenueOther;

  if (key === "costSupply") return ledger.costSupply;

  if (key === "costManagement") return ledger.costManagement;

  if (key === "citizenTrust") return ledger.citizenTrust;

  if (key === "institutionalTrust") return ledger.institutionalTrust;

  return 0;
};

const monthLabel = (ledger: MonthlyLedger): string =>
  `T${ledger.month}/${String(ledger.year).slice(2)}`;

const maxOf = (rows: readonly MonthlyLedger[]): number => {
  let max = 1;

  for (const row of rows) {
    max = Math.max(
      max,
      row.revenueElectricity + row.revenueOther,
      row.costManagement + row.costSupply,
    );
  }

  return max;
};

const yOf = (value: number, max: number): number =>
  pad.top + (1 - value / max) * (height - pad.top - pad.bottom);

const pathOf = (rows: readonly MonthlyLedger[], key: string, max: number): string => {
  let path = "";

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];

    if (row === undefined) continue;
    const x = pad.left + (index / Math.max(1, rows.length - 1)) * (width - pad.left - pad.right);
    const y = yOf(valueOf(row, key), max);

    path += `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)} `;
  }

  return path;
};

export const RevenueCostChart = (props: {
  readonly rows: readonly MonthlyLedger[];
}): JSX.Element => {
  const rows = () => props.rows.slice(-6);
  const max = () => maxOf(rows()) * 1.12;

  const groupWidth = () => (width - pad.left - pad.right) / Math.max(1, rows().length);

  return (
    <figure class="chart-figure">
      <div class="chart-legend" aria-hidden="true">
        <For each={[...revenueSeries, ...costSeries]}>
          {(series) => (
            <span class="chart-legend-item">
              <span class="chart-swatch" style={{ background: series.color }} />
              {series.label}
            </span>
          )}
        </For>
      </div>
      <div class="chart-scroll">
        <svg
          class="chart"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="So sánh cơ cấu doanh thu và chi phí sáu tháng gần nhất"
        >
          <title>Doanh thu và chi phí theo tháng, đơn vị tỷ đồng</title>
          <For each={[0, 0.25, 0.5, 0.75, 1]}>
            {(ratio) => (
              <g>
                <line
                  x1={pad.left}
                  x2={width - pad.right}
                  y1={pad.top + ratio * (height - pad.top - pad.bottom)}
                  y2={pad.top + ratio * (height - pad.top - pad.bottom)}
                  class="chart-grid"
                />
                <text
                  x={pad.left - 8}
                  y={pad.top + ratio * (height - pad.top - pad.bottom) + 4}
                  text-anchor="end"
                  class="chart-axis"
                >
                  {Math.round(max() * (1 - ratio))}
                </text>
              </g>
            )}
          </For>
          <For each={rows()}>
            {(row, index) => {
              const group = () => pad.left + index() * groupWidth() + groupWidth() * 0.18;
              const barWidth = () => groupWidth() * 0.26;
              const totalRevenue = () => row.revenueElectricity + row.revenueOther;
              const totalCost = () => row.costSupply + row.costManagement;
              const revenueTop = () => yOf(totalRevenue(), max());
              const costTop = () => yOf(totalCost(), max());

              const electricHeight = () =>
                yOf(row.revenueOther, max()) - yOf(totalRevenue(), max());

              const otherHeight = () => height - pad.bottom - yOf(row.revenueOther, max());

              const supplyHeight = () => yOf(row.costManagement, max()) - yOf(totalCost(), max());

              const managementHeight = () => height - pad.bottom - yOf(row.costManagement, max());

              return (
                <g>
                  <rect
                    x={group()}
                    y={revenueTop()}
                    width={barWidth()}
                    height={height - pad.bottom - revenueTop()}
                    fill="var(--electric)"
                    class="chart-bar"
                  >
                    <title>{`${monthLabel(row)} · Doanh thu ${Math.round(totalRevenue())} tỷ`}</title>
                  </rect>
                  <rect
                    x={group()}
                    y={yOf(row.revenueOther, max())}
                    width={barWidth()}
                    height={otherHeight()}
                    fill="var(--cyan-soft)"
                    class="chart-bar"
                  >
                    <title>{`${monthLabel(row)} · Doanh thu khác ${Math.round(row.revenueOther)} tỷ`}</title>
                  </rect>
                  <rect
                    x={group() + barWidth() + 4}
                    y={costTop()}
                    width={barWidth()}
                    height={height - pad.bottom - costTop()}
                    fill="var(--amber)"
                    class="chart-bar"
                  >
                    <title>{`${monthLabel(row)} · Chi phí ${Math.round(totalCost())} tỷ`}</title>
                  </rect>
                  <rect
                    x={group() + barWidth() + 4}
                    y={yOf(row.costManagement, max())}
                    width={barWidth()}
                    height={managementHeight()}
                    fill="var(--rose)"
                    class="chart-bar"
                  >
                    <title>{`${monthLabel(row)} · Chi phí quản lý ${Math.round(row.costManagement)} tỷ`}</title>
                  </rect>
                  <rect
                    x={group()}
                    y={revenueTop()}
                    width={barWidth()}
                    height={electricHeight()}
                    fill="transparent"
                  >
                    <title>{`${monthLabel(row)} · Doanh thu điện ${Math.round(row.revenueElectricity)} tỷ`}</title>
                  </rect>
                  <rect
                    x={group() + barWidth() + 4}
                    y={costTop()}
                    width={barWidth()}
                    height={supplyHeight()}
                    fill="transparent"
                  >
                    <title>{`${monthLabel(row)} · Chi phí cung ứng ${Math.round(row.costSupply)} tỷ`}</title>
                  </rect>
                  <text
                    x={group() + barWidth()}
                    y={height - 8}
                    text-anchor="middle"
                    class="chart-axis"
                  >
                    {monthLabel(row)}
                  </text>
                </g>
              );
            }}
          </For>
        </svg>
      </div>
      <figcaption class="chart-caption">
        Cột trái: doanh thu. Cột phải: chi phí. Đơn vị tỷ đồng.
      </figcaption>
    </figure>
  );
};

export const TrustTrendChart = (props: {
  readonly rows: readonly MonthlyLedger[];
}): JSX.Element => {
  const rows = () => props.rows.slice(-24);
  const pathCitizen = () => pathOf(rows(), "citizenTrust", 100);
  const pathInstitutional = () => pathOf(rows(), "institutionalTrust", 100);

  return (
    <figure class="chart-figure">
      <div class="chart-legend" aria-hidden="true">
        <span class="chart-legend-item">
          <span class="chart-swatch" style={{ background: "var(--electric)" }} />
          Niềm tin người dân
        </span>
        <span class="chart-legend-item">
          <span class="chart-swatch" style={{ background: "var(--gold)" }} />
          Tín nhiệm thể chế
        </span>
      </div>
      <div class="chart-scroll">
        <svg
          class="chart"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Xu hướng hai chỉ số niềm tin trong hai mươi bốn tháng"
        >
          <title>Hai chỉ số niềm tin theo tháng, phần trăm</title>
          <For each={[0, 0.25, 0.5, 0.75, 1]}>
            {(ratio) => (
              <g>
                <line
                  x1={pad.left}
                  x2={width - pad.right}
                  y1={pad.top + ratio * (height - pad.top - pad.bottom)}
                  y2={pad.top + ratio * (height - pad.top - pad.bottom)}
                  class="chart-grid"
                />
                <text
                  x={pad.left - 8}
                  y={pad.top + ratio * (height - pad.top - pad.bottom) + 4}
                  text-anchor="end"
                  class="chart-axis"
                >
                  {Math.round(100 * (1 - ratio))}
                </text>
              </g>
            )}
          </For>
          <path d={pathCitizen()} class="chart-line" stroke="var(--electric)" />
          <path d={pathInstitutional()} class="chart-line" stroke="var(--gold)" />
        </svg>
      </div>
      <figcaption class="chart-caption">
        Ngưỡng thất bại: 0%. Mục tiêu ổn định: trên 55%.
      </figcaption>
    </figure>
  );
};

export const GenerationMix = (props: { readonly rows: readonly MonthlyLedger[] }): JSX.Element => {
  const last = () => props.rows[props.rows.length - 1];

  const total = () => {
    const row = last();

    if (row === undefined) return 1;

    return Math.max(
      1,
      row.hydroMillionKwh + row.thermalMillionKwh + row.renewableMillionKwh + row.importMillionKwh,
    );
  };

  const segments = () => {
    const row = last();

    if (row === undefined) return [];

    return [
      { label: "Thủy điện", value: row.hydroMillionKwh, color: "var(--cyan-soft)" },
      { label: "Nhiệt điện", value: row.thermalMillionKwh, color: "var(--amber)" },
      { label: "Tái tạo", value: row.renewableMillionKwh, color: "var(--lime)" },
      { label: "Nhập khẩu", value: row.importMillionKwh, color: "var(--electric)" },
    ];
  };

  return (
    <div class="mix">
      <div class="mix-bar" role="img" aria-label="Cơ cấu nguồn điện tháng gần nhất">
        <Show when={last() !== undefined}>
          <For each={segments()}>
            {(segment) => (
              <span
                class="mix-segment"
                style={{
                  width: `${(segment.value / total()) * 100}%`,
                  background: segment.color,
                }}
                title={`${segment.label}: ${Math.round(segment.value)} triệu kWh`}
              />
            )}
          </For>
        </Show>
      </div>
      <div class="mix-legend">
        <For each={segments()}>
          {(segment) => (
            <span class="mix-item">
              <span class="chart-swatch" style={{ background: segment.color }} />
              {segment.label}
              <strong>{Math.round((segment.value / total()) * 100)}%</strong>
            </span>
          )}
        </For>
      </div>
    </div>
  );
};
