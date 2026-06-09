import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { L, fmt, useCountUp, CountUp, Clover, Wordmark, LeafShape, LeafFall, CloverWatermark, Ic, Icon, Gardener, VineStepper, CountdownArc, Plant, PixelTree, Confetti, AreaChart, Collapse, Reveal, TopBar, Toast } from './shared.jsx';

/* ============================================================
   CLOVA, Screens: Loading (splash) + Landing
   ============================================================ */

/* ---------------- 1. LOADING / SPLASH ---------------- */
function ScreenLoading({ lang, go, t }) {
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);
  const msgs = [
    { id: "Menyiapkan kebunmu…", en: "Preparing your garden…" },
    { id: "Mengunci modalmu dengan aman…", en: "Securing your principal…" },
    { id: "Menumbuhkan bunga…", en: "Growing the yield…" },
  ];
  const [mi, setMi] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setPct((p) => {
      const next = Math.min(100, p + Math.random() * 9 + 4);
      if (next >= 100) { clearInterval(iv); setTimeout(() => setDone(true), 350); }
      return next;
    }), 280);
    return () => clearInterval(iv);
  }, []);
  useEffect(() => {
    const iv = setInterval(() => setMi((m) => (m + 1) % msgs.length), 1500);
    return () => clearInterval(iv);
  }, []);
  useEffect(() => { if (done) { const t = setTimeout(() => go("landing"), 1100); return () => clearTimeout(t); } }, [done]);

  return (
    <div className="screen" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(120% 70% at 50% 8%, color-mix(in srgb,var(--leaf) 22%, transparent), transparent 60%), var(--canvas)", overflow: "hidden" }}>
      <LeafFall density={t.leafDensity ?? 1} golden={done} />
      <CloverWatermark corner="tl" size={200} opacity={0.05} />
      <CloverWatermark corner="br" size={240} opacity={0.04} />

      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 28,
        animation: "bloomPop .8s var(--ease-back)" }}>
        <div style={{ position: "relative" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 2,
            fontFamily: "var(--font-mark)", fontWeight: 700, fontSize: 58, color: "var(--forest)", letterSpacing: "-.02em" }}>
            Cl
            <span style={{ filter: done ? "drop-shadow(0 0 14px color-mix(in srgb,var(--gold) 70%, transparent))" : "none", transition: "filter .5s" }}>
              <Clover size={56} color={done ? "var(--gold)" : "var(--clover)"} stem={false} breathe={!done} spin={done} />
            </span>
            va
          </span>
        </div>

        {/* growing vine progress */}
        <div style={{ width: 220, position: "relative" }}>
          <svg width="220" height="26" viewBox="0 0 220 26" style={{ overflow: "visible" }}>
            <path d="M4 13 Q 55 2 110 13 T 216 13" fill="none" stroke="color-mix(in srgb,var(--clover) 18%, transparent)" strokeWidth="3" strokeLinecap="round" />
            <path id="vinepath" d="M4 13 Q 55 2 110 13 T 216 13" fill="none" stroke="var(--clover)" strokeWidth="3.4" strokeLinecap="round"
                  pathLength="100" strokeDasharray="100" strokeDashoffset={100 - pct}
                  style={{ transition: "stroke-dashoffset .3s var(--ease-soft)" }} />
            {/* little leaves popping along */}
            {[18, 38, 58, 78, 95].map((p, i) => pct >= p && (
              <g key={i} style={{ animation: "bloomPop .4s var(--ease-back)" }}>
                <g transform={`translate(${4 + (p/100)*212}, ${13 - (i%2?8:-8)})`}>
                  <LeafShape size={13} color={i % 2 ? "var(--leaf)" : "var(--clover)"} style={{ transform: `rotate(${i%2?-30:30}deg)` }} />
                </g>
              </g>
            ))}
          </svg>
        </div>

        <div style={{ height: 22, color: "var(--forest-70)", fontSize: 14.5, fontWeight: 500, minWidth: 240, textAlign: "center" }}>
          <span key={done ? "done" : mi} className="reveal" style={{ animationDuration: ".5s" }}>
            {done ? L(lang, { id: "Kebunmu siap 🍀", en: "Your garden is ready 🍀" }) : L(lang, msgs[mi])}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 2. LANDING ---------------- */
function HowStep({ n, stage, title, body, last }) {
  const cell = [3.6, 4.1, 4.6, 5.1][(stage || n) - 1];
  return (
    <div style={{ display: "flex", gap: 14, position: "relative" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "0 0 auto", width: 56 }}>
        <div style={{ height: 68, display: "flex", alignItems: "flex-end" }}>
          <PixelTree stage={stage || n} cell={cell} />
        </div>
        {!last && <div style={{ flex: 1, width: 2.5, margin: "4px 0", borderLeft: "2.5px dotted color-mix(in srgb,var(--clover) 38%, transparent)", minHeight: 26 }} />}
      </div>
      <div style={{ paddingBottom: last ? 0 : 18 }}>
        <div className="row aic gap-8" style={{ marginBottom: 4 }}>
          <span className="badge badge-safe" style={{ width: 22, height: 22, padding: 0, justifyContent: "center", borderRadius: "50%" }}>{n}</span>
          <div className="head" style={{ fontSize: 17 }}>{title}</div>
        </div>
        <div className="muted" style={{ fontSize: 14, lineHeight: 1.5 }}>{body}</div>
      </div>
    </div>
  );
}

function ScreenLanding({ lang, go, t }) {
  const steps = [
    { icon: Icon.sprout, title: { id: "Setor & Tanam", en: "Deposit & Plant" },
      body: { id: "Danamu di-stake ke Aave dari dompetmu. Modal awal dicatat sebagai baseline.", en: "Your funds are staked to Aave from your own wallet. The principal is recorded as a baseline." } },
    { icon: Icon.robot, title: { id: "AI Memelihara", en: "AI Tends It" },
      body: { id: "Agen Venice memantau kesehatan protokol, bukan cuma APY, dalam izin ketat. Tiap keputusan dijelaskan.", en: "The Venice agent watches protocol health, not just APY, under strict permissions. Every decision is explained." } },
    { icon: Icon.drop, title: { id: "Panen Bunga", en: "Harvest the Yield" },
      body: { id: "Tiap ronde, hanya BUNGA (bukan modal) disapu jadi Kolam Hadiah bersama.", en: "Each round, only the YIELD (never principal) is swept into a shared Prize Pool." } },
    { icon: Icon.trophy, title: { id: "Undian Adil", en: "Fair Draw" },
      body: { id: "Pemenang dipilih acak (VRF). Menang dapat bunga gabungan; sisanya modal utuh, bisa ditarik kapan saja.", en: "A winner is drawn at random (VRF). Win, and you get the combined yield; otherwise your principal stays whole, withdrawable anytime." } },
  ];
  const safety = [
    { id: "AI tak bisa menyentuh modal pokok.", en: "The AI cannot touch your principal." },
    { id: "AI tak bisa kirim ke alamat di luar daftar putih.", en: "The AI cannot send funds outside the whitelist." },
    { id: "Kamu bisa cabut izin kapan saja, langsung.", en: "You can revoke permission anytime, instantly." },
  ];

  return (
    <div className="screen">
      <LeafFall density={(t.leafDensity ?? 1) * 0.7} />
      {/* top mini bar */}
      <div className="row between aic" style={{ padding: "16px 18px 0", position: "relative", zIndex: 5 }}>
        <Wordmark size={26} />
        <button className="chip btn-sm" style={{ padding: "7px 12px" }} onClick={() => go("dashboard")}>
          <Icon.spark size={15} stroke="var(--clover-deep)" /> {L(lang, { id: "Demo", en: "Demo" })}
        </button>
      </div>

      {/* HERO */}
      <div style={{ position: "relative", padding: "26px 22px 8px", zIndex: 2 }}>
        <div style={{ position: "absolute", right: -36, top: -6, opacity: .9, zIndex: -1 }}>
          <Clover size={210} color="color-mix(in srgb,var(--leaf) 70%, var(--clover))" breathe />
        </div>
        <Reveal delay={40}>
          <h1 style={{ fontSize: 38, lineHeight: 1.04, maxWidth: 320 }}>
            {L(lang, { id: "Tabung. Jangan pernah rugi.", en: "Save. Never lose." })}{" "}
            <span style={{ color: "var(--clover)" }}>{L(lang, { id: "Menangkan bunga semua orang.", en: "Win everyone's yield." })}</span>
          </h1>
        </Reveal>
        <Reveal delay={140}>
          <p className="muted" style={{ fontSize: 15.5, lineHeight: 1.55, maxWidth: 360, marginTop: 14 }}>
            {L(lang, { id: "Modalmu tetap di dompetmu sendiri dan tak pernah hilang. AI menumbuhkannya di protokol DeFi teruji. Tiap ronde, bunga semua peserta jadi kolam hadiah dan diundi adil.",
                       en: "Your principal stays in your own wallet and is never lost. AI grows it across battle-tested DeFi. Each round, everyone's yield becomes a prize pool, drawn fairly." })}
          </p>
        </Reveal>
        <Reveal delay={240} className="row gap-10 wrap" style={{ marginTop: 20 }}>
          <button className="btn btn-primary btn-lg" onClick={() => go("ob1")}>
            <Icon.sprout size={19} stroke="#F4FBF6" /> {L(lang, { id: "Mulai Menanam", en: "Start Planting" })}
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => { document.getElementById("how")?.scrollIntoView?.({ behavior: "smooth" }); }}>
            {L(lang, { id: "Lihat Cara Kerja", en: "See How" })}
          </button>
        </Reveal>
        <Reveal delay={340} className="row gap-8 wrap" style={{ marginTop: 18 }}>
          {[{ i: Icon.shieldLeaf, t: { id: "Modal tak tersentuh", en: "Principal untouched" } },
            { i: Icon.leaf, t: { id: "Peluang proporsional deposit", en: "Proportional deposit chance" } },
            { i: Icon.robot, t: { id: "Setiap keputusan dijelaskan", en: "Every decision explained" } }].map((c, i) => (
            <span key={i} className="chip tiny" style={{ padding: "8px 12px" }}>
              <c.i size={15} stroke="var(--clover-deep)" /> {L(lang, c.t)}
            </span>
          ))}
        </Reveal>
      </div>

      {/* CARA KERJA */}
      <div id="how" style={{ padding: "30px 22px 8px", position: "relative", zIndex: 2 }}>
        <Reveal className="head" style={{ fontSize: 13, letterSpacing: ".08em", color: "var(--clover-deep)", textTransform: "uppercase", marginBottom: 4 }}>
          {L(lang, { id: "Cara Kerja", en: "How It Works" })}
        </Reveal>
        <Reveal delay={60}><h2 style={{ fontSize: 25, marginBottom: 18 }}>{L(lang, { id: "Empat langkah, kebun bertumbuh", en: "Four steps, a growing garden" })}</h2></Reveal>
        <div className="card" style={{ padding: "22px 20px" }}>
          {steps.map((s, i) => (
            <HowStep key={i} n={i + 1} stage={i + 1} last={i === 3}
              title={L(lang, s.title)} body={L(lang, s.body)} />
          ))}
        </div>
      </div>

      {/* KENAPA AMAN */}
      <div style={{ padding: "26px 22px 8px", position: "relative", zIndex: 2 }}>
        <div className="card card-sage" style={{ padding: "24px 20px", overflow: "hidden" }}>
          <CloverWatermark corner="br" size={150} opacity={0.07} />
          <div className="row aic gap-10" style={{ marginBottom: 6 }}>
            <Icon.shieldLeaf size={26} stroke="var(--clover-deep)" />
            <span className="badge badge-safe">{L(lang, { id: "Paling penting", en: "Most important" })}</span>
          </div>
          <h2 style={{ fontSize: 23, lineHeight: 1.12, marginBottom: 16 }}>
            {L(lang, { id: "Aman bukan karena percaya AI, tapi karena dipaksa kode.", en: "Safe not because you trust the AI, but because code enforces it." })}
          </h2>
          <div className="col gap-12">
            {safety.map((s, i) => (
              <div key={i} className="row gap-10" style={{ alignItems: "flex-start" }}>
                <div style={{ flex: "0 0 auto", marginTop: 1 }}><Icon.shield size={20} stroke="var(--clover)" /></div>
                <div style={{ fontSize: 14.5, lineHeight: 1.45, color: "var(--ink)", fontWeight: 500 }}>{L(lang, s)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HADIAH (gold accent allowed) */}
      <div style={{ padding: "26px 22px 8px", position: "relative", zIndex: 2 }}>
        <div className="card" style={{ background: "linear-gradient(160deg, color-mix(in srgb,var(--gold) 12%, var(--canvas-2)), var(--canvas-2))",
          textAlign: "center", padding: "26px 20px", overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, opacity: .5 }}><LeafFall density={0.4} golden /></div>
          <div className="badge badge-win" style={{ position: "relative", marginBottom: 12 }}><Icon.trophy size={14} stroke="var(--gold-deep)" /> {L(lang, { id: "Kolam ronde ini", en: "This round's pool" })}</div>
          <div className="head tnum" style={{ fontSize: 46, color: "var(--gold-deep)", position: "relative" }}>
            <CountUp value={1284} dec={0} suffix=" USDC" />
          </div>
          <div className="muted tiny" style={{ marginTop: 6, position: "relative" }}>{L(lang, { id: "248 penanam ikut ronde #12", en: "248 planters in round #12" })}</div>
        </div>
      </div>

      {/* FOOTER disclaimer */}
      <div style={{ padding: "22px 22px 30px", position: "relative", zIndex: 2 }}>
        <button className="btn btn-primary btn-block btn-lg" onClick={() => go("ob1")} style={{ marginBottom: 18 }}>
          {L(lang, { id: "Mulai Menanam", en: "Start Planting" })} <Icon.arrow size={18} stroke="#F4FBF6" />
        </button>
        <div className="tiny" style={{ color: "var(--ink-45)", lineHeight: 1.5, textAlign: "center" }}>
          {L(lang, { id: "No-loss ≠ no-risk. Dana ditempatkan di protokol teruji (Aave, Compound, Morpho, Moonwell). Biaya platform ~10% dari bunga; modal tak pernah dipotong.",
                     en: "No-loss ≠ no-risk. Funds sit in audited protocols (Aave, Compound, Morpho, Moonwell). Platform fee ~10% of yield; principal is never cut." })}
        </div>
      </div>
    </div>
  );
}

export { ScreenLoading, ScreenLanding };
