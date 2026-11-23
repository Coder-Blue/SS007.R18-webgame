import type { JSX } from "@solidjs/web";
import { For, Show } from "solid-js";
import { useGame } from "../game-context";
import { ActionButton, Badge, Panel, Stat } from "../components/base";
import { Icon } from "../components/icons";
import { formatBillion, formatPercent } from "~/state/format";
import { missionStatus, type EndingReason } from "~/domain";

const reasonCopy: Readonly<
  Record<EndingReason, { readonly title: string; readonly body: string }>
> = {
  "citizen-trust": {
    title: "Biểu tình và mất niềm tin",
    body: "Niềm tin người dân về 0%. Cắt điện luân phiên và hóa đơn không đủ khả năng chi trả đã biến bất mãn thành bất ổn toàn quốc. Chủ tịch đình chỉ nhiệm kỳ.",
  },
  "institutional-trust": {
    title: "Bị cách chức",
    body: "Tín nhiệm thể chế về 0%. Những khoản lỗ, nợ và scandal điều hành đã bào mòn hoàn toàn sự tín nhiệm của Chủ tịch và Quốc hội.",
  },
  debt: {
    title: "Vỡ nợ",
    body: "Dư nợ vượt 100.000 tỷ đồng. Tập đoàn mất khả năng thanh toán, các chủ nợ siết tài sản và lưới điện rơi vào trạng thái khẩn cấp.",
  },
  privatization: {
    title: "Lưới điện phân mảnh",
    body: "Nhánh tư nhân hóa không có cơ chế điều tiết. Các đường dây trùng lặp, giá điện tăng vọt và vùng khó bị cắt điện. An ninh năng lượng quốc gia bị đe dọa.",
  },
  blackout: {
    title: "Sụp đổ hệ thống điện",
    body: "Độ tin cậy lưới xuống dưới ngưỡng vận hành. Sự cố dây chuyền làm mất điện trên diện rộng, không thể phục hồi trong nhiệm kỳ.",
  },
  final: {
    title: "Hoàn tất nhiệm kỳ",
    body: "Năm năm điều hành khép lại. Bạn đã giữ được lưới điện vận hành và để lại một hồ sơ cải cách cho giai đoạn phục hồi sau năm 5.",
  },
};

const endingTitle = (id: string, reason: EndingReason): string => {
  if (id === "reformer") return "Nhà cải cách lưới điện";

  if (id === "caretaker") return "Người giữ lưới";

  if (id === "captured") return "Tập đoàn bị chi phối";

  if (reason === "citizen-trust") return "Bị cách chức vì bất ổn";

  if (reason === "institutional-trust") return "Bị cách chức";

  if (reason === "debt") return "Vỡ nợ";

  if (reason === "privatization") return "Lưới điện phân mảnh";

  if (reason === "blackout") return "Sụp đổ hệ thống điện";

  return "Nhiệm kỳ khép lại";
};

const finalCopy = {
  reformer: {
    title: "Hoàn tất nhiệm kỳ cải cách",
    body: "Bạn giữ được lưới vận hành, phủ điện toàn quốc và để lại bộ khung N-2, DPPA, VREM cho giai đoạn phục hồi sau năm 5. Khoản lỗ cấu trúc vẫn còn, nhưng đã có đường trả.",
  },
  caretaker: {
    title: "Nhiệm kỳ khép lại trong giới hạn",
    body: "Bạn giữ được dòng tiền và lưới không sụp, nhưng chưa hoàn tất bộ cải cách. Nhiệm kỳ kết thúc với dư địa phục hồi hẹp hơn.",
  },
  captured: {
    title: "Tập đoàn bị chi phối",
    body: "Ngân quỹ được bảo vệ nhưng người dân bị bỏ lại phía sau. Giá điện, cắt điện và lợi ích nhóm đã chi phối quyết định cuối nhiệm kỳ.",
  },
} as const;

export const EndingScreen = (props: { readonly onNewGame: () => void }): JSX.Element => {
  const { store } = useGame();
  const state = store.state;
  const ending = () => state().ending;

  const copy = () => {
    const current = ending();

    if (current === null) return reasonCopy.final;

    if (current.reason !== "final") return reasonCopy[current.reason];

    if (current.id === "reformer") return finalCopy.reformer;

    if (current.id === "caretaker") return finalCopy.caretaker;

    if (current.id === "captured") return finalCopy.captured;

    return reasonCopy.final;
  };

  const isBad = () => ending()?.id === "collapse" || ending()?.id === "captured";

  return (
    <Show when={ending() !== null}>
      <div
        class="ending-overlay"
        data-tone={isBad() ? "bad" : "good"}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ending-title"
      >
        <div class="ending-panel">
          <div class="ending-head">
            <Badge tone={isBad() ? "bad" : "good"} pulse={isBad()}>
              <Icon icon={isBad() ? "tabler:alert-triangle" : "tabler:shield-check"} size={14} />
              {isBad() ? "Kết thúc thất bại" : "Kết thúc nhiệm kỳ"}
            </Badge>
            <h2 id="ending-title">
              {endingTitle(ending()?.id ?? "caretaker", ending()?.reason ?? "final")}
            </h2>
            <p class="ending-reason">{copy().title}</p>
            <p class="ending-body">{copy().body}</p>
          </div>

          <div class="ending-stats">
            <Stat
              label="Phủ điện"
              value={formatPercent(
                (state().zones.urban.coverage +
                  state().zones.industrial.coverage +
                  state().zones.rural.coverage) /
                  3,
              )}
              tone="good"
            />
            <Stat
              label="Niềm tin dân"
              value={formatPercent(state().metrics.citizenTrust)}
              tone={state().metrics.citizenTrust > 0 ? "good" : "bad"}
            />
            <Stat
              label="Tín nhiệm"
              value={formatPercent(state().metrics.institutionalTrust)}
              tone={state().metrics.institutionalTrust > 0 ? "good" : "bad"}
            />
            <Stat
              label="Dư nợ"
              value={formatBillion(state().finance.debt)}
              tone={isBad() ? "bad" : "warn"}
            />
          </div>

          <div class="ending-missions">
            <For each={missionStatus(state())}>
              {(mission) => (
                <span class="goal" data-done={mission.done ? "true" : "false"}>
                  <span class="goal-check">
                    <Icon icon={mission.done ? "lucide:check" : "lucide:x"} size={14} />
                  </span>
                  <strong>
                    {mission.id === "electrification"
                      ? "Phủ điện toàn quốc"
                      : mission.id === "market"
                        ? "Thị trường điện hợp lý"
                        : "An ninh năng lượng"}
                  </strong>
                </span>
              )}
            </For>
          </div>

          <Panel title="Dấu chân nhiệm kỳ" kicker="Số liệu cuối" icon="tabler:file-analytics">
            <div class="ending-table">
              <div>
                <span>Kết quả lũy kế</span>
                <strong>
                  {formatBillion(
                    state().finance.monthlyHistory.reduce((sum, row) => sum + row.netResult, 0),
                  )}
                </strong>
              </div>
              <div>
                <span>Lỗ lũy kế</span>
                <strong>{formatBillion(state().finance.accumulatedLoss)}</strong>
              </div>
              <div>
                <span>Số tháng điều hành</span>
                <strong>{state().finance.monthlyHistory.length}</strong>
              </div>
              <div>
                <span>Nhánh</span>
                <strong>
                  {state().policy.branch === "state" ? "Nhà nước cải cách" : "Tư nhân hóa"}
                </strong>
              </div>
            </div>
          </Panel>

          <p class="ending-footnote">
            {ending()?.id === "reformer"
              ? "Chế độ phục hồi sau năm 5 được mở: N-2, DPPA và VREM tiếp tục trả dần khoản lỗ cấu trúc."
              : "Kết quả này được lưu vào hồ sơ nhiệm kỳ. Chơi lại để thử một chiến lược khác."}
          </p>

          <div class="ending-actions">
            <ActionButton variant="primary" icon="lucide:rotate-ccw" onClick={props.onNewGame}>
              Nhiệm kỳ mới
            </ActionButton>
          </div>
        </div>
      </div>
    </Show>
  );
};
