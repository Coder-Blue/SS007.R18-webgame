import type { JSX } from "@solidjs/web";
import { Show } from "solid-js";
import { useGame } from "../game-context";
import { ActionButton, Badge, Divider, Stat } from "../components/base";
import { Icon } from "../components/icons";
import { formatBillion, formatPercent } from "~/state/format";
import { ARCHITECT_DEBT_MAX, type EndingId, type EndingReason } from "~/domain";

const endingCopy = (id: EndingId): string => {
  if (id === "architect") {
    return "Bạn giữ được mạng đường chung, phủ tới từng bản xa, đưa lỗ N-2 trở lại trần giá mà không gây sốc, và biến công ty thành trụ cột của một nền kinh tế làng hiện đại. Chairman ghi nhận bạn là người xây nền an ninh quốc gia từ hạ tầng.";
  }

  if (id === "predator") {
    return "Ngân quỹ phình ra nhờ giá cao và những thỏa thuận mờ ám. Xưởng vẫn chạy, nhưng hộ nghèo và bản xa ngày càng tụt lại. Bạn thắng về tiền, thua về chính danh.";
  }

  return "Không thể vừa mua đắt, vừa bán dưới trần, vừa giữ lòng dân. Hệ thống mất cân bằng và Chairman buộc phải cách chức bạn để ổn định làng.";
};

const endingTitle = (id: EndingId): string => {
  if (id === "architect") return "Kiến Trúc Sư An Ninh Quốc Gia";

  if (id === "predator") return "Tư Bản Đỏ Độc Quyền";

  return "Vỡ Trận Thị Trường";
};

const gradeLabel = (id: EndingId): string => {
  if (id === "architect") return "Xuất sắc";

  if (id === "predator") return "Tiêu cực";

  return "Thất bại";
};

const reasonText = (reason: EndingReason): string => {
  switch (reason) {
    case "debt":
      return "Dư nợ vượt trần cho phép.";
    case "unrest":
      return "Bất ổn lan rộng, dân làng nổi giận.";
    case "deposed":
      return "Tín nhiệm của Chairman về 0.";
    case "privatization":
      return "Tư nhân hóa sớm chia cắt mạng đường và làm sụp hệ thống.";
    case "california":
      return "Mô phỏng California 2001 kết thúc bằng vỡ thị trường.";
    case "texas":
      return "Mô phỏng Texas 2021 kết thúc bằng khủng hoảng mùa đông.";
    case "final":
      return "Nhiệm kỳ kết thúc mà chưa đạt mục tiêu phục hồi.";
  }
};

const download = (content: string): void => {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `doc-quyen-kinh-te-${Date.now()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const EndingScreen = (): JSX.Element => {
  const { store, actions } = useGame();
  const state = store.state;

  return (
    <Show when={state().ending}>
      {(ending) => (
        <div
          class="ending-screen"
          role="dialog"
          aria-modal="true"
          aria-label={endingTitle(ending().id)}
        >
          <div class="ending-glow" />
          <div class="ending-card">
            <div class="ending-head">
              <Badge
                tone={
                  ending().id === "architect" ? "good" : ending().id === "predator" ? "gold" : "bad"
                }
              >
                Kết thúc · {gradeLabel(ending().id)}
              </Badge>
              <span class="ending-date">
                {ending().month}/{ending().year}
              </span>
            </div>
            <h1>{endingTitle(ending().id)}</h1>
            <p class="ending-body">{endingCopy(ending().id)}</p>
            <p class="ending-reason">{reasonText(ending().reason)}</p>
            <Divider />
            <div class="stat-grid">
              <Stat
                label="Dư nợ cuối kỳ"
                value={formatBillion(state().finance.debt)}
                tone={state().finance.debt <= ARCHITECT_DEBT_MAX ? "good" : "bad"}
                icon="lucide:landmark"
              />
              <Stat
                label="Ngân quỹ cuối kỳ"
                value={formatBillion(state().finance.cash)}
                tone="gold"
                icon="lucide:wallet"
              />
              <Stat
                label="Bao phủ cuối kỳ"
                value={formatPercent(state().infrastructure.coverage)}
                tone={state().infrastructure.coverage >= 100 ? "good" : "warn"}
                icon="lucide:road"
              />
              <Stat
                label="Tín nhiệm cuối kỳ"
                value={formatPercent(state().metrics.trust)}
                tone={state().metrics.trust >= 55 ? "good" : "bad"}
                icon="lucide:shield"
              />
              <Stat
                label="Hài lòng cuối kỳ"
                value={formatPercent(state().metrics.satisfaction)}
                tone={state().metrics.satisfaction >= 55 ? "good" : "bad"}
                icon="lucide:users"
              />
              <Stat
                label="Lạm phát"
                value={formatPercent(state().metrics.inflation)}
                tone={state().metrics.inflation <= 8 ? "good" : "bad"}
                icon="lucide:trending-up"
              />
            </div>
            <div class="ending-actions">
              <ActionButton variant="gold" icon="lucide:play" onClick={() => actions.newGame()}>
                Chơi lại từ đầu
              </ActionButton>
              <ActionButton
                variant="secondary"
                icon="lucide:download"
                onClick={() => download(actions.exportJson())}
              >
                Xuất dữ liệu ván chơi
              </ActionButton>
            </div>
            <p class="modal-hint">
              <Icon icon="lucide:info" size={14} /> Tổng kết nhiệm kỳ
            </p>
          </div>
        </div>
      )}
    </Show>
  );
};
