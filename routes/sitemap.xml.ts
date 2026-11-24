import { defineHandler } from "nitro";
import { SITE_URL } from "../src/site";

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/questions</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>
`;

export default defineHandler(
  () =>
    new Response(sitemap, {
      headers: {
        "content-type": "application/xml; charset=utf-8",
        "cache-control": "public, max-age=3600, s-maxage=86400",
      },
    }),
);
