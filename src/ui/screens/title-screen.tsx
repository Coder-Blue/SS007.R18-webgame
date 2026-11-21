import type { JSX } from "@solidjs/web";
import { Show } from "solid-js";
import { ActionButton } from "../components/base";
import { Icon } from "../components/icons";
import { t } from "../localization";
import { GAME_VERSION } from "~/domain";

export const TitleScreen = (props: {
  readonly hasSave: boolean;
  readonly onStart: () => void;
  readonly onContinue: () => void;
  readonly onOpenLoad: () => void;
  readonly onTutorial: () => void;
}): JSX.Element => (
  <div class="title-screen">
    <div class="title-vignette" />
    <div class="title-content">
      <h1 class="title-main">{t("app.title")}</h1>
      <p class="title-sub">{t("app.subtitle")}</p>
      <p class="title-tagline">{t("app.tagline")}</p>
      <div class="title-role">
        <Icon icon="lucide:landmark" size={16} />
        <span>{t("app.role")}</span>
      </div>
      <p class="title-prompt">{t("app.pressStart")}</p>
      <div class="title-actions">
        <ActionButton variant="gold" size="lg" icon="lucide:play" onClick={props.onStart}>
          {t("app.newGame")}
        </ActionButton>
        <Show when={props.hasSave}>
          <ActionButton variant="primary" size="lg" icon="lucide:clock" onClick={props.onContinue}>
            {t("app.continue")}
          </ActionButton>
        </Show>
        <ActionButton variant="secondary" size="lg" icon="lucide:save" onClick={props.onOpenLoad}>
          {t("app.loadGame")}
        </ActionButton>
        <ActionButton variant="ghost" size="lg" icon="lucide:book-open" onClick={props.onTutorial}>
          {t("app.howTo")}
        </ActionButton>
      </div>
      <div class="title-acts">
        <div class="title-act">
          <span>I</span>
          <strong>{t("app.act1")}</strong>
          <p>{t("tutorial.step1Body")}</p>
        </div>
        <div class="title-act">
          <span>II</span>
          <strong>{t("app.act2")}</strong>
          <p>{t("tutorial.step2Body")}</p>
        </div>
        <div class="title-act">
          <span>III</span>
          <strong>{t("app.act3")}</strong>
          <p>{t("tutorial.step4Body")}</p>
        </div>
      </div>
      <p class="title-footer">
        {t("app.yearSpan")} · {t("app.footer")} · v{GAME_VERSION}
      </p>
    </div>
  </div>
);
