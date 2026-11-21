import type { JSX } from "@solidjs/web";
import { useGame } from "../game-context";
import { Icon, type IconName } from "../components/icons";
import { t } from "../localization";
import type { PanelId } from "../mobile/mobile-nav";
import { formatBillion } from "~/state/format";

const items: readonly { readonly id: PanelId; readonly label: string; readonly icon: IconName }[] =
  [
    { id: "overview", label: "panel.overview", icon: "lucide:gauge" },
    { id: "production", label: "panel.production", icon: "tabler:wheat" },
    { id: "infrastructure", label: "panel.infrastructure", icon: "lucide:road" },
    { id: "tariffs", label: "panel.tariffs", icon: "lucide:scale" },
    { id: "policy", label: "panel.policy", icon: "lucide:landmark" },
  ];

export const BottomDock = (props: {
  readonly onOpenPanel: (panel: PanelId) => void;
}): JSX.Element => {
  const { store } = useGame();
  const state = store.state;

  return (
    <nav class="bottom-dock desktop-only" aria-label={t("mobile.sheetTitle")}>
      <div class="bottom-dock-tabs">
        {items.map((item) => (
          <button type="button" class="bottom-dock-tab" onClick={() => props.onOpenPanel(item.id)}>
            <Icon icon={item.icon} size={17} />
            <span>{t(item.label)}</span>
          </button>
        ))}
      </div>
      <span class="bottom-dock-status">
        <Icon icon="lucide:save" size={14} /> {t("save.autosave")} ·{" "}
        {formatBillion(state().finance.cash)}
      </span>
    </nav>
  );
};
