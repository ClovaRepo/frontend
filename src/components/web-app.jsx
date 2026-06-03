import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { L, fmt, useCountUp, CountUp, Clover, Wordmark, LeafShape, LeafFall, CloverWatermark, Ic, Icon, Gardener, VineStepper, CountdownArc, Plant, Confetti, AreaChart, Collapse, Reveal, TopBar, Toast } from './shared.jsx';

/* ============================================================
   CLOVA WEB — App shell (left sidebar) + desktop Dashboard
   ============================================================ */

const WEB_NAV = [
  { k: "dashboard", icon: "home", t: { id: "Kebunku", en: "My Garden" } },
  { k: "pool", icon: "pool", t: { id: "Kolam Hadiah", en: "Prize Pool" } },
  { k: "keeper", icon: "robot", t: { id: "Pemelihara AI", en: "AI Keeper" } },
  { k: "log", icon: "scroll", t: { id: "Catatan", en: "Log" } },
  { k: "settings", icon: "gear", t: { id: "Pengaturan", en: "Settings" } },
];

function Sidebar({ lang, setLang, screen, go, onExit }) {
  return (
    <aside className="sidebar">
      <div className="row between aic" style={{ padding: "0 6px" }}>
        <button onClick={onExit} title="Home" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><Wordmark size={26} /></button>
      </div>
      <nav className="side-nav">
        {WEB_NAV.map((n) => {
          const I = Icon[n.icon];
          const active = screen === n.k;
          return (
            <button key={n.k} className={"side-item" + (active ? " active" : "")} onClick={() => go(n.k)}>
              <span className="si-ic" style={{ display: "flex", color: active ? "#F4FBF6" : "var(--clover-deep)" }}><I size={20} stroke="currentColor" /></span>
              <span className="si-label">{L(lang, n.t)}</span>
            </button>
          );
        })}
      </nav>
      <div className="side-foot col gap-12">
        <div className="wallet-pill">
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--canvas-2)", display: "grid", placeItems: "center", flex: "0 0 auto" }}><Icon.wallet size={18} stroke="var(--clover-deep)" /></div>
          <div style={{ minWidth: 0 }}>
            <div className="tnum" style={{ fontWeight: 700, fontSize: 13.5, color: "var(--forest)" }}>0x12…9aF3</div>
            <div className="tiny" style={{ color: "var(--clover-deep)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}><Clover size={11} color="var(--clover-deep)" stem={false} /> {L(lang, { id: "Terverifikasi", en: "Verified" })}</div>
          </div>
        </div>
        <div className="row between aic" style={{ padding: "0 6px" }}>
          <div className="seg">
            {["id", "en"].map((lc) => <button key={lc} className={lang === lc ? "on" : ""} onClick={() => setLang(lc)}>{lc.toUpperCase()}</button>)}
          </div>
          <button onClick={onExit} className="tlink tiny" title="Exit to site">{L(lang, { id: "Keluar", en: "Exit" })}</button>
        </div>
      </div>
    </aside>
  );
}

function MainHead({ lang, title, sub, onDraw }) {
  return (
    <div className="main-head">
      <div>
        <div className="head" style={{ fontSize: 26 }}>{title}</div>
        {sub && <div className="muted tiny" style={{ marginTop: 2 }}>{sub}</div>}
      </div>
      <div className="row aic gap-12">
        <div className="row aic gap-8" style={{ background: "linear-gradient(160deg, color-mix(in srgb,var(--gold) 14%, var(--canvas-2)), var(--canvas-2))", borderRadius: 14, padding: "9px 14px" }}>
          <Icon.trophy size={16} stroke="var(--gold-deep)" />
          <span className="tnum" style={{ fontWeight: 700, fontSize: 14, color: "var(--gold-deep)" }}>1.284 USDC</span>
          <span className="tiny muted" style={{ marginLeft: 2 }}>· 11j 24m</span>
        </div>
        {onDraw && <button className="btn btn-gold btn-sm" onClick={onDraw}><Icon.spark size={16} stroke="#3a2603" /> {L(lang, { id: "Undian", en: "Draw" })}</button>}
        <button aria-label="alerts" style={{ width: 40, height: 40, borderRadius: "50%", border: "none", background: "var(--canvas-2)", boxShadow: "var(--shadow-card)", display: "grid", placeItems: "center", cursor: "pointer", position: "relative" }}>
          <Icon.bell size={19} stroke="var(--forest)" />
          <span style={{ position: "absolute", top: 9, right: 10, width: 7, height: 7, borderRadius: "50%", background: "var(--gold)", boxShadow: "0 0 0 2px var(--canvas-2)" }} />
        </button>
      </div>
    </div>
  );
}

/* ===================== DASHBOARD ===================== */
function WebDashboard({ lang, go, t, openModal, onDraw }) {
  const yieldSeries = [40, 120, 220, 360, 470, 560, 700, 820, 980, 1120, 1284];
  return (
    <div className="main">
      <MainHead lang={lang} title={L(lang, { id: "Kebunku 🌿", en: "My Garden 🌿" })}
        sub={L(lang, { id: "Selamat datang kembali. Ronde #12 sedang berjalan.", en: "Welcome back. Round #12 is running." })} onDraw={onDraw} />
      <div className="main-body">
        <div className="bento">
          {/* HERO principal */}
          <Reveal className="col-7">
            <div className="card card-pad-lg" style={{ overflow: "hidden", position: "relative", height: "100%" }}>
              <CloverWatermark corner="br" size={200} opacity={0.05} />
              <div className="row between aic" style={{ marginBottom: 6 }}>
                <span className="muted" style={{ fontWeight: 600, fontSize: 14 }}>{L(lang, { id: "Tanamanku · Modal pokok", en: "My plant · Principal" })}</span>
                <span className="badge badge-safe"><Icon.shieldLeaf size={13} stroke="var(--clover-deep)" /> {L(lang, { id: "Aman & utuh", en: "Safe & whole" })}</span>
              </div>
              <div className="row aic gap-20" style={{ marginTop: 8 }}>
                <div style={{ flex: "0 0 auto" }}><Plant grow={0.62} size={150} /></div>
                <div style={{ flex: 1 }}>
                  <div className="num-xl"><CountUp value={100} /></div>
                  <div className="head" style={{ fontSize: 18, color: "var(--ink-45)", marginTop: 2 }}>USDC</div>
                  <div className="row aic gap-10" style={{ marginTop: 16, background: "var(--sage)", borderRadius: 14, padding: "12px 16px" }}>
                    <Icon.drop size={18} stroke="var(--clover)" />
                    <span className="muted tiny" style={{ fontWeight: 600 }}>{L(lang, { id: "Bunga tersumbang ronde ini", en: "Yield contributed this round" })}</span>
                    <span className="head tnum" style={{ fontSize: 18, color: "var(--clover)", marginLeft: "auto" }}>+<CountUp value={3.42} /></span>
                  </div>
                </div>
              </div>
              <div className="row between aic" style={{ marginTop: 18 }}>
                <span className="row aic gap-8" style={{ fontWeight: 600, fontSize: 14, color: "var(--forest-70)" }}>
                  <Icon.leaf size={16} stroke="var(--clover)" /> {L(lang, { id: "Protokol aktif", en: "Active protocol" })}: Aave v3
                  <span className="badge badge-active" style={{ fontSize: 11, padding: "3px 9px" }}>{L(lang, { id: "Sehat", en: "Healthy" })}</span>
                </span>
                <div className="row gap-10">
                  <button className="btn btn-secondary btn-sm" onClick={() => openModal("tarik")}>{L(lang, { id: "Tarik Modal", en: "Withdraw" })}</button>
                  <button className="btn btn-danger-ghost btn-sm" onClick={() => openModal("cabut")}>{L(lang, { id: "Cabut Izin", en: "Revoke" })}</button>
                </div>
              </div>
            </div>
          </Reveal>

          {/* PRIZE POOL */}
          <Reveal delay={80} className="col-5">
            <div className="card card-pad-lg" style={{ height: "100%", background: "linear-gradient(160deg, color-mix(in srgb,var(--gold) 13%, var(--canvas-2)), var(--canvas-2))", display: "flex", flexDirection: "column" }}>
              <div className="row between aic">
                <span className="badge badge-win"><Icon.trophy size={13} stroke="var(--gold-deep)" /> {L(lang, { id: "Kolam · Ronde #12", en: "Pool · Round #12" })}</span>
                <button className="tlink tiny" onClick={() => go("pool")}>{L(lang, { id: "Detail", en: "Details" })} →</button>
              </div>
              <div className="num-lg" style={{ color: "var(--gold-deep)", marginTop: 12 }}><CountUp value={1284} dec={0} /> <span style={{ fontSize: 20 }}>USDC</span></div>
              <div className="muted tiny" style={{ marginTop: 2 }}>{L(lang, { id: "248 penanam ikut", en: "248 planters in" })}</div>
              <div style={{ marginTop: "auto", paddingTop: 10 }}>
                <CountdownArc pct={0.68} gold size={210} label={L(lang, { id: "11j 24m", en: "11h 24m" })} sub={L(lang, { id: "menuju undian", en: "to the draw" })} />
              </div>
              <button className="btn btn-gold btn-block" style={{ marginTop: 12 }} onClick={onDraw}><Icon.spark size={17} stroke="#3a2603" /> {L(lang, { id: "Lihat Undian", en: "Open Draw" })}</button>
            </div>
          </Reveal>

          {/* AI keeper */}
          <Reveal delay={140} className="col-4">
            <div className="card card-pad-lg card-lift" onClick={() => go("keeper")} style={{ cursor: "pointer", height: "100%" }}>
              <div className="row aic gap-12" style={{ marginBottom: 12 }}>
                <Gardener size={48} />
                <div>
                  <div className="head" style={{ fontSize: 16 }}>{L(lang, { id: "Pemelihara AI", en: "AI Keeper" })}</div>
                  <span className="badge badge-active" style={{ fontSize: 10.5, padding: "3px 8px" }}>{L(lang, { id: "Aktif", en: "Active" })}</span>
                </div>
              </div>
              <p className="muted" style={{ fontSize: 14, lineHeight: 1.5 }}>"{L(lang, { id: "Tetap di Aave — likuiditas kuat, tak ada kabar audit negatif minggu ini.", en: "Staying on Aave — strong liquidity, no negative audit news this week." })}"</p>
              <span className="tlink" style={{ marginTop: 8, display: "inline-block" }}>{L(lang, { id: "Lihat alasan lengkap", en: "See full reasoning" })} →</span>
            </div>
          </Reveal>

          {/* participation */}
          <Reveal delay={200} className="col-4">
            <div className="card card-pad-lg card-sage" style={{ height: "100%", overflow: "hidden", position: "relative" }}>
              <CloverWatermark corner="br" size={120} opacity={0.06} />
              <div className="head" style={{ fontSize: 16, marginBottom: 16 }}>{L(lang, { id: "Caramu ikut", en: "Your stake" })}</div>
              <div className="row between" style={{ gap: 10 }}>
                {[{ l: { id: "Modalmu", en: "Principal" }, v: "100" }, { l: { id: "Bunga", en: "Yield" }, v: "+3,42", c: "var(--clover)" }, { l: { id: "Tiketmu", en: "Tickets" }, v: "1" }].map((x, i) => (
                  <div key={i} style={{ flex: 1 }}><div className="head tnum" style={{ fontSize: 24, color: x.c || "var(--forest)" }}>{x.v}</div><div className="muted tiny">{L(lang, x.l)}</div></div>
                ))}
              </div>
              <div className="vine-divide" />
              <div className="row aic gap-8 tiny muted"><Clover size={14} color="var(--clover)" stem={false} /> {L(lang, { id: "1 manusia, 1 tiket — undian adil via VRF.", en: "1 human, 1 ticket — fair draw via VRF." })}</div>
            </div>
          </Reveal>

          {/* fee */}
          <Reveal delay={260} className="col-4">
            <div className="card card-pad-lg" style={{ height: "100%" }}>
              <div className="head" style={{ fontSize: 16, marginBottom: 14 }}>{L(lang, { id: "Transparansi biaya", en: "Fee transparency" })}</div>
              <div className="row aic gap-14">
                <svg width="78" height="78" viewBox="0 0 96 96" style={{ flex: "0 0 auto" }}>
                  <circle cx="48" cy="48" r="38" fill="none" stroke="var(--clover)" strokeWidth="15" strokeDasharray={`${0.9 * 238.7} 238.7`} transform="rotate(-90 48 48)" strokeLinecap="round" />
                  <circle cx="48" cy="48" r="38" fill="none" stroke="var(--gold)" strokeWidth="15" strokeDasharray={`${0.1 * 238.7} 238.7`} strokeDashoffset={`${-0.9 * 238.7}`} transform="rotate(-90 48 48)" strokeLinecap="round" />
                </svg>
                <div className="col gap-6">
                  <div className="row aic gap-8"><span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--clover)" }} /><span className="tiny" style={{ fontWeight: 600 }}>90% {L(lang, { id: "pemenang", en: "winners" })}</span></div>
                  <div className="row aic gap-8"><span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--gold)" }} /><span className="tiny" style={{ fontWeight: 600 }}>10% {L(lang, { id: "treasury", en: "treasury" })}</span></div>
                  <div className="tiny muted" style={{ lineHeight: 1.35, marginTop: 2 }}>{L(lang, { id: "Modal tak pernah dipotong.", en: "Principal never cut." })}</div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* yield chart */}
          <Reveal delay={320} className="col-8">
            <div className="card card-pad-lg">
              <div className="row between aic" style={{ marginBottom: 4 }}>
                <div className="head" style={{ fontSize: 16 }}>{L(lang, { id: "Pertumbuhan kolam ronde ini", en: "Pool growth this round" })}</div>
                <span className="head tnum" style={{ fontSize: 18, color: "var(--clover)" }}>+1.284 USDC</span>
              </div>
              <AreaChart data={yieldSeries} color="var(--clover)" h={120} />
            </div>
          </Reveal>

          {/* win history */}
          <Reveal delay={360} className="col-4">
            <div className="card card-pad-lg" style={{ height: "100%" }}>
              <div className="head" style={{ fontSize: 16, marginBottom: 12 }}>{L(lang, { id: "Riwayat menang", en: "Win history" })}</div>
              <div className="col gap-10">
                {[{ r: 9, win: true, amt: "+18,20" }, { r: 8, win: false }, { r: 6, win: true, amt: "+9,80" }].map((it, i) => (
                  <div key={i} className="row between aic" style={{ padding: "10px 12px", borderRadius: 12, background: it.win ? "color-mix(in srgb,var(--gold) 10%, var(--canvas-2))" : "var(--sage)" }}>
                    <span className="tiny" style={{ fontWeight: 700, color: "var(--ink-45)" }}>{L(lang, { id: "Ronde", en: "Round" })} #{it.r}</span>
                    {it.win ? <span className="head tnum" style={{ fontSize: 15, color: "var(--gold-deep)" }}>{it.amt}</span>
                      : <span className="tiny" style={{ fontWeight: 600, color: "var(--clover-deep)" }}>{L(lang, { id: "Modal utuh", en: "Whole" })}</span>}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

export { Sidebar, MainHead, WebDashboard, WEB_NAV };
