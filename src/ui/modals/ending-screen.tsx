import type { JSX } from "@solidjs/web";
import { Show } from "solid-js";
import { useGame } from "../game-context";
import { ActionButton, Badge, Divider, Stat } from "../components/base";
import { Icon } from "../components/icons";
import { t } from "../localization";
import { formatBillion, formatPercent } from "~/state/format";
import { ARCHITECT_DEBT_MAX, type EndingId } from "~/domain";

const endingCopy = (id: EndingId): string => {
  if (id === "architect") return "ending.architect.body";

  if (id === "predator") return "ending.predator.body";

  return "ending.collapse.body";
};

const endingTitle = (id: EndingId): string => {
  if (id === "architect") return "ending.architect.title";

  if (id === "predator") return "ending.predator.title";

  return "ending.collapse.title";
};

const gradeKey = (id: EndingId): string => {
  if (id === "architect") return "ending.gradeArchitect";

  if (id === "predator") return "ending.gradePredator";

  return "ending.gradeCollapse";
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
          aria-label={t(endingTitle(ending().id))}
        >
          <div class="ending-glow" />
          <div class="ending-card">
            <div class="ending-head">
              <Badge
                tone={
                  ending().id === "architect" ? "good" : ending().id === "predator" ? "gold" : "bad"
                }
              >
                {t("ending.ending")} · {t(gradeKey(ending().id))}
              </Badge>
              <span class="ending-date">
                {ending().month}/{ending().year}
              </span>
            </div>
            <h1>{t(endingTitle(ending().id))}</h1>
            <p class="ending-body">{t(endingCopy(ending().id))}</p>
            <p class="ending-reason">{t(`ending.reason.${ending().reason}`)}</p>
            <Divider />
            <div class="stat-grid">
              <Stat
                label={t("ending.finalDebt")}
                value={formatBillion(state().finance.debt)}
                tone={state().finance.debt <= ARCHITECT_DEBT_MAX ? "good" : "bad"}
                icon="landmark"
              />
              <Stat
                label={t("ending.finalCash")}
                value={formatBillion(state().finance.cash)}
                tone="gold"
                icon="wallet"
              />
              <Stat
                label={t("ending.finalCoverage")}
                value={formatPercent(state().infrastructure.coverage)}
                tone={state().infrastructure.coverage >= 100 ? "good" : "warn"}
                icon="road"
              />
              <Stat
                label={t("ending.finalTrust")}
                value={formatPercent(state().metrics.trust)}
                tone={state().metrics.trust >= 55 ? "good" : "bad"}
                icon="shield"
              />
              <Stat
                label={t("ending.finalSatisfaction")}
                value={formatPercent(state().metrics.satisfaction)}
                tone={state().metrics.satisfaction >= 55 ? "good" : "bad"}
                icon="users"
              />
              <Stat
                label={t("hud.inflation")}
                value={formatPercent(state().metrics.inflation)}
                tone={state().metrics.inflation <= 8 ? "good" : "bad"}
                icon="trend-up"
              />
            </div>
            <div class="ending-actions">
              <ActionButton variant="gold" icon="play" onClick={() => actions.newGame()}>
                {t("ending.replay")}
              </ActionButton>
              <ActionButton
                variant="secondary"
                icon="download"
                onClick={() => download(actions.exportJson())}
              >
                {t("ending.export")}
              </ActionButton>
            </div>
            <p class="modal-hint">
              <Icon name="info" size={14} /> {t("ending.summary")}
            </p>
          </div>
        </div>
      )}
    </Show>
  );
};
