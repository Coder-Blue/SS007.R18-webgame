import type { JSX } from "@solidjs/web";
import { Show } from "solid-js";
import { useGame } from "../game-context";
import { useAdvanceMonth, useAutoPlay } from "~/state/queries";
import { ActionButton, Badge, Bar, IconButton } from "../components/base";
import { AnimatedNumber } from "../components/animated-number";
import { Icon } from "../components/icons";
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
          <strong>Độc Quyền Kinh Tế</strong>
          <span>The Rice Monopoly</span>
        </div>
      </div>

      <div class="date-block">
        <span class="date-main">{formatDate(state().clock.year, state().clock.month)}</span>
        <span class="date-sub">
          {`Mùa ${seasonLabel(seasonOf(state().clock.month))}`} · {`Hồi ${state().act}`}
        </span>
      </div>

      <div class="top-gauges desktop-only">
        <div class="top-gauge" data-tone="gold">
          <div class="top-gauge-label">
            <Icon icon="lucide:wallet" size={15} />
            <span>Ngân quỹ</span>
          </div>
          <strong>
            <AnimatedNumber value={() => state().finance.cash} format={formatBillion} />
          </strong>
          <Bar
            value={Math.max(0, Math.min(100, (state().finance.cash / 24_000) * 100))}
            tone="gold"
            label="Ngân quỹ"
          />
        </div>
        <div class="top-gauge" data-tone={debtRatio() > 80 ? "bad" : "warn"}>
          <div class="top-gauge-label">
            <Icon icon="lucide:landmark" size={15} />
            <span>Dư nợ</span>
          </div>
          <strong>
            <AnimatedNumber value={() => state().finance.debt} format={formatBillion} />
          </strong>
          <Bar value={debtRatio()} tone={debtRatio() > 80 ? "bad" : "warn"} label="Dư nợ" />
        </div>
        <div class="top-gauge" data-tone="green">
          <div class="top-gauge-label">
            <Icon icon="lucide:users" size={15} />
            <span>Hài lòng dân làng</span>
          </div>
          <strong>
            <AnimatedNumber value={() => state().metrics.satisfaction} format={formatPercent} />
          </strong>
          <Bar
            value={state().metrics.satisfaction}
            tone={state().metrics.satisfaction >= 55 ? "good" : "bad"}
            label="Hài lòng dân làng"
          />
        </div>
        <div class="top-gauge" data-tone="green">
          <div class="top-gauge-label">
            <Icon icon="lucide:shield" size={15} />
            <span>Tín nhiệm Chairman</span>
          </div>
          <strong>
            <AnimatedNumber value={() => state().metrics.trust} format={formatPercent} />
          </strong>
          <Bar
            value={state().metrics.trust}
            tone={state().metrics.trust >= 55 ? "good" : "bad"}
            label="Tín nhiệm Chairman"
          />
        </div>
      </div>

      <div class="top-actions">
        <Show when={state().events.activeId === null && state().ending === null}>
          <ActionButton
            class="advance-btn desktop-only"
            variant="secondary"
            icon={store.autoPlay() ? "lucide:pause" : "lucide:play"}
            onClick={() => store.setAutoPlay(!store.autoPlay())}
            ariaLabel={store.autoPlay() ? "Dừng tự động" : "Chạy tự động"}
          >
            {store.autoPlay() ? "Dừng tự động" : "Chạy tự động"}
          </ActionButton>
          <ActionButton
            class="advance-btn"
            variant="gold"
            icon="lucide:calendar"
            disabled={advance.isPending}
            onClick={runAdvance}
            ariaLabel="Kết thúc tháng"
          >
            Kết thúc tháng
          </ActionButton>
        </Show>
        <IconButton icon="lucide:book-open" label="Hướng dẫn" onClick={props.onOpenTutorial} />
        <IconButton icon="lucide:save" label="Kho lưu và cài đặt" onClick={props.onOpenMenu} />
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
