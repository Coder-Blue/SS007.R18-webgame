# Design Direction

## Five lines

- **Product**: a 60-month grid-operations game for players who want the
  political economy behind every megawatt.
- **Character**: exact, nocturnal, quietly tense.
- **World**: a control room at night, instrumentation, transmission corridors
  and amber warnings.
- **Moments**: the isometric grid map and the revenue/cost breakdown chart.
- **Signature**: a live status dot on the brand mark (green running, amber
  paused) and pulsing MW trust meters.

## Visual system

| Role | Token | Value |
| --- | --- | --- |
| Page | `--bg` | `#07121b` |
| Panel | `--panel` | `#0c1f28` |
| Raised | `--panel-2` | `#102730` |
| Text primary | `--ink` | `#e7f2f4` |
| Text secondary | `--ink-soft` | `#a8bec4` |
| Text muted | `--ink-faint` | `#8aa4ab` |
| Accent | `--electric` | `#39d7ff` |
| Warning | `--amber` | `#ffb347` |
| Positive | `--green` | `#5bd6a2` |
| Danger | `--rose` | `#ff6b6b` |
| Cost series | `--gold` | `#f2d06b` |

Surfaces are neutral navy steps with hairline borders. The bright color belongs
to the map, the charts and live status, not to the chrome. Type is Be Vietnam
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
- **Policy**: long-term missions, post-event decisions, N-2/NSMO/DPPA/VREM and
  the private-branch warning.
- **Finance**: monthly ledger, annual audit and the structural-deficit
  diagnosis.

## Responsive rules

- Desktop `1440x900`: persistent top bar, left mission rail, right operations
  rail, bottom dock, right workspace drawer.
- Tablet `768x1024`: rails hidden, mobile tab bar, bottom-sheet panels.
- Mobile `390x844` and narrow `360x740`: five-item bottom navigation (overview,
  production, transmission, distribution, finance), all panels reachable from
  the sheet tabs, 44 px targets. The policy panel is one sheet tab away.
- The 3D canvas uses `touch-action: none`, pointer drag, wheel zoom and pinch
  zoom.

## Motion

Motion explains state: the live status dot, MW pulses, smoke and reservoir
level, and the single media badge pulse. There is no looping decorative motion.
`prefers-reduced-motion` and the in-game switch collapse animation and camera
travel to the final state.
