import type { JSX } from "@solidjs/web";
import { Show, createSignal, createTrackedEffect, onCleanup } from "solid-js";
import {
  Dialog,
  DialogBackdrop,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@ui-sdk/solid/dialog";
import { useGame } from "../game-context";
import { ActionButton, Badge, Bar, IconButton, Stat } from "../components/base";
import { Icon } from "../components/icons";
import { formatBillion, formatPercent, formatPrice, formatSignedBillion } from "~/state/format";
import { tariffPreview } from "~/domain";
import type { ApprovalResult } from "~/state/game-store";

export const ApprovalModal = (): JSX.Element => {
  const { store } = useGame();
  const [result, setResult] = createSignal<ApprovalResult | null>(null);
  const approval = () => store.state().approval;
  const open = () => approval() !== null || result() !== null;

  createTrackedEffect(() => {
    store.setHold(open());
  });

  onCleanup(() => store.setHold(false));

  const preview = () => {
    const request = approval();

    if (request === null) return null;

    return tariffPreview(store.state(), request.proposedTiers, request.proposedIndustrial);
  };

  const submit = (): void => {
    const next = store.submitApproval();

    if (next) setResult(store.lastApproval());
  };

  const close = (): void => {
    if (approval() !== null) store.cancelApproval();
    store.clearApprovalResult();
    setResult(null);
  };

  return (
    <Dialog open={open()} onOpenChange={(next) => (next ? undefined : close())}>
      <DialogBackdrop class="modal-backdrop" />
      <DialogContent class="modal approval-modal">
        <div class="event-head">
          <Badge tone="warn" pulse>
            <Icon icon="tabler:building-bank" size={14} />
            Nhà nước thẩm định
          </Badge>
          <DialogTitle class="modal-title">Trình phương án điều chỉnh giá điện</DialogTitle>
          <DialogDescription class="modal-desc">
            Mức tăng vượt 5% phải được Nhà nước chấp thuận. Cơ quan thẩm định tự đối chiếu chi phí
            đầu vào, lỗ lũy kế, lạm phát và niềm tin dân.
          </DialogDescription>
        </div>

        <Show
          when={result() === null}
          fallback={
            <div class="approval-result" data-result={result() ?? "refused"}>
              <Icon
                icon={result() === "approved" ? "lucide:circle-check" : "lucide:circle-x"}
                size={28}
              />
              <div>
                <strong>{result() === "approved" ? "Nhà nước đồng ý" : "Nhà nước từ chối"}</strong>
                <p>
                  {result() === "approved"
                    ? "Phương án được ban hành. Doanh thu tăng nhưng áp lực lạm phát và niềm tin dân sẽ phản ánh trong các tháng tới."
                    : "Phương án bị bác bỏ. Tín nhiệm thể chế giảm và biểu giá cũ được giữ nguyên."}
                </p>
              </div>
            </div>
          }
        >
          <Show when={approval() !== null && preview() !== null}>
            <>
              <div class="stat-grid">
                <Stat
                  label="Mức tăng"
                  value={formatPercent(approval()?.changePct ?? 0)}
                  tone="warn"
                  icon="lucide:trending-up"
                />
                <Stat
                  label="Giá bình quân mới"
                  value={formatPrice(approval()?.average ?? 0)}
                  hint={`Hiện tại ${formatPrice(preview()?.before.averageTariff ?? 0)}`}
                  icon="tabler:cash-banknote"
                />
                <Stat
                  label="Lãi/lỗ tháng"
                  value={formatSignedBillion(preview()?.after.netResult ?? 0)}
                  hint={`Hiện tại ${formatSignedBillion(preview()?.before.netResult ?? 0)}`}
                  tone={(preview()?.after.netResult ?? 0) >= 0 ? "good" : "bad"}
                  icon="tabler:report-money"
                />
                <Stat
                  label="Khả năng chấp thuận"
                  value={formatPercent(approval()?.likelihood ?? 0)}
                  tone={(approval()?.likelihood ?? 0) >= 55 ? "good" : "bad"}
                  icon="tabler:shield-check"
                />
              </div>
              <div class="approval-audit">
                <div class="audit-row">
                  <span>Áp lực nhiên liệu</span>
                  <strong>{formatPercent((store.state().market.fuelPriceIndex - 1) * 100)}</strong>
                </div>
                <div class="audit-row">
                  <span>Lỗ lũy kế</span>
                  <strong>{formatBillion(store.state().finance.accumulatedLoss)}</strong>
                </div>
                <div class="audit-row">
                  <span>Lạm phát</span>
                  <strong>{formatPercent(store.state().metrics.inflation)}</strong>
                </div>
                <div class="audit-row">
                  <span>Kiến nghị chính sách</span>
                  <strong>{store.state().policy.petitionDone ? "Đã có" : "Chưa có"}</strong>
                </div>
              </div>
              <Bar
                value={approval()?.likelihood ?? 0}
                tone={(approval()?.likelihood ?? 0) >= 55 ? "good" : "bad"}
                label="Khả năng chấp thuận"
              />
              <div class="action-row">
                <ActionButton variant="primary" icon="tabler:building-bank" onClick={submit}>
                  Trình Nhà nước
                </ActionButton>
                <ActionButton variant="ghost" icon="lucide:x" onClick={close}>
                  Rút hồ sơ
                </ActionButton>
              </div>
              <p class="modal-footnote">
                <Icon icon="tabler:clock-pause" size={14} />
                Mô phỏng tạm dừng cho đến khi hồ sơ được xử lý.
              </p>
            </>
          </Show>
        </Show>
        <Show when={result() !== null}>
          <div class="action-row">
            <IconButton icon="lucide:x" label="Đóng" onClick={close} />
          </div>
        </Show>
      </DialogContent>
    </Dialog>
  );
};
