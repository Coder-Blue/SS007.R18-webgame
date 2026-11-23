import { For, createSignal, createTrackedEffect } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useGame } from "../game-context";
import { ActionButton, Badge, Bar, Panel, RangeSlider } from "../components/base";
import { Icon } from "../components/icons";
import {
  formatPercent,
  formatPrice,
  formatSignedBillion,
  formatSignedPercent,
} from "~/state/format";
import { TARIFF_BANDS, TARIFF_WEIGHTS, DIRECT_TARIFF_CAP_PCT, tariffPreview } from "~/domain";

const tierLabels = [
  "Bậc 1 · 0–50 kWh",
  "Bậc 2 · 51–100 kWh",
  "Bậc 3 · 101–200 kWh",
  "Bậc 4 · 201–300 kWh",
  "Bậc 5 · 301–400 kWh",
  "Bậc 6 · trên 400 kWh",
] as const;

export const TariffPanel = (): JSX.Element => {
  const { store } = useGame();
  const state = store.state;

  const [tiers, setTiers] = createSignal<readonly [number, number, number, number, number, number]>(
    state().tariffs.tiers,
  );

  const [industrial, setIndustrial] = createSignal(state().tariffs.industrial);

  createTrackedEffect(() => {
    setTiers(state().tariffs.tiers);
    setIndustrial(state().tariffs.industrial);
  });

  const preview = () => tariffPreview(state(), tiers(), industrial());

  const change = () => {
    const before = preview().before.averageTariff;

    const household = before > 0 ? ((preview().after.averageTariff - before) / before) * 100 : 0;

    const industrialBase = state().tariffs.industrial;

    const industrialChange =
      industrialBase > 0
        ? Math.max(0, ((industrial() - industrialBase) / industrialBase) * 100)
        : 0;

    return Math.max(household, industrialChange);
  };

  const setTier = (index: number, value: number): void => {
    const current = tiers();

    const next: [number, number, number, number, number, number] = [
      current[0],
      current[1],
      current[2],
      current[3],
      current[4],
      current[5],
    ];

    next[index] = value;
    setTiers(next);
  };

  const apply = (): void => {
    store.requestTariff(tiers(), industrial());
  };

  return (
    <div class="stack-lg" data-tutorial="tariff-panel">
      <Panel title="Biểu giá bán lẻ" kicker="Bước 3 · Phân phối" icon="tabler:scale">
        <p class="panel-lead">
          Sáu bậc lũy tiến cho hộ dân, một giá trợ cấp cho khu công nghiệp. Tăng đến{" "}
          {DIRECT_TARIFF_CAP_PCT}% được thực hiện ngay; vượt mức đó phải trình Nhà nước thẩm định.
        </p>
        <dl class="grid grid-cols-2 gap-x-6 gap-y-4 border-y border-line py-4 sm:grid-cols-4">
          <div>
            <dt class="text-[11px] text-ink-faint">Giá bình quân</dt>
            <dd class="mt-1 text-base font-semibold tabular-nums text-gold">
              {formatPrice(preview().after.averageTariff)}
              <span class="mt-1 block text-[11px] font-normal leading-4 text-ink-faint">
                {`Trần năm: ${formatPrice(state().tariffs.ceiling)}`}
              </span>
            </dd>
          </div>
          <div>
            <dt class="text-[11px] text-ink-faint">Thay đổi dự kiến</dt>
            <dd
              class={`mt-1 text-base font-semibold tabular-nums ${
                change() > DIRECT_TARIFF_CAP_PCT ? "text-amber" : "text-green"
              }`}
            >
              {formatSignedPercent(change())}
              <span class="mt-1 block text-[11px] font-normal leading-4 text-ink-faint">
                {change() > DIRECT_TARIFF_CAP_PCT ? "Cần trình Nhà nước" : "Điều chỉnh trực tiếp"}
              </span>
            </dd>
          </div>
          <div>
            <dt class="text-[11px] text-ink-faint">Giá công nghiệp</dt>
            <dd class="mt-1 text-base font-semibold tabular-nums text-amber">
              {formatPrice(industrial())}
              <span class="mt-1 block text-[11px] font-normal leading-4 text-ink-faint">
                Thấp hơn chi phí biên
              </span>
            </dd>
          </div>
          <div>
            <dt class="text-[11px] text-ink-faint">Lợi nhuận tháng</dt>
            <dd
              class={`mt-1 text-base font-semibold tabular-nums ${
                preview().after.netResult >= preview().before.netResult ? "text-green" : "text-rose"
              }`}
            >
              {formatSignedBillion(preview().after.netResult)}
              <span class="mt-1 block text-[11px] font-normal leading-4 text-ink-faint">
                {`Trước điều chỉnh: ${formatSignedBillion(preview().before.netResult)}`}
              </span>
            </dd>
          </div>
        </dl>
        <div class="tier-list">
          <For each={tiers()}>
            {(value, index) => (
              <div class="tier-row">
                <div class="tier-head">
                  <span>{tierLabels[index()]}</span>
                  <strong>{formatPrice(value)}</strong>
                </div>
                <RangeSlider
                  value={value}
                  min={TARIFF_BANDS[index()]?.[0] ?? 0}
                  max={TARIFF_BANDS[index()]?.[1] ?? 4_000}
                  step={10}
                  label={tierLabels[index()] ?? "Bậc giá"}
                  onInput={(next) => setTier(index(), next)}
                />
                <span class="tier-meta">
                  Tỷ trọng {formatPercent((TARIFF_WEIGHTS[index()] ?? 0) * 100)}
                </span>
              </div>
            )}
          </For>
          <div class="tier-row">
            <div class="tier-head">
              <span>Giá khu công nghiệp</span>
              <strong>{formatPrice(industrial())}</strong>
            </div>
            <RangeSlider
              value={industrial()}
              min={1_550}
              max={1_950}
              step={10}
              label="Giá điện khu công nghiệp"
              onInput={setIndustrial}
            />
            <span class="tier-meta">Trợ cấp công nghiệp hóa</span>
          </div>
        </div>
        <div class="preview-card" data-tone={change() > DIRECT_TARIFF_CAP_PCT ? "warn" : "good"}>
          <div class="preview-head">
            <span>Dự đoán kết quả tức thì</span>
            <Badge tone={change() > DIRECT_TARIFF_CAP_PCT ? "warn" : "good"}>
              {change() > DIRECT_TARIFF_CAP_PCT ? "Cần thẩm định" : "Trong hạn mức"}
            </Badge>
          </div>
          <div class="preview-grid">
            <div>
              <span>Lãi/lỗ tháng</span>
              <strong>
                {formatSignedBillion(preview().before.netResult)} →{" "}
                {formatSignedBillion(preview().after.netResult)}
              </strong>
            </div>
            <div>
              <span>Khả năng chấp thuận</span>
              <strong>{Math.round(preview().after.approvalLikelihood)}%</strong>
            </div>
            <div>
              <span>Niềm tin dân</span>
              <strong>
                {Math.round(preview().before.trustBefore)}% →{" "}
                {Math.round(preview().after.trustAfter)}%
              </strong>
            </div>
            <div>
              <span>Dự phòng</span>
              <strong>
                {Math.round(preview().before.reserveMargin)}% →{" "}
                {Math.round(preview().after.reserveMargin)}%
              </strong>
            </div>
            <div>
              <span>Độ tin cậy</span>
              <strong>
                {Math.round(preview().before.reliability)}% →{" "}
                {Math.round(preview().after.reliability)}%
              </strong>
            </div>
            <div>
              <span>Giá bình quân</span>
              <strong>
                {formatPrice(preview().before.averageTariff)} →{" "}
                {formatPrice(preview().after.averageTariff)}
              </strong>
            </div>
          </div>
          <Bar
            value={preview().after.approvalLikelihood}
            tone={preview().after.approvalLikelihood >= 55 ? "good" : "bad"}
            label="Khả năng chấp thuận"
          />
        </div>
        <div class="action-row">
          <ActionButton variant="primary" icon="tabler:building-bank" onClick={apply}>
            Trình điều chỉnh giá
          </ActionButton>
          <ActionButton
            variant="ghost"
            icon="lucide:rotate-ccw"
            onClick={() => {
              setTiers(state().tariffs.tiers);
              setIndustrial(state().tariffs.industrial);
            }}
          >
            Hoàn tác
          </ActionButton>
        </div>
        <div class="callout">
          <Icon icon="lucide:info" size={16} />
          <span>
            Nhà nước tự thẩm định chi phí đầu vào, lỗ lũy kế, lạm phát và niềm tin dân trước khi
            đồng ý. Hồ sơ kiến nghị chính sách giúp tăng khả năng chấp thuận.
          </span>
        </div>
      </Panel>

      <Panel title="Hồ sơ đang chờ" kicker="Nhà nước thẩm định" icon="tabler:file-analytics">
        {state().approval === null ? (
          <p class="rail-note">
            <Icon icon="lucide:check" size={14} />
            Không có hồ sơ điều chỉnh giá nào đang chờ.
          </p>
        ) : (
          <div class="pending-approval">
            <div class="project-head">
              <strong>Phương án tăng {formatPercent(state().approval?.changePct ?? 0)}</strong>
              <Badge tone="warn">Đang chờ</Badge>
            </div>
            <Bar
              value={state().approval?.likelihood ?? 0}
              tone="warn"
              label="Khả năng chấp thuận"
            />
            <span class="project-meta">
              Khả năng chấp thuận {Math.round(state().approval?.likelihood ?? 0)}%
            </span>
          </div>
        )}
      </Panel>
    </div>
  );
};
