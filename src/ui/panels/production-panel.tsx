import { For } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useGame } from "../game-context";
import { ActionButton, Badge, Bar, Panel, SectionHeading, Stat } from "../components/base";
import { Icon, type IconName } from "../components/icons";
import { formatBillion, formatPercent, formatPrice, formatTonne } from "~/state/format";
import { investmentCost, productionCostPerTonne, type InvestmentKind } from "~/domain";

interface InvestmentCard {
  readonly kind: InvestmentKind;
  readonly label: string;
  readonly desc: string;
  readonly icon: IconName;
}

const investments: readonly InvestmentCard[] = [
  {
    kind: "hydro",
    label: "Mở ruộng nước",
    desc: "Tăng công suất thủy lợi, chịu ảnh hưởng hạn hán.",
    icon: "lucide:droplets",
  },
  {
    kind: "mechanized",
    label: "Mở ruộng cơ giới",
    desc: "Công suất ổn định hơn, cần phân bón và R&D.",
    icon: "lucide:factory",
  },
  {
    kind: "irrigation",
    label: "Nâng thủy lợi",
    desc: "Giảm tác động hạn hán lên ruộng nước.",
    icon: "lucide:cloud-rain",
  },
  {
    kind: "rnd",
    label: "Đầu tư R&D",
    desc: "Tăng năng suất và giảm chi phí sản xuất.",
    icon: "lucide:sparkles",
  },
  {
    kind: "fleet",
    label: "Mua thêm xe",
    desc: "Tăng 20 xe, giảm chi phí vận chuyển.",
    icon: "lucide:truck",
  },
];

export const ProductionPanel = (): JSX.Element => {
  const { store, actions } = useGame();
  const state = store.state;
  const last = () => state().finance.monthlyHistory[state().finance.monthlyHistory.length - 1];
  const production = () => state().production;
  const market = () => state().market;
  const own = () => last()?.ownProduction ?? 0;
  const external = () => last()?.externalPurchase ?? 0;

  const selfSufficiency = () => {
    const total = own() + external();

    return total <= 0 ? 0 : (own() / total) * 100;
  };

  return (
    <div class="stack-lg">
      <Panel title="Sản xuất" kicker="Phát điện · Ruộng và nông trại" icon="tabler:wheat">
        <div class="stat-grid">
          <Stat
            label="Sản lượng tự sản xuất"
            value={formatTonne(own())}
            hint="Mua từ nông dân tư nhân"
            icon="tabler:wheat"
          />
          <Stat
            label="Tỷ lệ tự chủ"
            value={formatPercent(selfSufficiency())}
            tone={selfSufficiency() >= 40 ? "good" : "warn"}
            icon="lucide:gauge"
          />
          <Stat
            label="Tồn kho"
            value={formatTonne(production().riceInventory)}
            tone={production().riceInventory > 60 ? "good" : "warn"}
            icon="lucide:warehouse"
          />
          <Stat
            label="Nhu cầu tháng"
            value={formatTonne(last()?.totalDemand ?? 0)}
            icon="lucide:users"
          />
        </div>
        <div class="supply-mix">
          <span class="muted">Cơ cấu nguồn cung</span>
          <div class="supply-mix-bar">
            <span class="mix-self" style={{ width: `${selfSufficiency()}%` }} />
            <span class="mix-private" style={{ width: `${100 - selfSufficiency()}%` }} />
          </div>
          <div class="supply-mix-legend">
            <span>
              <i class="dot dot-self" /> Nhà nước {Math.round(selfSufficiency())}%
            </span>
            <span>
              <i class="dot dot-private" /> Tư nhân {Math.round(100 - selfSufficiency())}%
            </span>
          </div>
        </div>
      </Panel>

      <Panel title="Sản xuất" kicker="Đầu tư" icon="lucide:factory">
        <SectionHeading title="Ruộng nước" hint="Hạn hán làm giảm mạnh sản lượng ruộng nước." />
        <div class="line-stats">
          <span>{`${production().hydroPaddies} đơn vị`}</span>
          <Badge tone={market().drought > 0.6 ? "bad" : "good"}>
            Chỉ số hạn hán: {formatPercent(market().drought * 100)}
          </Badge>
        </div>
        <div class="line-stats">
          <span>{`${production().mechanizedPaddies} đơn vị`}</span>
          <Badge tone="gold">Mức thủy lợi: {production().irrigationLevel}</Badge>
        </div>
        <div class="market-grid">
          <Stat
            label="Giá phân bón"
            value={formatPrice(market().fertilizerPrice)}
            icon="lucide:leaf"
          />
          <Stat
            label="Giá nhiên liệu"
            value={formatPrice(market().fuelPrice)}
            icon="lucide:truck"
          />
          <Stat label="Tỷ giá" value={market().exchangeRate.toFixed(2)} icon="lucide:scale" />
          <Stat
            label="Chi phí sản xuất/tấn"
            value={formatPrice(productionCostPerTonne(market(), production().rndLevel))}
            icon="lucide:coins"
          />
        </div>
      </Panel>

      <Panel
        title="Đầu tư"
        kicker="Ruộng nước, ruộng cơ giới và nguồn cung tư nhân."
        icon="lucide:sparkles"
      >
        <div class="action-list">
          <For each={investments}>
            {(item) => (
              <div class="action-card">
                <div class="action-card-main">
                  <span class="action-icon">
                    <Icon icon={item.icon} size={18} />
                  </span>
                  <div>
                    <strong>{item.label}</strong>
                    <p>{item.desc}</p>
                  </div>
                </div>
                <div class="action-cost">
                  <span>{formatBillion(investmentCost(state(), item.kind))}</span>
                  <ActionButton size="sm" variant="gold" onClick={() => actions.invest(item.kind)}>
                    Đầu tư
                  </ActionButton>
                </div>
              </div>
            )}
          </For>
          <div class="action-card">
            <div class="action-card-main">
              <span class="action-icon">
                <Icon icon="lucide:warehouse" size={18} />
              </span>
              <div>
                <strong>Nhập gạo dự trữ</strong>
                <p>Mua 100 nghìn tấn theo giá thị trường hiện tại.</p>
              </div>
            </div>
            <div class="action-cost">
              <span>{formatBillion(100 * market().ricePrice * 1.03)}</span>
              <ActionButton size="sm" variant="primary" onClick={() => actions.importRice()}>
                Nhập
              </ActionButton>
            </div>
          </div>
        </div>
      </Panel>

      <Panel title="Nhu cầu tháng" kicker="Tình hình tháng này" icon="lucide:users">
        <div class="meter-block">
          <div class="meter-row">
            <span>Độ ổn định cấp gạo</span>
            <strong>{formatPercent(state().metrics.reliability)}</strong>
          </div>
          <Bar
            value={state().metrics.reliability}
            tone={state().metrics.reliability >= 95 ? "good" : "warn"}
            label="Độ ổn định cấp gạo"
          />
        </div>
        <div class="meter-block">
          <div class="meter-row">
            <span>Thiếu hụt</span>
            <strong>
              {last()?.shortage && last()!.shortage > 0.5
                ? formatTonne(last()!.shortage)
                : "Không thiếu hụt"}
            </strong>
          </div>
          <Bar
            value={Math.min(100, (last()?.shortage ?? 0) * 2)}
            tone="bad"
            label="Thiếu hụt gạo"
          />
        </div>
      </Panel>
    </div>
  );
};
