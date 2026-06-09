"use client";
/* ============================================================
   CLOVA WEB, top-level router (landing ↔ sidebar app) + tweaks.
   Landing, sidebar and dashboard load eagerly (first paint); the
   remaining screens, the draw overlay and modals are code-split.
   ============================================================ */
import React, { useState, useEffect, lazy, Suspense } from "react";
import "../styles/web.css";
import { L } from "./shared.jsx";
import { Sidebar, WebDashboard } from "./web-app.jsx";
import { WebLanding } from "./web-landing.jsx";
import { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakSelect, TweakSlider } from "./tweaks.jsx";
import { useClovaState } from "./app-state.js";
import { WebSkeleton, OnboardSkeleton } from "./skeletons.jsx";
import { useWallet } from "./wallet-context.jsx";

const lazyNamed = (loader, name) => lazy(() => loader().then((m) => ({ default: m[name] })));
const WebPool = lazyNamed(() => import("./web-screens.jsx"), "WebPool");
const WebKeeper = lazyNamed(() => import("./web-screens.jsx"), "WebKeeper");
const WebLog = lazyNamed(() => import("./web-screens.jsx"), "WebLog");
const WebSettings = lazyNamed(() => import("./web-screens.jsx"), "WebSettings");
const WebDraw = lazyNamed(() => import("./web-screens.jsx"), "WebDraw");
const WebModalTarik   = lazyNamed(() => import("./web-screens.jsx"), "WebModalTarik");
const WebModalCabut   = lazyNamed(() => import("./web-screens.jsx"), "WebModalCabut");
const WebModalDeposit = lazyNamed(() => import("./web-screens.jsx"), "WebModalDeposit");
// Onboarding reuses the same 5 mobile steps, shown as a centered column on web.
const OB_STEPS = {
  ob1: lazyNamed(() => import("./screens-ob.jsx"), "ScreenOB1"),
  ob2: lazyNamed(() => import("./screens-ob.jsx"), "ScreenOB2"),
  ob3: lazyNamed(() => import("./screens-ob.jsx"), "ScreenOB3"),
  ob4: lazyNamed(() => import("./screens-ob.jsx"), "ScreenOB4"),
  ob5: lazyNamed(() => import("./screens-ob.jsx"), "ScreenOB5"),
};

const WEB_TWEAK_DEFAULTS = {
  clover: "#2FA56B",
  gold: "#D9A441",
  headFont: "Fraunces",
  leafDensity: 1,
  drawResult: "win",
};

const WEB_HEAD_FONTS = {
  Fraunces: '"Fraunces", Georgia, serif',
  "Playfair Display": '"Playfair Display", Georgia, serif',
  Lora: '"Lora", Georgia, serif',
};

function shadeW(hex, amt) {
  const c = hex.replace("#", "");
  const n = parseInt(c.length === 3 ? c.split("").map((x) => x + x).join("") : c, 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = amt < 0 ? 0 : 255, p = Math.abs(amt);
  r = Math.round((f - r) * p + r); g = Math.round((f - g) * p + g); b = Math.round((f - b) * p + b);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

const WEB_SCREENS = { dashboard: WebDashboard, pool: WebPool, keeper: WebKeeper, log: WebLog, settings: WebSettings };

/* Onboarding flow on web, drives the shared OB steps in a centered column.
   go("dashboard") finishes; go("landing") backs out to the marketing site. */
function WebOnboarding({ lang, setLang, t, onDone, onExit }) {
  const [step, setStep] = useState("ob1");
  const go = (s) => {
    if (s === "dashboard" || s === "app") return onDone();
    if (s === "landing" || s === "loading") return onExit();
    if (OB_STEPS[s]) { setStep(s); window.scrollTo({ top: 0, behavior: "smooth" }); }
  };
  const Step = OB_STEPS[step] || OB_STEPS.ob1;
  return (
    <div className="web-onboard">
      <div className="web-onboard-col">
        <button className="tlink" style={{ marginBottom: 6 }} onClick={onExit}>
          ← {L(lang, { id: "Kembali ke beranda", en: "Back to home" })}
        </button>
        <Suspense fallback={<OnboardSkeleton />}>
          <Step lang={lang} go={go} t={t} setLang={setLang} />
        </Suspense>
      </div>
    </div>
  );
}

export default function WebApp() {
  const [t, setTweak] = useTweaks(WEB_TWEAK_DEFAULTS);
  const { lang, setLang, stage, setStage, screen, setScreen } = useClovaState();
  const [modal, setModal] = useState(null);
  const [draw, setDraw] = useState(false);
  const wallet = useWallet();

  /* keep the document language in sync for a11y / screen readers */
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  /* When user disconnects MetaMask externally while in app, return to onboarding */
  useEffect(() => {
    if (stage === "app" && !wallet.account) {
      setStage("onboarding");
      window.scrollTo(0, 0);
    }
  }, [wallet.account, stage, setStage]);

  /* reveal failsafe (paused timeline while hidden) */
  useEffect(() => {
    document.documentElement.classList.remove("reveal-settled");
    const id = setTimeout(() => document.documentElement.classList.add("reveal-settled"), 1700);
    return () => clearTimeout(id);
  }, [stage, screen]);

  /* tweak tokens */
  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty("--clover", t.clover);
    r.setProperty("--clover-deep", shadeW(t.clover, -0.16));
    r.setProperty("--leaf", shadeW(t.clover, 0.28));
    r.setProperty("--gold", t.gold);
    r.setProperty("--gold-deep", shadeW(t.gold, -0.38));
    r.setProperty("--font-head", WEB_HEAD_FONTS[t.headFont] || WEB_HEAD_FONTS.Fraunces);
  }, [t.clover, t.gold, t.headFont]);

  const go = (s) => { setScreen(s); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const Screen = WEB_SCREENS[screen] || WebDashboard;

  return (
    <div className="web-root">
      <div className="web-bg" />
      <div className="stage-view" key={stage}>
      {stage === "landing" ? (
        <WebLanding lang={lang} setLang={setLang} t={t} onEnter={() => { setStage("onboarding"); window.scrollTo(0, 0); }} />
      ) : stage === "onboarding" ? (
        <WebOnboarding
          lang={lang} setLang={setLang} t={t}
          onDone={() => { setScreen("dashboard"); setStage("app"); window.scrollTo(0, 0); }}
          onExit={() => { setStage("landing"); window.scrollTo(0, 0); }}
        />
      ) : (
        <div className="app-layout">
          <Sidebar lang={lang} setLang={setLang} screen={screen} go={go} onExit={() => { setStage("landing"); window.scrollTo(0, 0); }} />
          <Suspense fallback={<WebSkeleton />}>
            <Screen lang={lang} setLang={setLang} go={go} t={t} openModal={setModal} onDraw={() => setDraw(true)} />
          </Suspense>
        </div>
      )}
      </div>

      {draw && <Suspense fallback={null}><WebDraw lang={lang} t={t} onClose={() => setDraw(false)} /></Suspense>}
      {modal === "tarik"   && <Suspense fallback={null}><WebModalTarik   lang={lang} onClose={() => setModal(null)} /></Suspense>}
      {modal === "cabut"   && <Suspense fallback={null}><WebModalCabut   lang={lang} onClose={() => setModal(null)} /></Suspense>}
      {modal === "deposit" && <Suspense fallback={null}><WebModalDeposit lang={lang} onClose={() => setModal(null)} /></Suspense>}

      <TweaksPanel>
        <TweakSection label={L(lang, { id: "Bahasa", en: "Language" })} />
        <TweakRadio label={L(lang, { id: "Bahasa", en: "Language" })} value={lang} options={["id", "en"]} onChange={setLang} />
        <TweakSection label={L(lang, { id: "Tampilan", en: "View" })} />
        <TweakRadio label={L(lang, { id: "Halaman", en: "Page" })} value={stage} options={["landing", "onboarding", "app"]} onChange={(v) => { setStage(v); window.scrollTo(0, 0); }} />
        <TweakSection label={L(lang, { id: "Undian", en: "Draw" })} />
        <TweakRadio label={L(lang, { id: "Hasil", en: "Result" })} value={t.drawResult} options={["win", "lose"]} onChange={(v) => { setTweak("drawResult", v); setStage("app"); setDraw(true); }} />
        <TweakSection label={L(lang, { id: "Brand & gerak", en: "Brand & motion" })} />
        <TweakColor label={L(lang, { id: "Hijau utama", en: "Primary green" })} value={t.clover} options={["#2FA56B", "#1F8A5B", "#3FAE7A", "#2E8B7A"]} onChange={(v) => setTweak("clover", v)} />
        <TweakColor label={L(lang, { id: "Emas hadiah", en: "Prize gold" })} value={t.gold} options={["#D9A441", "#E0A93E", "#C9952F", "#D9883F"]} onChange={(v) => setTweak("gold", v)} />
        <TweakSelect label={L(lang, { id: "Font judul", en: "Heading font" })} value={t.headFont} options={["Fraunces", "Playfair Display", "Lora"]} onChange={(v) => setTweak("headFont", v)} />
        <TweakSlider label={L(lang, { id: "Kerapatan daun", en: "Leaf density" })} value={t.leafDensity} min={0} max={1.6} step={0.1} onChange={(v) => setTweak("leafDensity", v)} />
      </TweaksPanel>
    </div>
  );
}
