import type { JSX } from "@solidjs/web";
import { For, Show, createMemo, createSignal, createTrackedEffect, onCleanup } from "solid-js";
import {
  Dialog,
  DialogBackdrop,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@ui-sdk/solid/dialog";
import { useGame } from "../game-context";
import { quarterReport } from "~/state/selectors";
import { Badge, IconButton } from "../components/base";
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
    { label: "Nhập khẩu", value: row.importMillionKwh / total, color: "var(--ink-faint)" },
  ];
};

export const MonthlyReport = (): JSX.Element => {
  const { store } = useGame();
  const [visible, setVisible] = createSignal(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastTick = -1;

  createTrackedEffect(() => {
    const outcome = store.lastOutcome();
    const state = store.state();

    if (
      store.hold() ||
      state.events.activeId !== null ||
      state.approval !== null ||
      state.ending !== null
    ) {
      setVisible(false);

      return;
    }

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

  const blocked = (): boolean => {
    const state = store.state();

    return (
      store.hold() ||
      state.events.activeId !== null ||
      state.approval !== null ||
      state.ending !== null
    );
  };

  return (
    <Show when={visible() && ledger() !== undefined && !blocked()}>
      <aside
        class="monthly-toast"
        role="status"
        aria-live="polite"
        data-hold={store.hold() ? "true" : "false"}
        data-blocked={blocked() ? "true" : "false"}
      >
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
  let lastShown = -1;
  let wasRunning = false;
  const report = createMemo(() => quarterReport(store.state()));

  const mix = () => {
    const current = report();

    if (current === null) return [];

    const total = Math.max(
      1,
      current.hydroMillionKwh +
        current.thermalMillionKwh +
        current.renewableMillionKwh +
        current.importMillionKwh,
    );

    const items = [
      { label: "Thủy điện", value: current.hydroMillionKwh, color: "var(--cyan-soft)" },
      { label: "Nhiệt điện", value: current.thermalMillionKwh, color: "var(--amber)" },
      { label: "Tái tạo", value: current.renewableMillionKwh, color: "var(--lime)" },
      { label: "Nhập khẩu", value: current.importMillionKwh, color: "var(--ink-faint)" },
    ];

    const shares = items.map((item) => Math.round((item.value / total) * 100));
    const largest = shares.indexOf(Math.max(...shares));

    shares[largest] =
      (shares[largest] ?? 0) + (100 - shares.reduce((sum, share) => sum + share, 0));

    return items.flatMap((item, index) =>
      item.value > 0 ? [{ ...item, share: shares[index] ?? 0 }] : [],
    );
  };

  createTrackedEffect(() => {
    const outcome = store.lastOutcome();
    const state = store.state();

    if (outcome === null || state.ending !== null) return;

    if (state.clock.tick === lastShown) return;

    if (state.events.activeId !== null || state.approval !== null) return;
    const ledger = outcome.ledger;

    if (ledger.month % 3 !== 0) return;

    if (quarterReport(state) === null) return;
    lastShown = state.clock.tick;
    wasRunning = store.running();
    store.setHold(true);
    store.setRunning(false);
    setOpen(true);
  });

  const close = (): void => {
    setOpen(false);
    store.setHold(false);

    if (wasRunning) store.setRunning(true);
  };

  const energyDelta = () => {
    const current = report();

    if (
      current === null ||
      current.previousEnergyMillionKwh === null ||
      current.previousEnergyMillionKwh <= 0
    ) {
      return null;
    }

    return (
      ((current.energyMillionKwh - current.previousEnergyMillionKwh) /
        current.previousEnergyMillionKwh) *
      100
    );
  };

  const netDelta = () => {
    const current = report();

    if (current?.previousNetBillionVnd === null || current === null) return null;

    return current.netBillionVnd - current.previousNetBillionVnd;
  };

  const deltaClass = (value: number): string => (value >= 0 ? "text-green" : "text-rose");

  return (
    <Dialog open={open()} onOpenChange={(next) => (next ? undefined : close())}>
      <DialogBackdrop class="modal-backdrop" />
      <DialogContent
        class="modal summary-modal overscroll-contain focus-visible:outline-none"
        initialFocus="content"
      >
        <Show when={report()}>
          {(current) => (
            <div class="flex flex-col gap-6">
              <header class="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
                <div>
                  <p class="text-[11px] font-medium text-ink-faint">
                    {`Tổng kết quý ${current().quarter} · ${current().year}`}
                  </p>
                  <DialogTitle class="mt-1 text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink sm:text-[30px]">
                    {`Quý ${current().quarter} đã khép lại`}
                  </DialogTitle>
                  <DialogDescription class="mt-2 max-w-[52ch] text-sm leading-6 text-ink-soft">
                    {`Sổ tháng ${current().startMonth}–${current().endMonth}. Mô phỏng tạm dừng để bạn đọc kết quả trước khi sang quý mới.`}
                  </DialogDescription>
                </div>
                <span class="mt-1 inline-flex items-center gap-2 text-[11px] text-ink-faint">
                  <span class="h-2 w-2 rounded-full bg-green" aria-hidden="true" />
                  Đã chốt sổ
                </span>
              </header>

              <div class="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <section aria-labelledby="summary-energy">
                  <p id="summary-energy" class="text-[11px] font-medium text-ink-faint">
                    Điện thương phẩm · ba tháng
                  </p>
                  <div class="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <strong class="text-[32px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-ink">
                      {formatEnergy(current().energyMillionKwh)}
                    </strong>
                    <Show when={energyDelta()}>
                      {(delta) => (
                        <span class={`text-xs tabular-nums ${deltaClass(delta())}`}>
                          {`${delta() >= 0 ? "+" : ""}${delta().toFixed(1)}% so với quý trước`}
                        </span>
                      )}
                    </Show>
                  </div>

                  <div
                    class="mt-5 flex h-3 overflow-hidden rounded-full bg-panel-2"
                    role="img"
                    aria-label="Cơ cấu nguồn điện của quý"
                  >
                    <For each={mix()}>
                      {(item) => (
                        <span
                          style={{
                            width: `${item.share}%`,
                            background: item.color,
                          }}
                          title={`${item.label}: ${item.share}%`}
                        />
                      )}
                    </For>
                  </div>

                  <div class="mt-3 grid grid-cols-2 gap-x-5 gap-y-2 text-xs">
                    <For each={mix()}>
                      {(item) => (
                        <span class="flex items-center justify-between gap-2 text-ink-soft">
                          <span class="inline-flex items-center gap-2">
                            <span
                              class="h-2 w-2 rounded-sm"
                              style={{ background: item.color }}
                              aria-hidden="true"
                            />
                            {item.label}
                          </span>
                          <strong class="font-medium tabular-nums text-ink">
                            {`${item.share}%`}
                          </strong>
                        </span>
                      )}
                    </For>
                  </div>

                  <dl class="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4">
                    <div>
                      <dt class="text-[11px] text-ink-faint">Giá bán bình quân</dt>
                      <dd class="mt-1 text-sm font-medium tabular-nums text-ink">
                        {formatPrice(current().averageRetailTariffVndPerKwh)}
                      </dd>
                    </div>
                    <div>
                      <dt class="text-[11px] text-ink-faint">Chi phí cung ứng</dt>
                      <dd class="mt-1 text-sm font-medium tabular-nums text-ink">
                        {formatPrice(
                          (current().costSupplyBillionVnd * 1_000) /
                            Math.max(1, current().energyMillionKwh),
                        )}
                      </dd>
                    </div>
                  </dl>

                  <div class="mt-5 border-t border-line pt-4" aria-labelledby="summary-trust">
                    <p id="summary-trust" class="text-[11px] font-medium text-ink-faint">
                      Niềm tin cuối quý
                    </p>
                    <div class="mt-3 grid grid-cols-2 gap-4">
                      <div>
                        <div class="flex items-baseline justify-between gap-3 text-xs">
                          <span class="text-ink-soft">Người dân</span>
                          <strong class="font-medium tabular-nums text-ink">
                            {formatPercent(current().citizenTrust)}
                          </strong>
                        </div>
                        <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-panel-2">
                          <div
                            class={`h-full rounded-full ${
                              current().citizenTrust >= 45 ? "bg-green" : "bg-rose"
                            }`}
                            style={{ width: `${current().citizenTrust}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div class="flex items-baseline justify-between gap-3 text-xs">
                          <span class="text-ink-soft">Thể chế</span>
                          <strong class="font-medium tabular-nums text-ink">
                            {formatPercent(current().institutionalTrust)}
                          </strong>
                        </div>
                        <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-panel-2">
                          <div
                            class={`h-full rounded-full ${
                              current().institutionalTrust >= 45 ? "bg-green" : "bg-rose"
                            }`}
                            style={{ width: `${current().institutionalTrust}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section aria-labelledby="summary-ledger">
                  <p id="summary-ledger" class="text-[11px] font-medium text-ink-faint">
                    Sổ kết quả
                  </p>
                  <dl class="mt-2 divide-y divide-line border-y border-line text-sm">
                    <div class="flex items-baseline justify-between gap-4 py-2.5">
                      <dt class="font-medium text-ink">Kết quả quý</dt>
                      <dd
                        class={`font-medium tabular-nums ${
                          current().netBillionVnd >= 0 ? "text-green" : "text-rose"
                        }`}
                      >
                        {formatSignedBillion(current().netBillionVnd)}
                      </dd>
                    </div>
                    <div class="flex items-baseline justify-between gap-4 py-2.5">
                      <dt class="text-ink-soft">Doanh thu</dt>
                      <dd class="tabular-nums text-ink">
                        {formatBillion(current().revenueBillionVnd)}
                      </dd>
                    </div>
                    <div class="flex items-baseline justify-between gap-4 py-2.5">
                      <dt class="text-ink-soft">Tổng chi phí cung ứng</dt>
                      <dd class="tabular-nums text-ink">
                        {formatBillion(current().costSupplyBillionVnd)}
                      </dd>
                    </div>
                    <div class="flex items-baseline justify-between gap-4 py-2.5">
                      <dt class="text-ink-soft">Tổng chi phí quản lý</dt>
                      <dd class="tabular-nums text-ink">
                        {formatBillion(current().costManagementBillionVnd)}
                      </dd>
                    </div>
                    <Show when={netDelta()}>
                      {(delta) => (
                        <div class="flex items-baseline justify-between gap-4 py-2.5">
                          <dt class="text-ink-soft">So với quý trước</dt>
                          <dd class={`tabular-nums ${deltaClass(delta())}`}>
                            {formatSignedBillion(delta())}
                          </dd>
                        </div>
                      )}
                    </Show>
                  </dl>
                  <dl class="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <dt class="text-[11px] text-ink-faint">Dư nợ cuối quý</dt>
                      <dd class="mt-1 text-sm font-medium tabular-nums text-ink">
                        {formatBillion(current().debtBillionVnd)}
                      </dd>
                    </div>
                    <div>
                      <dt class="text-[11px] text-ink-faint">Lỗ lũy kế</dt>
                      <dd class="mt-1 text-sm font-medium tabular-nums text-ink">
                        {formatBillion(current().accumulatedLossBillionVnd)}
                      </dd>
                    </div>
                  </dl>
                </section>
              </div>

              <footer class="sticky bottom-0 z-10 -mx-[18px] -mb-[18px] flex flex-col gap-3 border-t border-line bg-panel px-[18px] pb-[18px] pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p class="text-xs text-ink-faint">{`Kỳ tiếp theo giữ tốc độ ${store.speed()}×.`}</p>
                <button
                  type="button"
                  class="inline-flex min-h-11 items-center justify-center rounded-lg bg-electric px-5 text-sm font-semibold text-bg transition-colors hover:bg-electric-soft"
                  onClick={close}
                >
                  Tiếp tục điều hành
                </button>
              </footer>
            </div>
          )}
        </Show>
      </DialogContent>
    </Dialog>
  );
};
