import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { L, fmt, useCountUp, CountUp, Clover, Wordmark, LeafShape, LeafFall, CloverWatermark, Ic, Icon, Gardener, VineStepper, CountdownArc, Plant, PixelTree, Confetti, AreaChart, Collapse, Reveal, TopBar, Toast } from './shared.jsx';
import { SafetyBonsai } from './web-bonsai.jsx';

/* ============================================================
   CLOVA WEB — Marketing landing page (desktop-first, responsive)
   ============================================================ */

function WebNav({ lang, setLang, onEnter }) {
  const links = [
    { id: "how", t: { id: "Cara Kerja", en: "How it works" } },
    { id: "safe", t: { id: "Keamanan", en: "Safety" } },
    { id: "prize", t: { id: "Hadiah", en: "Prizes" } },
  ];
  const jump = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  return (
    <div className="lnav">
      <div className="maxw lnav-in">
        <Wordmark size={28} />
        <div className="lnav-links">
          {links.map((l) => <button key={l.id} className="lnav-link" onClick={() => jump(l.id)}>{L(lang, l.t)}</button>)}
          <div className="seg">
            {["id", "en"].map((lc) => <button key={lc} className={lang === lc ? "on" : ""} onClick={() => setLang(lc)}>{lc.toUpperCase()}</button>)}
          </div>
          <button className="btn btn-primary btn-sm" onClick={onEnter}>{L(lang, { id: "Buka App", en: "Open App" })} <Icon.arrow size={16} stroke="#F4FBF6" /></button>
        </div>
      </div>
    </div>
  );
}

function WebHowCard({ n, title, body, accent }) {
  // trees grow bigger left → right; all bottom-aligned on a shared ground line
  const cell = [6.4, 7.3, 8.2, 9.1][n - 1];
  return (
    <div style={{ padding: "0 22px", position: "relative", borderLeft: n === 1 ? "none" : "1px dashed color-mix(in srgb,var(--clover) 28%, transparent)" }}>
      <div style={{ height: 124, display: "flex", alignItems: "flex-end", marginBottom: 14 }}>
        <PixelTree stage={n} cell={cell} />
      </div>
      <div className="row aic gap-8" style={{ marginBottom: 8 }}>
        <span className="badge badge-safe" style={{ width: 24, height: 24, padding: 0, justifyContent: "center", borderRadius: "50%" }}>{n}</span>
        <div className="head" style={{ fontSize: 19 }}>{title}</div>
      </div>
      <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.55 }}>{body}</p>
    </div>
  );
}

function WebLanding({ lang, setLang, t, onEnter }) {
  const steps = [
    { icon: Icon.sprout, title: { id: "Setor & Tanam", en: "Deposit & Plant" }, body: { id: "Danamu di-stake ke Aave dari dompetmu. Modal awal dicatat sebagai baseline.", en: "Your funds are staked to Aave from your own wallet. Principal is recorded as a baseline." } },
    { icon: Icon.robot, title: { id: "AI Memelihara", en: "AI Tends It" }, body: { id: "Agen Venice memantau kesehatan protokol dalam izin ketat. Tiap keputusan dijelaskan.", en: "The Venice agent watches protocol health under strict permissions. Every decision explained." } },
    { icon: Icon.drop, title: { id: "Panen Bunga", en: "Harvest Yield" }, body: { id: "Tiap ronde, hanya bunga (bukan modal) disapu jadi Kolam Hadiah bersama.", en: "Each round, only yield (never principal) is swept into a shared Prize Pool." } },
    { icon: Icon.trophy, title: { id: "Undian Adil", en: "Fair Draw" }, body: { id: "Pemenang dipilih acak (VRF). Sisanya modal utuh, bisa ditarik kapan saja.", en: "A winner is drawn at random (VRF). Otherwise principal stays whole, withdrawable anytime." }, accent: true },
  ];
  const safety = [
    { id: "AI tak bisa menyentuh modal pokok.", en: "The AI cannot touch your principal." },
    { id: "AI tak bisa kirim ke alamat di luar daftar putih.", en: "The AI cannot send funds outside the whitelist." },
    { id: "Kamu bisa cabut izin kapan saja, langsung.", en: "You can revoke permission anytime, instantly." },
  ];
  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      <LeafFall density={(t.leafDensity ?? 1) * 0.6} />
      <WebNav lang={lang} setLang={setLang} onEnter={onEnter} />

      {/* HERO */}
      <div className="maxw">
        <div className="hero">
          <div>
            <Reveal className="row aic gap-8" style={{ marginBottom: 20 }}>
              <span className="badge badge-safe"><Icon.shieldLeaf size={14} stroke="var(--clover-deep)" /> {L(lang, { id: "Tabungan tanpa rugi modal", en: "No-loss savings" })}</span>
            </Reveal>
            <Reveal delay={60}><h1 className="hero-title head">
              {L(lang, { id: "Tabung. Jangan pernah rugi.", en: "Save. Never lose." })}{" "}
              <span style={{ color: "var(--clover)" }}>{L(lang, { id: "Menangkan bunga semua orang.", en: "Win everyone's yield." })}</span>
            </h1></Reveal>
            <Reveal delay={140}><p className="muted" style={{ fontSize: 18, lineHeight: 1.55, maxWidth: 520, marginTop: 26 }}>
              {L(lang, { id: "Modalmu tetap di dompetmu sendiri dan tak pernah hilang. AI menumbuhkannya di protokol DeFi teruji. Tiap ronde, bunga semua peserta jadi kolam hadiah dan diundi adil.",
                         en: "Your principal stays in your own wallet and is never lost. AI grows it across battle-tested DeFi. Each round, everyone's yield becomes a prize pool, drawn fairly." })}
            </p></Reveal>
            <Reveal delay={220} className="row gap-12 wrap" style={{ marginTop: 30 }}>
              <button className="btn btn-primary btn-lg" onClick={onEnter}><Icon.sprout size={20} stroke="#F4FBF6" /> {L(lang, { id: "Mulai Menanam", en: "Start Planting" })}</button>
              <button className="btn btn-secondary btn-lg" onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}>{L(lang, { id: "Lihat Cara Kerja", en: "See How" })}</button>
            </Reveal>
            <Reveal delay={300} className="row gap-10 wrap" style={{ marginTop: 26 }}>
              {[{ i: Icon.shieldLeaf, t: { id: "Modal tak tersentuh", en: "Principal untouched" } },
                { i: Icon.leaf, t: { id: "1 manusia, 1 tiket", en: "1 human, 1 ticket" } },
                { i: Icon.robot, t: { id: "Keputusan AI dijelaskan", en: "AI decisions explained" } }].map((c, i) => (
                <span key={i} className="chip"><c.i size={16} stroke="var(--clover-deep)" /> {L(lang, c.t)}</span>
              ))}
            </Reveal>
          </div>
          <div className="hero-art">
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
              <Clover size={360} color="color-mix(in srgb,var(--leaf) 65%, var(--clover))" breathe />
            </div>
            {/* floating prize chip */}
            <Reveal delay={360} className="card" style={{ position: "absolute", right: 0, top: 30, padding: "16px 20px", background: "linear-gradient(160deg, color-mix(in srgb,var(--gold) 14%, var(--canvas-2)), var(--canvas-2))", boxShadow: "var(--shadow-soft)" }}>
              <div className="badge badge-win" style={{ marginBottom: 8 }}><Icon.trophy size={13} stroke="var(--gold-deep)" /> {L(lang, { id: "Kolam ronde ini", en: "This round's pool" })}</div>
              <div className="head tnum" style={{ fontSize: 30, color: "var(--gold-deep)" }}><CountUp value={1284} dec={0} /> USDC</div>
            </Reveal>
            <Reveal delay={460} className="card" style={{ position: "absolute", left: 0, bottom: 24, padding: "14px 18px", boxShadow: "var(--shadow-soft)" }}>
              <div className="row aic gap-10">
                <Gardener size={40} />
                <div>
                  <div className="tiny" style={{ fontWeight: 700, color: "var(--clover-deep)" }}>{L(lang, { id: "Pemelihara AI", en: "AI Keeper" })}</div>
                  <div className="muted tiny">{L(lang, { id: "Tetap di Aave \u00b7 Sehat", en: "Staying on Aave \u00b7 Healthy" })}</div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* HOW */}
      <div id="how" className="section">
        <div className="maxw">
          <Reveal className="section-kicker">{L(lang, { id: "Cara Kerja", en: "How it works" })}</Reveal>
          <Reveal delay={60}><h2 style={{ fontSize: 40, marginBottom: 44, maxWidth: 620 }}>{L(lang, { id: "Empat langkah, kebun yang bertumbuh aman", en: "Four steps, a garden that grows safely" })}</h2></Reveal>
          <div className="how-grid">
            {steps.map((s, i) => <Reveal key={i} delay={i * 90}><WebHowCard n={i + 1} icon={s.icon} title={L(lang, s.title)} body={L(lang, s.body)} accent={s.accent} /></Reveal>)}
          </div>
        </div>
      </div>

      {/* SAFETY */}
      <div id="safe" className="section" style={{ background: "color-mix(in srgb,var(--sage) 55%, var(--canvas))" }}>
        <div className="maxw">
          <Reveal className="row aic gap-10" style={{ marginBottom: 6 }}>
            <span className="section-kicker" style={{ margin: 0 }}>{L(lang, { id: "Kenapa Aman", en: "Why it's safe" })}</span>
            <span className="badge badge-safe"><Icon.lock size={13} stroke="var(--clover-deep)" /> {L(lang, { id: "Dipaksa oleh kode", en: "Enforced by code" })}</span>
          </Reveal>
          <Reveal delay={60}><h2 style={{ fontSize: 40, lineHeight: 1.12, maxWidth: 560, marginBottom: 8 }}>{L(lang, { id: "Aman bukan karena percaya AI \u2014 tapi karena dipaksa kode.", en: "Safe not because you trust the AI \u2014 but because code enforces it." })}</h2></Reveal>
          <Reveal delay={120}><p className="muted" style={{ fontSize: 16, maxWidth: 520, marginBottom: 18 }}>{L(lang, { id: "Setiap cabang dipagari batasan on-chain. Inilah yang tak bisa dilakukan agen \u2014 selamanya.", en: "Every branch is fenced by on-chain limits. Here's what the agent simply cannot do \u2014 ever." })}</p></Reveal>
          <SafetyBonsai lang={lang} />
        </div>
      </div>

      {/* PRIZE */}
      <div id="prize" className="section">
        <div className="maxw">
          <div className="card" style={{ background: "linear-gradient(150deg, color-mix(in srgb,var(--gold) 12%, var(--canvas-2)), var(--canvas-2))", padding: "56px 40px", textAlign: "center", overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, opacity: .5 }}><LeafFall density={0.5} golden /></div>
            <div style={{ position: "relative" }}>
              <div className="badge badge-win" style={{ marginBottom: 18 }}><Icon.trophy size={14} stroke="var(--gold-deep)" /> {L(lang, { id: "Kolam Hadiah \u00b7 Ronde #12", en: "Prize Pool \u00b7 Round #12" })}</div>
              <div className="head tnum" style={{ fontSize: 88, color: "var(--gold-deep)", lineHeight: 1 }}><CountUp value={1284} dec={0} /> <span style={{ fontSize: 40 }}>USDC</span></div>
              <p className="muted" style={{ fontSize: 16, marginTop: 14 }}>{L(lang, { id: "Dikumpulkan dari bunga 248 penanam. Modal mereka tetap utuh.", en: "Pooled from the yield of 248 planters. Their principal stays whole." })}</p>
              <button className="btn btn-gold btn-lg" style={{ marginTop: 28 }} onClick={onEnter}>{L(lang, { id: "Ikut menanam", en: "Join & plant" })} <Icon.arrow size={18} stroke="#3a2603" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="bigfoot">
        <div className="maxw">
          <div className="row between aic wrap" style={{ gap: 24, marginBottom: 30 }}>
            <Wordmark size={30} light />
            <div className="row gap-10 wrap">
              <span className="chip" style={{ background: "color-mix(in srgb,#F4FBF6 10%, transparent)", color: "#F4FBF6", boxShadow: "none" }}>Aave</span>
              <span className="chip" style={{ background: "color-mix(in srgb,#F4FBF6 10%, transparent)", color: "#F4FBF6", boxShadow: "none" }}>Compound</span>
              <span className="chip" style={{ background: "color-mix(in srgb,#F4FBF6 10%, transparent)", color: "#F4FBF6", boxShadow: "none" }}>Morpho</span>
              <span className="chip" style={{ background: "color-mix(in srgb,#F4FBF6 10%, transparent)", color: "#F4FBF6", boxShadow: "none" }}>Moonwell</span>
            </div>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "color-mix(in srgb,#F4FBF6 65%, transparent)", maxWidth: 720 }}>
            {L(lang, { id: "No-loss \u2260 no-risk. Dana ditempatkan di protokol teruji (Aave, Compound, Morpho, Moonwell). Biaya platform ~10% dari bunga; modal pokok tak pernah dipotong. Berjalan di jaringan Base.",
                       en: "No-loss \u2260 no-risk. Funds sit in audited protocols (Aave, Compound, Morpho, Moonwell). Platform fee ~10% of yield; principal is never cut. Runs on the Base network." })}
          </p>
        </div>
      </div>
    </div>
  );
}

export { WebLanding };
