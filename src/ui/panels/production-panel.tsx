import { For, Show, createSignal, createTrackedEffect } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useGame } from "../game-context";
import { ActionButton, Badge, Bar, Panel, RangeSlider, Stat } from "../components/base";
import { Icon } from "../components/icons";
import { formatBillion, formatPower, formatPrice, formatSignedBillion } from "~/state/format";
import {
  PLANT_PROJECTS,
  availableHydroMw,
  buildPlantAction,
  dispatchPreview,
  supplierPreview,
  type PlantKind,
  type SupplierKind,
} from "~/domain";

const supplierLabel: Readonly<Record<SupplierKind, string>> = {
  ipp: "IPP tư nhân",
  bot: "BOT khí",
  coal: "Than nhập khẩu",
  gas: "Khí nội địa",
};

const plants: readonly {
  readonly kind: PlantKind;
  readonly name: string;
  readonly detail: string;
  readonly icon: "tabler:droplet" | "tabler:flame" | "tabler:solar-panel" | "lucide:utility-pole";
}[] = [
  {
    kind: "hydro",
    name: "Mở rộng thủy điện",
    detail: "Công suất rẻ, phụ thuộc hồ chứa",
    icon: "tabler:droplet",
  },
  {
    kind: "thermal",
    name: "Thêm nhiệt điện",
    detail: "Ổn định, chi phí nhiên liệu cao",
    icon: "tabler:flame",
  },
  {
    kind: "renewable",
    name: "Trang trại tái tạo",
    detail: "Nguồn biến thiên, hợp đồng PPA",
    icon: "tabler:solar-panel",
  },
  {
    kind: "substation",
    name: "Trạm biến áp",
    detail: "Giảm tổn thất, tăng độ mạnh lưới",
    icon: "lucide:utility-pole",
  },
];

export const ProductionPanel = (): JSX.Element => {
  const { store } = useGame();
  const state = store.state;
  const [draft, setDraft] = createSignal(state().operations.dispatch);
  const [supplierDraft, setSupplierDraft] = createSignal(state().operations.supplierId);

  createTrackedEffect(() => {
    setDraft(state().operations.dispatch);
    setSupplierDraft(state().operations.supplierId);
  });

  const preview = () => dispatchPreview(state(), draft());
  const supplierView = () => supplierPreview(state(), supplierDraft());

  const draftSupplier = () => state().market.suppliers.find((row) => row.id === supplierDraft());

  const hydroCap = () => availableHydroMw(state().generation);

  const setPart = (key: "hydroMw" | "thermalMw" | "importMw", value: number): void => {
    setDraft({ ...draft(), [key]: value });
  };

  return (
    <div class="stack-lg" data-tutorial="production-panel">
      <Panel title="Mua điện cạnh tranh" kicker="Bước 1 · Thượng nguồn" icon="lucide:handshake">
        <p class="panel-lead">
          Ba nhà cung cấp chào giá gần như tương đương. Chênh lệch nhỏ về giá và công suất là toàn
          bộ cạnh tranh trước khi điện vào lưới độc quyền.
        </p>
        <div class="supplier-grid">
          <For each={state().market.suppliers}>
            {(supplier) => (
              <button
                type="button"
                class="supplier-card"
                data-active={supplier.id === state().operations.supplierId ? "true" : "false"}
                onClick={() => store.setSupplier(supplier.id)}
                aria-pressed={supplier.id === state().operations.supplierId ? "true" : "false"}
              >
                <div class="supplier-head">
                  <span class="supplier-kind">{supplierLabel[supplier.kind]}</span>
                  <Badge
                    tone={supplier.id === state().operations.supplierId ? "electric" : "neutral"}
                  >
                    {supplier.id === state().operations.supplierId ? "Đang chọn" : "Chào giá"}
                  </Badge>
                </div>
                <strong>{formatPrice(supplier.priceVndPerKwh)}</strong>
                <span class="supplier-meta">
                  <Icon icon="tabler:bolt" size={14} />
                  Công suất chào {formatPower(supplier.capacityMw)}
                </span>
                <Bar
                  value={supplier.capacityMw}
                  max={600}
                  tone={supplier.id === supplierDraft() ? "electric" : "gold"}
                  label={`Công suất ${supplier.id}`}
                />
              </button>
            )}
          </For>
        </div>
        <Show when={draftSupplier() !== undefined}>
          <div
            class="preview-card"
            data-tone={
              supplierView().after.netResult >= supplierView().before.netResult ? "good" : "warn"
            }
          >
            <div class="preview-head">
              <span>Dự đoán đổi nhà cung cấp</span>
              <Badge tone="electric">Trước → Sau</Badge>
            </div>
            <div class="preview-grid">
              <div>
                <span>Lãi/lỗ tháng</span>
                <strong>
                  {formatSignedBillion(supplierView().before.netResult)} →{" "}
                  {formatSignedBillion(supplierView().after.netResult)}
                </strong>
              </div>
              <div>
                <span>Dự phòng</span>
                <strong>
                  {Math.round(supplierView().before.reserveMargin)}% →{" "}
                  {Math.round(supplierView().after.reserveMargin)}%
                </strong>
              </div>
              <div>
                <span>Độ tin cậy</span>
                <strong>
                  {Math.round(supplierView().before.reliability)}% →{" "}
                  {Math.round(supplierView().after.reliability)}%
                </strong>
              </div>
              <div>
                <span>Niềm tin dân</span>
                <strong>
                  {Math.round(supplierView().before.trustBefore)}% →{" "}
                  {Math.round(supplierView().after.trustAfter)}%
                </strong>
              </div>
              <div>
                <span>Chấp thuận giá</span>
                <strong>{Math.round(supplierView().after.approvalLikelihood)}%</strong>
              </div>
            </div>
            <div class="action-row">
              <ActionButton
                size="sm"
                variant="primary"
                icon="lucide:check"
                disabled={supplierDraft() === state().operations.supplierId}
                onClick={() => store.setSupplier(supplierDraft())}
              >
                Áp dụng nhà cung cấp
              </ActionButton>
              <span class="tier-meta">
                Giá nhập {formatPrice(draftSupplier()?.priceVndPerKwh ?? 0)} · Tối đa{" "}
                {formatPower(draftSupplier()?.capacityMw ?? 0)}
              </span>
            </div>
          </div>
        </Show>
      </Panel>

      <Panel
        title="Điều độ và cân bằng phụ tải"
        kicker="Bước 2 · Truyền tải"
        icon="tabler:plug-connected"
      >
        <div class="dispatch-grid">
          <div class="dispatch-control">
            <div class="dispatch-head">
              <span>
                <Icon icon="tabler:droplet" size={16} /> Thủy điện
              </span>
              <strong>{formatPower(draft().hydroMw)}</strong>
            </div>
            <RangeSlider
              value={draft().hydroMw}
              min={0}
              max={Math.round(state().generation.hydroCapacityMw)}
              step={10}
              label="Công suất huy động thủy điện"
              onInput={(value) => setPart("hydroMw", value)}
            />
            <span class="dispatch-meta">Khả dụng theo hồ chứa: {formatPower(hydroCap())}</span>
          </div>
          <div class="dispatch-control">
            <div class="dispatch-head">
              <span>
                <Icon icon="tabler:flame" size={16} /> Nhiệt điện
              </span>
              <strong>{formatPower(draft().thermalMw)}</strong>
            </div>
            <RangeSlider
              value={draft().thermalMw}
              min={0}
              max={Math.round(state().generation.thermalCapacityMw)}
              step={10}
              label="Công suất huy động nhiệt điện"
              onInput={(value) => setPart("thermalMw", value)}
            />
            <span class="dispatch-meta">
              Giá nhiên liệu đang ở mức {state().market.fuelPriceIndex.toFixed(2)}x
            </span>
          </div>
          <div class="dispatch-control">
            <div class="dispatch-head">
              <span>
                <Icon icon="tabler:antenna" size={16} /> Nhập khẩu
              </span>
              <strong>{formatPower(draft().importMw)}</strong>
            </div>
            <RangeSlider
              value={draft().importMw}
              min={0}
              max={Math.round(draftSupplier()?.capacityMw ?? 0)}
              step={10}
              label="Công suất nhập khẩu"
              onInput={(value) => setPart("importMw", value)}
            />
            <span class="dispatch-meta">Hợp đồng với nhà cung cấp đang chọn</span>
          </div>
        </div>
        <div
          class="preview-card"
          data-tone={preview().after.netResult >= preview().before.netResult ? "good" : "bad"}
        >
          <div class="preview-head">
            <span>Dự đoán kết quả tức thì</span>
            <Badge tone="electric">Trước → Sau</Badge>
          </div>
          <div class="preview-grid">
            <div>
              <span>Lãi/lỗ tháng</span>
              <strong>
                {formatSignedBillion(preview().before.netResult)} →{" "}
                {formatSignedBillion(preview().after.netResult)}
              </strong>
            </div>
            <div>
              <span>Dự phòng</span>
              <strong>
                {Math.round(preview().before.reserveMargin)}% →{" "}
                {Math.round(preview().after.reserveMargin)}%
              </strong>
            </div>
            <div>
              <span>Độ tin cậy</span>
              <strong>
                {Math.round(preview().before.reliability)}% →{" "}
                {Math.round(preview().after.reliability)}%
              </strong>
            </div>
            <div>
              <span>Niềm tin dân</span>
              <strong>
                {Math.round(preview().before.trustBefore)}% →{" "}
                {Math.round(preview().after.trustAfter)}%
              </strong>
            </div>
            <div>
              <span>Chấp thuận giá</span>
              <strong>{Math.round(preview().after.approvalLikelihood)}%</strong>
            </div>
          </div>
        </div>
        <div class="action-row">
          <ActionButton
            variant="primary"
            icon="lucide:check"
            onClick={() => store.setDispatch(draft())}
          >
            Áp dụng điều độ
          </ActionButton>
          <ActionButton
            variant="ghost"
            icon="lucide:rotate-ccw"
            onClick={() => setDraft(state().operations.dispatch)}
          >
            Hoàn tác
          </ActionButton>
        </div>
      </Panel>

      <Panel title="Đầu tư nguồn điện" kicker="Công suất dài hạn" icon="tabler:building-factory-2">
        <div class="build-grid">
          <For each={plants}>
            {(plant) => {
              const plan = PLANT_PROJECTS[plant.kind];

              return (
                <div class="build-card">
                  <div class="build-head">
                    <Icon icon={plant.icon} size={18} />
                    <strong>{plant.name}</strong>
                  </div>
                  <p>{plant.detail}</p>
                  <div class="build-meta">
                    <span>{formatBillion(plan.cost)}</span>
                    <span>{plan.months} tháng</span>
                    <span>
                      {plan.capacityMw > 0
                        ? `+${plan.capacityMw} MW`
                        : `+${plan.gridStrength} điểm lưới`}
                    </span>
                  </div>
                  <ActionButton
                    size="sm"
                    variant="gold"
                    icon="lucide:plus"
                    disabled={state().operations.projects.length >= 3}
                    onClick={() => store.dispatch(buildPlantAction(state(), plant.kind))}
                  >
                    Khởi công
                  </ActionButton>
                </div>
              );
            }}
          </For>
        </div>
        <div class="mini-grid">
          <Stat
            label="Thủy điện"
            value={formatPower(state().generation.hydroCapacityMw)}
            tone="good"
          />
          <Stat
            label="Nhiệt điện"
            value={formatPower(state().generation.thermalCapacityMw)}
            tone="warn"
          />
          <Stat
            label="Tái tạo"
            value={formatPower(state().generation.renewableCapacityMw)}
            tone="good"
          />
        </div>
      </Panel>
    </div>
  );
};
