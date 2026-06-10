# Clova — Frontend

Next.js (App Router) implementation of the Clova UI: a no-loss prize-linked savings app with a botanical / "growing garden" fintech design.

Built faithfully from the design reference in `../clova ui reference`. **One app, one URL (`/`)** — the experience is chosen by viewport width and switches live on resize:

- **Phone (< 768px)** → the mobile phone-frame design: loading → landing → 5-step onboarding → tabbed app (garden, pool, log, settings) with draw/win and AI-transparency screens.
- **Tablet / desktop (≥ 768px)** → the web design: marketing landing → sidebar app (dashboard, prize pool, AI keeper, log, settings). The sidebar collapses to a top bar on smaller widths.

Only the chosen experience's chunk is downloaded. (Change the breakpoint in `src/app/page.jsx`.)

## Run

```bash
npm install
npm run dev      # http://localhost:3000  (and /mobile)
npm run build    # production build
npm start        # serve the build
```

Requires Node 18+. Stack: Next 16, React 19. No Tailwind — the look is a hand-authored CSS design system (see below).

## Structure

```
src/
  app/
    layout.jsx          root layout: <html>, Google Fonts, global design-system CSS
    page.jsx            single responsive entry → picks Mobile/Web by viewport (ssr:false)
  components/
    shared.jsx          primitives: Clover/Wordmark/Leaf motifs, Icon set, CountUp,
                        VineStepper, CountdownArc, Plant, Confetti, AreaChart, TopBar…
    tweaks.jsx          dev-only floating "Tweaks" panel + controls (renders nothing
                        unless an external editor host activates it)
    screens-intro.jsx   ScreenLoading, ScreenLanding            (mobile)
    screens-ob.jsx      ScreenOB1–5 onboarding + useFlow/StatePill/OBShell (mobile)
    screens-dash.jsx    ScreenDashboard, ScreenPanelAI          (mobile)
    screens-app.jsx     Undian/DetailRonde/Riwayat/Pengaturan + modals (mobile)
    web-landing.jsx     WebLanding marketing site               (web)
    web-app.jsx         Sidebar, MainHead, WebDashboard         (web)
    web-screens.jsx     WebPool/Keeper/Log/Settings, WebDraw, modals (web)
    mobile-app.jsx      mobile router (bottom nav, screen-jump, live theming)
    web-root.jsx        web router (landing ↔ app, live theming)
  styles/
    styles.css          design system: tokens, buttons, cards, badges, animations
    web.css             desktop layout: sidebar, bento grid, landing sections
```

## How it works

- **Client-only SPA.** The entry uses `window.matchMedia` to mount either `<MobileApp/>` or `<WebApp/>`, each via `next/dynamic` with `ssr: false`. In-app routing is in-memory (`useState` + `localStorage`), matching the original prototype and avoiding SSR/`window` issues.
- **Lazy loading.** Each route only eager-loads its first paint (landing + dashboard); every other screen, the draw overlay and the modals are `React.lazy` + `<Suspense>` chunks that load on demand.
- **Live theming.** Primary green, prize gold and the heading font are CSS custom properties (`--clover`, `--gold`, `--font-head`) updated at runtime — see the Tweaks panel.
- **Bilingual.** Indonesian (default) / English via the `L(lang, {id, en})` helper; the choice persists in `localStorage`.

## Design system

Botanical fintech, **light theme**. Jade green is primary; gold is reserved **only** for prizes/wins. See `../design-system/clova/MASTER.md` for the full token reference. Fonts: Fraunces (headings), Hanken Grotesk (body), Quicksand (wordmark).

> The `tweaks.jsx` panel is a prototyping artifact (it talks to an external editor host) and is inert in normal use. Full Web3 integration is live: MetaMask Smart Accounts (EIP-7702 + ERC-7710 delegation), Aave deposit, yield sweep, protocol rotation via RotationHelper, and AI Transparency Panel — see `src/components/wallet-context.jsx`.
