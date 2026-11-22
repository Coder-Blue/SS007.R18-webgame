import type { JSX } from "@solidjs/web";
import { For, Show, createSignal, createTrackedEffect, onCleanup } from "solid-js";
import {
  Dialog,
  DialogBackdrop,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@ui-sdk/solid/dialog";
import { useGame } from "../game-context";
import { Badge, Bar, IconButton, Stat } from "../components/base";
import { Icon } from "../components/icons";
import {
  formatBillion,
  formatEnergy,
  formatPercent,
  formatPrice,
  formatSignedBillion,
} from "~/state/format";

const mixRows = (row: {
  hydroMillionKwh: number;
  thermalMillionKwh: number;
  renewableMillionKwh: number;
  importMillionKwh: number;
}) => {
  const total = Math.max(
    1,
    row.hydroMillionKwh + row.thermalMillionKwh + row.renewableMillionKwh + row.importMillionKwh,
  );

  return [
    { label: "Thủy điện", value: row.hydroMillionKwh / total, color: "var(--cyan-soft)" },
    { label: "Nhiệt điện", value: row.thermalMillionKwh / total, color: "var(--amber)" },
    { label: "Tái tạo", value: row.renewableMillionKwh / total, color: "var(--lime)" },
    { label: "Nhập khẩu", value: row.importMillionKwh / total, color: "var(--electric)" },
  ];
};

export const MonthlyReport = (): JSX.Element => {
  const { store } = useGame();
  const [visible, setVisible] = createSignal(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastTick = -1;

  createTrackedEffect(() => {
    const outcome = store.lastOutcome();

    if (outcome === null || outcome.ledger.tick === lastTick) return;
    lastTick = outcome.ledger.tick;
    setVisible(true);

    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => setVisible(false), 7_000);
  });

  onCleanup(() => {
    if (timer !== undefined) clearTimeout(timer);
  });

  const ledger = () => store.lastOutcome()?.ledger;

  return (
    <Show when={visible() && ledger() !== undefined}>
      <aside class="monthly-toast" role="status" aria-live="polite">
        <div class="monthly-head">
          <div>
            <p class="eyebrow">Báo cáo tháng</p>
            <strong>{`T${ledger()?.month}/${ledger()?.year}`}</strong>
          </div>
          <IconButton
            icon="lucide:x"
            label="Đóng báo cáo tháng"
            onClick={() => setVisible(false)}
          />
        </div>
        <div class="monthly-grid">
          <span>
            <Icon icon="tabler:bolt" size={14} />
            {formatEnergy(ledger()?.energySoldMillionKwh ?? 0)}
          </span>
          <span>
            <Icon icon="tabler:cash-banknote" size={14} />
            {formatPrice(ledger()?.averageRetailTariff ?? 0)}
          </span>
          <span data-tone={(ledger()?.netResult ?? 0) >= 0 ? "good" : "bad"}>
            <Icon icon="lucide:trending-down" size={14} />
            {formatSignedBillion(ledger()?.netResult ?? 0)}
          </span>
          <span>
            <Icon icon="tabler:tools" size={14} />
            {formatPrice(
              ((ledger()?.costSupply ?? 0) * 1_000) /
                Math.max(1, ledger()?.energySoldMillionKwh ?? 1),
            )}
          </span>
          <span>
            <Icon icon="tabler:building-bank" size={14} />
            {formatBillion(ledger()?.debt ?? 0)}
          </span>
        </div>
        <div class="mix-bar compact">
          <For each={ledger() === undefined ? [] : mixRows(ledger()!)}>
            {(row) => (
              <span
                class="mix-segment"
                style={{ width: `${row.value * 100}%`, background: row.color }}
                title={`${row.label}: ${Math.round(row.value * 100)}%`}
              />
            )}
          </For>
        </div>
        <Show when={ledger()?.mediaActive === true}>
          <Badge tone="bad" pulse>
            <Icon icon="tabler:speakerphone" size={14} />
            Niềm tin dân giảm nhanh do báo chí
          </Badge>
        </Show>
      </aside>
    </Show>
  );
};

export const SummaryModal = (): JSX.Element => {
  const { store } = useGame();
  const [open, setOpen] = createSignal(false);
  const [annual, setAnnual] = createSignal(false);
  let lastShown = store.state().clock.tick;
  let wasRunning = false;

  createTrackedEffect(() => {
    const outcome = store.lastOutcome();
    const state = store.state();

    if (outcome === null || state.ending !== null) return;

    if (state.clock.tick === lastShown) return;

    if (state.events.activeId !== null || state.approval !== null) return;
    const ledger = outcome.ledger;

    if (ledger.month % 3 !== 0) return;
    lastShown = state.clock.tick;
    wasRunning = store.running();
    store.setRunning(false);
    setAnnual(ledger.month === 12);
    setOpen(true);
  });

  const close = (): void => {
    setOpen(false);

    if (wasRunning) store.setRunning(true);
  };

  const ledger = () => store.lastOutcome()?.ledger;

  return (
    <Dialog open={open()} onOpenChange={(next) => (next ? undefined : close())}>
      <DialogBackdrop class="modal-backdrop" />
      <DialogContent class="modal summary-modal">
        <div class="event-head">
          <Badge tone={annual() ? "gold" : "electric"} pulse={annual()}>
            <Icon icon={annual() ? "tabler:file-analytics" : "tabler:chart-bar"} size={14} />
            {annual() ? "Tổng kết năm" : "Tổng kết quý"}
          </Badge>
          <DialogTitle class="modal-title">
            {annual()
              ? `Năm ${store.state().clock.year}`
              : `Quý ${Math.ceil((ledger()?.month ?? 1) / 3)}/${store.state().clock.year}`}
          </DialogTitle>
          <DialogDescription class="modal-desc">
            Mô phỏng tạm dừng để bạn đọc báo cáo. Bấm tiếp tục để giữ tốc độ trước đó.
          </DialogDescription>
        </div>
        <Show when={ledger() !== undefined}>
          <div class="stat-grid">
            <Stat
              label="Điện thương phẩm"
              value={formatEnergy(ledger()?.energySoldMillionKwh ?? 0)}
              icon="tabler:bolt"
            />
            <Stat
              label="Giá bán bình quân"
              value={formatPrice(ledger()?.averageRetailTariff ?? 0)}
              hint={`Chi phí cung ứng ${formatPrice(((ledger()?.costSupply ?? 0) * 1000) / Math.max(1, ledger()?.energySoldMillionKwh ?? 1))}`}
              tone="gold"
              icon="tabler:cash-banknote"
            />
            <Stat
              label="Kết quả tháng"
              value={formatSignedBillion(ledger()?.netResult ?? 0)}
              tone={(ledger()?.netResult ?? 0) >= 0 ? "good" : "bad"}
              icon="tabler:report-money"
            />
            <Stat
              label="Nợ và lỗ lũy kế"
              value={formatBillion(ledger()?.debt ?? 0)}
              hint={`Lỗ lũy kế ${formatBillion(ledger()?.accumulatedLoss ?? 0)}`}
              tone={(ledger()?.debt ?? 0) > 80_000 ? "bad" : "warn"}
              icon="tabler:building-bank"
            />
          </div>
          <div class="summary-mix">
            <div class="mix-bar">
              <For each={ledger() === undefined ? [] : mixRows(ledger()!)}>
                {(row) => (
                  <span
                    class="mix-segment"
                    style={{ width: `${row.value * 100}%`, background: row.color }}
                    title={`${row.label}: ${Math.round(row.value * 100)}%`}
                  />
                )}
              </For>
            </div>
            <div class="mix-legend">
              <For each={ledger() === undefined ? [] : mixRows(ledger()!)}>
                {(row) => (
                  <span class="mix-item">
                    <span class="chart-swatch" style={{ background: row.color }} />
                    {row.label}
                    <strong>{Math.round(row.value * 100)}%</strong>
                  </span>
                )}
              </For>
            </div>
          </div>
          <div class="summary-trust">
            <span>
              Niềm tin dân <strong>{formatPercent(ledger()?.citizenTrust ?? 0)}</strong>
            </span>
            <Bar
              value={ledger()?.citizenTrust ?? 0}
              tone={(ledger()?.citizenTrust ?? 0) >= 45 ? "good" : "bad"}
              label="Niềm tin dân"
            />
            <span>
              Tín nhiệm thể chế <strong>{formatPercent(ledger()?.institutionalTrust ?? 0)}</strong>
            </span>
            <Bar
              value={ledger()?.institutionalTrust ?? 0}
              tone={(ledger()?.institutionalTrust ?? 0) >= 45 ? "good" : "bad"}
              label="Tín nhiệm thể chế"
            />
          </div>
        </Show>
        <div class="action-row">
          <button type="button" class="btn" data-variant="primary" onClick={close}>
            <Icon icon="lucide:play" size={18} />
            <span>Tiếp tục</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
