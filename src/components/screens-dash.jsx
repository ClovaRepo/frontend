import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { L, fmt, nfmt, growFromUsdc, useCountUp, CountUp, Clover, Wordmark, LeafShape, LeafFall, CloverWatermark, Ic, Icon, Gardener, VineStepper, CountdownArc, Plant, Confetti, AreaChart, Collapse, Reveal, TopBar, Toast } from './shared.jsx';

/* ============================================================
   CLOVA, Dashboard ("Kebunku") with 3 layout variants + Panel AI
   ============================================================ */

function DashTopBar({ lang, go }) {
  return (
    <div className="row between aic" style={{ padding: "16px 18px 10px", position: "sticky", top: 0, zIndex: 20,
      background: "linear-gradient(var(--canvas), color-mix(in srgb,var(--canvas) 80%, transparent))", backdropFilter: "blur(8px)" }}>
      <Wordmark size={24} />
      <div className="row aic gap-8">
        <span className="chip tiny" style={{ padding: "7px 11px" }}>
          <span className="tnum">0x12…9aF3</span>
          <Clover size={13} color="var(--clover)" stem={false} />
        </span>
        <button onClick={() => go("riwayat")} aria-label="notifications" style={{ width: 38, height: 38, borderRadius: "50%", border: "none", background: "var(--canvas-2)", boxShadow: "var(--shadow-card)", display: "grid", placeItems: "center", cursor: "pointer", position: "relative" }}>
          <Icon.bell size={19} stroke="var(--forest)" />
          <span style={{ position: "absolute", top: 8, right: 9, width: 8, height: 8, borderRadius: "50%", background: "var(--gold)", boxShadow: "0 0 0 2px var(--canvas-2)" }} />
        </button>
      </div>
    </div>
  );
}

/* ---- Hero plant card ---- */
function HeroPlant({ lang, openModal, compact }) {
  const principal = 100; // USDC — plant size scales with this
  return (
    <div className="card reveal card-lift" style={{ padding: compact ? "18px 20px" : "22px 22px", overflow: "hidden", position: "relative" }}>
      <CloverWatermark corner="br" size={150} opacity={0.05} />
      <div className="row" style={{ gap: 14, alignItems: "center" }}>
        <div style={{ flex: "0 0 auto" }}><Plant grow={growFromUsdc(principal)} size={compact ? 96 : 116} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="muted tiny" style={{ fontWeight: 600, marginBottom: 2 }}>{L(lang, { id: "Modalku", en: "My principal" })}</div>
          <div className="head tnum" style={{ fontSize: 32, lineHeight: 1 }}><CountUp value={principal} /></div>
          <div className="head" style={{ fontSize: 15, color: "var(--ink-45)", marginTop: 1 }}>USDC</div>
          <span className="badge badge-safe" style={{ marginTop: 8 }}><Icon.shieldLeaf size={13} stroke="var(--clover-deep)" /> {L(lang, { id: "Aman & utuh", en: "Safe & whole" })}</span>
        </div>
      </div>
      <div className="row between aic" style={{ marginTop: 14, background: "var(--sage)", borderRadius: 14, padding: "11px 14px" }}>
        <span className="muted tiny" style={{ fontWeight: 600 }}>{L(lang, { id: "Bunga tersumbang ronde ini", en: "Yield contributed this round" })}</span>
        <span className="head tnum" style={{ fontSize: 18, color: "var(--clover)" }}>+<CountUp value={3.42} /></span>
      </div>
      <div className="row between aic" style={{ marginTop: 10, padding: "0 2px" }}>
        <span className="row aic gap-6 tiny" style={{ fontWeight: 600, color: "var(--forest-70)" }}>
          <Icon.leaf size={15} stroke="var(--clover)" /> Aave v3
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
function PrizePool({ lang, go, big }) {
  return (
    <div className="card reveal card-lift" onClick={() => go("detailRonde")} style={{ cursor: "pointer",
      background: "linear-gradient(160deg, color-mix(in srgb,var(--gold) 13%, var(--canvas-2)), var(--canvas-2))", overflow: "hidden", position: "relative" }}>
      <div className="row between aic" style={{ marginBottom: 6 }}>
        <span className="badge badge-win"><Icon.trophy size={13} stroke="var(--gold-deep)" /> {L(lang, { id: "Kolam Hadiah · Ronde #12", en: "Prize Pool · Round #12" })}</span>
        <Icon.chevron size={18} stroke="var(--gold-deep)" />
      </div>
      <div className="head tnum" style={{ fontSize: big ? 40 : 34, color: "var(--gold-deep)" }}><CountUp value={1284} dec={0} /> <span style={{ fontSize: big ? 20 : 18 }}>USDC</span></div>
      <div className="muted tiny" style={{ marginTop: 2, marginBottom: 12 }}>{L(lang, { id: "248 penanam ikut", en: "248 planters in" })}</div>
      <CountdownArc pct={0.68} gold size={170}
        label={L(lang, { id: "11j 24m", en: "11h 24m" })}
        sub={L(lang, { id: "menuju undian", en: "to the draw" })} />
    </div>
  );
}

/* ---- AI keeper shortcut ---- */
function KeeperCard({ lang, go }) {
  return (
    <div className="card reveal card-lift" onClick={() => go("panelAI")} style={{ cursor: "pointer", padding: "16px 18px" }}>
      <div className="row gap-12" style={{ alignItems: "flex-start" }}>
        <Gardener size={46} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row between aic">
            <div className="head" style={{ fontSize: 15 }}>{L(lang, { id: "Pemelihara AI", en: "The AI Keeper" })}</div>
            <span className="badge badge-active" style={{ padding: "3px 8px", fontSize: 10.5 }}>{L(lang, { id: "Aktif", en: "Active" })}</span>
          </div>
          <p className="muted" style={{ fontSize: 13, lineHeight: 1.45, margin: "5px 0 8px" }}>
            "{L(lang, { id: "Tetap di Aave, likuiditas kuat, tak ada kabar audit negatif.", en: "Staying on Aave, deep liquidity, no negative audit news." })}"
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
        {L(lang, { id: "Biaya platform 10% dari bunga. Modal tak pernah dipotong.", en: "Platform fee 10% of yield. Principal is never cut." })}
      </span>
    </div>
  );
}

/* ====================== DASHBOARD ====================== */
function ScreenDashboard({ lang, go, t, openModal }) {
  const variant = t.dashLayout || "garden";
  const stagger = (n) => ({ animationDelay: n * 80 + "ms" });

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
            <div style={stagger(0)}><HeroPlant lang={lang} openModal={openModal} /></div>
            <div style={stagger(1)}><PrizePool lang={lang} go={go} big /></div>
            <div style={stagger(2)}><KeeperCard lang={lang} go={go} /></div>
            <div style={stagger(3)}><WinStrip lang={lang} /></div>
            <div style={stagger(4)}><FeeBar lang={lang} /></div>
          </div>
        )}

        {variant === "calm" && (
          <div className="col gap-14">
            {/* big calm numbers, minimal illustration */}
            <div className="reveal card" style={{ ...stagger(0), padding: "24px 22px", textAlign: "center", overflow: "hidden" }}>
              <CloverWatermark corner="tr" size={130} opacity={0.05} />
              <div className="muted tiny" style={{ fontWeight: 600, marginBottom: 4 }}>{L(lang, { id: "Modalku, aman & utuh", en: "My principal, safe & whole" })}</div>
              <div className="head tnum" style={{ fontSize: 52, lineHeight: 1 }}><CountUp value={100} /></div>
              <div className="head" style={{ fontSize: 16, color: "var(--ink-45)", marginTop: 2 }}>USDC</div>
              <div className="vine-divide" />
              <div className="row between aic">
                <span className="muted tiny">{L(lang, { id: "Bunga ronde ini", en: "Yield this round" })}</span>
                <span className="head tnum" style={{ fontSize: 18, color: "var(--clover)" }}>+<CountUp value={3.42} /> USDC</span>
              </div>
              <div className="row gap-10" style={{ marginTop: 16 }}>
                <button className="btn btn-secondary grow btn-sm" onClick={() => openModal("tarik")}>{L(lang, { id: "Tarik Modal", en: "Withdraw" })}</button>
                <button className="btn btn-danger-ghost btn-sm" onClick={() => openModal("cabut")}>{L(lang, { id: "Cabut Izin", en: "Revoke" })}</button>
              </div>
            </div>
            <div style={stagger(1)}><PrizePool lang={lang} go={go} /></div>
            <div style={stagger(2)}><KeeperCard lang={lang} go={go} /></div>
            <div style={stagger(3)}><WinStrip lang={lang} /></div>
            <div style={stagger(4)}><FeeBar lang={lang} /></div>
          </div>
        )}

        {variant === "plots" && (
          <div className="col gap-14">
            {/* bento: hero spanning, then 2-up tiles */}
            <div style={stagger(0)}><HeroPlant lang={lang} openModal={openModal} compact /></div>
            <div className="row gap-12" style={{ alignItems: "stretch" }}>
              <div className="reveal card card-lift" style={{ ...stagger(1), flex: 1, cursor: "pointer", background: "linear-gradient(160deg, color-mix(in srgb,var(--gold) 13%, var(--canvas-2)), var(--canvas-2))" }} onClick={() => go("detailRonde")}>
                <span className="badge badge-win" style={{ marginBottom: 8 }}><Icon.trophy size={12} stroke="var(--gold-deep)" /> {L(lang, { id: "Kolam #12", en: "Pool #12" })}</span>
                <div className="head tnum" style={{ fontSize: 26, color: "var(--gold-deep)" }}><CountUp value={1284} dec={0} /></div>
                <div className="muted tiny">USDC · 248 {L(lang, { id: "penanam", en: "planters" })}</div>
              </div>
              <div className="reveal card card-lift" style={{ ...stagger(2), flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <CountdownArc pct={0.68} gold size={130} label={L(lang, { id: "11j 24m", en: "11h 24m" })} sub={L(lang, { id: "undian", en: "draw" })} />
              </div>
            </div>
            <div style={stagger(3)}><KeeperCard lang={lang} go={go} /></div>
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
