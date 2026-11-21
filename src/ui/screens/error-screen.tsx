import type { JSX } from "@solidjs/web";
import { ActionButton } from "../components/base";
import { Icon } from "../components/icons";
import { t } from "../localization";

export const ErrorScreen = (props: {
  readonly error?: unknown;
  readonly onRetry?: () => void;
}): JSX.Element => (
  <div class="error-screen">
    <div class="error-card">
      <span class="outcome-icon">
        <Icon name="alert" size={22} />
      </span>
      <h1>{t("error.pageTitle")}</h1>
      <p>{t("error.pageBody")}</p>
      <ActionButton variant="gold" onClick={props.onRetry ?? (() => window.location.reload())}>
        {t("error.retry")}
      </ActionButton>
    </div>
  </div>
);
