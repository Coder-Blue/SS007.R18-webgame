import type { JSX } from "@solidjs/web";
import { Show } from "solid-js";
import { useGame } from "../game-context";
import { useAdvanceMonth, useAutoPlay } from "~/state/queries";
import { ActionButton, Badge, Bar, IconButton } from "../components/base";
import { AnimatedNumber } from "../components/animated-number";
import { Icon } from "../components/icons";
import { t } from "../localization";
import { formatBillion, formatDate, formatPercent, seasonLabel } from "~/state/format";
import { recoveryOf, seasonOf } from "~/domain";

export const TopBar = (props: {
  readonly onOpenMenu: () => void;
  readonly onOpenTutorial: () => void;
}): JSX.Element => {
  const { store } = useGame();
  const state = store.state;
  const advance = useAdvanceMonth(store);
  const runAdvance = () => advance.mutate();
  useAutoPlay(store, runAdvance, 4_200);
  const debtRatio = () => (state().finance.debt / state().finance.debtLimit) * 100;

  return (
    <header class="top-bar">
      <div class="brand-block">
        <div class="brand-mark">
          <Icon icon="tabler:wheat" size={22} />
        </div>
        <div class="brand-copy">
          <strong>{t("app.title")}</strong>
          <span>{t("app.subtitle")}</span>
        </div>
      </div>

      <div class="date-block">
        <span class="date-main">{formatDate(state().clock.year, state().clock.month)}</span>
        <span class="date-sub">
          {t("hud.season", { season: seasonLabel(seasonOf(state().clock.month)) })} ·{" "}
          {t("hud.act", { act: state().act })}
        </span>
      </div>

      <div class="top-gauges desktop-only">
        <div class="top-gauge" data-tone="gold">
          <div class="top-gauge-label">
            <Icon icon="lucide:wallet" size={15} />
            <span>{t("hud.cash")}</span>
          </div>
          <strong>
            <AnimatedNumber value={() => state().finance.cash} format={formatBillion} />
          </strong>
          <Bar
            value={Math.max(0, Math.min(100, (state().finance.cash / 24_000) * 100))}
            tone="gold"
          />
        </div>
        <div class="top-gauge" data-tone={debtRatio() > 80 ? "bad" : "warn"}>
          <div class="top-gauge-label">
            <Icon icon="lucide:landmark" size={15} />
            <span>{t("hud.debt")}</span>
          </div>
          <strong>
            <AnimatedNumber value={() => state().finance.debt} format={formatBillion} />
          </strong>
          <Bar value={debtRatio()} tone={debtRatio() > 80 ? "bad" : "warn"} />
        </div>
        <div class="top-gauge" data-tone="green">
          <div class="top-gauge-label">
            <Icon icon="lucide:users" size={15} />
            <span>{t("hud.satisfaction")}</span>
          </div>
          <strong>
            <AnimatedNumber value={() => state().metrics.satisfaction} format={formatPercent} />
          </strong>
          <Bar
            value={state().metrics.satisfaction}
            tone={state().metrics.satisfaction >= 55 ? "good" : "bad"}
          />
        </div>
        <div class="top-gauge" data-tone="green">
          <div class="top-gauge-label">
            <Icon icon="lucide:shield" size={15} />
            <span>{t("hud.trust")}</span>
          </div>
          <strong>
            <AnimatedNumber value={() => state().metrics.trust} format={formatPercent} />
          </strong>
          <Bar value={state().metrics.trust} tone={state().metrics.trust >= 55 ? "good" : "bad"} />
        </div>
      </div>

      <div class="top-actions">
        <Show when={state().events.activeId === null && state().ending === null}>
          <ActionButton
            class="advance-btn desktop-only"
            variant="gold"
            icon={store.autoPlay() ? "lucide:pause" : "lucide:play"}
            onClick={() => store.setAutoPlay(!store.autoPlay())}
            ariaLabel={store.autoPlay() ? t("hud.stopAuto") : t("hud.autoPlay")}
          >
            {store.autoPlay() ? t("hud.stopAuto") : t("hud.autoPlay")}
          </ActionButton>
          <ActionButton
            class="advance-btn"
            variant="primary"
            icon="lucide:calendar"
            disabled={advance.isPending}
            onClick={runAdvance}
            ariaLabel={t("hud.endMonth")}
          >
            {t("hud.endMonth")}
          </ActionButton>
        </Show>
        <IconButton
          icon="lucide:book-open"
          label={t("hud.tutorial")}
          onClick={props.onOpenTutorial}
        />
        <IconButton icon="lucide:save" label={t("save.title")} onClick={props.onOpenMenu} />
      </div>

      <div class="mobile-status">
        <span class="mobile-date">{formatDate(state().clock.year, state().clock.month)}</span>
        <span>
          <Icon icon="lucide:wallet" size={14} /> {formatBillion(state().finance.cash)}
        </span>
        <span>
          <Icon icon="lucide:users" size={14} /> {formatPercent(state().metrics.satisfaction)}
        </span>
        <span>
          <Icon icon="lucide:shield" size={14} /> {formatPercent(state().metrics.trust)}
        </span>
        <Show when={recoveryOf(state()).monthlyCredit > 0}>
          <Badge tone="good">N-2</Badge>
        </Show>
      </div>
    </header>
  );
};
