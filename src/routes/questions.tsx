import { createFileRoute } from "@tanstack/solid-router";
import { SITE_URL } from "~/site";
import { QuestionsScreen } from "~/ui/screens/questions-screen";

export const Route = createFileRoute("/questions")({
  component: QuestionsScreen,
  head: () => ({
    meta: [
      { title: "Câu hỏi trắc nghiệm · Điều Hành Lưới Điện Quốc Gia" },
      {
        name: "description",
        content: "10 câu trắc nghiệm về độc quyền trong ngành điện và Tập đoàn Điện lực Việt Nam.",
      },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { property: "og:title", content: "Câu hỏi trắc nghiệm · Điều Hành Lưới Điện Quốc Gia" },
      {
        property: "og:description",
        content: "10 câu trắc nghiệm về độc quyền trong ngành điện và Tập đoàn Điện lực Việt Nam.",
      },
      { property: "og:url", content: `${SITE_URL}/questions` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/questions` }],
  }),
});
