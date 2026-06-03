"use client";
/* ============================================================
   CLOVA — Mobile app shell: router, bottom nav, screen-jump, tweaks.
   Screens are code-split with React.lazy so each route loads on demand.
   ============================================================ */
import React, { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { Icon, L, Clover } from "./shared.jsx";
import { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakSelect, TweakSlider } from "./tweaks.jsx";
import { useClovaState } from "./app-state.js";

/* Map between the canonical in-app screen (shared with web) and this app's
   own screen vocabulary, so resizing keeps you on the same logical page. */
const M2C = { dashboard: "dashboard", detailRonde: "pool", panelAI: "keeper", riwayat: "log", pengaturan: "settings" };
const C2M = { dashboard: "dashboard", pool: "detailRonde", keeper: "panelAI", log: "riwayat", settings: "pengaturan" };

/* lazy() wants a default export; our screens are named, so map them. */
const lazyNamed = (loader, name) => lazy(() => loader().then((m) => ({ default: m[name] })));

const SCREEN_MAP = {
  loading: lazyNamed(() => import("./screens-intro.jsx"), "ScreenLoading"),
  landing: lazyNamed(() => import("./screens-intro.jsx"), "ScreenLanding"),
  ob1: lazyNamed(() => import("./screens-ob.jsx"), "ScreenOB1"),
  ob2: lazyNamed(() => import("./screens-ob.jsx"), "ScreenOB2"),
  ob3: lazyNamed(() => import("./screens-ob.jsx"), "ScreenOB3"),
  ob4: lazyNamed(() => import("./screens-ob.jsx"), "ScreenOB4"),
  ob5: lazyNamed(() => import("./screens-ob.jsx"), "ScreenOB5"),
  dashboard: lazyNamed(() => import("./screens-dash.jsx"), "ScreenDashboard"),
  panelAI: lazyNamed(() => import("./screens-dash.jsx"), "ScreenPanelAI"),
  undian: lazyNamed(() => import("./screens-app.jsx"), "ScreenUndian"),
  detailRonde: lazyNamed(() => import("./screens-app.jsx"), "ScreenDetailRonde"),
  riwayat: lazyNamed(() => import("./screens-app.jsx"), "ScreenRiwayat"),
  pengaturan: lazyNamed(() => import("./screens-app.jsx"), "ScreenPengaturan"),
};
const ModalTarik = lazyNamed(() => import("./screens-app.jsx"), "ModalTarik");
const ModalCabut = lazyNamed(() => import("./screens-app.jsx"), "ModalCabut");

const TWEAK_DEFAULTS = {
  clover: "#2FA56B",
  gold: "#D9A441",
  headFont: "Fraunces",
  leafDensity: 1,
  dashLayout: "garden",
  drawResult: "win",
};

const HEAD_FONTS = {
  Fraunces: '"Fraunces", Georgia, serif',
  "Playfair Display": '"Playfair Display", Georgia, serif',
  Lora: '"Lora", Georgia, serif',
};

/* screens that show the bottom tab bar */
const TAB_SCREENS = ["dashboard", "detailRonde", "riwayat", "pengaturan"];
const TABS = [
  { k: "dashboard", icon: "home", t: { id: "Kebun", en: "Garden" } },
  { k: "detailRonde", icon: "pool", t: { id: "Kolam", en: "Pool" } },
  { k: "riwayat", icon: "scroll", t: { id: "Catatan", en: "Log" } },
  { k: "pengaturan", icon: "gear", t: { id: "Atur", en: "Settings" } },
];

/* All screens for the jump menu */
const ALL_SCREENS = [
  { k: "loading", t: { id: "Loading", en: "Loading" } },
  { k: "landing", t: { id: "Landing", en: "Landing" } },
  { k: "ob1", t: { id: "Onboarding 1 · Dompet", en: "Onboarding 1 · Wallet" } },
  { k: "ob2", t: { id: "Onboarding 2 · World ID", en: "Onboarding 2 · World ID" } },
  { k: "ob3", t: { id: "Onboarding 3 · Smart Account", en: "Onboarding 3 · Smart Account" } },
  { k: "ob4", t: { id: "Onboarding 4 · Izin Aman ★", en: "Onboarding 4 · Permission ★" } },
  { k: "ob5", t: { id: "Onboarding 5 · Setor", en: "Onboarding 5 · Deposit" } },
  { k: "dashboard", t: { id: "Dashboard ★", en: "Dashboard ★" } },
  { k: "panelAI", t: { id: "Panel AI ★", en: "AI Panel ★" } },
  { k: "undian", t: { id: "Undian / Menang ★", en: "Draw / Win ★" } },
  { k: "detailRonde", t: { id: "Detail Ronde", en: "Round Detail" } },
  { k: "riwayat", t: { id: "Riwayat", en: "History" } },
  { k: "pengaturan", t: { id: "Pengaturan", en: "Settings" } },
];

function Splash() {
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "var(--canvas)" }}>
      <Clover size={52} breathe />
    </div>
  );
}

function BottomNav({ lang, current, go }) {
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 50,
      background: "color-mix(in srgb,var(--canvas-2) 92%, transparent)", backdropFilter: "blur(14px)",
      borderTop: "1px solid var(--hairline)", display: "flex", padding: "8px 10px 14px" }}>
      {TABS.map((tab) => {
        const active = current === tab.k;
        const I = Icon[tab.icon];
        return (
          <button key={tab.k} onClick={() => go(tab.k)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "5px 0", color: active ? "var(--clover)" : "var(--ink-45)" }}>
            <div style={{ position: "relative", transition: "transform .25s var(--ease-back)", transform: active ? "translateY(-1px)" : "none" }}>
              <I size={23} stroke={active ? "var(--clover)" : "var(--ink-45)"} sw={active ? 2.1 : 1.8} />
              {active && <span style={{ position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)", width: 5, height: 5, borderRadius: "50%", background: "var(--clover)" }} />}
            </div>
            <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 600 }}>{L(lang, tab.t)}</span>
          </button>
        );
      })}
    </div>
  );
}

function JumpMenu({ lang, open, setOpen, go, current }) {
  return (
    <>
      <button onClick={() => setOpen(!open)} title="Screens" style={{ position: "absolute", top: 14, left: 14, zIndex: 70,
        width: 34, height: 34, borderRadius: 10, border: "none", cursor: "pointer", background: "color-mix(in srgb,var(--forest) 80%, transparent)",
        color: "#F4FBF6", display: "grid", placeItems: "center", boxShadow: "var(--shadow-soft)", opacity: 0.55 }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)} onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.55)}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>
      {open && (
        <div style={{ position: "absolute", inset: 0, zIndex: 69 }} onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: 56, left: 14, width: 244, maxHeight: "78%", overflowY: "auto",
            background: "var(--canvas-2)", borderRadius: 18, boxShadow: "var(--shadow-lift)", padding: 8, animation: "riseIn .2s" }}>
            <div className="tiny" style={{ fontWeight: 700, color: "var(--ink-45)", padding: "6px 10px", textTransform: "uppercase", letterSpacing: ".06em" }}>{L(lang, { id: "Semua layar", en: "All screens" })}</div>
            {ALL_SCREENS.map((s) => (
              <button key={s.k} onClick={() => { go(s.k); setOpen(false); }} style={{ width: "100%", textAlign: "left", border: "none", cursor: "pointer",
                background: current === s.k ? "var(--sage)" : "transparent", borderRadius: 10, padding: "9px 11px", fontSize: 13, fontWeight: 600,
                fontFamily: "var(--font-body)", color: current === s.k ? "var(--clover-deep)" : "var(--ink)", marginBottom: 2 }}>
                {L(lang, s.t)}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const { lang, setLang, stage, setStage, screen: canonical, setScreen: setCanonical } = useClovaState();
  /* mobile keeps its own richer screen vocabulary; seed it from the shared state */
  const [screen, setScreen] = useState(() =>
    stage === "app" ? (C2M[canonical] || "dashboard") : stage === "onboarding" ? "ob1" : "landing"
  );
  const [modal, setModal] = useState(null);
  const [jumpOpen, setJumpOpen] = useState(false);

  /* failsafe: let reveals animate, then force-settle so content is never stuck
     invisible (paused animation timeline when the tab is hidden). */
  useEffect(() => {
    document.documentElement.classList.remove("reveal-settled");
    const id = setTimeout(() => document.documentElement.classList.add("reveal-settled"), 1700);
    return () => clearTimeout(id);
  }, [screen]);

  /* apply tweak tokens to :root */
  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty("--clover", t.clover);
    r.setProperty("--clover-deep", shade(t.clover, -0.16));
    r.setProperty("--leaf", shade(t.clover, 0.28));
    r.setProperty("--gold", t.gold);
    r.setProperty("--gold-deep", shade(t.gold, -0.38));
    r.setProperty("--font-head", HEAD_FONTS[t.headFont] || HEAD_FONTS.Fraunces);
  }, [t.clover, t.gold, t.headFont]);

  const go = useCallback((s) => {
    setModal(null);
    setScreen(s);
    /* sync the shared stage/screen so the web view stays in lockstep.
       Onboarding (ob*) leaves the stage untouched — it can be entered from
       the landing OR from inside the app (settings → view permission). */
    if (s === "landing" || s === "loading") setStage("landing");
    else if (s.startsWith("ob")) setStage((cur) => (cur === "app" ? "app" : "onboarding"));
    else { setStage("app"); if (M2C[s]) setCanonical(M2C[s]); }
    document.querySelector(".screen")?.scrollTo?.(0, 0);
  }, [setStage, setCanonical]);
  const openModal = useCallback((m) => setModal(m), []);

  const Screen = SCREEN_MAP[screen] || SCREEN_MAP.loading;
  const showTabs = TAB_SCREENS.includes(screen);

  return (
    <div className="app-frame">
      <JumpMenu lang={lang} open={jumpOpen} setOpen={setJumpOpen} go={go} current={screen} />
      <Suspense fallback={<Splash />}>
        <Screen key={screen} lang={lang} go={go} t={t} openModal={openModal} setLang={setLang} />
      </Suspense>
      {showTabs && <BottomNav lang={lang} current={screen} go={go} />}
      {modal === "tarik" && <Suspense fallback={null}><ModalTarik lang={lang} onClose={() => setModal(null)} /></Suspense>}
      {modal === "cabut" && <Suspense fallback={null}><ModalCabut lang={lang} onClose={() => setModal(null)} /></Suspense>}

      <TweaksPanel>
        <TweakSection label={L(lang, { id: "Bahasa", en: "Language" })} />
        <TweakRadio label={L(lang, { id: "Bahasa", en: "Language" })} value={lang} options={["id", "en"]} onChange={setLang} />

        <TweakSection label={L(lang, { id: "Dashboard", en: "Dashboard" })} />
        <TweakRadio label={L(lang, { id: "Tata letak", en: "Layout" })} value={t.dashLayout}
          options={["garden", "calm", "plots"]} onChange={(v) => { setTweak("dashLayout", v); go("dashboard"); }} />

        <TweakSection label={L(lang, { id: "Undian", en: "Draw" })} />
        <TweakRadio label={L(lang, { id: "Hasil", en: "Result" })} value={t.drawResult}
          options={["win", "lose"]} onChange={(v) => { setTweak("drawResult", v); go("undian"); }} />

        <TweakSection label={L(lang, { id: "Brand & gerak", en: "Brand & motion" })} />
        <TweakColor label={L(lang, { id: "Hijau utama", en: "Primary green" })} value={t.clover}
          options={["#2FA56B", "#1F8A5B", "#3FAE7A", "#2E8B7A"]} onChange={(v) => setTweak("clover", v)} />
        <TweakColor label={L(lang, { id: "Emas hadiah", en: "Prize gold" })} value={t.gold}
          options={["#D9A441", "#E0A93E", "#C9952F", "#D9883F"]} onChange={(v) => setTweak("gold", v)} />
        <TweakSelect label={L(lang, { id: "Font judul", en: "Heading font" })} value={t.headFont}
          options={["Fraunces", "Playfair Display", "Lora"]} onChange={(v) => setTweak("headFont", v)} />
        <TweakSlider label={L(lang, { id: "Kerapatan daun", en: "Leaf density" })} value={t.leafDensity}
          min={0} max={1.6} step={0.1} onChange={(v) => setTweak("leafDensity", v)} />
      </TweaksPanel>
    </div>
  );
}

/* lighten/darken a hex color by amt (-1..1) */
function shade(hex, amt) {
  const c = hex.replace("#", "");
  const n = parseInt(c.length === 3 ? c.split("").map((x) => x + x).join("") : c, 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = amt < 0 ? 0 : 255, p = Math.abs(amt);
  r = Math.round((f - r) * p + r); g = Math.round((f - g) * p + g); b = Math.round((f - b) * p + b);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/* The garden canvas (#stage) centers the phone-frame app on larger screens. */
export default function MobileRoot() {
  return (
    <div id="stage">
      <App />
    </div>
  );
}
