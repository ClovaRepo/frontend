import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { L, fmt, nfmt, clickable, useCountUp, CountUp, Clover, Wordmark, LeafShape, LeafFall, CloverWatermark, Ic, Icon, Gardener, VineStepper, CountdownArc, Plant, Confetti, AreaChart, Collapse, Reveal, TopBar, Toast } from './shared.jsx';
import { useWallet } from './wallet-context.jsx';

/* ============================================================
   CLOVA, Dashboard ("Kebunku") with 3 layout variants + Panel AI
   ============================================================ */

const WALLET_ADDR = "0x12…9aF3";
const WALLET_ADDR_FULL = "0x1234567890aBcDeF1234567890AbCdEf129aF3";

/* Tappable wallet chip → popup with copy address + disconnect. */
function WalletMenu({ lang, go }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(WALLET_ADDR_FULL); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="chip tiny" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        style={{ padding: "7px 11px", cursor: "pointer" }}>
        <span className="tnum">{WALLET_ADDR}</span>
        <Clover size={13} color="var(--clover)" stem={false} />
      </button>
      {open && (
        <div role="menu" className="card" style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 80,
          width: 232, padding: 8, boxShadow: "var(--shadow-lift)", animation: "riseIn .18s var(--ease-soft)" }}>
          <div className="row aic gap-8" style={{ padding: "8px 10px 10px" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--sage)", display: "grid", placeItems: "center", flex: "0 0 auto" }}><Icon.wallet size={16} stroke="var(--clover-deep)" /></div>
            <div style={{ minWidth: 0 }}>
              <div className="tnum" style={{ fontWeight: 700, fontSize: 13.5, color: "var(--forest)" }}>{WALLET_ADDR}</div>
              <div className="tiny" style={{ color: "var(--clover-deep)", fontWeight: 600 }}>{L(lang, { id: "Terverifikasi", en: "Verified" })}</div>
            </div>
          </div>
          <button role="menuitem" className="wallet-menu-item" onClick={copy}>
            <Icon.copy size={17} stroke={copied ? "var(--clover)" : "var(--forest-70)"} />
            <span>{copied ? L(lang, { id: "Tersalin!", en: "Copied!" }) : L(lang, { id: "Salin alamat", en: "Copy address" })}</span>
            {copied && <Icon.check size={15} stroke="var(--clover)" sw={2.4} style={{ marginLeft: "auto" }} />}
          </button>
          <button role="menuitem" className="wallet-menu-item danger" onClick={() => { setOpen(false); go("landing"); }}>
            <Icon.lock size={17} stroke="var(--danger)" />
            <span>{L(lang, { id: "Putuskan dompet", en: "Disconnect wallet" })}</span>
          </button>
        </div>
      )}
    </div>
  );
}

function DashTopBar({ lang, go }) {
  return (
    <div className="row between aic" style={{ padding: "16px 18px 10px", position: "sticky", top: 0, zIndex: 20,
      background: "linear-gradient(var(--canvas), color-mix(in srgb,var(--canvas) 80%, transparent))", backdropFilter: "blur(8px)" }}>
      <Wordmark size={24} />
      <div className="row aic gap-8">
        <WalletMenu lang={lang} go={go} />
        <button onClick={() => go("riwayat")} aria-label={L(lang, { id: "Notifikasi", en: "Notifications" })} style={{ width: 42, height: 42, borderRadius: "50%", border: "none", background: "var(--canvas-2)", boxShadow: "var(--shadow-card)", display: "grid", placeItems: "center", cursor: "pointer", position: "relative" }}>
          <Icon.bell size={19} stroke="var(--forest)" />
          <span style={{ position: "absolute", top: 8, right: 9, width: 8, height: 8, borderRadius: "50%", background: "var(--gold)", boxShadow: "0 0 0 2px var(--canvas-2)" }} />
        </button>
      </div>
    </div>
  );
}

/* ---- Hero plant card ---- */
function HeroPlant({ lang, openModal, compact, principalUsdc = 0, userYieldUsdc = 0, activeProtocol = "Aave v3" }) {
  const grow = principalUsdc > 0 ? Math.min(1, principalUsdc / 500) : 0.62;
  return (
    <div className="card reveal card-lift" style={{ padding: compact ? "18px 20px" : "22px 22px", overflow: "hidden", position: "relative" }}>
      <CloverWatermark corner="br" size={150} opacity={0.05} />
      <div className="row" style={{ gap: 14, alignItems: "center" }}>
        <div style={{ flex: "0 0 auto" }}><Plant grow={grow} size={compact ? 96 : 116} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="muted tiny" style={{ fontWeight: 600, marginBottom: 2 }}>{L(lang, { id: "Modalku", en: "My principal" })}</div>
          <div className="head tnum" style={{ fontSize: 32, lineHeight: 1 }}><CountUp value={principalUsdc} /></div>
          <div className="head" style={{ fontSize: 15, color: "var(--ink-45)", marginTop: 1 }}>USDC</div>
          <span className="badge badge-safe" style={{ marginTop: 8 }}><Icon.shieldLeaf size={13} stroke="var(--clover-deep)" /> {L(lang, { id: "Aman & utuh", en: "Safe & whole" })}</span>
        </div>
      </div>
      <div className="row between aic" style={{ marginTop: 14, background: "var(--sage)", borderRadius: 14, padding: "11px 14px" }}>
        <span className="muted tiny" style={{ fontWeight: 600 }}>{L(lang, { id: "Bunga tersumbang ronde ini", en: "Yield contributed this round" })}</span>
        <span className="head tnum" style={{ fontSize: 18, color: "var(--clover)" }}>+<CountUp value={userYieldUsdc} /></span>
      </div>
      <div className="row between aic" style={{ marginTop: 10, padding: "0 2px" }}>
        <span className="row aic gap-6 tiny" style={{ fontWeight: 600, color: "var(--forest-70)" }}>
          <Icon.leaf size={15} stroke="var(--clover)" /> {activeProtocol}
          <span className="badge badge-active" style={{ padding: "3px 8px", fontSize: 11 }}>{L(lang, { id: "Sehat", en: "Healthy" })}</span>
        </span>
      </div>
      <div className="row gap-10" style={{ marginTop: 14 }}>
        <button className="btn btn-secondary grow btn-sm" onClick={() => openModal("tarik")}>{L(lang, { id: "Tarik Modal", en: "Withdraw" })}</button>
        <button className="btn btn-danger-ghost btn-sm" onClick={() => openModal("cabut")} style={{ flex: "0 0 auto" }}>{L(lang, { id: "Cabut Izin", en: "Revoke" })}</button>
      </div>
    </div>
  );
}

/* ---- Prize pool panel ---- */
function PrizePool({ lang, go, big, currentRound = 1, poolYieldUsdc = 0, participantCount = 0 }) {
  return (
    <div className="card reveal card-lift" {...clickable(() => go("detailRonde"))} aria-label={L(lang, { id: "Buka Kolam Hadiah", en: "Open Prize Pool" })} style={{ cursor: "pointer",
      background: "linear-gradient(160deg, color-mix(in srgb,var(--gold) 13%, var(--canvas-2)), var(--canvas-2))", overflow: "hidden", position: "relative" }}>
      <div className="row between aic" style={{ marginBottom: 6 }}>
        <span className="badge badge-win"><Icon.trophy size={13} stroke="var(--gold-deep)" /> {L(lang, { id: `Kolam Hadiah · Ronde #${currentRound}`, en: `Prize Pool · Round #${currentRound}` })}</span>
        <Icon.chevron size={18} stroke="var(--gold-deep)" />
      </div>
      <div className="head tnum" style={{ fontSize: big ? 40 : 34, color: "var(--gold-deep)" }}><CountUp value={poolYieldUsdc} dec={6} /> <span style={{ fontSize: big ? 20 : 18 }}>USDC</span></div>
      <div className="muted tiny" style={{ marginTop: 2, marginBottom: 12 }}>{L(lang, { id: `${participantCount} penanam ikut`, en: `${participantCount} planters in` })}</div>
      <CountdownArc pct={0.68} gold size={170}
        label={L(lang, { id: "11j 24m", en: "11h 24m" })}
        sub={L(lang, { id: "menuju undian", en: "to the draw" })} />
    </div>
  );
}

/* ---- AI keeper shortcut ---- */
function KeeperCard({ lang, go, latestReasoning }) {
  const snippet = latestReasoning
    ? (latestReasoning.length > 100 ? latestReasoning.slice(0, 97) + "…" : latestReasoning)
    : L(lang, { id: "Tetap di Aave — likuiditas kuat, tak ada kabar audit negatif.", en: "Staying on Aave — deep liquidity, no negative audit news." });
  return (
    <div className="card reveal card-lift" {...clickable(() => go("panelAI"))} aria-label={L(lang, { id: "Buka Pemelihara AI", en: "Open AI Keeper" })} style={{ cursor: "pointer", padding: "16px 18px" }}>
      <div className="row gap-12" style={{ alignItems: "flex-start" }}>
        <Gardener size={46} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row between aic">
            <div className="head" style={{ fontSize: 15 }}>{L(lang, { id: "Pemelihara AI", en: "The AI Keeper" })}</div>
            <span className="badge badge-active" style={{ padding: "3px 8px", fontSize: 10.5 }}>{L(lang, { id: "Aktif", en: "Active" })}</span>
          </div>
          <p className="muted" style={{ fontSize: 13, lineHeight: 1.45, margin: "5px 0 8px" }}>
            "{snippet}"
          </p>
          <span className="tlink" style={{ fontSize: 13 }}>{L(lang, { id: "Lihat alasan lengkap", en: "See full reasoning" })} →</span>
        </div>
      </div>
    </div>
  );
}

/* ---- Win history strip ---- */
function WinStrip({ lang }) {
  const items = [
    { r: 9, win: true, amt: "+18,20", label: { id: "Menang!", en: "Won!" } },
    { r: 11, win: false, label: { id: "Belum hoki, modal utuh", en: "No luck, principal whole" } },
    { r: 8, win: false, label: { id: "Modal utuh", en: "Principal whole" } },
    { r: 6, win: true, amt: "+9,80", label: { id: "Menang!", en: "Won!" } },
  ];
  return (
    <div className="reveal">
      <div className="row between aic" style={{ marginBottom: 10, padding: "0 2px" }}>
        <div className="head" style={{ fontSize: 15 }}>{L(lang, { id: "Riwayat menang", en: "Win history" })}</div>
      </div>
      <div className="row gap-10" style={{ overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
        {items.map((it, i) => (
          <div key={i} style={{ flex: "0 0 auto", width: 130, borderRadius: 16, padding: "13px 14px",
            background: it.win ? "linear-gradient(160deg, color-mix(in srgb,var(--gold) 16%, var(--canvas-2)), var(--canvas-2))" : "var(--canvas-2)",
            boxShadow: "var(--shadow-card)", border: it.win ? "1.5px solid color-mix(in srgb,var(--gold) 35%, transparent)" : "1.5px solid transparent" }}>
            <div className="row between aic" style={{ marginBottom: 8 }}>
              <span className="tiny" style={{ fontWeight: 700, color: "var(--ink-45)" }}>{L(lang, { id: "Ronde", en: "Round" })} #{it.r}</span>
              {it.win ? <Icon.trophy size={16} stroke="var(--gold-deep)" /> : <Clover size={16} color="var(--clover)" stem={false} />}
            </div>
            {it.win
              ? <div className="head tnum" style={{ fontSize: 18, color: "var(--gold-deep)" }}>{nfmt(lang, it.amt)}</div>
              : <Icon.shieldLeaf size={20} stroke="var(--clover)" />}
            <div className="tiny muted" style={{ marginTop: 4, lineHeight: 1.25 }}>{L(lang, it.label)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeeBar({ lang }) {
  return (
    <div className="reveal row aic gap-8" style={{ background: "color-mix(in srgb,var(--forest) 5%, transparent)", borderRadius: 12, padding: "10px 14px" }}>
      <Icon.info size={16} stroke="var(--forest-70)" />
      <span className="tiny" style={{ color: "var(--forest-70)", lineHeight: 1.4 }}>
        {L(lang, { id: "Biaya platform 10% dari bunga. Modal tidak dipotong.", en: "Platform fee 10% of yield. Principal is not deducted." })}
      </span>
    </div>
  );
}

/* ====================== DASHBOARD ====================== */
function ScreenDashboard({ lang, go, t, openModal }) {
  const wallet = useWallet();
  const variant = t.dashLayout || "garden";
  const stagger = (n) => ({ animationDelay: n * 80 + "ms" });

  // Live pool data
  const [poolData, setPoolData] = useState(null);
  const [latestReasoning, setLatestReasoning] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [data, decisionsRes] = await Promise.all([
          wallet.fetchPoolData(),
          fetch(`${BACKEND_URL}/decisions?limit=1`).then((r) => r.json()).catch(() => []),
        ]);
        if (!alive) return;
        if (data) setPoolData(data);
        if (decisionsRes?.[0]?.reasoning) setLatestReasoning(decisionsRes[0].reasoning);
      } catch (_) {}
    };
    load();
    const id = setInterval(load, 60000); // refresh every 60s
    return () => { alive = false; clearInterval(id); };
  }, [wallet.account]);

  const principal   = poolData?.principalUsdc   ?? 0;
  const userYield   = poolData?.userYieldUsdc    ?? 0;
  const poolYield   = poolData?.poolYieldUsdc    ?? 0;
  const participants = poolData?.participantCount ?? 0;
  const round       = poolData?.currentRound     ?? 1;
  const chancePct   = poolData?.chancePct        ?? 0;
  const protocol    = "Aave v3"; // from contract activeProtocol — simplified

  return (
    <div className="screen" style={{ paddingBottom: 90 }}>
      <LeafFall density={(t.leafDensity ?? 1) * 0.45} />
      <DashTopBar lang={lang} go={go} />

      <div style={{ padding: "6px 16px 20px", position: "relative", zIndex: 2 }}>
        <div className="reveal head" style={{ fontSize: 22, padding: "4px 2px 14px" }}>
          {L(lang, { id: "Kebunku 🌿", en: "My Garden 🌿" })}
        </div>

        {variant === "garden" && (
          <div className="col gap-14">
            <div style={stagger(0)}><HeroPlant lang={lang} openModal={openModal} principalUsdc={principal} userYieldUsdc={userYield} activeProtocol={protocol} /></div>
            <div style={stagger(1)}><PrizePool lang={lang} go={go} big currentRound={round} poolYieldUsdc={poolYield} participantCount={participants} /></div>
            <div style={stagger(2)}><KeeperCard lang={lang} go={go} latestReasoning={latestReasoning} /></div>
            <div style={stagger(3)}><WinStrip lang={lang} /></div>
            <div style={stagger(4)}><FeeBar lang={lang} /></div>
          </div>
        )}

        {variant === "calm" && (
          <div className="col gap-14">
            <div className="reveal card" style={{ ...stagger(0), padding: "24px 22px", textAlign: "center", overflow: "hidden" }}>
              <CloverWatermark corner="tr" size={130} opacity={0.05} />
              <div className="muted tiny" style={{ fontWeight: 600, marginBottom: 4 }}>{"My principal, protected on-chain"}</div>
              <div className="head tnum" style={{ fontSize: 52, lineHeight: 1 }}><CountUp value={principal} /></div>
              <div className="head" style={{ fontSize: 16, color: "var(--ink-45)", marginTop: 2 }}>USDC</div>
              <div className="vine-divide" />
              <div className="row between aic">
                <span className="muted tiny">{L(lang, { id: "Bunga ronde ini", en: "Yield this round" })}</span>
                <span className="head tnum" style={{ fontSize: 18, color: "var(--clover)" }}>+<CountUp value={userYield} /> USDC</span>
              </div>
              <div className="row gap-10" style={{ marginTop: 16 }}>
                <button className="btn btn-secondary grow btn-sm" onClick={() => openModal("tarik")}>{L(lang, { id: "Tarik Modal", en: "Withdraw" })}</button>
                <button className="btn btn-danger-ghost btn-sm" onClick={() => openModal("cabut")}>{L(lang, { id: "Cabut Izin", en: "Revoke" })}</button>
              </div>
            </div>
            <div style={stagger(1)}><PrizePool lang={lang} go={go} currentRound={round} poolYieldUsdc={poolYield} participantCount={participants} /></div>
            <div style={stagger(2)}><KeeperCard lang={lang} go={go} latestReasoning={latestReasoning} /></div>
            <div style={stagger(3)}><WinStrip lang={lang} /></div>
            <div style={stagger(4)}><FeeBar lang={lang} /></div>
          </div>
        )}

        {variant === "plots" && (
          <div className="col gap-14">
            <div style={stagger(0)}><HeroPlant lang={lang} openModal={openModal} compact principalUsdc={principal} userYieldUsdc={userYield} activeProtocol={protocol} /></div>
            <div className="row gap-12" style={{ alignItems: "stretch" }}>
              <div className="reveal card card-lift" {...clickable(() => go("detailRonde"))} aria-label={L(lang, { id: "Buka Kolam Hadiah", en: "Open Prize Pool" })} style={{ ...stagger(1), flex: 1, cursor: "pointer", background: "linear-gradient(160deg, color-mix(in srgb,var(--gold) 13%, var(--canvas-2)), var(--canvas-2))" }}>
                <span className="badge badge-win" style={{ marginBottom: 8 }}><Icon.trophy size={12} stroke="var(--gold-deep)" /> {L(lang, { id: `Kolam #${round}`, en: `Pool #${round}` })}</span>
                <div className="head tnum" style={{ fontSize: 26, color: "var(--gold-deep)" }}><CountUp value={poolYield} dec={6} /></div>
                <div className="muted tiny">USDC · {participants} {L(lang, { id: "penanam", en: "planters" })}</div>
              </div>
              <div className="reveal card card-lift" style={{ ...stagger(2), flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <CountdownArc pct={0.68} gold size={130} label={L(lang, { id: "11j 24m", en: "11h 24m" })} sub={L(lang, { id: "undian", en: "draw" })} />
              </div>
            </div>
            <div style={stagger(3)}><KeeperCard lang={lang} go={go} latestReasoning={latestReasoning} /></div>
            <div style={stagger(4)}><WinStrip lang={lang} /></div>
            <div style={stagger(5)}><FeeBar lang={lang} /></div>
          </div>
        )}
      </div>
    </div>
  );
}

const BACKEND_URL = (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_BACKEND_URL) || "http://localhost:3001";

function useDecisions() {
  const [decisions, setDecisions] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/decisions`);
      if (res.ok) setDecisions(await res.json());
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);
  return { decisions, loading, refresh: fetch_ };
}

/* ====================== PANEL TRANSPARANSI AI ====================== */
function SignalChip({ icon: I, label, delay }) {
  return (
    <span className="chip reveal tiny" style={{ animationDelay: delay + "ms", padding: "8px 12px" }}>
      <I size={14} stroke="var(--clover-deep)" /> {label}
    </span>
  );
}

const STATIC_TIMELINE = [
  { r: 11, type: "stay", reason: { id: "Selisih bunga dengan Compound terlalu kecil untuk menutup gas.", en: "Yield gap vs Compound too small to cover gas." }, ok: true },
  { r: 10, type: "move", to: "Moonwell", reason: { id: "Bunga naik signifikan & audit baru lulus.", en: "Yield jumped and a fresh audit passed." }, ok: true },
  { r: 8, type: "stay", reason: { id: "Ada kabar eksploit di protokol lain, hindari risiko.", en: "Exploit news elsewhere, avoid the risk." }, ok: true },
];

function ScreenPanelAI({ lang, go, t }) {
  const { decisions, loading: apiLoading, refresh } = useDecisions();
  const [refreshing, setRefreshing] = useState(false);

  const timeline = decisions
    ? decisions.slice(0, 8).map((d) => ({
        r: d.round,
        type: d.recommendation === "TETAP" || d.recommendation === "STAY" ? "stay" : "move",
        to: d.recommendation !== "TETAP" && d.recommendation !== "STAY" ? d.recommendation : undefined,
        reason: { id: d.reasoning, en: d.reasoning },
        ok: true,
      }))
    : STATIC_TIMELINE;

  const latest = decisions?.[0];

  return (
    <div className="screen" style={{ paddingBottom: 90 }}>
      <LeafFall density={(t.leafDensity ?? 1) * 0.4} />
      <TopBar onBack={() => go("dashboard")} title={L(lang, { id: "Si Pemelihara", en: "The Keeper" })} />

      <div style={{ padding: "8px 18px 20px", position: "relative", zIndex: 2 }}>
        {/* header */}
        <Reveal className="row gap-12" style={{ alignItems: "center", marginBottom: 18 }}>
          <Gardener size={58} />
          <div>
            <h1 style={{ fontSize: 22, lineHeight: 1.1 }}>{L(lang, { id: "Apa yang sedang dipikirkan pemelihara AI", en: "What the AI keeper is thinking" })}</h1>
          </div>
        </Reveal>
        <Reveal delay={60} className="muted" style={{ fontSize: 13.5, lineHeight: 1.5, marginBottom: 18 }}>
          {L(lang, { id: "Setiap keputusan dijelaskan. AI menilai KUALITAS protokol, bukan sekadar bunga tertinggi.", en: "Every decision is explained. The AI judges protocol QUALITY, not just the highest yield." })}
        </Reveal>

        {/* latest decision card */}
        <div className="card reveal" style={{ animationDelay: "120ms", padding: "20px 20px", overflow: "hidden", position: "relative",
          opacity: refreshing || apiLoading ? 0.5 : 1, transition: "opacity .4s" }}>
          <CloverWatermark corner="br" size={130} opacity={0.05} />
          <div className="row between aic" style={{ marginBottom: 12 }}>
            <span className="badge" style={{ background: latest?.recommendation === "TETAP" || latest?.recommendation === "STAY" || !latest ? "var(--clover)" : "var(--gold)", color: "#F4FBF6", fontSize: 14, padding: "9px 16px" }}>
              {latest?.recommendation === "TETAP" || latest?.recommendation === "STAY" || !latest
                ? <><Icon.check size={15} stroke="#F4FBF6" sw={2.4} /> {L(lang, { id: "TETAP DI AAVE", en: "STAY ON AAVE" })}</>
                : <><Icon.arrow size={15} stroke="#F4FBF6" /> {L(lang, { id: "PINDAH KE", en: "MOVE TO" })} {latest.recommendation}</>}
            </span>
            {(refreshing || apiLoading) && <span style={{ width: 18, height: 18, borderRadius: "50%", border: "2.5px solid color-mix(in srgb,var(--clover) 30%, transparent)", borderTopColor: "var(--clover)", animation: "spinClover .8s linear infinite" }} />}
          </div>
          <p style={{ fontSize: 14.5, lineHeight: 1.55, color: "var(--ink)", marginBottom: 14 }}>
            {latest?.reasoning
              ? latest.reasoning
              : L(lang, { id: "Aave punya likuiditas dalam dan tak ada kabar audit negatif minggu ini. Selisih bunga dengan Compound terlalu kecil untuk menutup biaya gas pindah. Maka aku tetap di sini demi keamanan & efisiensi.",
                         en: "Aave has deep liquidity and no negative audit news this week. The yield gap with Compound is too small to cover the gas of moving. So I'm staying here for safety and efficiency." })}
          </p>
          {latest?.protocolSignals?.length > 0 ? (
            <div className="row gap-8 wrap" style={{ marginBottom: 14 }}>
              {latest.protocolSignals.slice(0, 4).map((s, i) => (
                <SignalChip key={i} icon={Icon.coin} label={`${s.name} APY ${s.apy?.toFixed(1)}%`} delay={140 + i * 60} />
              ))}
            </div>
          ) : (
            <div className="row gap-8 wrap" style={{ marginBottom: 14 }}>
              <SignalChip icon={Icon.coin} label={nfmt(lang, "APY 4,1%")} delay={140} />
              <SignalChip icon={Icon.pool} label={nfmt(lang, "TVL $1,2B")} delay={200} />
              <SignalChip icon={Icon.shield} label={L(lang, { id: "Audit: bersih", en: "Audit: clean" })} delay={260} />
              <SignalChip icon={Icon.spark} label={L(lang, { id: "Sentimen: stabil", en: "Sentiment: stable" })} delay={320} />
            </div>
          )}
          <div className="row aic gap-8 tiny" style={{ color: "var(--ink-45)", fontWeight: 600 }}>
            <Icon.history size={14} stroke="var(--ink-45)" />
            {latest
              ? `${L(lang, { id: "Dievaluasi", en: "Evaluated" })} ${new Date(latest.timestamp).toLocaleTimeString()} · ${L(lang, { id: "Dibayar mandiri (x402)", en: "Self-paid (x402)" })}`
              : L(lang, { id: "Dievaluasi 2 jam lalu · Dibayar mandiri oleh agen (x402)", en: "Evaluated 2h ago · Self-paid by the agent (x402)" })}
          </div>
        </div>

        <button className="btn btn-secondary btn-block" style={{ marginTop: 14 }}
          onClick={() => { setRefreshing(true); refresh().finally(() => setRefreshing(false)); }}>
          <Icon.spark size={17} stroke="var(--clover-deep)" /> {L(lang, { id: "Segarkan pemikiran", en: "Refresh thinking" })}
        </button>

        {/* timeline */}
        <div className="head" style={{ fontSize: 16, margin: "26px 2px 14px" }}>{L(lang, { id: "Linimasa keputusan", en: "Decision timeline" })}</div>
        <div style={{ position: "relative", paddingLeft: 6 }}>
          {timeline.map((d, i) => (
            <Reveal key={i} delay={i * 90} className="row gap-12" style={{ alignItems: "flex-start", paddingBottom: i === timeline.length - 1 ? 0 : 16 }}>
              <div className="col aic" style={{ flex: "0 0 auto" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: d.type === "move" ? "color-mix(in srgb,var(--gold) 22%, white)" : "var(--sage)", display: "grid", placeItems: "center" }}>
                  {d.type === "move" ? <Icon.arrow size={16} stroke="var(--gold-deep)" /> : <Icon.check size={16} stroke="var(--clover-deep)" />}
                </div>
                {i !== timeline.length - 1 && <div style={{ width: 2.5, flex: 1, minHeight: 30, margin: "4px 0", borderLeft: "2.5px dotted color-mix(in srgb,var(--clover) 35%, transparent)" }} />}
              </div>
              <div className="card" style={{ flex: 1, padding: "12px 15px" }}>
                <div className="row between aic" style={{ marginBottom: 4 }}>
                  <span className="tiny" style={{ fontWeight: 700, color: "var(--ink-45)" }}>{L(lang, { id: "Ronde", en: "Round" })} #{d.r}</span>
                  <span className="badge" style={{ fontSize: 10.5, padding: "3px 9px", background: d.type === "move" ? "color-mix(in srgb,var(--gold) 20%, white)" : "var(--sage-2)", color: d.type === "move" ? "var(--gold-deep)" : "var(--clover-deep)" }}>
                    {d.type === "move" ? `${L(lang, { id: "PINDAH", en: "MOVE" })} → ${d.to}` : L(lang, { id: "TETAP", en: "STAY" })}
                  </span>
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.4, color: "var(--ink)" }}>{L(lang, d.reason)}</div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* guardrails */}
        <div className="card card-sage reveal" style={{ marginTop: 22, padding: "18px 18px", overflow: "hidden" }}>
          <CloverWatermark corner="br" size={120} opacity={0.06} />
          <div className="row aic gap-10" style={{ marginBottom: 10 }}>
            <Icon.shieldLeaf size={24} stroke="var(--clover-deep)" />
            <div className="head" style={{ fontSize: 16 }}>{L(lang, { id: "Pagar pengaman", en: "Guardrails" })}</div>
          </div>
          <p style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--ink)", marginBottom: 10 }}>
            {L(lang, { id: "AI hanya boleh memilih dari daftar putih. Pemilihan pemenang TIDAK dilakukan AI, memakai undian acak (VRF).",
                       en: "The AI may only choose from the whitelist. Winner selection is NOT done by the AI, it uses random VRF." })}
          </p>
          <div className="row aic gap-8" style={{ background: "var(--canvas-2)", borderRadius: 12, padding: "10px 13px" }}>
            <Icon.check size={16} stroke="var(--clover)" sw={2.4} />
            <span className="tiny" style={{ fontWeight: 600, color: "var(--forest-70)" }}>{L(lang, { id: "Percobaan aksi terlarang terakhir: ditolak otomatis ✔", en: "Last forbidden attempt: auto-rejected ✔" })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export { ScreenDashboard, ScreenPanelAI };
