import type { JSX } from "@solidjs/web";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@ui-sdk/solid/drawer";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@ui-sdk/solid/tabs";
import { Icon } from "../components/icons";
import { PanelView } from "../panels/panel-view";
import { PANEL_TABS } from "../hud/bottom-dock";
import { PANEL_IDS, type PanelId } from "../mobile/mobile-nav";

export const WorkspaceDrawer = (props: {
  readonly open: boolean;
  readonly panel: PanelId;
  readonly onPanel: (panel: PanelId) => void;
  readonly onClose: () => void;
}): JSX.Element => (
  <Drawer
    open={props.open}
    side="right"
    modal={false}
    onOpenChange={(open) => (open ? undefined : props.onClose())}
  >
    <DrawerContent class="workspace-drawer flex flex-col overflow-hidden">
      <div class="workspace-head shrink-0">
        <div>
          <p class="eyebrow">Bảng điều hành</p>
          <DrawerTitle class="modal-title">Điều Hành Lưới Điện Quốc Gia</DrawerTitle>
          <p class="modal-desc">Ra quyết định, xem dự đoán, rồi tiếp tục mô phỏng.</p>
        </div>
        <DrawerClose class="icon-btn" aria-label="Đóng">
          <Icon icon="lucide:x" size={18} />
        </DrawerClose>
      </div>
      <Tabs
        class="flex min-h-0 flex-1 flex-col"
        value={props.panel}
        onValueChange={(value) =>
          props.onPanel(PANEL_IDS.find((panel) => panel === value) ?? "overview")
        }
      >
        <TabsList class="workspace-tabs shrink-0" aria-label="Bảng điều hành">
          {PANEL_TABS.map((tab) => (
            <TabsTab value={tab.id}>
              <Icon icon={tab.icon} size={16} />
              {tab.label}
            </TabsTab>
          ))}
        </TabsList>
        {PANEL_TABS.map((tab) => (
          <TabsPanel
            value={tab.id}
            class="workspace-panel min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain [scrollbar-color:var(--ink-faint)_var(--panel)] [scrollbar-gutter:stable]"
          >
            <PanelView panel={tab.id} />
          </TabsPanel>
        ))}
      </Tabs>
    </DrawerContent>
  </Drawer>
);
