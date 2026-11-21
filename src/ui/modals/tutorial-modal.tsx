import { createSignal, For, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import {
  Dialog,
  DialogBackdrop,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@ui-sdk/solid/dialog";
import { ActionButton, IconButton } from "../components/base";
import { Icon, type IconName } from "../components/icons";
import { t } from "../localization";

const steps: readonly { readonly title: string; readonly body: string; readonly icon: IconName }[] =
  [
    { title: "tutorial.step1Title", body: "tutorial.step1Body", icon: "rice" },
    { title: "tutorial.step2Title", body: "tutorial.step2Body", icon: "calendar" },
    { title: "tutorial.step3Title", body: "tutorial.step3Body", icon: "scale" },
    { title: "tutorial.step4Title", body: "tutorial.step4Body", icon: "landmark" },
    { title: "tutorial.step5Title", body: "tutorial.step5Body", icon: "map-pin" },
  ];

export const TutorialModal = (props: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onFinish: () => void;
}): JSX.Element => {
  const [index, setIndex] = createSignal(0);
  const current = () => steps[index()] ?? steps[0]!;

  const close = (): void => {
    props.onFinish();
    props.onClose();
  };

  return (
    <Dialog open={props.open} onOpenChange={(open) => (open ? undefined : props.onClose())}>
      <DialogBackdrop class="modal-backdrop" />
      <DialogContent class="modal tutorial-modal">
        <div class="tutorial-head">
          <span class="tutorial-icon">
            <Icon name={current().icon} size={24} />
          </span>
          <div>
            <p class="eyebrow">{t("tutorial.title")}</p>
            <DialogTitle class="modal-title">{t(current().title)}</DialogTitle>
          </div>
          <IconButton icon="close" label={t("tutorial.skip")} onClick={close} />
        </div>
        <DialogDescription class="modal-desc">{t(current().body)}</DialogDescription>
        <div class="tutorial-progress">
          <For each={steps}>
            {(_step, stepIndex) => (
              <span class="tutorial-dot" data-active={stepIndex() === index()} />
            )}
          </For>
        </div>
        <div class="modal-actions">
          <Show when={index() > 0}>
            <ActionButton variant="ghost" onClick={() => setIndex(index() - 1)}>
              {t("tutorial.back")}
            </ActionButton>
          </Show>
          <ActionButton
            variant="gold"
            onClick={() => {
              if (index() >= steps.length - 1) close();
              else setIndex(index() + 1);
            }}
          >
            {index() >= steps.length - 1 ? t("tutorial.done") : t("tutorial.next")}
          </ActionButton>
        </div>
        <p class="modal-hint">
          {t("tutorial.step", { current: index() + 1, total: steps.length })}
        </p>
      </DialogContent>
    </Dialog>
  );
};
