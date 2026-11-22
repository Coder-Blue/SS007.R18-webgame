import type { JSX } from "@solidjs/web";
import { For, Show } from "solid-js";
import { useGame } from "../game-context";
import { useAdvanceMonth, useAutoPlay } from "~/state/queries";
import { ActionButton, Badge, Bar, IconButton } from "../components/base";
import { AnimatedNumber } from "../components/animated-number";
import { Icon } from "../components/icons";
import { formatBillion, formatDate, formatPercent, seasonLabel } from "~/state/format";
import { seasonOf } from "~/domain";
import type { GameSpeed } from "~/state/persistence";

const speeds: readonly GameSpeed[] = [1, 2, 3];

export const TopBar = (props: {
  readonly onOpenMenu: () => void;
  readonly onOpenTutorial: () => void;
}): JSX.Element => {
  const { store } = useGame();
  const state = store.state;
  const advance = useAdvanceMonth(store);
  const runAdvance = () => advance.mutate();
  useAutoPlay(store, runAdvance);
  const debtRatio = () => (state().finance.debt / state().finance.debtLimit) * 100;
  const paused = () => !store.running();

  return (
    <header class="top-bar" data-paused={paused() ? "true" : "false"}>
      <div class="brand-block">
        <div class="brand-mark">
          <Icon icon="tabler:bolt" size={22} />
        </div>
        <div class="brand-copy">
          <strong>Điều Hành Lưới Điện Quốc Gia</strong>
          <span>National Grid Command</span>
        </div>
      </div>

      <div class="date-block">
        <span class="date-main">{formatDate(state().clock.year, state().clock.month)}</span>
        <span class="date-sub">
          {`Mùa ${seasonLabel(seasonOf(state().clock.month))}`} · {`Chặng ${state().act}/4`}
        </span>
      </div>

      <div class="top-gauges desktop-only">
        <div class="top-gauge" data-tone="gold" data-tutorial="cash">
          <div class="top-gauge-label">
            <Icon icon="lucide:wallet" size={15} />
            <span>Ngân quỹ</span>
          </div>
          <strong>
            <AnimatedNumber value={() => state().finance.cash} format={formatBillion} />
          </strong>
          <Bar
            value={Math.max(0, Math.min(100, (state().finance.cash / 20_000) * 100))}
            tone="gold"
            label="Ngân quỹ"
          />
        </div>
        <div class="top-gauge" data-tone={debtRatio() > 80 ? "bad" : "warn"}>
          <div class="top-gauge-label">
            <Icon icon="tabler:building-bank" size={15} />
            <span>Nợ / 100.000 tỷ</span>
          </div>
          <strong>
            <AnimatedNumber value={() => state().finance.debt} format={formatBillion} />
          </strong>
          <Bar value={debtRatio()} tone={debtRatio() > 80 ? "bad" : "warn"} label="Dư nợ" />
        </div>
        <div class="top-gauge" data-tone="electric" data-tutorial="trust">
          <div class="top-gauge-label">
            <Icon icon="tabler:users" size={15} />
            <span>Niềm tin người dân</span>
          </div>
          <strong>
            <AnimatedNumber value={() => state().metrics.citizenTrust} format={formatPercent} />
          </strong>
          <Bar
            value={state().metrics.citizenTrust}
            tone={state().metrics.citizenTrust >= 45 ? "electric" : "bad"}
            label="Niềm tin người dân"
            pulse={state().media.activeMonths > 0}
          />
        </div>
        <div class="top-gauge" data-tone="green">
          <div class="top-gauge-label">
            <Icon icon="tabler:shield-check" size={15} />
            <span>Tín nhiệm thể chế</span>
          </div>
          <strong>
            <AnimatedNumber
              value={() => state().metrics.institutionalTrust}
              format={formatPercent}
            />
          </strong>
          <Bar
            value={state().metrics.institutionalTrust}
            tone={state().metrics.institutionalTrust >= 45 ? "green" : "bad"}
            label="Tín nhiệm thể chế"
          />
        </div>
        <div class="top-gauge" data-tone="warn" data-tutorial="reserve">
          <div class="top-gauge-label">
            <Icon icon="lucide:activity" size={15} />
            <span>Dự phòng</span>
          </div>
          <strong>
            <AnimatedNumber value={() => state().metrics.reserveMargin} format={formatPercent} />
          </strong>
          <Bar
            value={Math.max(0, state().metrics.reserveMargin)}
            max={50}
            tone={state().metrics.reserveMargin >= 15 ? "green" : "bad"}
            label="Biên dự phòng"
          />
        </div>
      </div>

      <div class="top-actions" data-tutorial="pause">
        <button
          type="button"
          class="pause-btn"
          data-running={store.running() ? "true" : "false"}
          onClick={store.togglePause}
          aria-label={store.running() ? "Tạm dừng mô phỏng" : "Tiếp tục mô phỏng"}
          aria-pressed={paused() ? "true" : "false"}
          disabled={state().ending !== null}
        >
          <Icon icon={store.running() ? "lucide:pause" : "lucide:play"} size={19} />
          <span>{store.running() ? "Tạm dừng" : "Tiếp tục"}</span>
        </button>
        <div class="speed-group" role="group" aria-label="Tốc độ mô phỏng">
          <For each={speeds}>
            {(speed) => (
              <button
                type="button"
                class="speed-btn"
                data-active={store.speed() === speed ? "true" : "false"}
                aria-pressed={store.speed() === speed ? "true" : "false"}
                aria-label={`Tốc độ ${speed} lần`}
                onClick={() => store.setSpeed(speed)}
              >
                {speed}x
              </button>
            )}
          </For>
        </div>
        <Show when={state().media.activeMonths > 0}>
          <Badge tone="bad" pulse class="media-badge">
            <Icon icon="tabler:speakerphone" size={14} />
            Truyền thông lỗ EVN
          </Badge>
        </Show>
        <IconButton
          icon="lucide:book-open"
          label="Hướng dẫn nhập cuộc"
          onClick={props.onOpenTutorial}
        />
        <IconButton icon="lucide:save" label="Kho lưu và cài đặt" onClick={props.onOpenMenu} />
      </div>

      <div class="mobile-status">
        <span class="mobile-date">{formatDate(state().clock.year, state().clock.month)}</span>
        <span>
          <Icon icon="lucide:wallet" size={14} /> {formatBillion(state().finance.cash)}
        </span>
        <span>
          <Icon icon="tabler:users" size={14} /> {formatPercent(state().metrics.citizenTrust)}
        </span>
        <span>
          <Icon icon="tabler:shield-check" size={14} />{" "}
          {formatPercent(state().metrics.institutionalTrust)}
        </span>
        <ActionButton
          size="sm"
          variant={paused() ? "primary" : "ghost"}
          icon={paused() ? "lucide:play" : "lucide:pause"}
          onClick={store.togglePause}
          ariaLabel={paused() ? "Tiếp tục" : "Tạm dừng"}
        >
          {paused() ? store.speed() + "x" : "Tạm dừng"}
        </ActionButton>
      </div>
    </header>
  );
};
