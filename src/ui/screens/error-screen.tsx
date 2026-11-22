import type { JSX } from "@solidjs/web";
import { ActionButton } from "../components/base";
import { Icon } from "../components/icons";

export const ErrorScreen = (props: {
  readonly error?: unknown;
  readonly notFound?: boolean;
  readonly onRetry?: () => void;
}): JSX.Element => (
  <div class="error-screen">
    <div class="error-card">
      <span class="outcome-icon">
        <Icon icon="tabler:alert-triangle" size={22} />
      </span>
      <h1>{props.notFound === true ? "Không tìm thấy trang" : "Lưới đang gặp trục trặc"}</h1>
      <p>
        {props.notFound === true
          ? "Đường dẫn này không nối vào lưới điện."
          : "Một lỗi ngoài dự kiến đã xảy ra. Bạn có thể thử lại hoặc quay về màn hình đầu."}
      </p>
      <ActionButton variant="gold" onClick={props.onRetry ?? (() => window.location.reload())}>
        Thử lại
      </ActionButton>
    </div>
  </div>
);
