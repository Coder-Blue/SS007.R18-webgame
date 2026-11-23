import type { JSX } from "@solidjs/web";

export const EmptyState = (props: {
  readonly title: string;
  readonly body: string;
}): JSX.Element => (
  <div class="flex min-h-36 flex-col justify-center gap-1.5 rounded-lg border border-dashed border-line px-5 py-6">
    <p class="text-sm font-medium text-ink">{props.title}</p>
    <p class="max-w-[52ch] text-xs leading-5 text-ink-faint">{props.body}</p>
  </div>
);
