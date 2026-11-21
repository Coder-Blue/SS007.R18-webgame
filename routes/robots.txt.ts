import { defineHandler } from "nitro";
import { SITE_URL } from "../src/site";

const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

export default defineHandler(
  () =>
    new Response(robots, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "public, max-age=86400",
      },
    }),
);
