# TARGET.md — PROJECT: THE RICE MONOPOLY (ĐỘC QUYỀN KINH TẾ)

> **DIRECTIVE:** Single Source of Truth for autonomous multi-agent development (Codex, OpenCode, Antigravity, Claude). Execute strictly per specs below.
> **LOCALIZATION & TYPOGRAPHY MANDATE:** All code, identifiers, commits, and agent logs must be in **English**. All **in-game UI, dialogues, events, tutorials, and copy MUST default to Vietnamese**. Configure and enforce **`Be Vietnam Pro`** (Google Fonts / local variable font) as the primary UI typeface across the entire app for crisp Vietnamese diacritic rendering.

## 1. STRICT ENGINEERING & CODE QUALITY STANDARDS (NON-NEGOTIABLE)

* **Zero Emojis Policy:** Strictly forbid emojis anywhere in the repository—no emojis in source code, comments, UI strings, Git commit messages, PR descriptions, or agent logs. Use clean vector icons (`ui-sdk.dev/docs/solid` or Lucide/SVG) for UI iconography.
* **Minimal Comments:** Write self-documenting, expressive code with clear naming and strict types. Avoid redundant/narrative comments; permit comments only for complex mathematical/economic edge cases or non-obvious ThreeJS/GSAP workarounds.
* **Pure Functional Programming (FP) Over OOP:** Strictly avoid ES6 `class`, `this`, inheritance, and mutable state mutations. Use pure functions, immutable data structures (`readonly` types/arrays), function composition, discriminated unions, and `Result`/`Option` patterns (`fp-ts` style). Even ThreeJS scene controllers and GSAP timelines must be structured as factory functions returning plain objects/closures, never classes.
* **Strict Separation of Concerns (Senior Architecture):**
  * `domain/` — Pure economic formulas, state machines, types, and validation (zero UI, zero ThreeJS, zero DOM imports).
  * `state/` — SolidJS signals/stores, TanStack Query tick/season orchestration, and `localStorage`/`sessionStorage` persistence adapters.
  * `scene/` — Isolated ThreeJS isometric rendering, camera, asset factories, and GSAP timeline controllers subscribing reactively to state snapshots.
  * `ui/` — Presentational SolidJS components (`ui-sdk.dev/docs/solid`), custom hooks/primitives, and Vietnamese localization dictionaries.
* **500-Line Hard File Limit:** No single source file (`.ts`, `.tsx`, `.css`, `.json`) may exceed **500 lines of code**. Decompose large modules into cohesive, single-responsibility sub-modules before hitting this threshold.

## 2. GAME DESIGN DOCUMENT (GDD) — EVN POLITICAL ECONOMY ALLEGORY

* **Title:** Độc Quyền Kinh Tế (*The Rice Monopoly*)
* **Genre:** Macroeconomic, Supply Chain & Political-Economy Tycoon (Isometric 3D/2.5D) simplifying Vietnam Electricity (EVN) natural monopoly, cross-subsidy, and market reform dynamics.
* **Setting & Core Allegory (EVN $\leftrightarrow$ Village Rice Ecosystem):**
  * **The Village** = Vietnam's National Economy (rapidly industrializing, surging rice/energy demand).
  * **Village Chief / Chairman (Trưởng Làng)** = The State (enforces price ceilings, social welfare mandates, and macro-economic stability).
  * **Protagonist & Specialized Corporation (Parent-Subsidiary Structure)** = **EVN** (State-Owned Enterprise granted initial capital and vertical oversight, delegating operations to specialized subsidiaries/managers).
  * **Three Value Chain Pillars:**
    1. **Rice Farming & Input Procurement (Phát điện — EVNGENCO & IPPs):** Competitive production sector. Private farmers and external growers compete alongside the player's own farming subsidiary (~42% state/GENCO share vs. ~58% private/external growers). Player invests in machinery, irrigation/hydro-paddies, and R&D while importing expensive fertilizer/fuel.
    2. **Exclusive Roads & Transport Fleet (Truyền tải — EVNNPT 500kV/220kV):** **Natural Monopoly**. Player builds roads from scratch (`Dirt` $\rightarrow$ `Cobblestone` $\rightarrow$ `Asphalt`) reaching **100% of households, including remote mountain/outskirt huts** (universal social welfare mission), maintaining full state-backed control to avoid duplicate infrastructure waste and security risks.
    3. **Distribution & Retail (Phân phối & Bán lẻ — 5 Power Corporations):** **Cross-Subsidy & Price-Capped Retail**. Player buys inputs at volatile market prices and sells retail rice under Chairman-enforced price ceilings.

### 2.1. Core Gameplay Progression (3-Act Arc)

1. **Act 1: Universal Coverage, Subsidized Growth & Structural Deficit (2022–2023 Loss Era)**
   * **Mandates:** Guarantee village rice security, extend roads to remote households, and supply rapidly growing craft workshops.
   * **Cross-Subsidy Tariff System:**
     * *Workshops/Artisans (Điện sản xuất):* Deeply subsidized below-cost rice rates to fuel village industrialization and attract external investment.
     * *Households (Điện sinh hoạt bậc thang):* Progressive tiered pricing—low-consumption/remote poor households pay heavily subsidized Tier 1 rates, while heavy household consumers pay escalating higher tiers ("high users subsidize low users").
   * **Macro Shocks & Accumulated Debt:** Prolonged drought (*El Niño* drying up cheap hydro-paddies), neighboring conflicts spiking fertilizer/fuel import costs, and currency/exchange pressure force the player to buy high and sell under the Chairman's price cap—pushing the player's balance sheet into deep **accumulated debt** (mirroring EVN's ~50,000 billion VND deficit).

2. **Act 2: The Privatization Debate & Crisis Case Studies**
   * Seeing the player's mounting losses, villagers, workshops, and factions demand: *"Why not privatize the roads and let private merchants take over rice distribution?"*
   * **Interactive Policy & Debate Mechanics:** Player must manage public trust and justify natural monopoly retention using economic reality and historical failure scenarios:
     * *Natural Monopoly & Sunk Cost:* Building parallel private roads wastes village land/capital and breaks grid coordination.
     * *Deregulation Crisis Simulations (Interactive Event Decisions):*
       * **California 2001 Scenario:** Wholesale/input rice prices float freely while retail prices stay frozen + market manipulators hoard supply $\rightarrow$ utility bankruptcy and rolling shortages.
       * **Texas 2021 (Storm Uri) Scenario:** Isolated grid with zero reserve capacity and extreme weather $\rightarrow$ scarcity price spikes (`$9,000/MWh` equivalent) and catastrophic blackouts/famine.
   * **Black Market & Faction Lobbying:**
     * *Smugglers:* Exploit the gap between subsidized workshop rice and external market prices.
     * *Wealthy Workshop Owners:* Offer bribes to classify luxury brewing/baking under subsidized worker tariffs.
     * *Farmers & Workers:* Lobby for higher procurement prices vs. lower retail price caps.

3. **Act 3: Financial Recovery Mechanism & Market Modernization (Decision 05/2024, DPPA & VREM)**
   * **Cost-Recovery Lag Formula (`N - 2` Audit Rule):** To heal accumulated debt without triggering inflation shock, the Chairman enacts the **Decision 05/2024 Reform**—audited input losses from **2 years prior (`N - 2`)** are gradually factored into the current year's regulated retail tariff ceiling.
   * **Market Restructuring & Optional Reforms:**
     * *System Operator Spin-Off (A0 $\rightarrow$ NSMO):* Separate neutral dispatch/scheduling from the player's company for transparency.
     * *Direct Rice Purchase Agreement (DPPA):* Allow large modern workshops to sign direct contracts with private high-tech/green farms, paying the player a **regulated road/grid wheeling toll**.
     * *Competitive Retail Pilot (VREM) & Two-Part Tariff:* Transition from cross-subsidies toward transparent capacity + volume pricing as the village evolves into a modern town.

### 2.2. Core Survival Gauges (Game Over if critical)

1. **Company Treasury / Net Equity (Vàng / Vốn Chủ Sở Hữu):** Tracks operating cash + accumulated debt ceiling. Breaching maximum debt limit without Chairman bailout = Insolvency/Bankruptcy.
2. **Villager & Workshop Satisfaction (%):** Driven by uninterrupted rice supply (zero shortages in remote areas), fair tiered tariffs, and workshop productivity. `0%` = Strikes/Unrest.
3. **Chairman & State Trust (%):** Driven by meeting national KPIs (100% road coverage, industrial growth, controlling inflation, executing `N - 2` recovery cleanly). `0%` = Deposed.

### 2.3. Multiple Endings

* **Kiến Trúc Sư An Ninh Quốc Gia (State-Owned Backbone):** Cleared accumulated debt via `N - 2` reform, maintained 100% universal road coverage, modernized into DPPA/VREM without supply shocks.
* **Tư Bản Đỏ Độc Quyền (Predatory Monopolist):** Abused tariff hikes and bribes to amass huge treasury reserves while villagers and workshops stagnate in poverty.
* **Vỡ Trận Thị Trường / Cách Chức (Market Collapse / Deposed):** Failed to balance `Buy Market - Sell Capped` or botched premature privatization (triggering a California/Texas-style supply collapse), resulting in dismissal.

## 3. TECH STACK, RESPONSIVE UX & ARCHITECTURE

* **Framework:** **SolidJS 2.0** (latest fine-grained signals/stores).
* **Meta-Framework & State:** **TanStack Start (Solid)** + **TanStack Solid Query** (tick/season/year loop & state sync).
* **UI Library:** **UI SDK for Solid** (`https://ui-sdk.dev/docs/solid`) for dashboards, tiered tariff sliders, financial P&L statements (`N - 2` debt tracker), policy debate modals, and charts.
* **Styling & Typography:** **TailwindCSS** (latest) + **`Be Vietnam Pro`** font family (weights 400, 500, 600, 700, 800) configured as default sans font.
* **Cross-Device Responsive Design (Mobile & Desktop Browsers):**
  * Full fluid responsiveness across mobile (`360px`–`767px`), tablet (`768px`–`1023px`), and desktop (`1024px+`) viewports, respecting `100dvh` and mobile safe-area insets (`env(safe-area-inset-*)`).
  * **Adaptive HUD:** Desktop uses persistent side/top analytical panels; mobile collapses controls into bottom sheets/drawers and compact top survival bars without obstructing the 3D village canvas.
  * **Touch & Pointer Parity:** ThreeJS isometric camera supports both desktop mouse drag/scroll-zoom and mobile single-finger pan, two-finger pinch-to-zoom, and tap-to-inspect buildings/roads (`touch-action: none` on canvas). Minimum `44x44px` touch targets on all mobile sliders/buttons.
* **3D & Motion:**
  * **ThreeJS:** Lightweight Isometric 3D village map (hydro-paddies, private farms, remote mountain huts, workshops, exclusive road network, animated transport fleet) with dynamic `devicePixelRatio` scaling for mobile GPU performance.
  * **GSAP:** Camera transitions, seasonal weather shifts (*El Niño* drought visuals vs. monsoon), animated financial counters, UI micro-interactions.
* **Persistence:** Auto-save/load game state, slots, and multi-year financial history to `localStorage` & `sessionStorage` (+ JSON export/import).
* **Tooling:** **Vite** (latest), **`oxlint`**, **`oxfmt`**, **`Vitest`** (100% coverage on `domain/` economic formulas & state transitions).
* **Deployment:** **Vercel** (`vercel.json` configured).

## 4. ENVIRONMENT SETUP: NIX, SKILLS, PLUGINS & GRAPHIFY

### 4.1. Reproducible Nix + Direnv Dev Environment (Step 0 — Before Coding)

Before initializing the app or writing code, bootstrap a reproducible Node.js development environment using **Nix Flakes** modeled after `https://github.com/farbenbuilds/ventiws/blob/main/flake.nix` with full cross-libc support (`glibc` and `musl`):

1. **`flake.nix`:**
   * Define `devShells.<system>.default` (standard `glibc` / macOS toolchain with latest Node.js LTS, `corepack`/`pnpm`, `git`, `oxlint`, `oxfmt`, Playwright/Chromium libs for headless verification) and `devShells.<system>.musl` (using `pkgs.pkgsMusl` on Linux for static/musl-compatible Node.js & native binary execution).
   * Ensure shell hooks configure `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD` / native system browser paths cleanly so native bindings (Vite, Rollup, Oxc) work seamlessly on both `glibc` (Ubuntu/Debian/NixOS) and `musl` (Alpine/Void) hosts.
2. **`.envrc`:** Create `.envrc` at the repository root with the exact detection logic below and run `direnv allow`:
   ```bash
   if [ "$(uname -s)" = "Linux" ]; then
     if ldd /bin/sh 2>&1 | grep -iq "musl"; then
       use flake .#musl
     else
       use flake .#default
     fi
   else
     use flake .#default
   fi
   ```

### 4.2. Install Agent Skills & Plugins (`skills.sh` & GitHub)

Bootstrap agent must install all 18 skills/plugins inside the Nix dev shell prior to coding:

```bash
npx skills add https://www.skills.sh/caldoai/skills/untangle-codebase
npx skills add https://www.skills.sh/vercel-labs/skills/find-skills
npx skills add https://www.skills.sh/mattpocock/skills/grill-me
npx skills add https://www.skills.sh/pbakaus/impeccable/impeccable
npx skills add https://www.skills.sh/dietrichgebert/ponytail/ponytail
npx skills add https://www.skills.sh/juliusbrussee/caveman/caveman
npx skills add https://www.skills.sh/herdrdev/herdr/herdr
npx skills add https://www.skills.sh/suryavirkapur/skills/solidjs
npx skills add https://www.skills.sh/whatiskadudoing/fp-ts-skills/pragmatic-functional-programming
npx skills add https://www.skills.sh/intellectronica/agent-skills/context7
npx skills add https://www.skills.sh/dmmulroy/anti-slop/install-anti-slop
npx skills add https://www.skills.sh/cursor/plugins/thermo-nuclear-code-quality-review
npx skills add https://www.skills.sh/sickn33/agentic-awesome-skills/typescript-expert
npx skills add https://www.skills.sh/cloudai-x/threejs-skills
npx skills add https://www.skills.sh/greensock/gsap-skills/gsap-core
npx skills add https://www.skills.sh/googlechrome/modern-web-guidance/modern-web-guidance
npx skills add https://www.skills.sh/github/awesome-copilot/chrome-devtools
npx skills add https://github.com/msitarzewski/agency-agents
```

### 4.3. Graphify Knowledge Graph Integrations

Configure **Graphify** across all available agent runtimes (OpenCode, Google Antigravity, Claude Code, Codex) and index the repo immediately after scaffolding:

1. OpenCode: `https://graphify.com/integrations/opencode`
2. Google Antigravity: `https://graphify.com/integrations/google-antigravity`
3. Claude Code: `https://graphify.com/integrations/claude-code`
4. Codex: `https://graphify.com/integrations/codex`

## 5. MULTI-AGENT ORCHESTRATION & AUTO-MERGE WORKFLOW

Orchestrate the available agent pool (Codex, OpenCode, Antigravity, Claude) dynamically via **Herdr** (or **Orca**) utilizing specialized personas from `agency-agents` in a continuous loop. Any agent in the pool may assume any role dynamically based on availability and task routing, provided a different agent instance performs the review than the one that authored the code:

$$
\text{Architecture} \longrightarrow \text{Developer} \longrightarrow \text{Integrator} \longrightarrow \text{Reviewer} \longrightarrow (\text{Auto-Merge})
$$

1. **Architecture Role:**
   * *Skills:* `grill-me`, `pragmatic-functional-programming`, `solidjs`, `context7`, `herdr`, `agency-agents`.
   * *Responsibility:* Enforce strict Separation of Concerns (`domain/`, `state/`, `scene/`, `ui/`), define immutable FP schemas, and **autonomously estimate complexity and slice the roadmap into small, atomic, dependency-ordered Git issues/PRs** dispatched via Herdr/Orca.
2. **Developer Role:**
   * *Skills:* `typescript-expert`, `pragmatic-functional-programming`, `solidjs`, `threejs-skills`, `gsap-core`, `impeccable`, `modern-web-guidance`, `install-anti-slop`.
   * *Responsibility:* Implement pure FP engines, factory-based ThreeJS/GSAP modules, mobile-first responsive `ui-sdk.dev/docs/solid` components (Vietnamese copy, `Be Vietnam Pro`, zero emojis), minimal comments, `< 500` LOC per file, and `Vitest` unit tests on branch `feat/issue-<id>-<slug>`.
3. **Integrator Role:**
   * *Skills:* `untangle-codebase`, `ponytail`, `caveman`, `chrome-devtools`.
   * *Responsibility:* Wire SolidJS signals to ThreeJS render loops, GSAP triggers, and `localStorage`/`sessionStorage`; verify desktop (`1440x900`) and mobile (`390x844`) responsive viewports & touch gestures via Chrome DevTools; resolve merge conflicts; ensure `vite build` & Vercel compatibility.
4. **Reviewer Role (Independent Cross-Review):**
   * *Skills:* `thermo-nuclear-code-quality-review`, `install-anti-slop`, `grill-me`, `modern-web-guidance`, `chrome-devtools`.
   * *Responsibility:* Audit FP purity (reject classes/OOP), Separation of Concerns boundaries, `< 500` LOC file cap, zero-emoji compliance, minimal comments, mobile/desktop responsiveness, ThreeJS memory disposal, Vietnamese localization, and test coverage.

### Auto-Merge Policy (Quality Gates)

The agent assigned to the **Reviewer** role holds **auto-merge authority** into `main` once all 6 gates pass:

1. `oxlint` & `oxfmt --check` exit `0`.
2. Automated check confirms zero files exceed `500` lines and zero emojis exist in codebase/UI.
3. Static import check confirms `domain/` has zero imports from `ui/`, `scene/`, or `state/`.
4. `vitest run` passes `100%`.
5. `vite build` succeeds with zero TS errors and Chrome DevTools check passes on both mobile (`390x844`) and desktop (`1440x900`) viewports.
6. Reviewer applies `approved-by-thermo-nuclear-review` label.
   *(Post-merge: Herdr/Orca triggers Graphify re-index and dispatches next autonomously planned issue).*