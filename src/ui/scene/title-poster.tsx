import type { JSX } from "@solidjs/web";

export const TitlePoster = (): JSX.Element => (
  <div class="title-poster" aria-hidden="true">
    <div class="poster-grid" />
    <svg class="poster-lines" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
      <g class="poster-tower">
        <path d="M180 760 L250 300 L320 760 M215 560 L285 560 M200 660 L300 660 M230 420 L270 420" />
        <path d="M1050 780 L1120 260 L1190 780 M1085 580 L1155 580 M1070 680 L1170 680 M1100 400 L1140 400" />
      </g>
      <g class="poster-cable">
        <path d="M250 320 C 520 470, 760 470, 1120 280" />
        <path d="M250 360 C 540 520, 760 520, 1120 320" />
        <path d="M250 400 C 560 570, 760 570, 1120 360" />
      </g>
      <g class="poster-node">
        <circle cx="250" cy="300" r="5" />
        <circle cx="1120" cy="260" r="5" />
        <circle cx="710" cy="490" r="4" />
        <circle cx="420" cy="640" r="4" />
        <circle cx="960" cy="640" r="4" />
      </g>
      <g class="poster-horizon">
        <path d="M0 760 H1440 M0 800 H1440" />
      </g>
    </svg>
    <div class="poster-glow" />
  </div>
);
