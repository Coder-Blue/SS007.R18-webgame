/// <reference types="vite/client" />
import type { JSX } from "@solidjs/web";
import { HeadContent, Scripts, createRootRoute } from "@tanstack/solid-router";
import { HydrationScript } from "@solidjs/web";
import appCss from "~/styles/app.css?url";
import { SITE_URL } from "~/site";
import { GameProvider } from "~/ui/game-context";
import { ErrorScreen } from "~/ui/screens/error-screen";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5",
      },
      { name: "theme-color", content: "#07121b" },
      {
        title: "Điều Hành Lưới Điện Quốc Gia · National Grid Command",
      },
      {
        name: "description",
        content:
          "Trò chơi mô phỏng kinh tế chính trị ngành điện: mua điện cạnh tranh, vận hành lưới 500kV/220kV và giữ hai chỉ số niềm tin qua 60 tháng.",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Điều Hành Lưới Điện Quốc Gia · National Grid Command" },
      {
        property: "og:description",
        content:
          "Một lưới điện, ba khâu, năm năm. Điều hành tập đoàn điện lực nhà nước qua 60 tháng.",
      },
      { property: "og:image", content: `${SITE_URL}/og.png` },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content: "Điều Hành Lưới Điện Quốc Gia, trò chơi mô phỏng ngành điện Việt Nam",
      },
      { property: "og:url", content: `${SITE_URL}/` },
      { property: "og:locale", content: "vi_VN" },
      { property: "og:site_name", content: "Điều Hành Lưới Điện Quốc Gia" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Điều Hành Lưới Điện Quốc Gia · National Grid Command" },
      {
        name: "twitter:description",
        content:
          "Một lưới điện, ba khâu, năm năm. Điều hành tập đoàn điện lực nhà nước qua 60 tháng.",
      },
      { name: "twitter:image", content: `${SITE_URL}/og.png` },
      {
        name: "twitter:image:alt",
        content: "Điều Hành Lưới Điện Quốc Gia, trò chơi mô phỏng ngành điện Việt Nam",
      },
      { name: "color-scheme", content: "dark" },
    ],
    links: [
      { rel: "sitemap", type: "application/xml", href: `${SITE_URL}/sitemap.xml` },
      {
        rel: "preload",
        href: "/fonts/be-vietnam-pro-400-vietnamese.woff2",
        as: "font",
        type: "font/woff2",
        crossorigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/fonts/be-vietnam-pro-400-latin.woff2",
        as: "font",
        type: "font/woff2",
        crossorigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/fonts/be-vietnam-pro-600-vietnamese.woff2",
        as: "font",
        type: "font/woff2",
        crossorigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/fonts/be-vietnam-pro-600-latin.woff2",
        as: "font",
        type: "font/woff2",
        crossorigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/fonts/be-vietnam-pro-700-vietnamese.woff2",
        as: "font",
        type: "font/woff2",
        crossorigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/fonts/be-vietnam-pro-700-latin.woff2",
        as: "font",
        type: "font/woff2",
        crossorigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/fonts/be-vietnam-pro-800-vietnamese.woff2",
        as: "font",
        type: "font/woff2",
        crossorigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/fonts/be-vietnam-pro-800-latin.woff2",
        as: "font",
        type: "font/woff2",
        crossorigin: "anonymous",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "icon", type: "image/png", sizes: "64x64", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/favicon.png" },
    ],
  }),
  shellComponent: RootDocument,
  errorComponent: () => <ErrorScreen />,
  notFoundComponent: () => <ErrorScreen notFound />,
});

function RootDocument(props: { readonly children: JSX.Element }): JSX.Element {
  return (
    <html lang="vi">
      <head>
        <meta charset="utf-8" />
        {/* Apply the saved motion preference before the first paint. */}
        <script
          innerHTML={`try{var p=JSON.parse(sessionStorage.getItem("dhl:session")||"{}");document.documentElement.dataset.motion=p.reducedMotion?"reduced":"full"}catch(e){document.documentElement.dataset.motion="full"}`}
        />
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
