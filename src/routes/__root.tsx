/// <reference types="vite/client" />
import type { JSX } from "@solidjs/web";
import { HeadContent, Scripts, createRootRoute } from "@tanstack/solid-router";
import { HydrationScript } from "@solidjs/web";
import appCss from "~/styles/app.css?url";
import { GameProvider } from "~/ui/game-context";
import { ErrorScreen } from "~/ui/screens/error-screen";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5",
      },
      { name: "theme-color", content: "#0d2116" },
      {
        title: "Độc Quyền Kinh Tế · The Rice Monopoly",
      },
      {
        name: "description",
        content:
          "Trò chơi mô phỏng kinh tế chính trị: vận hành mạng lưới gạo của làng qua ba hồi, giữ an sinh và cân bằng ngân sách.",
      },
      { name: "color-scheme", content: "light" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "icon", type: "image/png", sizes: "64x64", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
    ],
  }),
  shellComponent: RootDocument,
  errorComponent: () => <ErrorScreen />,
  notFoundComponent: () => <ErrorScreen />,
});

function RootDocument(props: { readonly children: JSX.Element }): JSX.Element {
  return (
    <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <HydrationScript />
      </head>
      <body>
        <HeadContent />
        <GameProvider>{props.children}</GameProvider>
        <Scripts />
      </body>
    </html>
  );
}
