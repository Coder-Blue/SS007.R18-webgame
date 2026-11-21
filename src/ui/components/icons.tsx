import type { JSX } from "@solidjs/web";
import { Icon as IconifyIcon } from "@iconify-icon/solid";
import "virtual:icon-collections";
import type { IconName } from "./icon-names";

export type { IconName } from "./icon-names";

export const Icon = (props: {
  readonly icon: IconName;
  readonly size?: number;
  readonly class?: string;
  readonly label?: string;
}): JSX.Element => (
  <IconifyIcon
    icon={props.icon}
    width={props.size ?? 20}
    height={props.size ?? 20}
    class={props.class}
    role={props.label === undefined ? undefined : "img"}
    aria-label={props.label}
    aria-hidden={props.label === undefined ? "true" : undefined}
  />
);
