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
import { t } from "../localization";
import {
  averageHouseholdTariff,
  TARIFF_BANDS,
  WORKSHOP_TARIFF_MAX,
  WORKSHOP_TARIFF_MIN,
  type TariffTiers,
} from "~/domain";
import { formatBillion, formatPercent, formatPrice } from "~/state/format";

const tierLabels = ["tariff.tier1", "tariff.tier2", "tariff.tier3", "tariff.tier4"] as const;

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
      <Panel title={t("panel.tariffs")} kicker={t("pillar.retailTag")} icon="scale">
        <p class="muted">{t("tariff.help")}</p>
        <div class="tariff-summary">
          <Stat
            label={t("tariff.average")}
            value={formatPrice(average())}
            tone={overCeiling() ? "bad" : "good"}
            icon="scale"
          />
          <Stat
            label={t("tariff.ceiling")}
            value={formatPrice(state().tariffs.ceiling)}
            icon="shield"
          />
          <Stat
            label={t("finance.revenueHousehold")}
            value={formatBillion(householdRevenue)}
            hint={t("finance.pnl")}
            icon="wallet"
          />
          <Stat
            label={t("hud.inflation")}
            value={formatPercent(state().metrics.inflation)}
            tone={state().metrics.inflation > 8 ? "bad" : "warn"}
            icon="trend-up"
          />
        </div>
        <Badge tone={overCeiling() ? "bad" : "good"}>
          {overCeiling() ? t("tariff.over") : t("tariff.within")}
        </Badge>
      </Panel>

      <Panel title={t("tariff.title")} kicker={t("policy.roles")} icon="coins">
        <div class="slider-list">
          <For each={tierLabels}>
            {(label, index) => {
              const band = TARIFF_BANDS[index()] ?? [7, 20];

              return (
                <div class="slider-row" data-over={overCeiling()}>
                  <div class="slider-head">
                    <span>{t(label)}</span>
                    <strong>{formatPrice(draft()[index()] ?? band[0])}</strong>
                  </div>
                  <Slider
                    value={draft()[index()] ?? band[0]}
                    min={band[0]}
                    max={band[1]}
                    step={0.1}
                    onValueChange={(value) => update(index(), Number(value))}
                    aria-label={t(label)}
                  >
                    <SliderControl>
                      <SliderTrack>
                        <SliderIndicator />
                        <SliderThumb aria-label={t(label)} />
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

      <Panel title={t("tariff.workshop")} kicker={t("pillar.retail")} icon="factory">
        <p class="muted">{t("tariff.workshopHelp")}</p>
        <div class="slider-row">
          <div class="slider-head">
            <span>{t("tariff.workshop")}</span>
            <strong>{formatPrice(workshop())}</strong>
          </div>
          <Slider
            value={workshop()}
            min={WORKSHOP_TARIFF_MIN}
            max={WORKSHOP_TARIFF_MAX}
            step={0.1}
            onValueChange={(value) => setWorkshop(Number(value))}
            aria-label={t("tariff.workshop")}
          >
            <SliderControl>
              <SliderTrack>
                <SliderIndicator />
                <SliderThumb aria-label={t("tariff.workshop")} />
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
            <span>{t("tariff.ceiling")}</span>
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
            icon="check"
            disabled={overCeiling()}
            onClick={() => actions.setTariffs(draft(), workshop())}
          >
            {t("tariff.save")}
          </ActionButton>
          <ActionButton
            variant="ghost"
            onClick={() => {
              setDraft(asTierTuple(state().tariffs.tiers));
              setWorkshop(state().tariffs.workshop);
            }}
          >
            {t("tariff.reset")}
          </ActionButton>
        </div>
        <div class="callout">
          <Icon name="info" size={16} />
          <span>{t("policy.debateHelp")}</span>
        </div>
      </Panel>
    </div>
  );
};
