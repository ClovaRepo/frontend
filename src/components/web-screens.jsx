import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { L, fmt, nfmt, useCountUp, CountUp, Clover, Wordmark, LeafShape, LeafFall, CloverWatermark, Ic, Icon, ActivityIcon, ChainIcon, Gardener, VineStepper, CountdownArc, Plant, Confetti, AreaChart, Collapse, Reveal, TopBar, Toast } from './shared.jsx';
import { MainHead } from './web-app.jsx';
import { useWallet } from './wallet-context.jsx';
import { formatUnits, parseUnits } from 'viem';
import { BRIDGE_CHAINS, fetchLifiQuote, ensureApproval, sendBridgeTx, pollBridgeStatus, quoteEstimate } from '../lib/lifi.js';

const BACKEND_URL = (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_BACKEND_URL) || "http://localhost:3001";

// Returns "CANCELLED" sentinel when user rejects, friendly string for real errors
const CANCELLED = "__cancelled__";
function friendlyErr(e, fallback = "Something went wrong") {
  const msg = (e?.message || e?.details || String(e)).toLowerCase();
  if (msg.includes("user denied") || msg.includes("user rejected") || msg.includes("rejected the request"))
    return CANCELLED;
  if (msg.includes("insufficient funds") || msg.includes("insufficient balance"))
    return "Insufficient balance to cover gas fees.";
  if (msg.includes("nonce") || msg.includes("already known"))
    return "Transaction conflict — please try again.";
  if (msg.includes("network") || msg.includes("failed to fetch") || msg.includes("connection"))
    return "Network error — check your connection and retry.";
  if (msg.includes("gas") && msg.includes("exceed"))
    return "Transaction would exceed gas limit — try a smaller amount.";
  if (msg.includes("reverted") || msg.includes("execution reverted"))
    return "Transaction reverted by the contract. Check your balance and try again.";
  // Strip long hex/viem stack from message
  const clean = (e?.shortMessage || e?.message || fallback).replace(/\n.*/s, "").trim();
  return clean.length > 120 ? fallback : clean;
}

// Shows a brief "cancelled" toast, auto-dismiss after 2s
function useCancelToast() {
  const [show, setShow] = useState(false);
  const fire = useCallback(() => {
    setShow(true);
    setTimeout(() => setShow(false), 2300); // matches toastLife 2.2s + buffer
  }, []);
  return [show, fire];
}

function useDecisionsW() {
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

/* ============================================================
   CLOVA WEB, Keeper, Pool, Log, Settings, Draw overlay, modals
   ============================================================ */

function useFlowW(initial = "idle") {
  const [state, setState] = useState(initial);
  const run = (steps) => { let i = 0; const next = () => { if (i >= steps.length) return; const [s, ms] = steps[i++]; setState(s); if (i < steps.length) setTimeout(next, ms); }; next(); };
  return [state, setState, run];
}
function StatePillW({ tone = "load", children }) {
  return (
    <div className="row aic gap-10" style={{ background: tone === "ok" ? "var(--sage-2)" : "var(--sage)", color: "var(--clover-deep)", borderRadius: 14, padding: "13px 16px", fontWeight: 600, fontSize: 14.5 }}>
      {tone === "load" && <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2.5px solid color-mix(in srgb,var(--clover) 30%, transparent)", borderTopColor: "var(--clover)", animation: "spinClover .8s linear infinite", display: "inline-block" }} />}
      {tone === "ok" && <Icon.check size={18} stroke="var(--clover)" sw={2.4} />}
      {children}
    </div>
  );
}

const STATIC_TIMELINE_W = [
  { r: 11, type: "stay", reason: { id: "Selisih bunga dengan Compound terlalu kecil untuk menutup gas.", en: "Yield gap vs Compound too small to cover gas." } },
  { r: 10, type: "move", to: "Moonwell", reason: { id: "Bunga naik signifikan & audit baru lulus.", en: "Yield jumped and a fresh audit passed." } },
  { r: 8, type: "stay", reason: { id: "Ada kabar eksploit di protokol lain, hindari risiko.", en: "Exploit news elsewhere, avoid the risk." } },
  { r: 7, type: "stay", reason: { id: "Kondisi stabil, tak ada alasan memindahkan dana.", en: "Stable conditions, no reason to move funds." } },
];

/* ===================== KEEPER / PANEL AI ===================== */
function WebKeeper({ lang, t, go }) {
  const { decisions, loading: apiLoading, refresh } = useDecisionsW();
  const [refreshing, setRefreshing] = useState(false);
  const latest = decisions?.[0];

  const defaultChips = [
    { i: Icon.coin, l: nfmt(lang, "APY 4,1%") }, { i: Icon.pool, l: nfmt(lang, "TVL $1,2B") },
    { i: Icon.shield, l: L(lang, { id: "Audit: bersih", en: "Audit: clean" }) },
    { i: Icon.spark, l: L(lang, { id: "Sentimen: stabil", en: "Sentiment: stable" }) },
    { i: Icon.drop, l: L(lang, { id: "Likuiditas: tinggi", en: "Liquidity: high" }) },
  ];
  const chips = latest?.protocolSignals?.length > 0
    ? latest.protocolSignals.slice(0, 5).map((s) => ({ i: Icon.coin, l: `${s.name} APY ${s.apy?.toFixed(1)}%` }))
    : defaultChips;

  const timeline = decisions
    ? decisions.slice(0, 8).map((d) => ({
        r: d.round,
        type: d.recommendation === "TETAP" || d.recommendation === "STAY" ? "stay" : "move",
        to: d.recommendation !== "TETAP" && d.recommendation !== "STAY" ? d.recommendation : undefined,
        reason: { id: d.reasoning, en: d.reasoning },
      }))
    : STATIC_TIMELINE_W;
  return (
    <div className="main">
      <MainHead lang={lang} go={go} title={L(lang, { id: "Pemelihara AI", en: "AI Keeper" })} sub={L(lang, { id: "Setiap keputusan dijelaskan terbuka.", en: "Every decision explained openly." })} />
      <div className="main-body">
        <Reveal className="row aic gap-16" style={{ marginBottom: 24 }}>
          <Gardener size={62} />
          <div>
            <h2 style={{ fontSize: 26, lineHeight: 1.1 }}>{L(lang, { id: "Apa yang sedang dipikirkan pemelihara AI", en: "What the AI keeper is thinking" })}</h2>
            <p className="muted" style={{ fontSize: 14.5, marginTop: 4 }}>{L(lang, { id: "AI menilai KUALITAS protokol, bukan sekadar bunga tertinggi.", en: "The AI judges protocol QUALITY, not just the highest yield." })}</p>
          </div>
        </Reveal>

        <div className="bento">
          {/* latest decision */}
          <Reveal delay={60} className="col-7">
            <div className="card card-pad-lg" style={{ overflow: "hidden", position: "relative", opacity: refreshing || apiLoading ? .5 : 1, transition: "opacity .4s" }}>
              <CloverWatermark corner="br" size={170} opacity={0.05} />
              <div className="row between aic" style={{ marginBottom: 14 }}>
                <span className="badge" style={{ background: latest?.recommendation === "TETAP" || latest?.recommendation === "STAY" || !latest ? "var(--clover)" : "var(--gold)", color: "#F4FBF6", fontSize: 15, padding: "10px 18px" }}>
                  {latest?.recommendation === "TETAP" || latest?.recommendation === "STAY" || !latest
                    ? <><Icon.check size={16} stroke="#F4FBF6" sw={2.4} /> {L(lang, { id: "TETAP DI AAVE", en: "STAY ON AAVE" })}</>
                    : <><Icon.arrow size={16} stroke="#F4FBF6" /> {L(lang, { id: "PINDAH KE", en: "MOVE TO" })} {latest.recommendation}</>}
                </span>
                {(refreshing || apiLoading) && <span style={{ width: 20, height: 20, borderRadius: "50%", border: "2.5px solid color-mix(in srgb,var(--clover) 30%, transparent)", borderTopColor: "var(--clover)", animation: "spinClover .8s linear infinite" }} />}
              </div>
              <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--ink)", marginBottom: 18 }}>
                {latest?.reasoning
                  ? latest.reasoning
                  : L(lang, { id: "Aave punya likuiditas dalam dan tak ada kabar audit negatif minggu ini. Selisih bunga dengan Compound terlalu kecil untuk menutup biaya gas pindah. Maka aku tetap di sini demi keamanan & efisiensi.",
                             en: "Aave has deep liquidity and no negative audit news this week. The yield gap with Compound is too small to cover the gas of moving. So I'm staying here for safety and efficiency." })}
              </p>
              <div className="row gap-8 wrap" style={{ marginBottom: 16 }}>
                {chips.map((c, i) => <span key={i} className="chip"><c.i size={14} stroke="var(--clover-deep)" /> {c.l}</span>)}
              </div>
              <div className="row between aic">
                <span className="row aic gap-8 tiny" style={{ color: "var(--ink-45)", fontWeight: 600 }}><Icon.history size={14} stroke="var(--ink-45)" />
                  {latest
                    ? `${L(lang, { id: "Dievaluasi", en: "Evaluated" })} ${new Date(latest.timestamp).toLocaleTimeString()} · ${L(lang, { id: "Dibayar mandiri (x402)", en: "Self-paid (x402)" })}`
                    : L(lang, { id: "Dievaluasi 2 jam lalu · Dibayar mandiri (x402)", en: "Evaluated 2h ago · Self-paid (x402)" })}
                </span>
                <button className="btn btn-secondary btn-sm" onClick={() => { setRefreshing(true); refresh().finally(() => setRefreshing(false)); }}><Icon.spark size={15} stroke="var(--clover-deep)" /> {L(lang, { id: "Segarkan", en: "Refresh" })}</button>
              </div>
            </div>
          </Reveal>

          {/* guardrails */}
          <Reveal delay={120} className="col-5">
            <div className="card card-pad-lg card-sage" style={{ height: "100%", overflow: "hidden", position: "relative", display: "flex", flexDirection: "column" }}>
              <CloverWatermark corner="br" size={150} opacity={0.06} />
              <div className="row aic gap-10" style={{ marginBottom: 12 }}><Icon.shieldLeaf size={26} stroke="var(--clover-deep)" /><div className="head" style={{ fontSize: 18 }}>{L(lang, { id: "Pagar pengaman", en: "Guardrails" })}</div></div>
              <p style={{ fontSize: 14.5, lineHeight: 1.55, color: "var(--ink)", marginBottom: 16 }}>{L(lang, { id: "Bukan sekadar janji, tiap aksi dipaksa oleh kode on-chain.", en: "Not just a promise, every action is enforced by on-chain code." })}</p>
              <div className="col gap-10" style={{ marginBottom: 16 }}>
                {[
                  { id: "Hanya memindah dana antar protokol daftar putih", en: "Only moves funds between whitelisted protocols" },
                  { id: "Hanya menyapu bunga, modal pokok tak tersentuh", en: "Sweeps yield only, principal is untouchable" },
                  { id: "Pemenang via VRF acak, bukan dipilih AI", en: "Winners via random VRF, never chosen by the AI" },
                  { id: "Izin bisa dicabut kapan saja, langsung", en: "Permission is revocable anytime, instantly" },
                ].map((g, i) => (
                  <div key={i} className="row gap-10" style={{ alignItems: "flex-start" }}>
                    <span style={{ flex: "0 0 auto", width: 22, height: 22, borderRadius: "50%", background: "var(--canvas-2)", display: "grid", placeItems: "center", marginTop: 1 }}><Icon.check size={13} stroke="var(--clover)" sw={2.6} /></span>
                    <span style={{ fontSize: 14, lineHeight: 1.45, color: "var(--ink)" }}>{L(lang, g)}</span>
                  </div>
                ))}
              </div>
              <div className="row aic gap-8" style={{ marginTop: "auto", background: "var(--canvas-2)", borderRadius: 12, padding: "11px 14px" }}>
                <Icon.check size={16} stroke="var(--clover)" sw={2.4} /><span className="tiny" style={{ fontWeight: 600, color: "var(--forest-70)" }}>{L(lang, { id: "Percobaan aksi terlarang terakhir: ditolak otomatis", en: "Last forbidden attempt: auto-rejected" })}</span>
              </div>
            </div>
          </Reveal>

          {/* timeline */}
          <Reveal delay={180} className="col-12">
            <div className="card card-pad-lg">
              <div className="head" style={{ fontSize: 18, marginBottom: 18 }}>{L(lang, { id: "Linimasa keputusan", en: "Decision timeline" })}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
                {timeline.map((d, i) => (
                  <div key={i} style={{ borderRadius: 16, padding: "16px 18px", background: d.type === "move" ? "color-mix(in srgb,var(--gold) 9%, var(--canvas))" : "var(--sage)" }}>
                    <div className="row between aic" style={{ marginBottom: 8 }}>
                      <span className="tiny" style={{ fontWeight: 700, color: "var(--ink-45)" }}>{L(lang, { id: "Ronde", en: "Round" })} #{d.r}</span>
                      <span className="badge" style={{ fontSize: 10, padding: "3px 9px", background: d.type === "move" ? "color-mix(in srgb,var(--gold) 20%, white)" : "var(--sage-2)", color: d.type === "move" ? "var(--gold-deep)" : "var(--clover-deep)" }}>{d.type === "move" ? `${L(lang, { id: "PINDAH", en: "MOVE" })} → ${d.to}` : L(lang, { id: "TETAP", en: "STAY" })}</span>
                    </div>
                    <div style={{ fontSize: 13.5, lineHeight: 1.45, color: "var(--ink)" }}>{L(lang, d.reason)}</div>
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

/* ===================== POOL DETAIL ===================== */
function WebPool({ lang, t, onDraw, go }) {
  const [status, setStatus] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [drawCountdown, setDrawCountdown] = useState({ label: "—", pct: 0 });

  useEffect(() => {
    fetch(`${BACKEND_URL}/status`).then(r => r.json()).then(setStatus).catch(() => {});
    fetch(`${BACKEND_URL}/decisions?limit=5`).then(r => r.json()).then(d => Array.isArray(d) && setDecisions(d)).catch(() => {});
  }, []);

  useEffect(() => {
    function calcDraw() {
      const now = new Date();
      const next = new Date(now);
      next.setUTCDate(now.getUTCDate() + ((7 - now.getUTCDay()) % 7 || 7));
      next.setUTCHours(0, 0, 0, 0);
      const ms = next - now;
      const totalMs = 7 * 24 * 3600 * 1000;
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const d = Math.floor(h / 24);
      const label = d > 0
        ? `${d}d ${h % 24}h`
        : `${h}h ${m}m`;
      setDrawCountdown({ label, pct: Math.max(0, 1 - ms / totalMs) });
    }
    calcDraw();
    const t = setInterval(calcDraw, 60000);
    return () => clearInterval(t);
  }, []);

  const totalYield   = Number(status?.roundYieldPool ?? 0);
  const totalPrincipal = Number(status?.totalPrincipalUsdc ?? 0);
  const planters     = status?.participantCount ?? 0;
  const protocol     = status?.activeProtocol ?? "Aave v3";
  const currentRound = status?.currentRound ?? 0;
  const chartData   = decisions.length > 1
    ? decisions.slice().reverse().map((d, i) => Number(d.yieldSweptUsdc ?? 0) * (i + 1))
    : [0, 0, 0, 0, 0, 0, 0, 0, 0, totalYield];
  const rounds = decisions.slice(0, 4).map(d => ({
    r: d.round,
    win: "—",
    amt: Number(d.yieldSweptUsdc ?? 0).toFixed(4),
    proto: d.recommendation === "TETAP" ? protocol : d.recommendation,
    dec: d.recommendation === "TETAP" ? "stay" : "move",
  }));

  return (
    <div className="main">
      <MainHead lang={lang} go={go} title={L(lang, { id: `Kolam Hadiah · Ronde #${currentRound}`, en: `Prize Pool · Round #${currentRound}` })} sub={L(lang, { id: "Sedang berjalan", en: "Currently running" })} />
      <div className="main-body">
        <div className="bento">
          <Reveal className="col-8">
            <div className="card card-pad-lg" style={{ background: "linear-gradient(160deg, color-mix(in srgb,var(--gold) 11%, var(--canvas-2)), var(--canvas-2))" }}>
              <div className="muted" style={{ fontWeight: 600, fontSize: 14 }}>{L(lang, { id: "Total bunga terkumpul ronde ini", en: "Total yield gathered this round" })}</div>
              <div className="num-lg" style={{ color: "var(--gold-deep)", margin: "8px 0 18px" }}><CountUp value={totalYield} dec={4} /> <span style={{ fontSize: 22 }}>USDC</span></div>
              <AreaChart data={chartData} color="var(--clover)" h={130} />
            </div>
          </Reveal>
          <Reveal delay={80} className="col-4">
            <div className="card card-pad-lg" style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <CountdownArc pct={drawCountdown.pct} gold size={220} label={drawCountdown.label} sub={L(lang, { id: "menuju undian", en: "to the draw" })} />
              <div className="row aic gap-8" style={{ marginTop: 16, background: "color-mix(in srgb,var(--gold) 10%, var(--canvas-2))", borderRadius: 12, padding: "11px 14px", width: "100%" }}>
                <Icon.robot size={15} stroke="var(--gold-deep)" />
                <span className="tiny" style={{ fontWeight: 600, color: "var(--gold-deep)" }}>
                  {L(lang, { id: "Undian otomatis via agen AI", en: "Auto draw via AI agent" })}
                </span>
              </div>
            </div>
          </Reveal>

          {[{ i: Icon.leaf, l: { id: "Penanam", en: "Planters" }, v: String(planters) },
            { i: Icon.coin, l: { id: "Modal dikelola", en: "Principal managed" }, v: totalPrincipal.toFixed(2), s: "USDC" },
            { i: Icon.drop, l: { id: "Bunga disapu hari ini", en: "Yield swept today" }, v: `+${totalYield.toFixed(4)}`, s: "USDC" },
            { i: Icon.shieldLeaf, l: { id: "Protokol aktif", en: "Active protocol" }, v: protocol, s: L(lang, { id: "Sehat", en: "Healthy" }) }].map((st, i) => (
            <Reveal key={i} delay={140 + i * 50} className="col-4" style={{ gridColumn: "span 3" }}>
              <div className="card card-pad-lg" style={{ height: "100%" }}>
                <st.i size={22} stroke="var(--clover-deep)" />
                <div className="head tnum" style={{ fontSize: 26, marginTop: 10 }}>{nfmt(lang, st.v)}</div>
                <div className="muted tiny" style={{ marginTop: 2 }}>{L(lang, st.l)}</div>
                {st.s && <div className="tiny" style={{ color: "var(--clover-deep)", fontWeight: 600, marginTop: 3 }}>{st.s}</div>}
              </div>
            </Reveal>
          ))}

          <Reveal delay={360} className="col-12">
            <div className="card card-pad-lg">
              <div className="head" style={{ fontSize: 18, marginBottom: 16 }}>{L(lang, { id: "Riwayat ronde", en: "Past rounds" })}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                {rounds.map((rd, i) => (
                  <div key={i} style={{ borderRadius: 16, padding: "16px 18px", background: "var(--sage)" }}>
                    <div className="row between aic" style={{ marginBottom: 8 }}>
                      <span className="tiny" style={{ fontWeight: 700, color: "var(--ink-45)" }}>{L(lang, { id: "Ronde", en: "Round" })} #{rd.r}</span>
                      <span className="badge" style={{ fontSize: 9.5, padding: "2px 8px", background: rd.dec === "move" ? "color-mix(in srgb,var(--gold) 20%, white)" : "var(--sage-2)", color: rd.dec === "move" ? "var(--gold-deep)" : "var(--clover-deep)" }}>{rd.dec === "move" ? L(lang, { id: "PINDAH", en: "MOVE" }) : L(lang, { id: "TETAP", en: "STAY" })}</span>
                    </div>
                    <div className="head tnum" style={{ fontSize: 22, color: "var(--gold-deep)" }}>{nfmt(lang, rd.amt)} <span style={{ fontSize: 12 }}>USDC</span></div>
                    <div className="tiny muted tnum" style={{ marginTop: 4 }}>{rd.win} · {rd.proto}</div>
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

/* ===================== LOG / RIWAYAT ===================== */
function WebLog({ lang, t, go }) {
  const { round, poolYield, chancePct, principalUsdc } = useWallet();
  const [filter, setFilter] = useState("all");
  const [decisions, setDecisions] = useState([]);
  const [txs, setTxs] = useState([]);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetch(`${BACKEND_URL}/decisions?limit=20`).then(r => r.json()).then(d => Array.isArray(d) && setDecisions(d)).catch(() => {});
    fetch(`${BACKEND_URL}/transactions`).then(r => r.json()).then(d => Array.isArray(d) && setTxs(d)).catch(() => {});
    fetch(`${BACKEND_URL}/status`).then(r => r.json()).then(setStatus).catch(() => {});
  }, []);

  const filters = [{ k: "all", t: { id: "Semua", en: "All" } }, { k: "deposit", t: { id: "Setoran", en: "Deposits" } }, { k: "yield", t: { id: "Bunga", en: "Yield" } }, { k: "ai", t: { id: "Keputusan AI", en: "AI" } }, { k: "draw", t: { id: "Undian", en: "Draws" } }];

  const relTime = (ts) => {
    const diff = Date.now() - ts;
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (h < 1) return { id: "Baru saja", en: "Just now" };
    if (h < 24) return { id: `${h} jam lalu`, en: `${h}h ago` };
    if (d < 7) return { id: `${d} hari lalu`, en: `${d}d ago` };
    return { id: `${d} hari lalu`, en: `${d}d ago` };
  };
  const dayLabel = (ts) => {
    const d = Math.floor((Date.now() - ts) / 86400000);
    if (d === 0) return { id: "Hari ini", en: "Today" };
    if (d === 1) return { id: "Kemarin", en: "Yesterday" };
    return { id: "Minggu ini", en: "This week" };
  };

  const events = [
    ...decisions.map(d => ({
      ts: d.timestamp,
      day: dayLabel(d.timestamp),
      cat: "ai",
      title: d.recommendation === "TETAP"
        ? { id: `AI: TETAP di ${status?.activeProtocol ?? "Aave"} — ${d.reasoning?.slice(0,50) ?? ""}…`, en: `AI: STAY on ${status?.activeProtocol ?? "Aave"} — ${d.reasoning?.slice(0,50) ?? ""}…` }
        : { id: `AI: PINDAH ke ${d.recommendation} — ${d.reasoning?.slice(0,40) ?? ""}…`, en: `AI: MOVE to ${d.recommendation} — ${d.reasoning?.slice(0,40) ?? ""}…` },
      time: relTime(d.timestamp),
      link: true,
    })),
    ...txs.filter(tx => tx.type === "sweep").map(tx => ({
      ts: tx.timestamp,
      day: dayLabel(tx.timestamp),
      cat: "yield",
      title: { id: `Bunga +${Number(tx.yieldAmountUsdc ?? 0).toFixed(4)} USDC disapu ke Kolam`, en: `Yield +${Number(tx.yieldAmountUsdc ?? 0).toFixed(4)} USDC swept to Pool` },
      time: relTime(tx.timestamp),
    })),
    ...txs.filter(tx => tx.type === "draw").map(tx => ({
      ts: tx.timestamp,
      day: dayLabel(tx.timestamp),
      cat: "draw",
      title: { id: `Undian ronde — modal utuh`, en: `Draw round — principal whole` },
      time: relTime(tx.timestamp),
    })),
  ].sort((a, b) => b.ts - a.ts);

  const shown = events.filter((e) => filter === "all" || e.cat === filter);
  const currentRound = status?.currentRound ?? round ?? 1;
  const totalYield = status?.roundYieldPool ? Number(status.roundYieldPool) : Number(poolYield ?? 0);
  let lastDay = null;
  return (
    <div className="main">
      <MainHead lang={lang} go={go} title={L(lang, { id: "Catatan kebunmu", en: "Your garden log" })} sub={L(lang, { id: "Semua kejadian dalam satu linimasa.", en: "Every event in one timeline." })} />
      <div className="main-body">
       <div className="bento">
        <div className="col-8">
        <div className="row gap-8 wrap" style={{ marginBottom: 24 }}>
          {filters.map((f) => <button key={f.k} className={"chip" + (filter === f.k ? " chip-on" : "")} style={{ cursor: "pointer" }} onClick={() => setFilter(f.k)}>{L(lang, f.t)}</button>)}
        </div>
        <div>
          {shown.length === 0 && (
            <div className="card card-pad-lg" style={{ textAlign: "center", padding: "44px 24px" }}>
              <div style={{ display: "grid", placeItems: "center", marginBottom: 12 }}><Plant grow={0.08} size={96} /></div>
              <div className="head" style={{ fontSize: 17, marginBottom: 6 }}>{L(lang, { id: "Belum ada aktivitas", en: "No activity yet" })}</div>
              <div className="muted tiny">{L(lang, { id: "Tak ada kejadian di kategori ini.", en: "No events in this category." })}</div>
            </div>
          )}
          {shown.map((e, i) => {
            const showDay = L(lang, e.day) !== lastDay; lastDay = L(lang, e.day);
            return (
              <React.Fragment key={i}>
                {showDay && <div className="tiny" style={{ fontWeight: 700, color: "var(--ink-45)", margin: i === 0 ? "0 0 14px 48px" : "20px 0 14px 48px", textTransform: "uppercase", letterSpacing: ".06em" }}>{L(lang, e.day)}</div>}
                <Reveal delay={i * 60} className="row gap-14" style={{ alignItems: "flex-start", paddingBottom: 16 }}>
                  <div className="col aic" style={{ flex: "0 0 auto" }}>
                    <ActivityIcon cat={e.cat} win={e.win} safe={e.safe} size={36} />
                    {i !== shown.length - 1 && <div style={{ width: 2.5, flex: 1, minHeight: 20, margin: "4px 0", borderLeft: "2.5px dotted color-mix(in srgb,var(--clover) 30%, transparent)" }} />}
                  </div>
                  <div className="card" style={{ flex: 1, padding: "14px 18px", border: e.win ? "1.5px solid color-mix(in srgb,var(--gold) 28%, transparent)" : "1.5px solid transparent" }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: e.win ? "var(--gold-deep)" : "var(--forest)" }}>{L(lang, e.title)}</div>
                    <div className="row aic gap-8" style={{ marginTop: 5 }}>
                      <span className="muted tiny">{L(lang, e.time)}</span>
                      {e.link && <span className="tlink tiny" style={{ padding: 0 }}>· {L(lang, { id: "lihat alasan", en: "see reason" })}</span>}
                      {e.safe && <span className="badge badge-safe" style={{ fontSize: 10, padding: "2px 8px" }}>{L(lang, { id: "Aman", en: "Safe" })}</span>}
                    </div>
                  </div>
                </Reveal>
              </React.Fragment>
            );
          })}
        </div>
        </div>

        <Reveal delay={120} className="col-4">
          <div className="card card-pad-lg" style={{ position: "sticky", top: 96 }}>
            <div className="head" style={{ fontSize: 17, marginBottom: 4 }}>{L(lang, { id: "Ronde ini", en: "This round" })}</div>
            <div className="muted tiny" style={{ marginBottom: 16 }}>{L(lang, { id: `Ronde #${currentRound} · sedang berjalan`, en: `Round #${currentRound} · running` })}</div>
            <div className="col gap-2">
              {[
                { l: { id: "Bunga disumbang", en: "Yield contributed" }, v: `+${totalYield.toFixed(4)} USDC`, accent: true },
                { l: { id: "Peluang menang", en: "Win chance" }, v: `${(chancePct ?? 0).toFixed(1)}%` },
                { l: { id: "Kolam hadiah", en: "Prize pool" }, v: `${totalYield.toFixed(4)} USDC` },
                { l: { id: "Undian berikutnya", en: "Next draw" }, v: L(lang, { id: "Otomatis (Minggu)", en: "Auto (Sunday)" }) },
              ].map((row, i) => (
                <div key={i} className="row between aic" style={{ padding: "11px 0", borderBottom: i < 3 ? "1px solid var(--hairline)" : "none" }}>
                  <span className="muted" style={{ fontSize: 13.5, fontWeight: 500 }}>{L(lang, row.l)}</span>
                  <span className="head tnum" style={{ fontSize: 15, color: row.accent ? "var(--clover)" : "var(--forest)" }}>{row.v}</span>
                </div>
              ))}
            </div>
            <button className="btn btn-secondary btn-sm btn-block" style={{ marginTop: 16 }} onClick={() => go && go("pool")}>
              {L(lang, { id: "Lihat Kolam Hadiah", en: "View Prize Pool" })} <Icon.arrow size={15} stroke="var(--clover-deep)" />
            </button>
          </div>
        </Reveal>
       </div>
      </div>
    </div>
  );
}

/* ===================== SETTINGS ===================== */
function WebSettings({ lang, setLang, openModal, t, go }) {
  const { account, chancePct } = useWallet();
  const shortAddr = account ? `${account.slice(0,6)}…${account.slice(-4)}` : "—";
  return (
    <div className="main">
      <MainHead lang={lang} go={go} title={L(lang, { id: "Pengaturan", en: "Settings" })} sub={L(lang, { id: "Kendali penuh & transparansi.", en: "Full control & transparency." })} />
      <div className="main-body">
        <div className="bento">
          <Reveal className="col-6">
            <div className="card card-pad-lg" style={{ height: "100%" }}>
              <div className="head" style={{ fontSize: 17, marginBottom: 8 }}>{L(lang, { id: "Akun", en: "Account" })}</div>
              {[{ i: Icon.wallet, l: { id: "Alamat dompet", en: "Wallet" }, v: shortAddr, b: <Icon.copy size={16} stroke="var(--clover)" /> },
                { i: Icon.spark, l: { id: "Akun Pintar", en: "Smart Account" }, b: <span className="badge badge-active" style={{ fontSize: 10.5, padding: "3px 9px" }}>{L(lang, { id: "Aktif", en: "Active" })}</span> },
                { i: Icon.leaf, l: { id: "Peluang Menang", en: "Win Chance" }, b: <span className="badge badge-active" style={{ fontSize: 10.5, padding: "3px 9px" }}>{`${(chancePct ?? 0).toFixed(1)}%`}</span> },
                { i: Icon.pool, l: { id: "Jaringan", en: "Network" }, b: <span className="badge badge-soft">Base</span> }].map((row, i) => (
                <div key={i} className="row between aic" style={{ padding: "14px 0", borderBottom: i < 3 ? "1px solid var(--hairline)" : "none" }}>
                  <div className="row aic gap-10"><row.i size={18} stroke="var(--forest-70)" /><span style={{ fontSize: 14.5, fontWeight: 500 }}>{L(lang, row.l)}</span></div>
                  <div className="row aic gap-8">{row.v && <span className="tnum tiny" style={{ color: "var(--ink-45)", fontWeight: 600 }}>{row.v}</span>}{row.b}</div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={80} className="col-6">
            <div className="card card-pad-lg card-sage" style={{ height: "100%", overflow: "hidden", position: "relative" }}>
              <CloverWatermark corner="br" size={130} opacity={0.06} />
              <div className="row aic gap-10" style={{ marginBottom: 14 }}><Icon.shieldLeaf size={24} stroke="var(--clover-deep)" /><div className="head" style={{ fontSize: 17 }}>{L(lang, { id: "Izin pemelihara AI", en: "AI keeper permission" })}</div><span className="badge badge-active" style={{ fontSize: 10.5, padding: "3px 9px", marginLeft: "auto" }}>{L(lang, { id: "Aktif", en: "Active" })}</span></div>
              <div className="row gap-10" style={{ marginBottom: 16 }}>
                <div style={{ flex: 1, background: "var(--canvas-2)", borderRadius: 12, padding: "12px 14px" }}><div className="tiny row aic gap-6" style={{ fontWeight: 700, color: "var(--clover-deep)", marginBottom: 5 }}><Icon.check size={14} stroke="var(--clover)" sw={2.6} /> {L(lang, { id: "BOLEH", en: "MAY" })}</div><div className="tiny muted" style={{ lineHeight: 1.4 }}>{L(lang, { id: "Pindah antar protokol putih · sapu bunga", en: "Move between whitelisted protocols · sweep yield" })}</div></div>
                <div style={{ flex: 1, background: "color-mix(in srgb,var(--danger) 7%, var(--canvas-2))", borderRadius: 12, padding: "12px 14px" }}><div className="tiny row aic gap-6" style={{ fontWeight: 700, color: "var(--danger)", marginBottom: 5 }}><Icon.x size={14} stroke="var(--danger)" sw={2.6} /> {L(lang, { id: "TIDAK", en: "CANNOT" })}</div><div className="tiny muted" style={{ lineHeight: 1.4 }}>{L(lang, { id: "Sentuh modal · kirim ke luar daftar", en: "Touch principal · send off-list" })}</div></div>
              </div>
              <div className="row gap-10"><button className="btn btn-secondary grow btn-sm" onClick={() => go("keeper")}>{L(lang, { id: "Lihat pemelihara", en: "View keeper" })}</button><button className="btn btn-danger-ghost btn-sm" onClick={() => openModal("cabut")}>{L(lang, { id: "Cabut Izin", en: "Revoke" })}</button></div>
              <div className="tiny muted" style={{ marginTop: 10, lineHeight: 1.4 }}>{L(lang, { id: "Pemelihara membayar operasinya sendiri (x402).", en: "The keeper self-pays its operations (x402)." })}</div>
            </div>
          </Reveal>

          <Reveal delay={140} className="col-6">
            <div className="card card-pad-lg" style={{ height: "100%" }}>
              <div className="head" style={{ fontSize: 17, marginBottom: 6 }}>{L(lang, { id: "Tentang & keamanan", en: "About & security" })}</div>
              <p style={{ fontSize: 14.5, lineHeight: 1.5, color: "var(--ink)", marginBottom: 12 }}>{L(lang, { id: "Aman bukan karena percaya AI, tapi karena dipaksa kode.", en: "Safe not because you trust the AI, but because code enforces it." })}</p>
              <div className="row gap-10 wrap" style={{ marginBottom: 12 }}><span className="tlink tiny">{L(lang, { id: "Lihat kontrak", en: "View contracts" })} ↗</span><span className="tlink tiny">{L(lang, { id: "Audit", en: "Audits" })} ↗</span></div>
              <div className="tiny muted" style={{ lineHeight: 1.45 }}>{L(lang, { id: "No-loss ≠ no-risk. Dana di protokol teruji: Aave, Compound, Morpho, Moonwell.", en: "No-loss ≠ no-risk. Funds in audited protocols: Aave, Compound, Morpho, Moonwell." })}</div>
            </div>
          </Reveal>

          <Reveal delay={200} className="col-6">
            <div className="card card-pad-lg" style={{ height: "100%" }}>
              <div className="head" style={{ fontSize: 17, marginBottom: 8 }}>{L(lang, { id: "Preferensi", en: "Preferences" })}</div>
              <div className="row between aic" style={{ padding: "14px 0", borderBottom: "1px solid var(--hairline)" }}>
                <div className="row aic gap-10"><Icon.bell size={18} stroke="var(--forest-70)" /><span style={{ fontSize: 14.5, fontWeight: 500 }}>{L(lang, { id: "Notifikasi undian & AI", en: "Draw & AI alerts" })}</span></div>
                <ToggleW on />
              </div>
              <div className="row between aic" style={{ padding: "14px 0" }}>
                <div className="row aic gap-10"><Icon.globe size={18} stroke="var(--forest-70)" /><span style={{ fontSize: 14.5, fontWeight: 500 }}>{L(lang, { id: "Bahasa", en: "Language" })}</span></div>
                <div className="seg">{["id", "en"].map((lc) => <button key={lc} className={lang === lc ? "on" : ""} onClick={() => setLang(lc)}>{lc.toUpperCase()}</button>)}</div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

function ToggleW({ on: initial }) {
  const [on, setOn] = useState(initial);
  return <button onClick={() => setOn(!on)} style={{ width: 46, height: 27, borderRadius: 999, border: "none", cursor: "pointer", padding: 3, background: on ? "var(--clover)" : "color-mix(in srgb,var(--forest) 15%, transparent)", transition: "background .25s" }}><span style={{ display: "block", width: 21, height: 21, borderRadius: "50%", background: "#fff", transform: on ? "translateX(19px)" : "none", transition: "transform .25s var(--ease-back)", boxShadow: "0 2px 4px rgba(0,0,0,.2)" }} /></button>;
}

/* ===================== DRAW OVERLAY ===================== */
function WebDraw({ lang, t, onClose }) {
  const result = t.drawResult || "win";
  const [phase, setPhase] = useState("pre");
  useEffect(() => { if (phase === "drawing") { const id = setTimeout(() => setPhase("result"), 2600); return () => clearTimeout(id); } }, [phase]);
  const winners = [{ addr: "0x12…9aF3", amt: "182,40", you: result === "win" }, { addr: "0x77…b2C1", amt: "514,80" }, { addr: "0x4a…0e9D", amt: "457,80" }];

  return (
    <div className="draw-overlay">
      <LeafFall density={(t.leafDensity ?? 1) * (phase === "result" && result === "win" ? 1.2 : 0.5)} golden={result === "win"} />
      {phase === "result" && result === "win" && <Confetti go count={70} />}
      <button onClick={onClose} aria-label="close" style={{ position: "absolute", top: 26, right: 30, width: 44, height: 44, borderRadius: "50%", border: "none", background: "var(--canvas-2)", boxShadow: "var(--shadow-card)", display: "grid", placeItems: "center", cursor: "pointer", zIndex: 5 }}><Icon.x size={20} stroke="var(--forest)" /></button>

      <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 560, padding: 24 }}>
        {phase === "pre" && (
          <div className="reveal">
            <div className="badge badge-win" style={{ marginBottom: 20 }}><Icon.trophy size={14} stroke="var(--gold-deep)" /> {L(lang, { id: "Ronde #12 · Undian berlangsung", en: "Round #12 · Draw in progress" })}</div>
            <div style={{ display: "grid", placeItems: "center", marginBottom: 22 }}><Clover size={140} color="var(--clover)" breathe /></div>
            <h1 style={{ fontSize: 34, marginBottom: 10 }}>{L(lang, { id: "Kolam hadiah ronde ini", en: "This round's prize pool" })}</h1>
            <div className="head tnum" style={{ fontSize: 64, color: "var(--gold-deep)", marginBottom: 8 }}>1.284 <span style={{ fontSize: 28 }}>USDC</span></div>
            <p className="muted" style={{ fontSize: 15, marginBottom: 24 }}>{L(lang, { id: "Acak & adil lewat VRF on-chain.", en: "Random & fair via on-chain VRF." })}</p>
            <div className="row aic gap-12" style={{ justifyContent: "center", background: "color-mix(in srgb,var(--gold) 11%, var(--canvas-2))", borderRadius: 16, padding: "16px 24px" }}>
              <Icon.robot size={22} stroke="var(--gold-deep)" />
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--gold-deep)" }}>
                {L(lang, { id: "Agen AI sedang menarik pemenang…", en: "AI agent is drawing the winner…" })}
              </span>
              <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2.5px solid color-mix(in srgb,var(--gold) 30%, transparent)", borderTopColor: "var(--gold-deep)", animation: "spinClover .8s linear infinite", display: "inline-block" }} />
            </div>
          </div>
        )}
        {phase === "drawing" && (
          <div>
            <div style={{ display: "grid", placeItems: "center", marginBottom: 30 }}><Clover size={180} color="var(--gold)" spin style={{ filter: "drop-shadow(0 10px 30px color-mix(in srgb,var(--gold) 50%, transparent))" }} /></div>
            <h1 style={{ fontSize: 32, marginBottom: 10 }}>{L(lang, { id: "Menarik pemenang ronde #12…", en: "Drawing round #12's winner…" })}</h1>
            <p className="muted" style={{ fontSize: 15 }}>{L(lang, { id: "Acak & adil lewat VRF on-chain.", en: "Random & fair via on-chain VRF." })}</p>
          </div>
        )}
        {phase === "result" && (
          <div className="reveal">
            {result === "win" ? (
              <>
                <div style={{ display: "grid", placeItems: "center", marginBottom: 10, animation: "bloomPop .9s var(--ease-back)" }}><Clover size={120} color="var(--gold)" style={{ filter: "drop-shadow(0 10px 26px color-mix(in srgb,var(--gold) 55%, transparent))" }} /></div>
                <h1 style={{ fontSize: 44, color: "var(--gold-deep)", marginBottom: 6 }}>{L(lang, { id: "Kamu menang! 🍀", en: "You won! 🍀" })}</h1>
                <div className="head tnum" style={{ fontSize: 64, color: "var(--gold-deep)", lineHeight: 1 }}>+<CountUp value={182.40} /> <span style={{ fontSize: 24 }}>USDC</span></div>
                <p className="muted" style={{ fontSize: 15, lineHeight: 1.5, maxWidth: 380, margin: "16px auto 26px" }}>{L(lang, { id: "Bunga gabungan semua penanam jadi milikmu ronde ini. Modalmu tetap utuh.", en: "Everyone's combined yield is yours this round. Your principal stays whole." })}</p>
              </>
            ) : (
              <>
                <div style={{ display: "grid", placeItems: "center", marginBottom: 14, animation: "bloomPop .8s var(--ease-back)" }}><Plant grow={0.5} size={130} /></div>
                <h1 style={{ fontSize: 34, marginBottom: 12 }}>{L(lang, { id: "Belum hoki ronde ini 🌱", en: "No luck this round 🌱" })}</h1>
                <p className="muted" style={{ fontSize: 15.5, lineHeight: 1.55, maxWidth: 400, margin: "0 auto 18px" }}>{L(lang, { id: "Modalmu 100% utuh dan tetap bekerja. Ronde berikutnya tiketmu otomatis ikut lagi.", en: "Your principal is 100% whole and still working. Next round, your ticket is automatically back in." })}</p>
                <span className="badge badge-safe" style={{ marginBottom: 22 }}><Icon.shieldLeaf size={14} stroke="var(--clover-deep)" /> {L(lang, { id: "Modal utuh & aman", en: "Principal whole & safe" })}</span>
              </>
            )}
            <div className="card" style={{ padding: "10px 8px", marginTop: 10, textAlign: "left" }}>
              <div className="head" style={{ fontSize: 14, padding: "6px 12px", color: "var(--forest-70)" }}>{L(lang, { id: "3 pemenang ronde #12", en: "3 winners · round #12" })}</div>
              {winners.map((w, i) => (
                <div key={i} className="row between aic" style={{ padding: "10px 14px", borderTop: "1px solid var(--hairline)" }}>
                  <div className="row aic gap-10">{w.you ? <Clover size={18} color="var(--gold)" stem={false} /> : <span style={{ width: 18, textAlign: "center", color: "var(--ink-45)", fontWeight: 700 }}>{i + 1}</span>}<span className="tnum" style={{ fontWeight: 600, fontSize: 13.5, color: w.you ? "var(--gold-deep)" : "var(--ink)" }}>{w.addr}{w.you && ` (${L(lang, { id: "kamu", en: "you" })})`}</span></div>
                  <span className="head tnum" style={{ fontSize: 15, color: "var(--gold-deep)" }}>+{w.amt}</span>
                </div>
              ))}
            </div>
            <div className="row gap-12" style={{ justifyContent: "center", marginTop: 22 }}>
              <button className="btn btn-primary btn-lg" onClick={onClose}>{result === "win" ? L(lang, { id: "Klaim / Lanjutkan", en: "Claim / Continue" }) : L(lang, { id: "Kembali", en: "Back" })}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===================== CENTERED MODALS ===================== */
function WebModal({ children, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 95, display: "grid", placeItems: "center", padding: 24, background: "color-mix(in srgb,var(--forest) 42%, transparent)", backdropFilter: "blur(4px)", animation: "riseIn .25s" }}>
      <div onClick={(e) => e.stopPropagation()} className="card card-pad-lg" style={{ width: "min(460px, 100%)", boxShadow: "var(--shadow-lift)", animation: "bloomPop .4s var(--ease-back)" }}>{children}</div>
    </div>
  );
}

function WebModalTarik({ lang, onClose }) {
  const wallet = useWallet();
  const principal = wallet.principalUsdc > 0n ? Number(formatUnits(wallet.principalUsdc, 6)) : 0;
  const [amt, setAmt] = useState(() => principal || 0);
  const [state, setState] = useState("idle");
  const [err, setErr] = useState("");
  const [cancelToast, fireCancelToast] = useCancelToast();

  if (state === "ok") return (
    <WebModal onClose={onClose}>
      <div className="center reveal">
        <div style={{ display: "grid", placeItems: "center", marginBottom: 8 }}><Plant grow={0.3} size={110} /></div>
        <h1 style={{ fontSize: 24, marginBottom: 6 }}>{L(lang, { id: "Berhasil ditarik", en: "Withdrawn" })}</h1>
        <p className="muted" style={{ fontSize: 14, marginBottom: 20 }}>{L(lang, { id: "Modalmu sudah kembali ke dompetmu.", en: "Your principal is back in your wallet." })}</p>
        <button className="btn btn-primary btn-block btn-lg" onClick={onClose}>{L(lang, { id: "Selesai", en: "Done" })}</button>
      </div>
    </WebModal>
  );

  return (
    <WebModal onClose={onClose}>
      <h1 style={{ fontSize: 24, marginBottom: 6 }}>{L(lang, { id: "Tarik modalmu kapan saja", en: "Withdraw anytime" })}</h1>
      <p className="muted" style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 18 }}>{L(lang, { id: "Modalmu selalu milikmu. Tarik sebagian atau semuanya.", en: "Your principal is always yours. Take part or all." })}</p>
      <div className="card card-sage" style={{ padding: "18px 20px", marginBottom: 14 }}>
        <div className="row aic" style={{ justifyContent: "center", gap: 8 }}>
          <input className="amount-input" style={{ width: "auto", maxWidth: 170, fontSize: 42 }}
            value={amt === 0 ? "" : amt} placeholder="0"
            onChange={(e) => { const v = +e.target.value.replace(/\D/g, "") || 0; setAmt(Math.min(principal, v)); }}
            inputMode="numeric" />
          <span className="head" style={{ fontSize: 20, color: "var(--ink-45)" }}>USDC</span>
        </div>
        <div className="row gap-8" style={{ justifyContent: "center", marginTop: 12 }}>
          <button className={"chip" + (amt === Math.floor(principal / 2) ? " chip-on" : "")} style={{ cursor: "pointer" }}
            onClick={() => setAmt(Math.floor(principal / 2))}>{L(lang, { id: "Setengah", en: "Half" })}</button>
          <button className={"chip" + (amt === principal ? " chip-on" : "")} style={{ cursor: "pointer" }}
            onClick={() => setAmt(principal)}>{L(lang, { id: "Semua", en: "All" })} ({fmt(principal, 0)})</button>
        </div>
        <div className="muted tiny center" style={{ marginTop: 8 }}>
          {L(lang, { id: "Modal di Aave", en: "Principal in Aave" })}: <span className="tnum">{fmt(principal, 2)} USDC</span>
        </div>
      </div>
      <div className="tiny muted" style={{ lineHeight: 1.5, marginBottom: 14 }}>
        {L(lang, { id: "Bunga yang sudah masuk Kolam ronde ini tetap diundi.", en: "Yield already in this round's Pool still enters the draw." })}
      </div>
      {err && <div className="tiny" style={{ color: "var(--danger)", marginBottom: 10, textAlign: "center" }}>{err}</div>}
      {state === "loading"
        ? <StatePillW tone="load">{L(lang, { id: "Menarik dari Aave…", en: "Withdrawing from Aave…" })}</StatePillW>
        : <div className="row gap-10">
            <button className="btn btn-ghost" onClick={onClose}>{L(lang, { id: "Batal", en: "Cancel" })}</button>
            <button className="btn btn-primary grow btn-lg" disabled={amt <= 0}
              onClick={async () => {
                setErr(""); setState("loading");
                try {
                  await wallet.withdraw(amt);
                  setState("ok");
                } catch (e) {
                  const msg = friendlyErr(e, "Withdraw failed");
                  if (msg === CANCELLED) fireCancelToast();
                  else if (msg) setErr(msg);
                  setState("idle");
                }
              }}>{L(lang, { id: "Tarik", en: "Withdraw" })}</button>
          </div>
      }
      <Toast show={cancelToast} tone="muted">
        {L(lang, { id: "Transaksi dibatalkan", en: "Transaction cancelled" })}
      </Toast>
    </WebModal>
  );
}

function WebModalCabut({ lang, onClose }) {
  const wallet = useWallet();
  const [state, setState] = useState("idle");
  const [err, setErr] = useState("");
  const [cancelToast, fireCancelToast] = useCancelToast();
  const impacts = [
    { id: "AI berhenti total", en: "AI stops entirely" },
    { id: "Modal tetap aman & milikmu", en: "Principal stays safe & yours" },
    { id: "Bisa diaktifkan ulang kapan saja", en: "Re-enable anytime" },
  ];

  if (state === "ok") return (
    <WebModal onClose={onClose}>
      <div className="center reveal">
        <div style={{ display: "grid", placeItems: "center", marginBottom: 12 }}>
          <Icon.shieldLeaf size={54} stroke="var(--danger)" />
        </div>
        <h1 style={{ fontSize: 23, marginBottom: 6 }}>{L(lang, { id: "Izin dicabut", en: "Permission revoked" })}</h1>
        <p className="muted" style={{ fontSize: 14, marginBottom: 20 }}>
          {L(lang, { id: "Pemelihara AI dinonaktifkan. Modalmu tetap di dompetmu.", en: "The AI keeper is disabled. Your principal stays in your wallet." })}
        </p>
        <button className="btn btn-primary btn-block btn-lg" onClick={onClose}>{L(lang, { id: "Selesai", en: "Done" })}</button>
      </div>
    </WebModal>
  );

  return (
    <WebModal onClose={onClose}>
      <div style={{ display: "grid", placeItems: "center", marginBottom: 12 }}>
        <div style={{ width: 60, height: 60, borderRadius: "50%", background: "color-mix(in srgb,var(--danger) 12%, transparent)", display: "grid", placeItems: "center" }}>
          <Icon.shieldLeaf size={30} stroke="var(--danger)" />
        </div>
      </div>
      <h1 style={{ fontSize: 23, marginBottom: 8, textAlign: "center" }}>{L(lang, { id: "Cabut izin pemelihara AI", en: "Revoke AI keeper permission" })}</h1>
      <p className="muted" style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 18, textAlign: "center" }}>
        {L(lang, { id: "Begitu dicabut, agen AI langsung lumpuh. Modalmu tidak terpengaruh dan tetap di dompetmu.", en: "Once revoked, the AI agent is instantly disabled. Your principal is unaffected and stays in your wallet." })}
      </p>
      <div className="card card-sage" style={{ padding: "14px 16px", marginBottom: 18 }}>
        {impacts.map((im, i) => (
          <div key={i} className="row aic gap-10" style={{ padding: "7px 0" }}>
            <Icon.check size={17} stroke="var(--clover)" sw={2.4} />
            <span style={{ fontSize: 13.5, fontWeight: 500 }}>{L(lang, im)}</span>
          </div>
        ))}
      </div>
      {err && <div className="tiny" style={{ color: "var(--danger)", marginBottom: 10, textAlign: "center" }}>{err}</div>}
      {state === "loading"
        ? <StatePillW tone="load">{L(lang, { id: "Mencabut…", en: "Revoking…" })}</StatePillW>
        : <div className="row gap-10">
            <button className="btn btn-ghost" onClick={onClose}>{L(lang, { id: "Batal", en: "Cancel" })}</button>
            <button className="btn btn-danger grow btn-lg"
              onClick={async () => {
                setErr(""); setState("loading");
                try {
                  await wallet.revokeDelegation();
                  setState("ok");
                } catch (e) {
                  const msg = friendlyErr(e, "Revoke failed");
                  if (msg === CANCELLED) fireCancelToast();
                  else if (msg) setErr(msg);
                  setState("idle");
                }
              }}>{L(lang, { id: "Ya, Cabut Izin", en: "Yes, Revoke" })}</button>
          </div>
      }
      <Toast show={cancelToast} tone="muted">
        {L(lang, { id: "Transaksi dibatalkan", en: "Transaction cancelled" })}
      </Toast>
    </WebModal>
  );
}

const CHAIN_FLAGS = { 8453: "🔵", 1: "⚪", 42161: "🔷", 137: "🟣", 56: "🟡" };

function WebModalDeposit({ lang, onClose }) {
  const wallet = useWallet();
  const [chain, setChain]   = useState(BRIDGE_CHAINS[0]); // Base default
  const [amt, setAmt]       = useState(10);
  const [state, setState]   = useState("idle"); // idle|quoting|approving|bridging|depositing|ok
  const [step, setStep]     = useState("");
  const [quote, setQuote]   = useState(null);
  const [err, setErr]       = useState("");
  const [cancelToast, fireCancelToast] = useCancelToast();

  const isCross   = !chain.native;
  const balance   = !isCross && wallet.usdcBalance > 0n ? Number(formatUnits(wallet.usdcBalance, 6)) : 0;
  const maxVal    = Math.floor(balance * 100) / 100; // clean 2-dp max (no dust overflow)
  const quick     = [10, 50, 100];
  const est       = isCross && quote ? quoteEstimate(quote) : null;
  const busy      = ["approving", "bridging", "depositing"].includes(state);

  // Refresh Base USDC balance on mount (Base flow only)
  useEffect(() => { if (!isCross) wallet.refreshBalance?.(); }, [isCross]);

  // Debounced LI.FI quote fetch for cross-chain
  useEffect(() => {
    if (!isCross || amt < 1 || !wallet.account) { setQuote(null); return; }
    setState("quoting");
    const t = setTimeout(async () => {
      try {
        const q = await fetchLifiQuote(chain.id, chain.token, amt, chain.decimals, wallet.account);
        setQuote(q); setState("idle");
      } catch { setQuote(null); setState("idle"); }
    }, 800);
    return () => clearTimeout(t);
  }, [isCross, chain.id, chain.token, chain.decimals, amt, wallet.account]);

  const handleDeposit = async () => {
    setErr("");

    // ── Base: existing direct flow ─────────────────────────────────────────
    if (!isCross) {
      setState("depositing"); setStep("");
      try { await wallet.deposit(amt); setState("ok"); }
      catch (e) {
        const msg = friendlyErr(e, "Deposit failed");
        if (msg === CANCELLED) fireCancelToast(); else if (msg) setErr(msg);
        setState("idle");
      }
      return;
    }

    // ── Cross-chain via LI.FI ──────────────────────────────────────────────
    if (!quote) { setErr("Waiting for quote..."); return; }
    try {
      // 1. ERC-20 approval (skip for native BNB)
      if (chain.token !== "0x0000000000000000000000000000000000000000") {
        setState("approving");
        setStep(L(lang, { id: "Menyetujui token…", en: "Approving token spending…" }));
        await ensureApproval(chain, amt, quote.estimate?.approvalAddress ?? quote.transactionRequest?.to, wallet.account);
      }

      // 2. Send bridge tx
      setState("bridging");
      setStep(L(lang, { id: "Kirim transaksi bridge…", en: "Sending bridge tx…" }));
      const txHash = await sendBridgeTx(chain, quote, wallet.account);

      // 3. Poll LI.FI until DONE
      setStep(L(lang, { id: "Bridge berlangsung (~5–15 menit)…", en: "Bridge in progress (~5–15 min)…" }));
      await pollBridgeStatus(txHash, quote, chain.id, (s) => {
        if (s.substatusMessage) setStep(s.substatusMessage);
      });

      // 4. Supply received USDC to Aave + register
      setState("depositing");
      setStep(L(lang, { id: "Bridge selesai! Menyetor ke Aave…", en: "Bridge done! Supplying to Aave…" }));
      const balBefore = wallet.usdcBalance;
      const balAfter  = await wallet.refreshBalance();
      const gained    = balAfter > balBefore ? Number(balAfter - balBefore) / 1e6 : 0;
      const toDeposit = gained > 0 ? gained : Number(quote.estimate?.toAmountMin ?? quote.estimate?.toAmount ?? 0) / 1e6;
      await wallet.deposit(Math.max(0.01, toDeposit));

      // 5. Notify backend of origin chain (for future reverse withdrawal)
      await fetch(`${BACKEND_URL}/record-origin`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAddress: wallet.account, originChainId: chain.id, originChainName: chain.name, originToken: chain.token, originSymbol: chain.symbol }),
      }).catch(() => {});

      setState("ok");
    } catch (e) {
      const msg = friendlyErr(e, "Bridge failed");
      if (msg === CANCELLED) fireCancelToast(); else if (msg) setErr(msg);
      setState("idle");
    }
  };

  if (state === "ok") return (
    <WebModal onClose={onClose}>
      <div className="center reveal">
        <div style={{ display: "grid", placeItems: "center", marginBottom: 8 }}><Plant grow={0.6} size={110} /></div>
        <h1 style={{ fontSize: 24, marginBottom: 6 }}>{L(lang, { id: "Deposit berhasil!", en: "Deposit successful!" })}</h1>
        <p className="muted" style={{ fontSize: 14, marginBottom: 20 }}>{L(lang, { id: "Modal bertambah & peluang menangmu naik.", en: "Principal increased & your win chance grew." })}</p>
        <button className="btn btn-primary btn-block btn-lg" onClick={onClose}>{L(lang, { id: "Selesai", en: "Done" })}</button>
      </div>
    </WebModal>
  );

  return (
    <WebModal onClose={onClose}>
      <h1 style={{ fontSize: 22, marginBottom: 6 }}>{L(lang, { id: "Tambah deposit", en: "Add deposit" })}</h1>
      <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.5, marginBottom: 14 }}>
        {L(lang, { id: "Deposit lebih besar = peluang lebih besar. Modal tetap milikmu.", en: "Bigger deposit = bigger win chance. Principal stays yours." })}
      </p>

      {/* Chain selector */}
      <div className="row gap-6" style={{ marginBottom: 14, flexWrap: "wrap" }}>
        {BRIDGE_CHAINS.map((c) => (
          <button key={c.id} disabled={busy}
            className={"chip" + (chain.id === c.id ? " chip-on" : "")}
            style={{ cursor: "pointer", fontSize: 12, gap: 7 }}
            onClick={() => { setChain(c); setQuote(null); setErr(""); }}>
            <ChainIcon name={c.name} size={16} /> {c.name}
          </button>
        ))}
      </div>

      {isCross && (
        <div className="tiny muted" style={{ marginBottom: 10, padding: "8px 12px", background: "color-mix(in srgb,var(--gold) 10%, var(--canvas-2))", borderRadius: 10, lineHeight: 1.5 }}>
          {L(lang, { id: `Aset kamu di ${chain.name} akan di-bridge ke USDC Base via LI.FI, lalu langsung masuk pool.`, en: `Your ${chain.symbol} on ${chain.name} will be bridged to Base USDC via LI.FI, then deposited into the pool.` })}
        </div>
      )}

      {/* Amount input */}
      <div className="card card-sage" style={{ padding: "16px 20px", marginBottom: 14 }}>
        <div className="row aic" style={{ justifyContent: "center", gap: 8 }}>
          <input className="amount-input" style={{ width: "auto", maxWidth: 160, fontSize: 42 }}
            value={amt === 0 ? "" : amt} placeholder="0" disabled={busy}
            onChange={(e) => { const v = +e.target.value.replace(/\D/g, "") || 0; setAmt(!isCross && balance > 0 ? Math.min(balance, v) : v); }}
            inputMode="numeric" />
          <span className="head" style={{ fontSize: 20, color: "var(--ink-45)" }}>{chain.symbol}</span>
        </div>
        <div className="row gap-8" style={{ justifyContent: "center", marginTop: 10 }}>
          {quick.map((q) => (
            <button key={q} disabled={busy} className={"chip" + (amt === q ? " chip-on" : "")} style={{ cursor: "pointer" }} onClick={() => setAmt(q)}>{q}</button>
          ))}
          {!isCross && <button disabled={busy} className={"chip" + (amt === maxVal ? " chip-on" : "")} style={{ cursor: "pointer" }} onClick={() => setAmt(maxVal)}>Max</button>}
        </div>
        {!isCross && (
          <div className="muted tiny center" style={{ marginTop: 8 }}>
            {L(lang, { id: "Saldo Base", en: "Base balance" })}: <span className="tnum">{balance > 0 ? fmt(balance, 2) : "—"} USDC</span>
          </div>
        )}
      </div>

      {/* LI.FI quote estimate */}
      {isCross && (
        <div className="card card-sage" style={{ padding: "12px 16px", marginBottom: 14, fontSize: 13 }}>
          {state === "quoting" ? (
            <div className="muted tiny center">Fetching route…</div>
          ) : est ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div className="row between"><span className="muted">{L(lang, { id: "Kamu terima (est.)", en: "You receive (est.)" })}</span><span className="tnum" style={{ fontWeight: 700, color: "var(--clover-deep)" }}>~{est.received} USDC</span></div>
              <div className="row between"><span className="muted">{L(lang, { id: "Biaya bridge", en: "Bridge fee" })}</span><span className="tnum muted">~${est.totalFeeUsd}</span></div>
              <div className="row between"><span className="muted">{L(lang, { id: "Via", en: "Via" })}</span><span className="muted">{est.tool}</span></div>
              <div className="row between"><span className="muted">{L(lang, { id: "Waktu", en: "Est. time" })}</span><span className="muted">5–15 min</span></div>
            </div>
          ) : (
            <div className="muted tiny center">{L(lang, { id: "Masukkan jumlah untuk melihat estimasi.", en: "Enter amount to see estimate." })}</div>
          )}
        </div>
      )}

      {err && <div className="tiny" style={{ color: "var(--danger)", marginBottom: 10, textAlign: "center" }}>{err}</div>}

      {/* Status during execution */}
      {busy && <StatePillW tone="load" style={{ marginBottom: 12 }}>{step || L(lang, { id: "Memproses…", en: "Processing…" })}</StatePillW>}

      {!busy && (
        <div className="row gap-10">
          <button className="btn btn-ghost" onClick={onClose}>{L(lang, { id: "Batal", en: "Cancel" })}</button>
          <button className="btn btn-primary grow btn-lg"
            disabled={amt < 1 || state === "quoting" || (isCross && !quote)}
            onClick={handleDeposit}>
            <Icon.sprout size={17} stroke="#F4FBF6" />
            {isCross
              ? L(lang, { id: "Bridge & Deposit", en: "Bridge & Deposit" })
              : L(lang, { id: "Setor", en: "Deposit" })}
          </button>
        </div>
      )}
      <Toast show={cancelToast} tone="muted">
        {L(lang, { id: "Transaksi dibatalkan", en: "Transaction cancelled" })}
      </Toast>
    </WebModal>
  );
}

export { WebKeeper, WebPool, WebLog, WebSettings, WebDraw, WebModalTarik, WebModalCabut, WebModalDeposit };
