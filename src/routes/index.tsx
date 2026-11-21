import { createFileRoute } from "@tanstack/solid-router";
import { SITE_URL } from "~/site";
import { GameShell } from "~/ui/app/game-shell";

export const Route = createFileRoute("/")({
  component: GameShell,
  head: () => ({
    meta: [{ name: "robots", content: "index, follow, max-image-preview:large" }],
    links: [{ rel: "canonical", href: `${SITE_URL}/` }],
  }),
});
