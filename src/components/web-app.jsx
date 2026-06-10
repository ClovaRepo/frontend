import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { L, fmt, fmtUsdc, nfmt, clickable, useCountUp, CountUp, Clover, Wordmark, LeafShape, LeafFall, CloverWatermark, Ic, Icon, ActivityIcon, Gardener, VineStepper, CountdownArc, Plant, Confetti, AreaChart, Collapse, Reveal, TopBar, Toast } from './shared.jsx';
import { useWallet } from './wallet-context.jsx';

/* ============================================================
   CLOVA WEB, App shell (left sidebar) + desktop Dashboard
   ============================================================ */

const WEB_NAV = [
  { k: "dashboard", icon: "home", t: { id: "Kebunku", en: "My Garden" } },
  { k: "pool", icon: "pool", t: { id: "Kolam Hadiah", en: "Prize Pool" } },
  { k: "keeper", icon: "robot", t: { id: "Pemelihara AI", en: "AI Keeper" } },
  { k: "log", icon: "scroll", t: { id: "Catatan", en: "Log" } },
  { k: "settings", icon: "gear", t: { id: "Pengaturan", en: "Settings" } },
];

function Sidebar({ lang, setLang, screen, go, onExit }) {
  const wallet = useWallet();
  const shortAddr = wallet.account
    ? wallet.account.slice(0, 6) + "…" + wallet.account.slice(-4)
    : "—";
  return (
    <aside className="sidebar">
      <div className="row between aic" style={{ padding: "0 6px" }}>
        <button onClick={onExit} title="Home" aria-label={L(lang, { id: "Beranda Clova", en: "Clova home" })} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><Wordmark size={26} /></button>
      </div>
      <nav className="side-nav">
        {WEB_NAV.map((n) => {
          const I = Icon[n.icon];
          const active = screen === n.k;
          return (
            <button key={n.k} className={"side-item" + (active ? " active" : "")} onClick={() => go(n.k)} aria-label={L(lang, n.t)} aria-current={active ? "page" : undefined}>
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
            <div className="tnum" style={{ fontWeight: 700, fontSize: 13.5, color: "var(--forest)" }}>{shortAddr}</div>
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

/* Recent activity shown in the bell popup (compact mirror of the Log feed) */
const NOTIFS = [
  { cat: "ai", title: { id: "AI: TETAP di Aave, likuiditas kuat", en: "AI: STAY on Aave, strong liquidity" }, time: { id: "4 jam lalu", en: "4h ago" } },
  { cat: "yield", title: { id: "Bunga +0,82 USDC disapu ke Kolam #12", en: "Yield +0.82 USDC swept to Pool #12" }, time: { id: "6 jam lalu", en: "6h ago" } },
  { cat: "ai", safe: true, title: { id: "Aksi terlarang ditolak otomatis", en: "Forbidden action auto-rejected" }, time: { id: "1 hari lalu", en: "1d ago" } },
  { cat: "draw", win: true, title: { id: "Menang ronde #9, +18,20 USDC", en: "Won round #9, +18.20 USDC" }, time: { id: "5 hari lalu", en: "5d ago" } },
];

function NotifBell({ lang, go }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);
  const seeAll = () => { setOpen(false); go && go("log"); };
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button aria-label={L(lang, { id: "Notifikasi", en: "Notifications" })} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        style={{ width: 40, height: 40, borderRadius: "50%", border: "none", background: open ? "var(--sage)" : "var(--canvas-2)", boxShadow: "var(--shadow-card)", display: "grid", placeItems: "center", cursor: "pointer", position: "relative", transition: "background .18s var(--ease-soft)" }}>
        <Icon.bell size={19} stroke="var(--forest)" />
        <span style={{ position: "absolute", top: 9, right: 10, width: 7, height: 7, borderRadius: "50%", background: "var(--gold)", boxShadow: "0 0 0 2px var(--canvas-2)" }} />
      </button>
      {open && (
        <div className="notif-pop card" role="menu">
          <div className="row between aic" style={{ marginBottom: 10 }}>
            <div className="head" style={{ fontSize: 16 }}>{L(lang, { id: "Notifikasi", en: "Notifications" })}</div>
            <span className="badge badge-safe tiny">{NOTIFS.length} {L(lang, { id: "baru", en: "new" })}</span>
          </div>
          <div className="col gap-4">
            {NOTIFS.map((n, i) => (
              <button key={i} className="notif-item" role="menuitem" onClick={seeAll}>
                <ActivityIcon cat={n.cat} win={n.win} safe={n.safe} size={32} />
                <div style={{ minWidth: 0, textAlign: "left" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: n.win ? "var(--gold-deep)" : "var(--forest)", lineHeight: 1.35 }}>{L(lang, n.title)}</div>
                  <div className="muted tiny" style={{ marginTop: 2 }}>{L(lang, n.time)}</div>
                </div>
              </button>
            ))}
          </div>
          <button className="btn btn-secondary btn-sm btn-block" style={{ marginTop: 10 }} onClick={seeAll}>
            {L(lang, { id: "Lihat semua", en: "See all" })} <Icon.arrow size={15} stroke="var(--clover-deep)" />
          </button>
        </div>
      )}
    </div>
  );
}

function MainHead({ lang, title, sub, onDraw, go, poolYield, round }) {
  const poolDisplay = poolYield != null && poolYield > 0
    ? `${fmtUsdc(poolYield)} USDC`
    : "— USDC";
  const roundDisplay = round && round !== "—" ? `#${round}` : "";
  return (
    <div className="main-head">
      <div>
        <div className="head" style={{ fontSize: 26 }}>{title}</div>
        {sub && <div className="muted tiny" style={{ marginTop: 2 }}>{sub}</div>}
      </div>
      <div className="row aic gap-12">
        <div className="row aic gap-8" style={{ background: "linear-gradient(160deg, color-mix(in srgb,var(--gold) 14%, var(--canvas-2)), var(--canvas-2))", borderRadius: 14, padding: "9px 14px" }}>
          <Icon.trophy size={16} stroke="var(--gold-deep)" />
          <span className="tnum" style={{ fontWeight: 700, fontSize: 14, color: "var(--gold-deep)" }}>{poolDisplay}</span>
          {roundDisplay && <span className="tiny muted" style={{ marginLeft: 2 }}>· Ronde {roundDisplay}</span>}
        </div>
        <div className="row aic gap-6" style={{ background: "color-mix(in srgb,var(--gold) 12%, var(--canvas-2))", borderRadius: 10, padding: "6px 12px" }}>
          <Icon.robot size={14} stroke="var(--gold-deep)" />
          <span className="tiny" style={{ fontWeight: 700, color: "var(--gold-deep)" }}>{L(lang, { id: "Agen aktif", en: "Agent active" })}</span>
        </div>
        <NotifBell lang={lang} go={go} />
      </div>
    </div>
  );
}

/* ===================== DASHBOARD ===================== */
const BACKEND_URL_WEB = (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_BACKEND_URL) || "http://localhost:3001";

const BACKEND_URL_APP = (typeof import.meta !== "undefined" && import.meta.env?.VITE_BACKEND_URL) || "http://localhost:3001";

function WinHistory({ lang }) {
  const [wins, setWins] = useState([]);
  useEffect(() => {
    fetch(`${BACKEND_URL_APP}/wins?limit=5`).then(r => r.json()).then(d => Array.isArray(d) && setWins(d)).catch(() => {});
  }, []);
  return (
    <div className="card card-pad-lg" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div className="head" style={{ fontSize: 16, marginBottom: 12 }}>{L(lang, { id: "Riwayat menang", en: "Win history" })}</div>
      <div className="col gap-10">
        {wins.length === 0
          ? <div className="muted tiny">{L(lang, { id: "Ronde pertama sedang berjalan.", en: "First round in progress." })}</div>
          : wins.map((w, i) => (
              <div key={i} className="row between aic" style={{ padding: "10px 12px", borderRadius: 12, background: "var(--sage)" }}>
                <div className="col gap-2">
                  <span className="tiny" style={{ fontWeight: 700, color: "var(--ink-45)" }}>{L(lang, { id: "Ronde", en: "Round" })} #{w.round}</span>
                  <span className="tiny muted tnum">{w.winner !== "—" ? `${w.winner.slice(0,6)}…${w.winner.slice(-4)}` : "—"}</span>
                </div>
                <span className="head tnum" style={{ fontSize: 14, color: "var(--gold-deep)" }}>{Number(w.prizeUsdc).toFixed(4)} USDC</span>
              </div>
            ))
        }
      </div>
    </div>
  );
}

function WebDashboard({ lang, go, t, openModal, onDraw }) {
  const wallet = useWallet();
  const [poolData, setPoolData] = useState(null);
  const [latestDecision, setLatestDecision] = useState(null);

  // Fetch pool data + AI decision on mount, refresh every 30s
  useEffect(() => {
    if (!wallet.account) return;
    let alive = true;
    const load = async () => {
      const [pd, dec] = await Promise.all([
        wallet.fetchPoolData().catch(() => null),
        fetch(`${BACKEND_URL_WEB}/decisions?limit=1`).then((r) => r.json()).catch(() => []),
      ]);
      if (!alive) return;
      setPoolData(pd);
      setLatestDecision(Array.isArray(dec) ? dec[0] : null);
    };
    load();
    const id = setInterval(load, 60_000);
    return () => { alive = false; clearInterval(id); };
  }, [wallet.account, wallet.fetchPoolData]);

  const principal = poolData?.principalUsdc ?? 0;
  const userYield = poolData?.userYieldUsdc ?? 0;
  const poolYield = poolData?.poolYieldUsdc ?? 0;
  const participants = poolData?.participantCount ?? 0;
  const chancePct = poolData?.chancePct ?? 0;
  const round = poolData?.currentRound ?? "—";

  // Normalised yield series for chart — real pool yield as final point
  const yieldSeries = poolYield > 0
    ? [0, poolYield * 0.09, poolYield * 0.21, poolYield * 0.38, poolYield * 0.52,
       poolYield * 0.63, poolYield * 0.74, poolYield * 0.83, poolYield * 0.91, poolYield * 0.96, poolYield]
    : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  const aiText = latestDecision?.reasoning
    ?? L(lang, { id: "Tetap di Aave — likuiditas kuat, tak ada kabar audit negatif minggu ini.", en: "Staying on Aave — strong liquidity, no negative audit news this week." });

  const plantGrow = principal > 0 ? Math.min(0.95, 0.15 + (principal / 1000) * 0.8) : 0.15;

  return (
    <div className="main">
      <MainHead lang={lang} go={go}
        title={L(lang, { id: "Kebunku 🌿", en: "My Garden 🌿" })}
        sub={L(lang, {
          id: `Selamat datang kembali. Ronde #${round} sedang berjalan.`,
          en: `Welcome back. Round #${round} is running.`,
        })}
        onDraw={onDraw} poolYield={poolYield} round={round} />
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
                <div style={{ flex: "0 0 auto" }}><Plant grow={plantGrow} size={150} /></div>
                <div style={{ flex: 1 }}>
                  <div className="num-xl"><CountUp value={principal} dec={2} /></div>
                  <div className="head" style={{ fontSize: 18, color: "var(--ink-45)", marginTop: 2 }}>USDC</div>
                  <div className="row aic gap-10" style={{ marginTop: 16, background: "var(--sage)", borderRadius: 14, padding: "12px 16px" }}>
                    <Icon.drop size={18} stroke="var(--clover)" />
                    <span className="muted tiny" style={{ fontWeight: 600 }}>{L(lang, { id: "Bunga tersumbang ronde ini", en: "Yield contributed this round" })}</span>
                    <span className="head tnum" style={{ fontSize: 18, color: "var(--clover)", marginLeft: "auto" }}>
                      {userYield > 0 ? "+" : ""}{fmtUsdc(userYield, 4)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="row between aic" style={{ marginTop: 18 }}>
                <span className="row aic gap-8" style={{ fontWeight: 600, fontSize: 14, color: "var(--forest-70)" }}>
                  <Icon.leaf size={16} stroke="var(--clover)" /> {L(lang, { id: "Protokol aktif", en: "Active protocol" })}: Aave v3
                  <span className="badge badge-active" style={{ fontSize: 11, padding: "3px 9px" }}>{L(lang, { id: "Sehat", en: "Healthy" })}</span>
                </span>
                <div className="row gap-10">
                  <button className="btn btn-primary btn-sm" onClick={() => openModal("deposit")}><Icon.plus size={14} stroke="#F4FBF6" /> {L(lang, { id: "Tambah", en: "Add" })}</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => openModal("tarik")}>{L(lang, { id: "Tarik", en: "Withdraw" })}</button>
                  <button className="btn btn-danger-ghost btn-sm" onClick={() => openModal("cabut")}>{L(lang, { id: "Cabut Izin", en: "Revoke" })}</button>
                </div>
              </div>
            </div>
          </Reveal>

          {/* PRIZE POOL */}
          <Reveal delay={80} className="col-5">
            <div className="card card-pad-lg" style={{ height: "100%", background: "linear-gradient(160deg, color-mix(in srgb,var(--gold) 13%, var(--canvas-2)), var(--canvas-2))", display: "flex", flexDirection: "column" }}>
              <div className="row between aic">
                <span className="badge badge-win"><Icon.trophy size={13} stroke="var(--gold-deep)" /> {L(lang, { id: "Kolam · Ronde", en: "Pool · Round" })} #{round}</span>
                <button className="tlink tiny" onClick={() => go("pool")}>{L(lang, { id: "Detail", en: "Details" })} →</button>
              </div>
              <div className="num-lg" style={{ color: "var(--gold-deep)", marginTop: 12 }}>
                {fmtUsdc(poolYield)} <span style={{ fontSize: 20 }}>USDC</span>
              </div>
              <div className="muted tiny" style={{ marginTop: 2 }}>
                {participants} {L(lang, { id: "penanam ikut", en: "planters in" })}
              </div>
              <div style={{ marginTop: "auto", paddingTop: 10 }}>
                {(() => {
                  const now = Date.now();
                  const nextSunday = new Date();
                  nextSunday.setUTCHours(0, 0, 0, 0);
                  const daysUntilSunday = (7 - nextSunday.getUTCDay()) % 7 || 7;
                  nextSunday.setUTCDate(nextSunday.getUTCDate() + daysUntilSunday);
                  const msLeft = nextSunday.getTime() - now;
                  const totalMs = 7 * 24 * 3600 * 1000;
                  const pct = Math.max(0.02, Math.min(0.98, 1 - msLeft / totalMs));
                  const hLeft = Math.floor(msLeft / 3600000);
                  const dLeft = Math.floor(hLeft / 24);
                  const label = dLeft > 0
                    ? L(lang, { id: `${dLeft}h ${hLeft % 24}m`, en: `${dLeft}d ${hLeft % 24}h` })
                    : L(lang, { id: `${hLeft}j`, en: `${hLeft}h` });
                  return (
                    <CountdownArc pct={pct} gold size={210}
                      label={label}
                      sub={L(lang, { id: "menuju undian", en: "to the draw" })} />
                  );
                })()}
              </div>
              <div className="row aic gap-8" style={{ marginTop: 12, background: "color-mix(in srgb,var(--gold) 10%, var(--canvas-2))", borderRadius: 12, padding: "10px 14px" }}>
                <Icon.robot size={15} stroke="var(--gold-deep)" />
                <span className="tiny" style={{ fontWeight: 600, color: "var(--gold-deep)" }}>
                  {L(lang, { id: "Undian dijalankan otomatis oleh agen AI", en: "Draw is run automatically by the AI agent" })}
                </span>
              </div>
            </div>
          </Reveal>

          {/* AI keeper */}
          <Reveal delay={140} className="col-4">
            <div className="card card-pad-lg card-lift" {...clickable(() => go("keeper"))} aria-label={L(lang, { id: "Buka Pemelihara AI", en: "Open AI Keeper" })} style={{ cursor: "pointer", height: "100%", display: "flex", flexDirection: "column" }}>
              <div className="row aic gap-12" style={{ marginBottom: 12 }}>
                <Gardener size={48} />
                <div>
                  <div className="head" style={{ fontSize: 16 }}>{L(lang, { id: "Pemelihara AI", en: "AI Keeper" })}</div>
                  <span className="badge badge-active" style={{ fontSize: 10.5, padding: "3px 8px" }}>{L(lang, { id: "Aktif", en: "Active" })}</span>
                </div>
              </div>
              <p className="muted" style={{ fontSize: 14, lineHeight: 1.5 }}>"{aiText.length > 140 ? aiText.slice(0, 137) + "…" : aiText}"</p>
              <span className="tlink" style={{ marginTop: 8, display: "inline-block" }}>{L(lang, { id: "Lihat alasan lengkap", en: "See full reasoning" })} →</span>
            </div>
          </Reveal>

          {/* participation */}
          <Reveal delay={200} className="col-4">
            <div className="card card-pad-lg card-sage" style={{ height: "100%", overflow: "hidden", position: "relative", display: "flex", flexDirection: "column" }}>
              <CloverWatermark corner="br" size={120} opacity={0.06} />
              <div className="head" style={{ fontSize: 16, marginBottom: 18 }}>{L(lang, { id: "Caramu ikut", en: "Your stake" })}</div>
              <div className="row between" style={{ gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div className="head tnum" style={{ fontSize: 24 }}><CountUp value={principal} dec={2} /></div>
                  <div className="muted tiny">{L(lang, { id: "Modal", en: "Principal" })}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="head tnum" style={{ fontSize: 24, color: "var(--clover)" }}>+{fmtUsdc(userYield, 4)}</div>
                  <div className="muted tiny">{L(lang, { id: "Bunga", en: "Yield" })}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="head tnum" style={{ fontSize: 24, color: "var(--gold-deep)" }}>{chancePct.toFixed(1)}%</div>
                  <div className="muted tiny">{L(lang, { id: "Peluang Menang", en: "Win Chance" })}</div>
                </div>
              </div>
              <div className="vine-divide" />
              <div className="row aic gap-8 tiny muted">
                <Icon.leaf size={14} stroke="var(--clover)" />
                {L(lang, { id: "Deposit lebih besar = peluang menang lebih besar — undian adil via VRF.", en: "Bigger deposit = bigger win chance — fair draw via VRF." })}
              </div>
            </div>
          </Reveal>

          {/* fee */}
          <Reveal delay={260} className="col-4">
            <div className="card card-pad-lg" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <div className="head" style={{ fontSize: 16, marginBottom: 14 }}>{L(lang, { id: "Transparansi biaya", en: "Fee transparency" })}</div>
              <div className="row aic gap-16">
                {(() => {
                  const R = 40, C = 2 * Math.PI * R, gap = 9;
                  const winLen = 0.9 * C - gap, treaLen = 0.1 * C - gap;
                  return (
                    <svg width="92" height="92" viewBox="0 0 100 100" style={{ flex: "0 0 auto" }}>
                      <circle cx="50" cy="50" r={R} fill="none" stroke="color-mix(in srgb,var(--forest) 8%, transparent)" strokeWidth="12" />
                      <circle cx="50" cy="50" r={R} fill="none" stroke="var(--clover)" strokeWidth="12" strokeLinecap="round"
                        strokeDasharray={`${winLen} ${C - winLen}`} strokeDashoffset={-(gap / 2)} transform="rotate(-90 50 50)" />
                      <circle cx="50" cy="50" r={R} fill="none" stroke="var(--gold)" strokeWidth="12" strokeLinecap="round"
                        strokeDasharray={`${treaLen} ${C - treaLen}`} strokeDashoffset={-(gap / 2 + winLen + gap)} transform="rotate(-90 50 50)" />
                      <text x="50" y="47" textAnchor="middle" fontFamily="var(--font-head)" fontSize="21" fontWeight="700" fill="var(--gold-deep)">10%</text>
                      <text x="50" y="63" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fontWeight="600" fill="var(--ink-45)" style={{ textTransform: "uppercase", letterSpacing: ".06em" }}>{L(lang, { id: "biaya", en: "fee" })}</text>
                    </svg>
                  );
                })()}
                <div className="col gap-7">
                  <div className="row aic gap-8"><span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--clover)" }} /><span className="tiny" style={{ fontWeight: 600 }}>90% {L(lang, { id: "pemenang", en: "winners" })}</span></div>
                  <div className="row aic gap-8"><span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--gold)" }} /><span className="tiny" style={{ fontWeight: 600 }}>10% {L(lang, { id: "treasury", en: "treasury" })}</span></div>
                  <div className="tiny muted" style={{ lineHeight: 1.35, marginTop: 2 }}>{L(lang, { id: "Modal tak pernah dipotong.", en: "Principal never cut." })}</div>
                </div>
              </div>
              <div className="row between aic" style={{ marginTop: "auto", paddingTop: 16 }}>
                <span className="tiny muted" style={{ fontWeight: 600 }}>{L(lang, { id: "Biaya ronde ini", en: "Fee this round" })}</span>
                <span className="head tnum" style={{ fontSize: 15, color: "var(--gold-deep)" }}>{nfmt(lang, "0,34")} USDC</span>
              </div>
            </div>
          </Reveal>

          {/* yield chart */}
          <Reveal delay={320} className="col-8">
            <div className="card card-pad-lg">
              <div className="row between aic" style={{ marginBottom: 4 }}>
                <div className="head" style={{ fontSize: 16 }}>{L(lang, { id: "Pertumbuhan kolam ronde ini", en: "Pool growth this round" })}</div>
                <span className="head tnum" style={{ fontSize: 18, color: "var(--clover)" }}>
                  +{fmtUsdc(poolYield)} USDC
                </span>
              </div>
              <AreaChart data={yieldSeries} color="var(--clover)" h={120} />
            </div>
          </Reveal>

          {/* win history */}
          <Reveal delay={360} className="col-4">
            <WinHistory lang={lang} />
          </Reveal>
        </div>
      </div>
    </div>
  );
}

export { Sidebar, MainHead, WebDashboard, WEB_NAV };
