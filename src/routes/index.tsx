import { createFileRoute } from "@tanstack/solid-router";
import { GameShell } from "~/ui/app/game-shell";

export const Route = createFileRoute("/")({
  component: GameShell,
});
