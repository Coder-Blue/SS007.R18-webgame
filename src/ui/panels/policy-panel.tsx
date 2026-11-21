import { createSignal, createTrackedEffect, Show } from "solid-js";
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
import { formatBillion, formatPercent } from "~/state/format";
import { N2_RATE_MAX, N2_RATE_MIN, recoveryFor } from "~/domain";

export const PolicyPanel = (): JSX.Element => {
  const { store, actions } = useGame();
  const state = store.state;
  const [rate, setRate] = createSignal(state().policy.n2Rate);
  createTrackedEffect(() => {
    setRate(state().policy.n2Rate);
  });
  const canN2 = () => state().clock.year >= 2024;
  const preview = () => recoveryFor(state().finance, state().clock.year, rate(), true);

  const reforms = [
    {
      key: "nsmo" as const,
      label: "Tách NSMO",
      desc: "Tách điều độ khỏi công ty để tăng tính trung lập.",
      enabled: () => state().policy.nsmo,
      action: () => actions.enableNsmo(),
      cost: 250,
      icon: "lucide:zap" as const,
    },
    {
      key: "dppa" as const,
      label: "DPPA",
      desc: "Cho xưởng mua trực tiếp từ nông trại, trả phí đường.",
      enabled: () => state().policy.dppa,
      action: () => actions.enableDppa(),
      cost: 400,
      icon: "lucide:leaf" as const,
    },
    {
      key: "vrem" as const,
      label: "VREM",
      desc: "Thí điểm bán lẻ cạnh tranh trên hạ tầng chung.",
      enabled: () => state().policy.vrem,
      action: () => actions.enableVrem(),
      cost: 350,
      icon: "lucide:scale" as const,
    },
  ];

  return (
    <div class="stack-lg">
      <Panel
        title="Quyết định 05/2024 và cải cách"
        kicker="Quyết định 05/2024, NSMO, DPPA và VREM."
        icon="lucide:landmark"
      >
        <div class="policy-hero">
          <div>
            <p class="eyebrow">Điểm tranh luận công khai</p>
            <strong class="big-number">{Math.round(state().metrics.debateScore)}</strong>
            <Bar
              value={state().metrics.debateScore}
              tone="gold"
              label="Điểm tranh luận công khai"
            />
            <p class="muted">
              Điểm cao giúp giữ được mô hình độc quyền tự nhiên trước áp lực tư nhân hóa.
            </p>
          </div>
          <div class="policy-role-card">
            <Icon icon="lucide:landmark" size={26} />
            <strong>Vai trò và trách nhiệm</strong>
            <p>
              Bạn là EVN của làng: vừa phải giữ an sinh, vừa phải trả nợ, vừa phải chuẩn bị cho thị
              trường cạnh tranh.
            </p>
          </div>
        </div>
      </Panel>

      <Panel
        title="Thu hồi chi phí N-2"
        kicker={canN2() ? "Ban hành" : "Chưa đủ dữ liệu N-2"}
        icon="lucide:scale"
      >
        <div class="policy-row">
          <div>
            <h4>Thu hồi chi phí N-2</h4>
            <p class="muted">
              Đưa khoản lỗ kiểm toán của hai năm trước vào trần giá hiện tại. Chỉ mở từ 2024.
            </p>
            <Show when={!canN2()}>
              <Badge tone="warn">Chính sách này chỉ mở từ năm 2024.</Badge>
            </Show>
          </div>
          <ActionButton
            variant="gold"
            disabled={!canN2() || state().policy.n2Enabled}
            onClick={() => actions.enactRecovery()}
          >
            {state().policy.n2Enabled ? "Đang áp dụng" : "Ban hành"}
          </ActionButton>
        </div>
        <Show when={state().policy.n2Enabled}>
          <div class="slider-row">
            <div class="slider-head">
              <span>Tỷ lệ thu hồi</span>
              <strong>{formatPercent(rate() * 100)}</strong>
            </div>
            <Slider
              value={rate()}
              min={N2_RATE_MIN}
              max={N2_RATE_MAX}
              step={0.01}
              onValueChange={(value) => setRate(Number(value))}
              aria-label="Tỷ lệ thu hồi"
            >
              <SliderControl>
                <SliderTrack>
                  <SliderIndicator />
                  <SliderThumb aria-label="Tỷ lệ thu hồi" />
                </SliderTrack>
              </SliderControl>
            </Slider>
            <div class="slider-scale">
              <span>{formatPercent(N2_RATE_MIN * 100)}</span>
              <span>{formatPercent(N2_RATE_MAX * 100)}</span>
            </div>
            <p class="muted">
              Tỷ lệ cao giúp giảm nợ nhanh nhưng làm lạm phát và tín nhiệm xấu đi.
            </p>
          </div>
          <div class="stat-grid">
            <Stat
              label="Lỗ N-2 đủ điều kiện"
              value={formatBillion(preview().eligibleLoss)}
              icon="lucide:scale"
            />
            <Stat
              label="Thu hồi tháng này"
              value={formatBillion(preview().monthlyCredit)}
              tone="good"
              icon="lucide:coins"
            />
            <Stat
              label="Còn lại có thể thu hồi"
              value={formatBillion(preview().remaining)}
              icon="lucide:clock"
            />
            <Stat
              label="Lạm phát"
              value={formatPercent(state().metrics.inflation)}
              tone={state().metrics.inflation > 8 ? "bad" : "warn"}
              icon="lucide:trending-up"
            />
          </div>
          <ActionButton variant="secondary" onClick={() => actions.setRecoveryRate(rate())}>
            Áp dụng
          </ActionButton>
        </Show>
      </Panel>

      <Panel title="Vai trò và trách nhiệm" kicker="Chính sách" icon="lucide:zap">
        <div class="reform-list">
          {reforms.map((reform) => (
            <div class="reform-card" data-enabled={reform.enabled()}>
              <span class="action-icon">
                <Icon icon={reform.icon} size={18} />
              </span>
              <div class="reform-main">
                <div class="reform-head">
                  <strong>{reform.label}</strong>
                  <Badge tone={reform.enabled() ? "good" : "neutral"}>
                    {reform.enabled() ? "Đang áp dụng" : "Chưa áp dụng"}
                  </Badge>
                </div>
                <p class="muted">{reform.desc}</p>
              </div>
              <div class="reform-side">
                <span>{formatBillion(reform.cost)}</span>
                <ActionButton
                  size="sm"
                  variant="secondary"
                  disabled={reform.enabled()}
                  onClick={reform.action}
                >
                  {reform.enabled() ? "Đang áp dụng" : "Ban hành"}
                </ActionButton>
              </div>
            </div>
          ))}
          <div class="reform-card" data-enabled={state().policy.twoPartTariff}>
            <span class="action-icon">
              <Icon icon="lucide:gauge" size={18} />
            </span>
            <div class="reform-main">
              <div class="reform-head">
                <strong>Biểu giá hai thành phần</strong>
                <Badge tone={state().policy.twoPartTariff ? "good" : "neutral"}>
                  {state().policy.twoPartTariff ? "Đang áp dụng" : "Chưa áp dụng"}
                </Badge>
              </div>
              <p class="muted">Tách phí công suất và phí sử dụng để minh bạch hơn.</p>
            </div>
            <div class="reform-side">
              <span>Miễn phí</span>
              <ActionButton
                size="sm"
                variant="secondary"
                disabled={state().policy.twoPartTariff || !state().policy.vrem}
                onClick={() => actions.enableTwoPart()}
              >
                {state().policy.vrem ? "Ban hành" : "Cần VREM trước."}
              </ActionButton>
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Chính sách" kicker="Phân phối" icon="lucide:shield">
        <div class="policy-actions">
          <ActionButton
            variant="secondary"
            icon="lucide:sparkles"
            disabled={state().policy.campaignCooldown > 0}
            onClick={() => actions.invest("campaign")}
          >
            Chiến dịch truyền thông
          </ActionButton>
          <ActionButton
            variant="secondary"
            icon="lucide:shield"
            disabled={state().policy.antiSmuggling}
            onClick={() => actions.invest("crackdown")}
          >
            Kiểm tra buôn lậu
          </ActionButton>
        </div>
        <p class="muted">Tăng tín nhiệm và hài lòng, nghỉ 6 tháng giữa các chiến dịch.</p>
        <div class="tag-row">
          <Badge tone={state().policy.antiSmuggling ? "good" : "warn"}>
            Chống buôn lậu: {state().policy.antiSmuggling ? "Đang áp dụng" : "Chưa áp dụng"}
          </Badge>
          <Badge tone={state().policy.nsmo ? "good" : "neutral"}>NSMO</Badge>
          <Badge tone={state().policy.dppa ? "good" : "neutral"}>DPPA</Badge>
          <Badge tone={state().policy.vrem ? "good" : "neutral"}>VREM</Badge>
        </div>
      </Panel>
    </div>
  );
};
