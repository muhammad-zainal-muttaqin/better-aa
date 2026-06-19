# 🎨 better-aa UI Redesign — Awwwards-Tier Overhaul

> **Goal:** Transform from "clean but generic dark dashboard" to "$150k agency build" — haptic depth, cinematic motion, premium typography, obsessive micro-interactions.

---

## 🎯 Design Direction (Ethereal Glass + Asymmetrical Bento)

**Vibe:** Ethereal Glass — OLED black (#050505), radial mesh gradients, vantablack cards, heavy backdrop-blur, white/10 hairlines.  
**Layout:** Asymmetrical Bento — masonry grid with varying card sizes to break visual monotony.

---

## ✅ PHASE 1: Typography & Foundations (30 min)

### 1.1 — Upgrade Font Stack
- [ ] Switch from `Geist` → `Clash Display` for headings (or keep Geist but add variable weight axis)
- [ ] Keep `Geist Mono` for data/numbers — already premium
- [ ] Add `font-variation-settings` for optical weight tuning
- [ ] Bump hero h1 to `clamp(38px, 5.5vw, 72px)` — currently too small
- [ ] Add `font-feature-settings: "ss01", "ss02"` for alternate glyphs if available

### 1.2 — Color System Refinement
- [ ] Darken base background: `--bg: #08080a` → `--bg: #050507` (deeper OLED black)
- [ ] Add a second ambient glow orb (teal + violet mesh gradient)
- [ ] Create `--glass` token: `rgba(255,255,255,0.03)` for glass surfaces
- [ ] Add `--glass-border: rgba(255,255,255,0.06)` — lighter than current border
- [ ] Accent color stays `#2dd4bf` (teal) — add a complementary `--accent-2: #8b5cf6` (violet) for secondary highlights

### 1.3 — Spacing Rhythm Overhaul
- [ ] Section padding: `py-30px` → `py-56px` minimum (macro-whitespace)
- [ ] Hero section: add `padding-bottom: 80px` for breathing room
- [ ] Card internal padding: `20px` → `28px 32px` for luxury feel
- [ ] KPI strip gap: `14px` → `18px`

---

## ✅ PHASE 2: Card Architecture — Double-Bezel Pattern (45 min)

### 2.1 — KPI Cards (StatStrip)
- [ ] Wrap each `.kpi` in outer shell: `p-1.5 rounded-[1.25rem] bg-white/[0.03] ring-1 ring-white/[0.06]`
- [ ] Inner core: own bg, `rounded-[calc(1.25rem-0.375rem)]`, inset shadow `shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]`
- [ ] Add subtle mesh gradient overlay per card (unique radial glow per metric)
- [ ] KPI value: increase to `34px` mono, add `text-shadow: 0 0 40px rgba(45,212,191,0.15)` for glow
- [ ] Model name: add tiny creator icon dot with pulse animation on hover

### 2.2 — Chart Cards
- [ ] Apply Double-Bezel to `.card` class globally
- [ ] Outer shell: `rounded-[2rem] p-[3px] bg-gradient-to-br from-white/[0.06] to-white/[0.02]`
- [ ] Inner core: `rounded-[calc(2rem-3px)] bg-[#0a0a0d]`
- [ ] Add `box-shadow: 0 0 80px -20px rgba(45,212,191,0.06)` for ambient teal glow

### 2.3 — Table Card
- [ ] Same Double-Bezel treatment
- [ ] Add sticky header backdrop-blur: `backdrop-blur-xl bg-[#0a0a0d]/80`
- [ ] Row hover: `background: linear-gradient(90deg, rgba(45,212,191,0.04), transparent)` instead of flat white overlay

---

## ✅ PHASE 3: Charts & Scatter — Premium Visual Overhaul (60 min)

### 3.1 — Intelligence vs Price Scatter (Hero Chart)
- [ ] Increase chart height: `420px` → `520px` for dramatic presence
- [ ] Dot sizing: use `ZAxis range={[36, 90]}` — smaller min, larger max for more variance
- [ ] Add dot glow effect: `filter: drop-shadow(0 0 6px rgba(creatorColor, 0.4))` via SVG filter
- [ ] Frontier line: thicker stroke `2.5px`, add animated gradient dash
- [ ] Grid lines: `strokeDasharray: "4 8"` — more spacing, less noise
- [ ] Add subtle animated "breathing" pulse to frontier dots (CSS `@keyframes pulse`)
- [ ] Tooltip: upgrade to Double-Bezel glass card with `backdrop-blur-2xl`
- [ ] Add "Efficiency frontier" label at the line's midpoint with connecting line

### 3.2 — Ranked Bar Charts (Speed, Price, Latency, Tokens)
- [ ] Bar width: increase `maxBarSize: 20` → `maxBarSize: 24`
- [ ] Bar radius: `[0, 5, 5, 0]` → `[0, 8, 8, 0]` for squircle feel
- [ ] Add subtle gradient to bars: `linear-gradient(90deg, creatorColor, creatorColor-lighter)`
- [ ] Bar hover: scale up slightly with glow effect
- [ ] Y-axis labels: increase to `12.5px`, add slight left padding
- [ ] Value labels: add background pill behind the number for readability
- [ ] Sort animation: add `isAnimationActive={true}` with `animationDuration={800}` and `animationEasing="ease-out"`

### 3.3 — New Chart: Benchmark Radar/Spider (if feasible)
- [ ] Add radar chart comparing top 5 models across GPQA, LiveCodeBench, AIME, MMLU-Pro, HLE
- [ ] Use semi-transparent fills with creator colors
- [ ] Interactive: hover to isolate a model's polygon

### 3.4 — New Chart: Speed vs Intelligence Bubble
- [ ] Scatter plot: X=speed, Y=intelligence, bubble size=price (inverted — bigger = cheaper)
- [ ] Highlights the "fast AND smart" quadrant
- [ ] Animated entry with staggered dots

---

## ✅ PHASE 4: Micro-Interactions & Motion (45 min)

### 4.1 — Entry Animations (Scroll Reveal)
- [ ] KPI cards: staggered fade-up with `translate-y-16 blur-md opacity-0` → resolved over `800ms`
- [ ] Chart cards: same pattern, delayed `100ms` per card
- [ ] Table: gentle fade-in `600ms` after charts settle
- [ ] Use `IntersectionObserver` for viewport entry (not scroll listener)
- [ ] Respect `prefers-reduced-motion` — skip all animations

### 4.2 — Hover Physics
- [ ] KPI cards: `transform: translateY(-4px)` + border glow intensifies
- [ ] Chart cards: subtle `scale(1.005)` with `transition: transform 600ms cubic-bezier(0.32,0.72,0,1)`
- [ ] Table rows: left-border accent flash on hover (3px teal line slides in)
- [ ] Creator legend chips: `active:scale-[0.96]` physical press feel

### 4.3 — Custom Cubic-Bezier Curves
- [ ] Replace all `var(--ease)` with `cubic-bezier(0.32, 0.72, 0, 1)` — heavier, more physical
- [ ] Add `--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)` for bouncy elements
- [ ] Stagger delays: use `calc(var(--i) * 80ms)` instead of `70ms`

### 4.4 — Ambient Background Motion
- [ ] Add subtle animated gradient orbs (2-3) that slowly drift across the background
- [ ] Use CSS `@keyframes drift` with `transform: translate()` — GPU-safe
- [ ] Very low opacity: `0.04-0.08` — atmospheric, not distracting

---

## ✅ PHASE 5: Hero Section — Cinematic Header (30 min)

### 5.1 — Hero Typography
- [ ] h1: increase to `clamp(38px, 5.5vw, 72px)` with tighter `letter-spacing: -0.045em`
- [ ] Add animated gradient text: teal → white → violet gradient that shifts on scroll
- [ ] Eyebrow badge: make it a floating pill with `backdrop-blur` and subtle glow
- [ ] Subtitle: increase to `17px`, add `line-height: 1.65`

### 5.2 — Hero Atmosphere
- [ ] Add large radial glow behind h1: `radial-gradient(ellipse at 30% 50%, rgba(45,212,191,0.08), transparent 70%)`
- [ ] Add subtle grid pattern overlay (very faint): `rgba(255,255,255,0.015)` grid lines
- [ ] Brand logo: add subtle rotation on hover (`rotate(360deg)` over 800ms)

### 5.3 — Attribution Badge
- [ ] Upgrade to pill with glass effect: `backdrop-blur-xl bg-white/[0.04] ring-1 ring-white/[0.08]`
- [ ] Add subtle icon before "data" text
- [ ] Hover: slight scale + border glow

---

## ✅ PHASE 6: Table Premium Polish (30 min)

### 6.1 — Header Treatment
- [ ] Sticky header: add `backdrop-blur-2xl bg-[#0a0a0d]/70`
- [ ] Column headers: add subtle bottom gradient line instead of flat border
- [ ] Sort caret: animate rotation with spring physics
- [ ] Active sort column: subtle background tint `rgba(45,212,191,0.03)`

### 6.2 — Row Enhancements
- [ ] Rank column: add subtle background tint for top 3 (gold, silver, bronze opacity)
- [ ] Model name: add tiny model-type icon (reasoning = brain, open = unlock)
- [ ] Intelligence bar: make it thicker `6px` with rounded ends + subtle glow
- [ ] Heatmap: increase contrast — floor `0.06` → ceiling `0.32`

### 6.3 — Filter/Controls Area
- [ ] Search input: glass morphism `backdrop-blur bg-white/[0.03] ring-1 ring-white/[0.08]`
- [ ] Date presets: pill buttons with active state glow
- [ ] Tab bar: glass segmented control with `backdrop-blur`
- [ ] Add smooth transition when switching views (fade columns in/out)

---

## ✅ PHASE 7: Tooltip & Overlay Polish (20 min)

### 7.1 — Chart Tooltips
- [ ] Double-Bezel glass card: `backdrop-blur-2xl bg-black/60 ring-1 ring-white/[0.1]`
- [ ] Rounded: `rounded-2xl`
- [ ] Add subtle shadow: `shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]`
- [ ] Creator dot: add subtle pulse animation
- [ ] "Frontier" badge: accent glow effect

### 7.2 — Empty States
- [ ] Upgrade from dashed border to subtle glass card with icon
- [ ] Add gentle float animation to the empty state illustration

---

## ✅ PHASE 8: Footer & Finishing Touches (15 min)

### 8.1 — Footer
- [ ] Increase top padding: `34px` → `56px`
- [ ] Add subtle top gradient line instead of flat border
- [ ] Link hover: add underline slide-in animation
- [ ] Add "Built with ♥" or similar brand touch

### 8.2 — Global Polish
- [ ] Scrollbar styling: thin, glass-effect scrollbar for WebKit + Firefox
- [ ] Selection color: `::selection { background: rgba(45,212,191,0.2); }`
- [ ] Focus visible: custom ring style matching accent color
- [ ] Add `<meta name="theme-color" content="#050507">` for mobile chrome

---

## ✅ PHASE 9: Performance & Accessibility (20 min)

### 9.1 — Performance Guardrails
- [ ] Verify no `top/left/width/height` animations — only `transform/opacity`
- [ ] `backdrop-blur` only on fixed/sticky elements, never scrolling content
- [ ] Noise overlay: `position: fixed; pointer-events: none` — already done ✓
- [ ] Add `will-change: transform` only to actively animating elements
- [ ] Verify `content-visibility: auto` on table rows — already done ✓

### 9.2 — Accessibility
- [ ] All interactive elements: visible focus rings
- [ ] `aria-label` on all icon-only buttons
- [ ] Color contrast: verify WCAG AA on all text (especially muted colors)
- [ ] Reduced motion: skip all animations — already partially done ✓

---

## 📊 Metrics to Track

| Metric | Current | Target |
|--------|---------|--------|
| Hero h1 size | ~50px max | 72px max |
| Section padding | 30px | 56px+ |
| Card border radius | 16px | 24-32px |
| Chart height (scatter) | 420px | 520px |
| Hover transform | -2px translateY | -4px + glow |
| Transition curve | ease | cubic-bezier(0.32,0.72,0,1) |
| Ambient glow | 1 orb | 2-3 orbs |
| Entry animation | simple fade | fade + blur + translate |

---

## 🚀 Execution Order

1. **Phase 1** (Foundations) — sets up tokens for everything else
2. **Phase 2** (Double-Bezel) — biggest visual impact per line of code
3. **Phase 5** (Hero) — first thing users see
4. **Phase 3** (Charts) — the main attraction
5. **Phase 6** (Table) — data-heavy, needs careful polish
6. **Phase 4** (Motion) — ties everything together
7. **Phase 7** (Tooltips) — detail work
8. **Phase 8** (Footer) — finishing touches
9. **Phase 9** (Perf/A11y) — final verification

---

## ⚠️ Constraints (must preserve)

- [ ] HTML-first: all data visible with JS disabled
- [ ] Charts are ONLY hydrated island — never move data into React
- [ ] `<main translate="no">` stays — prevents translate crash
- [ ] `content-visibility: auto` on rows — performance for 500+ models
- [ ] Astro 5.x + @astrojs/cloudflare 12.x — no major dep upgrades
- [ ] SSR renders full table — no client-only data loading
