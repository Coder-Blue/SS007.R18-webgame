# Design Direction

## Five lines

- **Product**: a 60-month grid-operations game for players who want the
  political economy behind every megawatt.
- **Character**: exact, nocturnal, quietly tense.
- **World**: a control room at night, instrumentation, transmission corridors
  and amber warnings.
- **Moments**: the isometric grid map and the revenue/cost breakdown chart.
- **Signature**: a live status dot on the brand mark (green running, amber
  paused) and pulsing MW trust meters. The favicon carries the same dark
  `#07121b` tile, cyan transmission pylon, amber insulator nodes and green live
  dot into the browser tab and home screen.

## Visual system

| Role | Token | Value |
| --- | --- | --- |
| Page | `--bg` | `oklch(0.1765 0.025 243.87)` |
| Panel | `--panel` | `oklch(0.2278 0.0304 230.63)` |
| Raised | `--panel-2` | `oklch(0.2585 0.0335 225.88)` |
| Text primary | `--ink` | `oklch(0.9535 0.012 209.8)` |
| Text secondary | `--ink-soft` | `oklch(0.7867 0.0256 215.95)` |
| Text muted | `--ink-faint` | `oklch(0.7012 0.0307 215.82)` |
| Accent | `--electric` | `oklch(0.8167 0.1361 219.52)` |
| Warning | `--amber` | `oklch(0.8208 0.1486 72.1)` |
| Positive | `--green` | `oklch(0.7925 0.1341 162.76)` |
| Danger | `--rose` | `oklch(0.7116 0.1812 22.84)` |
| Cost series / reform execution | `--gold` | `oklch(0.8666 0.1262 91.02)` |

Tokens are oklch, and components consume them through Tailwind utilities
(`bg-panel`, `text-ink`, `border-line`) rather than one-off component CSS.
Surfaces are neutral navy steps with hairline borders. The bright color belongs
to the map, the charts and live status, not to the chrome. Electric cyan marks
missions and the grid; gold marks money and structural reform, including the
policy bars, the reform HUD and the map beacon. Type is Be Vietnam
Pro throughout; figures use tabular numerals. Buttons are solid, not gradient.
Labels are sentence case, 10 to 12 px in dense chrome and 14 px in body copy.

## Source guidance

The polish pass used `ui-ux-pro-max` for a data-dense dashboard review and
`unslop` for the nine-pass redline. The generated design system suggested a
green/gold dark palette; the game kept its existing electric-cyan brand and
applied the structural guidance instead: one accent, quiet chrome, direct
labels, 4 px rhythm, no uppercase tracked labels, no decorative gradients, no
sub-11 px data text, 44 px controls, visible focus and reduced-motion support.

## Panels

- **Overview**: thesis, four KPIs, stacked revenue/cost chart, generation mix,
  trust trend and mission progress.
- **Production and procurement**: three competing supplier quotes, dispatch
  sliders and a before/after preview.
- **Transmission**: three zone coverage cards with before/after revenue lift,
  asset totals and construction progress.
- **Distribution**: six tariff tiers, industrial tariff, State approval
  likelihood and before/after profit.
- **Policy**: active reforms first with gold 0-100% bars, then long-term
  missions, post-event decisions, available reforms and the private-branch
  warning.
- **Quarter summary**: one energy figure and generation mix, a bottom-line
  ledger, trust at quarter close, and a single continue action. It aggregates
  the completed three months instead of repeating the latest month in stat
  cards.
- **Finance**: monthly ledger, annual audit and the structural-deficit
  diagnosis.

## Responsive rules

- Desktop `1440x900`: persistent top bar, left mission rail, right operations
  rail, bottom dock, right workspace drawer.
- Tablet `768x1024`: rails hidden, mobile tab bar, bottom-sheet panels.
- Mobile `390x844` and narrow `360x740`: five-item bottom navigation (overview,
  production, transmission, distribution, finance), all six sheet tabs wrap into
  two or three rows so every panel is reachable, 44 px targets.
- Scene badges clear the expanded mobile top bar at 172 px, toasts follow at
  210 px and the paused banner stacks at 280 px. Tablet uses 168/206/270 and
  desktop pauses at 168; the mobile WebGL fallback shifts below the pause pill. The tutorial begins below the bar at 158 px.
- The 3D canvas uses `touch-action: none`, pointer drag, wheel zoom and pinch
  zoom. Its `img` role references a hidden text description of coverage, weather,
  reserve and active reforms, and the WebGL fallback offers a dashboard action.

## Motion

Motion explains state: the live status dot, MW pulses, smoke and reservoir
level, and the single media badge pulse. There is no looping decorative motion.
`prefers-reduced-motion` and the in-game switch collapse animation and camera
travel to the final state.
