import { createSignal, For, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import {
  Dialog,
  DialogBackdrop,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@ui-sdk/solid/dialog";
import { useGame } from "../game-context";
import { ActionButton, Badge } from "../components/base";
import { Icon } from "../components/icons";
import { t } from "../localization";
import { activeEvent } from "~/domain";

export const EventModal = (): JSX.Element => {
  const { store, actions } = useGame();
  const state = store.state;
  const [outcome, setOutcome] = createSignal<{
    readonly title: string;
    readonly body: string;
  } | null>(null);
  const event = () => activeEvent(state());
  const choose = (choiceId: string, outcomeKey: string, titleKey: string): void => {
    setOutcome({ title: t(titleKey), body: t(outcomeKey) });
    actions.resolve(choiceId);
  };
  return (
    <>
      <Show when={event()}>
        {(current) => (
          <Dialog open={true} onOpenChange={() => undefined}>
            <DialogBackdrop class="modal-backdrop" />
            <DialogContent class="modal event-modal" aria-describedby="event-desc">
              <div class="event-head">
                <Badge tone="gold">{t(`event.kind.${current().kind}`)}</Badge>
                <span class="event-date">
                  {state().clock.month}/{state().clock.year}
                </span>
              </div>
              <DialogTitle class="modal-title">{t(current().titleKey)}</DialogTitle>
              <DialogDescription id="event-desc" class="modal-desc">
                {t(current().bodyKey)}
              </DialogDescription>
              <div class="event-choices">
                <For each={current().choices}>
                  {(choice, index) => (
                    <button
                      type="button"
                      class="event-choice"
                      onClick={() => choose(choice.id, choice.outcomeKey, choice.titleKey)}
                    >
                      <span class="choice-index">{index() + 1}</span>
                      <span class="choice-copy">
                        <strong>{t(choice.titleKey)}</strong>
                        <span>{t(choice.bodyKey)}</span>
                      </span>
                      <Icon name="chevron-right" size={18} />
                    </button>
                  )}
                </For>
              </div>
              <p class="modal-hint">{t("tutorial.keyboard")}</p>
            </DialogContent>
          </Dialog>
        )}
      </Show>

      <Show when={outcome()}>
        {(current) => (
          <Dialog open={true} onOpenChange={() => setOutcome(null)}>
            <DialogBackdrop class="modal-backdrop" />
            <DialogContent class="modal outcome-modal">
              <span class="outcome-icon">
                <Icon name="check" size={22} />
              </span>
              <DialogTitle class="modal-title">{current().title}</DialogTitle>
              <DialogDescription class="modal-desc">{current().body}</DialogDescription>
              <div class="modal-actions">
                <ActionButton variant="primary" onClick={() => setOutcome(null)}>
                  {t("tutorial.next")}
                </ActionButton>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </Show>
    </>
  );
};
