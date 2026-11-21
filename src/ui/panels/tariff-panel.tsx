import { createSignal, createTrackedEffect } from "solid-js";
import { For } from "solid-js";
import type { JSX } from "@solidjs/web";
import {
  Slider,
  SliderControl,
  SliderIndicator,
  SliderThumb,
  SliderTrack,
} from "@ui-sdk/solid/slider";
import { useGame } from "../game-context";
import { ActionButton, Badge, Bar, Panel, Stat } from "../components/base";
import { Icon } from "../components/icons";
import {
  averageHouseholdTariff,
  TARIFF_BANDS,
  WORKSHOP_TARIFF_MAX,
  WORKSHOP_TARIFF_MIN,
  type TariffTiers,
} from "~/domain";
import { formatBillion, formatPercent, formatPrice } from "~/state/format";

const tierLabels = [
  "Bậc 1 · Hộ nhỏ, hộ nghèo",
  "Bậc 2 · Hộ tiêu dùng vừa",
  "Bậc 3 · Hộ tiêu dùng cao",
  "Bậc 4 · Hộ tiêu dùng rất cao",
] as const;

const asTierTuple = (values: readonly number[]): readonly [number, number, number, number] => [
  values[0] ?? 8,
  values[1] ?? 10,
  values[2] ?? 13,
  values[3] ?? 17,
];

export const TariffPanel = (): JSX.Element => {
  const { store, actions } = useGame();
  const state = store.state;

  const [draft, setDraft] = createSignal<readonly [number, number, number, number]>(
    asTierTuple(state().tariffs.tiers),
  );

  const [workshop, setWorkshop] = createSignal(state().tariffs.workshop);
  createTrackedEffect(() => {
    const tariffs = state().tariffs;
    setDraft(asTierTuple(tariffs.tiers));
    setWorkshop(tariffs.workshop);
  });

  const average = () =>
    averageHouseholdTariff({
      tiers: draft(),
      workshop: workshop(),
      ceiling: state().tariffs.ceiling,
    } satisfies TariffTiers);

  const overCeiling = () => average() > state().tariffs.ceiling + 1e-9;

  const update = (index: number, value: number): void => {
    const current = draft();
    const next: [number, number, number, number] = [current[0], current[1], current[2], current[3]];
    next[index] = value;
    setDraft(next);
  };

  const last = () => state().finance.monthlyHistory[state().finance.monthlyHistory.length - 1];
  const householdRevenue = last()?.revenueHousehold ?? 0;

  return (
    <div class="stack-lg">
      <Panel title="Bán lẻ & giá" kicker="Bán lẻ · Giá trần và trợ giá" icon="lucide:scale">
        <p class="muted">
          Bậc thấp bảo vệ hộ nghèo và bản xa. Bậc cao buộc hộ tiêu dùng nhiều trả nhiều hơn.
        </p>
        <div class="tariff-summary">
          <Stat
            label="Giá bình quân có trọng số"
            value={formatPrice(average())}
            tone={overCeiling() ? "bad" : "good"}
            icon="lucide:scale"
          />
          <Stat
            label="Trần của Chairman"
            value={formatPrice(state().tariffs.ceiling)}
            icon="lucide:shield"
          />
          <Stat
            label="Bán lẻ hộ dân"
            value={formatBillion(householdRevenue)}
            hint="Báo cáo lãi lỗ tháng"
            icon="lucide:wallet"
          />
          <Stat
            label="Lạm phát"
            value={formatPercent(state().metrics.inflation)}
            tone={state().metrics.inflation > 8 ? "bad" : "warn"}
            icon="lucide:trending-up"
          />
        </div>
        <Badge tone={overCeiling() ? "bad" : "good"}>
          {overCeiling() ? "Vượt trần" : "Trong trần cho phép"}
        </Badge>
      </Panel>

      <Panel title="Bậc thang hộ dân" kicker="Vai trò và trách nhiệm" icon="lucide:coins">
        <div class="slider-list">
          <For each={tierLabels}>
            {(label, index) => {
              const band = TARIFF_BANDS[index()] ?? [7, 20];

              return (
                <div class="slider-row" data-over={overCeiling()}>
                  <div class="slider-head">
                    <span>{label}</span>
                    <strong>{formatPrice(draft()[index()] ?? band[0])}</strong>
                  </div>
                  <Slider
                    value={draft()[index()] ?? band[0]}
                    min={band[0]}
                    max={band[1]}
                    step={0.1}
                    onValueChange={(value) => update(index(), Number(value))}
                    aria-label={label}
                  >
                    <SliderControl>
                      <SliderTrack>
                        <SliderIndicator />
                        <SliderThumb aria-label={label} />
                      </SliderTrack>
                    </SliderControl>
                  </Slider>
                  <div class="slider-scale">
                    <span>{formatPrice(band[0])}</span>
                    <span>{formatPrice(band[1])}</span>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </Panel>

      <Panel title="Giá xưởng & thợ thủ công" kicker="Phân phối" icon="lucide:factory">
        <p class="muted">
          Giá trợ cấp cho xưởng. Giá thấp thúc đẩy công nghiệp hóa nhưng làm tăng lỗ.
        </p>
        <div class="slider-row">
          <div class="slider-head">
            <span>Giá xưởng & thợ thủ công</span>
            <strong>{formatPrice(workshop())}</strong>
          </div>
          <Slider
            value={workshop()}
            min={WORKSHOP_TARIFF_MIN}
            max={WORKSHOP_TARIFF_MAX}
            step={0.1}
            onValueChange={(value) => setWorkshop(Number(value))}
            aria-label="Giá xưởng & thợ thủ công"
          >
            <SliderControl>
              <SliderTrack>
                <SliderIndicator />
                <SliderThumb aria-label="Giá xưởng & thợ thủ công" />
              </SliderTrack>
            </SliderControl>
          </Slider>
          <div class="slider-scale">
            <span>{formatPrice(WORKSHOP_TARIFF_MIN)}</span>
            <span>{formatPrice(WORKSHOP_TARIFF_MAX)}</span>
          </div>
        </div>
        <div class="meter-block">
          <div class="meter-row">
            <span>Trần của Chairman</span>
            <strong>{formatPrice(state().tariffs.ceiling)}</strong>
          </div>
          <Bar
            value={Math.min(100, (average() / state().tariffs.ceiling) * 100)}
            tone={overCeiling() ? "bad" : "good"}
          />
        </div>
        <div class="inline-actions">
          <ActionButton
            variant="gold"
            icon="lucide:check"
            disabled={overCeiling()}
            onClick={() => actions.setTariffs(draft(), workshop())}
          >
            Áp dụng biểu giá
          </ActionButton>
          <ActionButton
            variant="ghost"
            onClick={() => {
              setDraft(asTierTuple(state().tariffs.tiers));
              setWorkshop(state().tariffs.workshop);
            }}
          >
            Khôi phục
          </ActionButton>
        </div>
        <div class="callout">
          <Icon icon="lucide:info" size={16} />
          <span>Điểm cao giúp giữ được mô hình độc quyền tự nhiên trước áp lực tư nhân hóa.</span>
        </div>
      </Panel>
    </div>
  );
};
