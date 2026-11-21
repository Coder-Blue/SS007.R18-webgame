import type { JSX } from "@solidjs/web";

export const TitlePoster = (): JSX.Element => (
  <picture class="title-poster">
    <source
      media="(max-width: 767px)"
      srcset="/images/village-poster-mobile.webp"
      type="image/webp"
    />
    <img
      src="/images/village-poster-desktop.webp"
      alt=""
      width="1440"
      height="900"
      fetchpriority="high"
      decoding="async"
    />
  </picture>
);
