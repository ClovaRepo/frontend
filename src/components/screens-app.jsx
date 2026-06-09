import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { L, fmt, nfmt, useCountUp, CountUp, Clover, Wordmark, LeafShape, LeafFall, CloverWatermark, Ic, Icon, ActivityIcon, Gardener, VineStepper, CountdownArc, Plant, Confetti, AreaChart, Collapse, Reveal, TopBar, Toast } from './shared.jsx';
import { useFlow, StatePill } from './screens-ob.jsx';
import { useWallet } from './wallet-context.jsx';

/* ============================================================
   CLOVA, Undian, Detail Ronde, Riwayat, Pengaturan, Modals
   ============================================================ */

/* ====================== 10. UNDIAN / WIN ====================== */
function ScreenUndian({ lang, go, t }) {
  const result = t.drawResult || "win"; // 'win' | 'lose'
  const [phase, setPhase] = useState("pre"); // pre, drawing, result
  useEffect(() => {
    if (phase === "drawing") { const id = setTimeout(() => setPhase("result"), 2600); return () => clearTimeout(id); }
  }, [phase]);

  const winners = [
    { addr: "0x12…9aF3", amt: "182,40", you: result === "win" },
    { addr: "0x77…b2C1", amt: "514,80" },
    { addr: "0x4a…0e9D", amt: "457,80" },
  ];

  return (
    <div className="screen" style={{ position: "relative",
      background: phase === "result" && result === "win"
        ? "radial-gradient(120% 70% at 50% 12%, color-mix(in srgb,var(--gold) 22%, transparent), transparent 60%), var(--canvas)"
        : "var(--canvas)" }}>
      <LeafFall density={(t.leafDensity ?? 1) * (phase === "result" && result === "win" ? 1 : 0.4)} golden={result === "win"} />
      {phase === "result" && result === "win" && <Confetti go count={60} />}
      <TopBar onBack={() => go("dashboard")} title={L(lang, { id: "Panen Keberuntungan", en: "Lucky Harvest" })} />

      <div style={{ padding: "12px 22px 40px", position: "relative", zIndex: 2, minHeight: "70%", display: "flex", flexDirection: "column" }}>

        {phase === "pre" && (
          <div className="center reveal" style={{ marginTop: 20 }}>
            <div className="badge badge-win" style={{ marginBottom: 16 }}><Icon.trophy size={14} stroke="var(--gold-deep)" /> {L(lang, { id: "Ronde #12 · Undian berlangsung", en: "Round #12 · Draw in progress" })}</div>
            <div style={{ display: "grid", placeItems: "center", margin: "10px 0 18px" }}>
              <Clover size={120} color="var(--clover)" breathe />
            </div>
            <h1 style={{ fontSize: 26, marginBottom: 8 }}>{L(lang, { id: "Kolam hadiah ronde ini", en: "This round's prize pool" })}</h1>
            <div className="head tnum" style={{ fontSize: 46, color: "var(--gold-deep)", marginBottom: 6 }}><CountUp value={1284} dec={0} /> USDC</div>
            <p className="muted" style={{ fontSize: 13.5, marginBottom: 20 }}>{L(lang, { id: "Acak & adil lewat VRF on-chain.", en: "Random & fair via on-chain VRF." })}</p>
            <div className="row aic gap-10" style={{ background: "color-mix(in srgb,var(--gold) 11%, var(--canvas-2))", borderRadius: 14, padding: "14px 18px", marginBottom: 16, justifyContent: "center" }}>
              <Icon.robot size={18} stroke="var(--gold-deep)" />
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--gold-deep)" }}>
                {L(lang, { id: "Agen AI sedang menarik pemenang…", en: "AI agent is drawing the winner…" })}
              </span>
              <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2.5px solid color-mix(in srgb,var(--gold) 30%, transparent)", borderTopColor: "var(--gold-deep)", animation: "spinClover .8s linear infinite", display: "inline-block" }} />
            </div>
            <p className="muted tiny" style={{ lineHeight: 1.5 }}>
              {L(lang, { id: "Undian dijalankan otomatis oleh agen — kamu akan notifikasi saat pemenang dipilih.", en: "The draw runs automatically via the agent — you'll be notified when a winner is picked." })}
            </p>
          </div>
        )}

        {phase === "drawing" && (
          <div className="center" style={{ marginTop: 30 }}>
            <div style={{ display: "grid", placeItems: "center", margin: "20px 0 26px" }}>
              <Clover size={150} color="var(--gold)" spin style={{ filter: "drop-shadow(0 8px 24px color-mix(in srgb,var(--gold) 50%, transparent))" }} />
            </div>
            <h1 style={{ fontSize: 25, marginBottom: 8 }}>{L(lang, { id: "Menarik pemenang ronde #12…", en: "Drawing round #12's winner…" })}</h1>
            <p className="muted" style={{ fontSize: 13.5 }}>{L(lang, { id: "Acak & adil lewat VRF on-chain.", en: "Random & fair via on-chain VRF." })}</p>
            <div className="head tnum" style={{ fontSize: 38, color: "var(--gold-deep)", marginTop: 22 }}>{nfmt(lang, "1.284,00")} USDC</div>
          </div>
        )}

        {phase === "result" && result === "win" && (
          <div className="center reveal">
            <div style={{ display: "grid", placeItems: "center", margin: "12px 0 8px", animation: "bloomPop .9s var(--ease-back)" }}>
              <Clover size={108} color="var(--gold)" style={{ filter: "drop-shadow(0 8px 22px color-mix(in srgb,var(--gold) 55%, transparent))" }} />
            </div>
            <h1 style={{ fontSize: 34, color: "var(--gold-deep)", marginBottom: 6 }}>{L(lang, { id: "Kamu menang! 🍀", en: "You won! 🍀" })}</h1>
            <div className="head tnum" style={{ fontSize: 50, color: "var(--gold-deep)", lineHeight: 1 }}>+<CountUp value={182.40} /></div>
            <div className="head" style={{ fontSize: 18, color: "var(--gold-deep)", marginBottom: 14 }}>USDC</div>
            <p className="muted" style={{ fontSize: 14, lineHeight: 1.5, maxWidth: 320, margin: "0 auto 22px" }}>
              {L(lang, { id: "Bunga gabungan semua penanam jadi milikmu ronde ini. Modalmu tetap utuh.", en: "Everyone's combined yield is yours this round. Your principal stays whole." })}
            </p>
            <button className="btn btn-gold btn-lg btn-block" onClick={() => go("dashboard")}>{L(lang, { id: "Klaim / Lanjutkan", en: "Claim / Continue" })}</button>
          </div>
        )}

        {phase === "result" && result === "lose" && (
          <div className="center reveal">
            <div style={{ display: "grid", placeItems: "center", margin: "16px 0 10px", animation: "bloomPop .8s var(--ease-back)" }}>
              <Plant grow={0.5} size={120} />
            </div>
            <h1 style={{ fontSize: 27, marginBottom: 10 }}>{L(lang, { id: "Belum hoki ronde ini 🌱", en: "No luck this round 🌱" })}</h1>
            <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.55, maxWidth: 320, margin: "0 auto 22px" }}>
              {L(lang, { id: "Modalmu 100% utuh dan tetap bekerja. Ronde berikutnya tiketmu otomatis ikut lagi.", en: "Your principal is 100% whole and still working. Next round, your ticket is automatically back in." })}
            </p>
            <span className="badge badge-safe" style={{ marginBottom: 22 }}><Icon.shieldLeaf size={14} stroke="var(--clover-deep)" /> {L(lang, { id: "Modal utuh & aman", en: "Principal whole & safe" })}</span>
            <button className="btn btn-primary btn-lg btn-block" onClick={() => go("dashboard")}>{L(lang, { id: "Lihat ronde berikutnya", en: "See next round" })}</button>
          </div>
        )}

        {/* winners list (after result) */}
        {phase === "result" && (
          <div className="reveal" style={{ marginTop: 30, animationDelay: "300ms" }}>
            <div className="head" style={{ fontSize: 16, marginBottom: 12 }}>{L(lang, { id: "3 pemenang ronde #12", en: "3 winners · round #12" })}</div>
            <div className="card" style={{ padding: "8px 6px" }}>
              {winners.map((w, i) => (
                <div key={i} className="row between aic" style={{ padding: "11px 14px", borderBottom: i < 2 ? "1px solid var(--hairline)" : "none" }}>
                  <div className="row aic gap-10">
                    {w.you ? <Clover size={20} color="var(--gold)" stem={false} /> : <span style={{ width: 20, textAlign: "center", color: "var(--ink-45)", fontWeight: 700 }}>{i + 1}</span>}
                    <span className="tnum" style={{ fontWeight: 600, fontSize: 14, color: w.you ? "var(--gold-deep)" : "var(--ink)" }}>{w.addr}{w.you && <span className="tiny" style={{ marginLeft: 6, color: "var(--gold-deep)" }}>({L(lang, { id: "kamu", en: "you" })})</span>}</span>
                  </div>
                  <span className="head tnum" style={{ fontSize: 16, color: "var(--gold-deep)" }}>+{nfmt(lang, w.amt)}</span>
                </div>
              ))}
            </div>
            <div className="tiny muted center" style={{ marginTop: 12, lineHeight: 1.5 }}>
              {L(lang, { id: "Total dibagikan: 1.155 USDC · Biaya platform 10%: 129 USDC", en: "Total paid: 1,155 USDC · Platform fee 10%: 129 USDC" })}<br />
              {L(lang, { id: "Modal tidak diundi, hanya bunga.", en: "Principal isn't drawn, only yield." })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ====================== 11. DETAIL RONDE ====================== */
function StatTile({ icon: I, label, value, sub }) {
  return (
    <div className="card reveal" style={{ padding: "15px 16px" }}>
      <I size={20} stroke="var(--clover-deep)" />
      <div className="head tnum" style={{ fontSize: 21, marginTop: 8 }}>{value}</div>
      <div className="muted tiny" style={{ marginTop: 2 }}>{label}</div>
      {sub && <div className="tiny" style={{ color: "var(--clover-deep)", fontWeight: 600, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function ScreenDetailRonde({ lang, go, t }) {
  const chart = [40, 120, 260, 380, 520, 720, 880, 1010, 1140, 1284];
  const rounds = [
    { r: 11, win: "0x77…b2C1", amt: "1.102", proto: "Aave v3", dec: "stay" },
    { r: 10, win: "0x4a…0e9D", amt: "1.340", proto: "Moonwell", dec: "move" },
    { r: 9, win: "0x12…9aF3", amt: "980", proto: "Aave v3", dec: "stay" },
  ];
  return (
    <div className="screen" style={{ paddingBottom: 90 }}>
      <LeafFall density={(t.leafDensity ?? 1) * 0.4} />
      <TopBar onBack={() => go("dashboard")} title={L(lang, { id: "Ronde #12", en: "Round #12" })}
        right={<span className="badge badge-active"><span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--clover)" }} /> {L(lang, { id: "Berjalan", en: "Running" })}</span>} />

      <div style={{ padding: "8px 18px 20px", position: "relative", zIndex: 2 }}>
        <Reveal className="center" style={{ marginBottom: 8 }}>
          <CountdownArc pct={0.68} gold size={190} label={L(lang, { id: "11j 24m", en: "11h 24m" })} sub={L(lang, { id: "menuju undian", en: "to the draw" })} />
        </Reveal>

        {/* pool panel + chart */}
        <div className="card reveal" style={{ padding: "20px 20px", background: "linear-gradient(160deg, color-mix(in srgb,var(--gold) 12%, var(--canvas-2)), var(--canvas-2))", marginBottom: 14 }}>
          <div className="muted tiny" style={{ fontWeight: 600 }}>{L(lang, { id: "Total bunga terkumpul ronde ini", en: "Total yield gathered this round" })}</div>
          <div className="head tnum" style={{ fontSize: 38, color: "var(--gold-deep)", marginBottom: 12 }}><CountUp value={1284} dec={0} /> USDC</div>
          <AreaChart data={chart} color="var(--clover)" h={84} />
        </div>

        {/* stat grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <StatTile icon={Icon.leaf} label={L(lang, { id: "Penanam", en: "Planters" })} value="248" />
          <StatTile icon={Icon.coin} label={L(lang, { id: "Modal dikelola", en: "Principal managed" })} value={nfmt(lang, "24.800")} sub="USDC" />
          <StatTile icon={Icon.drop} label={L(lang, { id: "Bunga disapu hari ini", en: "Yield swept today" })} value="+212" sub="USDC" />
          <StatTile icon={Icon.shieldLeaf} label={L(lang, { id: "Protokol aktif", en: "Active protocol" })} value="Aave v3" sub={L(lang, { id: "Sehat", en: "Healthy" })} />
        </div>

        {/* your participation */}
        <div className="card card-sage reveal" style={{ padding: "16px 18px", marginBottom: 18, overflow: "hidden" }}>
          <CloverWatermark corner="br" size={110} opacity={0.06} />
          <div className="row aic gap-8" style={{ marginBottom: 12 }}>
            <Clover size={20} color="var(--clover)" stem={false} /><div className="head" style={{ fontSize: 15 }}>{L(lang, { id: "Caramu ikut", en: "Your stake" })}</div>
          </div>
          <div className="row between" style={{ gap: 10 }}>
            {[{ l: { id: "Modalmu", en: "Principal" }, v: "100", c: "var(--forest)" }, { l: { id: "Bunga tersumbang", en: "Yield given" }, v: "+3,42", c: "var(--clover)" }, { l: { id: "Peluang Menang", en: "Win Chance" }, v: "12,5%", c: "var(--gold-deep)" }].map((x, i) => (
              <div key={i} style={{ flex: 1 }}>
                <div className="head tnum" style={{ fontSize: 19, color: x.c }}>{nfmt(lang, x.v)}</div>
                <div className="muted tiny">{L(lang, x.l)}</div>
              </div>
            ))}
          </div>
          <div className="tiny muted" style={{ marginTop: 8 }}>{L(lang, { id: "Deposit lebih besar = peluang lebih besar.", en: "Bigger deposit = bigger chance." })}</div>
        </div>

        {/* round history */}
        <div className="head" style={{ fontSize: 16, margin: "4px 2px 12px" }}>{L(lang, { id: "Riwayat ronde", en: "Past rounds" })}</div>
        <div className="row gap-12" style={{ overflowX: "auto", paddingBottom: 6, scrollbarWidth: "none" }}>
          {rounds.map((rd, i) => (
            <div key={i} className="card reveal" style={{ flex: "0 0 auto", width: 168, padding: "14px 16px", animationDelay: i * 80 + "ms" }}>
              <div className="row between aic" style={{ marginBottom: 8 }}>
                <span className="tiny" style={{ fontWeight: 700, color: "var(--ink-45)" }}>{L(lang, { id: "Ronde", en: "Round" })} #{rd.r}</span>
                <span className="badge" style={{ fontSize: 9.5, padding: "2px 7px", background: rd.dec === "move" ? "color-mix(in srgb,var(--gold) 20%, white)" : "var(--sage-2)", color: rd.dec === "move" ? "var(--gold-deep)" : "var(--clover-deep)" }}>{rd.dec === "move" ? L(lang, { id: "PINDAH", en: "MOVE" }) : L(lang, { id: "TETAP", en: "STAY" })}</span>
              </div>
              <div className="head tnum" style={{ fontSize: 20, color: "var(--gold-deep)" }}>{nfmt(lang, rd.amt)} <span style={{ fontSize: 12 }}>USDC</span></div>
              <div className="tiny muted tnum" style={{ marginTop: 3 }}>{rd.win}</div>
              <div className="tiny muted" style={{ marginTop: 6 }}>{rd.proto}</div>
            </div>
          ))}
        </div>

        <div className="reveal row aic gap-8" style={{ background: "color-mix(in srgb,var(--forest) 5%, transparent)", borderRadius: 12, padding: "11px 14px", marginTop: 16 }}>
          <Icon.info size={16} stroke="var(--forest-70)" />
          <span className="tiny" style={{ color: "var(--forest-70)", lineHeight: 1.4 }}>{L(lang, { id: "Tiap ronde, 90% bunga ke pemenang, 10% ke treasury. Modal tak pernah dipotong.", en: "Each round, 90% of yield to winners, 10% to treasury. Principal is never cut." })}</span>
        </div>
      </div>
    </div>
  );
}

/* ====================== 13. RIWAYAT ====================== */
function ScreenRiwayat({ lang, go, t }) {
  const [filter, setFilter] = useState("all");
  const filters = [
    { k: "all", t: { id: "Semua", en: "All" } },
    { k: "deposit", t: { id: "Setoran", en: "Deposits" } },
    { k: "yield", t: { id: "Bunga", en: "Yield" } },
    { k: "ai", t: { id: "Keputusan AI", en: "AI" } },
    { k: "draw", t: { id: "Undian", en: "Draws" } },
  ];
  const events = [
    { day: { id: "Hari ini", en: "Today" }, cat: "ai", title: { id: "AI: TETAP di Aave, likuiditas kuat", en: "AI: STAY on Aave, strong liquidity" }, time: { id: "4 jam lalu", en: "4h ago" }, link: true },
    { day: { id: "Hari ini", en: "Today" }, cat: "yield", title: { id: "Bunga +0,82 USDC disapu ke Kolam #12", en: "Yield +0.82 USDC swept to Pool #12" }, time: { id: "6 jam lalu", en: "6h ago" } },
    { day: { id: "Kemarin", en: "Yesterday" }, cat: "draw", title: { id: "Undian ronde #11, belum hoki, modal utuh", en: "Draw round #11, no luck, principal whole" }, time: { id: "1 hari lalu", en: "1d ago" } },
    { day: { id: "Kemarin", en: "Yesterday" }, cat: "ai", title: { id: "Percobaan aksi terlarang ditolak otomatis", en: "Forbidden action auto-rejected" }, time: { id: "1 hari lalu", en: "1d ago" }, safe: true },
    { day: { id: "Minggu ini", en: "This week" }, cat: "draw", title: { id: "Menang ronde #9, +18,20 USDC", en: "Won round #9, +18.20 USDC" }, time: { id: "5 hari lalu", en: "5d ago" }, win: true },
    { day: { id: "Minggu ini", en: "This week" }, cat: "deposit", title: { id: "Setor 100 USDC, modal awal dicatat", en: "Deposited 100 USDC, baseline recorded" }, time: { id: "5 hari lalu", en: "5d ago" } },
  ];
  const shown = events.filter((e) => filter === "all" || e.cat === filter);
  let lastDay = null;

  return (
    <div className="screen" style={{ paddingBottom: 90 }}>
      <LeafFall density={(t.leafDensity ?? 1) * 0.35} />
      <TopBar onBack={() => go("dashboard")} title={L(lang, { id: "Catatan kebunmu", en: "Your garden log" })} />

      <div className="row gap-8" style={{ padding: "4px 16px 14px", overflowX: "auto", scrollbarWidth: "none", position: "sticky", top: 64, zIndex: 15, background: "linear-gradient(var(--canvas), color-mix(in srgb,var(--canvas) 70%, transparent))" }}>
        {filters.map((f) => (
          <button key={f.k} className={"chip tiny" + (filter === f.k ? " chip-on" : "")} style={{ cursor: "pointer", flex: "0 0 auto" }} onClick={() => setFilter(f.k)}>{L(lang, f.t)}</button>
        ))}
      </div>

      <div style={{ padding: "6px 18px 20px", position: "relative", zIndex: 2 }}>
        {shown.length === 0 ? (
          <div className="center reveal" style={{ padding: "50px 20px" }}>
            <div style={{ display: "grid", placeItems: "center", marginBottom: 12 }}><Plant grow={0.05} size={120} /></div>
            <div className="head" style={{ fontSize: 18, marginBottom: 6 }}>{L(lang, { id: "Belum ada aktivitas", en: "No activity yet" })}</div>
            <div className="muted tiny">{L(lang, { id: "Tanam benih pertamamu untuk memulai.", en: "Plant your first seed to begin." })}</div>
          </div>
        ) : (
          <div style={{ position: "relative", paddingLeft: 4 }}>
            {shown.map((e, i) => {
              const showDay = L(lang, e.day) !== lastDay;
              lastDay = L(lang, e.day);
              return (
                <React.Fragment key={i}>
                  {showDay && <div className="tiny" style={{ fontWeight: 700, color: "var(--ink-45)", margin: i === 0 ? "4px 0 12px 44px" : "16px 0 12px 44px", textTransform: "uppercase", letterSpacing: ".06em" }}>{L(lang, e.day)}</div>}
                  <Reveal delay={i * 60} className="row gap-12" style={{ alignItems: "flex-start", paddingBottom: 14 }}>
                    <div className="col aic" style={{ flex: "0 0 auto" }}>
                      <ActivityIcon cat={e.cat} win={e.win} safe={e.safe} size={34} />
                      {i !== shown.length - 1 && <div style={{ width: 2.5, flex: 1, minHeight: 18, margin: "4px 0", borderLeft: "2.5px dotted color-mix(in srgb,var(--clover) 32%, transparent)" }} />}
                    </div>
                    <div className="card" style={{ flex: 1, padding: "12px 15px", border: e.win ? "1.5px solid color-mix(in srgb,var(--gold) 30%, transparent)" : "1.5px solid transparent" }}>
                      <div style={{ fontSize: 13.8, fontWeight: 600, lineHeight: 1.4, color: e.win ? "var(--gold-deep)" : "var(--forest)" }}>{L(lang, e.title)}</div>
                      <div className="row aic gap-8" style={{ marginTop: 5 }}>
                        <span className="muted tiny">{L(lang, e.time)}</span>
                        {e.link && <span className="tlink tiny" style={{ padding: 0 }}>· {L(lang, { id: "lihat alasan", en: "see reason" })}</span>}
                        {e.safe && <span className="badge badge-safe" style={{ fontSize: 10, padding: "2px 7px" }}>{L(lang, { id: "Aman", en: "Safe" })}</span>}
                      </div>
                    </div>
                  </Reveal>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ====================== 14. PENGATURAN ====================== */
function SettingRow({ icon: I, label, value, badge, onClick, danger }) {
  return (
    <div className="row between aic" onClick={onClick} style={{ padding: "13px 2px", cursor: onClick ? "pointer" : "default", borderBottom: "1px solid var(--hairline)" }}>
      <div className="row aic gap-10">
        {I && <I size={18} stroke={danger ? "var(--danger)" : "var(--forest-70)"} />}
        <span style={{ fontSize: 14, fontWeight: 500, color: danger ? "var(--danger)" : "var(--ink)" }}>{label}</span>
      </div>
      <div className="row aic gap-8">
        {value && <span className="tnum tiny" style={{ color: "var(--ink-45)", fontWeight: 600 }}>{value}</span>}
        {badge}
        {onClick && <Icon.chevron size={16} stroke="var(--ink-45)" />}
      </div>
    </div>
  );
}

function ScreenPengaturan({ lang, go, t, openModal, setLang }) {
  return (
    <div className="screen" style={{ paddingBottom: 90 }}>
      <LeafFall density={(t.leafDensity ?? 1) * 0.3} />
      <TopBar onBack={() => go("dashboard")} title={L(lang, { id: "Pengaturan", en: "Settings" })} />

      <div style={{ padding: "8px 18px 20px", position: "relative", zIndex: 2 }} className="col gap-16">
        {/* Account */}
        <div className="card reveal">
          <div className="head" style={{ fontSize: 15, marginBottom: 4 }}>{L(lang, { id: "Akun", en: "Account" })}</div>
          <SettingRow icon={Icon.wallet} label={L(lang, { id: "Alamat dompet", en: "Wallet" })} value="0x12…9aF3" badge={<Icon.copy size={16} stroke="var(--clover)" />} />
          <SettingRow icon={Icon.spark} label={L(lang, { id: "Akun Pintar", en: "Smart Account" })} badge={<span className="badge badge-active" style={{ fontSize: 10.5, padding: "3px 9px" }}>{L(lang, { id: "Aktif", en: "Active" })}</span>} />
          <SettingRow icon={Icon.leaf} label={L(lang, { id: "Peluang Menang", en: "Win Chance" })} badge={<span className="badge badge-active" style={{ fontSize: 10.5, padding: "3px 9px" }}><Icon.leaf size={11} stroke="var(--clover-deep)" /> 12,5%</span>} />
          <div className="row between aic" style={{ padding: "13px 2px 4px" }}>
            <div className="row aic gap-10"><Icon.pool size={18} stroke="var(--forest-70)" /><span style={{ fontSize: 14, fontWeight: 500 }}>{L(lang, { id: "Jaringan", en: "Network" })}</span></div>
            <span className="badge badge-soft">Base</span>
          </div>
        </div>

        {/* AI permission */}
        <div className="card card-sage reveal" style={{ overflow: "hidden" }}>
          <CloverWatermark corner="br" size={120} opacity={0.06} />
          <div className="row aic gap-8" style={{ marginBottom: 10 }}>
            <Icon.shieldLeaf size={22} stroke="var(--clover-deep)" />
            <div className="head" style={{ fontSize: 15 }}>{L(lang, { id: "Izin pemelihara AI", en: "AI keeper permission" })}</div>
            <span className="badge badge-active" style={{ fontSize: 10.5, padding: "3px 9px", marginLeft: "auto" }}>{L(lang, { id: "Aktif", en: "Active" })}</span>
          </div>
          <div className="row gap-8" style={{ marginBottom: 12 }}>
            <div style={{ flex: 1, background: "var(--canvas-2)", borderRadius: 12, padding: "10px 12px" }}>
              <div className="tiny row aic gap-6" style={{ fontWeight: 700, color: "var(--clover-deep)", marginBottom: 4 }}><Icon.check size={13} stroke="var(--clover)" sw={2.6} /> {L(lang, { id: "BOLEH", en: "MAY" })}</div>
              <div className="tiny muted" style={{ lineHeight: 1.35 }}>{L(lang, { id: "Pindah antar protokol putih · sapu bunga", en: "Move between whitelisted protocols · sweep yield" })}</div>
            </div>
            <div style={{ flex: 1, background: "color-mix(in srgb,var(--danger) 7%, var(--canvas-2))", borderRadius: 12, padding: "10px 12px" }}>
              <div className="tiny row aic gap-6" style={{ fontWeight: 700, color: "var(--danger)", marginBottom: 4 }}><Icon.x size={13} stroke="var(--danger)" sw={2.6} /> {L(lang, { id: "TIDAK", en: "CANNOT" })}</div>
              <div className="tiny muted" style={{ lineHeight: 1.35 }}>{L(lang, { id: "Sentuh modal · kirim ke luar daftar", en: "Touch principal · send off-list" })}</div>
            </div>
          </div>
          <div className="row gap-10">
            <button className="btn btn-secondary grow btn-sm" onClick={() => go("ob4")}>{L(lang, { id: "Lihat detail izin", en: "View permission" })}</button>
            <button className="btn btn-danger-ghost btn-sm" onClick={() => openModal("cabut")}>{L(lang, { id: "Cabut Izin", en: "Revoke" })}</button>
          </div>
          <div className="tiny muted" style={{ marginTop: 10, lineHeight: 1.4 }}>{L(lang, { id: "Pemelihara membayar operasinya sendiri (x402) · batas harian kecil ke fasilitator.", en: "The keeper self-pays its operations (x402) · small daily cap to the facilitator." })}</div>
        </div>

        {/* Fee transparency */}
        <div className="card reveal">
          <div className="head" style={{ fontSize: 15, marginBottom: 14 }}>{L(lang, { id: "Transparansi biaya", en: "Fee transparency" })}</div>
          <div className="row aic gap-16">
            <div style={{ flex: "0 0 auto", position: "relative", width: 96, height: 96 }}>
              {(() => {
                const C = 2 * Math.PI * 38, gap = 9;
                const winLen = 0.9 * C - gap, treaLen = 0.1 * C - gap;
                return (
                  <svg width="96" height="96" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r="38" fill="none" stroke="color-mix(in srgb,var(--forest) 8%, transparent)" strokeWidth="14" />
                    <circle cx="48" cy="48" r="38" fill="none" stroke="var(--clover)" strokeWidth="14" strokeLinecap="round"
                      strokeDasharray={`${winLen} ${C - winLen}`} strokeDashoffset={-(gap / 2)} transform="rotate(-90 48 48)" />
                    <circle cx="48" cy="48" r="38" fill="none" stroke="var(--gold)" strokeWidth="14" strokeLinecap="round"
                      strokeDasharray={`${treaLen} ${C - treaLen}`} strokeDashoffset={-(gap / 2 + winLen + gap)} transform="rotate(-90 48 48)" />
                  </svg>
                );
              })()}
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}><Icon.coin size={24} stroke="var(--forest-70)" /></div>
            </div>
            <div className="col gap-8 grow">
              <div className="row aic gap-8"><span style={{ width: 11, height: 11, borderRadius: 3, background: "var(--clover)" }} /><span className="tiny" style={{ fontWeight: 600 }}>90% {L(lang, { id: "ke pemenang", en: "to winners" })}</span></div>
              <div className="row aic gap-8"><span style={{ width: 11, height: 11, borderRadius: 3, background: "var(--gold)" }} /><span className="tiny" style={{ fontWeight: 600 }}>10% {L(lang, { id: "ke treasury", en: "to treasury" })}</span></div>
              <div className="tiny muted" style={{ lineHeight: 1.4, marginTop: 2 }}>{L(lang, { id: "Modal pokok TIDAK PERNAH dipotong. Treasury: biaya AI (x402), gas, undian (VRF).", en: "Principal is NEVER cut. Treasury: AI cost (x402), gas, draw (VRF)." })}</div>
            </div>
          </div>
        </div>

        {/* About & security */}
        <div className="card card-sage reveal">
          <div className="head" style={{ fontSize: 15, marginBottom: 6 }}>{L(lang, { id: "Tentang & keamanan", en: "About & security" })}</div>
          <p style={{ fontSize: 13.5, lineHeight: 1.5, color: "var(--ink)", marginBottom: 10 }}>{L(lang, { id: "Aman bukan karena percaya AI, tapi karena dipaksa kode.", en: "Safe not because you trust the AI, but because code enforces it." })}</p>
          <div className="row gap-8 wrap">
            <span className="tlink tiny">{L(lang, { id: "Lihat kontrak", en: "View contracts" })} ↗</span>
            <span className="tlink tiny">{L(lang, { id: "Audit", en: "Audits" })} ↗</span>
          </div>
          <div className="tiny muted" style={{ marginTop: 10, lineHeight: 1.45 }}>{L(lang, { id: "No-loss ≠ no-risk. Dana di protokol teruji: Aave, Compound, Morpho, Moonwell.", en: "No-loss ≠ no-risk. Funds in audited protocols: Aave, Compound, Morpho, Moonwell." })}</div>
        </div>

        {/* Preferences */}
        <div className="card reveal">
          <div className="head" style={{ fontSize: 15, marginBottom: 4 }}>{L(lang, { id: "Preferensi", en: "Preferences" })}</div>
          <SettingRow icon={Icon.bell} label={L(lang, { id: "Notifikasi undian & AI", en: "Draw & AI alerts" })} badge={<Toggle on />} />
          <div className="row between aic" style={{ padding: "13px 2px" }}>
            <div className="row aic gap-10"><Icon.globe size={18} stroke="var(--forest-70)" /><span style={{ fontSize: 14, fontWeight: 500 }}>{L(lang, { id: "Bahasa", en: "Language" })}</span></div>
            <div className="row" style={{ background: "var(--sage)", borderRadius: 999, padding: 3 }}>
              {["id", "en"].map((lc) => (
                <button key={lc} onClick={() => setLang(lc)} style={{ border: "none", cursor: "pointer", padding: "6px 14px", borderRadius: 999, fontWeight: 700, fontSize: 12.5, fontFamily: "var(--font-body)",
                  background: lang === lc ? "var(--clover)" : "transparent", color: lang === lc ? "#F4FBF6" : "var(--forest-70)" }}>{lc.toUpperCase()}</button>
              ))}
            </div>
          </div>
        </div>

        <button className="btn btn-ghost btn-block" onClick={() => go("landing")} style={{ color: "var(--ink-45)" }}>{L(lang, { id: "Keluar / Putuskan dompet", en: "Log out / Disconnect" })}</button>
      </div>
    </div>
  );
}

function Toggle({ on: initial }) {
  const [on, setOn] = useState(initial);
  return (
    <button onClick={() => setOn(!on)} style={{ width: 44, height: 26, borderRadius: 999, border: "none", cursor: "pointer", padding: 3,
      background: on ? "var(--clover)" : "color-mix(in srgb,var(--forest) 15%, transparent)", transition: "background .25s" }}>
      <span style={{ display: "block", width: 20, height: 20, borderRadius: "50%", background: "#fff", transform: on ? "translateX(18px)" : "none", transition: "transform .25s var(--ease-back)", boxShadow: "0 2px 4px rgba(0,0,0,.2)" }} />
    </button>
  );
}

/* ====================== 12. MODALS (Tarik / Cabut) ====================== */
function ModalSheet({ children, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "absolute", inset: 0, zIndex: 80, display: "flex", alignItems: "flex-end", justifyContent: "center",
      background: "color-mix(in srgb,var(--forest) 45%, transparent)", backdropFilter: "blur(3px)", animation: "riseIn .25s var(--ease-soft)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", background: "var(--canvas)", borderRadius: "28px 28px 0 0", padding: "10px 22px 26px",
        boxShadow: "0 -18px 50px rgba(20,58,42,.2)", animation: "sheetUp .35s var(--ease-back)", maxHeight: "88%", overflowY: "auto" }}>
        <div style={{ width: 42, height: 5, borderRadius: 999, background: "color-mix(in srgb,var(--forest) 18%, transparent)", margin: "0 auto 18px" }} />
        {children}
      </div>
    </div>
  );
}

function ModalTarik({ lang, onClose }) {
  const wallet = useWallet();
  const principalNum = wallet.principalUsdc
    ? Number(wallet.principalUsdc) / 1e6
    : 100;
  const [amt, setAmt] = useState(Math.floor(principalNum));
  const [state, setState] = useState("idle"); // idle, loading, ok, error
  const [err, setErr] = useState("");

  const doWithdraw = async () => {
    setState("loading"); setErr("");
    try {
      await wallet.withdraw(amt);
      setState("ok");
    } catch (e) {
      setErr(e.message || "Withdraw failed");
      setState("idle");
    }
  };

  return (
    <ModalSheet onClose={onClose}>
      {state === "ok" ? (
        <div className="center reveal" style={{ padding: "10px 0 6px" }}>
          <div style={{ display: "grid", placeItems: "center", marginBottom: 8 }}><Plant grow={0.3} size={110} /></div>
          <h1 style={{ fontSize: 24, marginBottom: 6 }}>{L(lang, { id: "Berhasil ditarik", en: "Withdrawn" })}</h1>
          <p className="muted" style={{ fontSize: 14, marginBottom: 20 }}>{L(lang, { id: "Modalmu sudah kembali ke dompetmu.", en: "Your principal is back in your wallet." })}</p>
          <button className="btn btn-primary btn-block btn-lg" onClick={onClose}>{L(lang, { id: "Selesai", en: "Done" })}</button>
        </div>
      ) : (
        <>
          <h1 style={{ fontSize: 25, marginBottom: 6 }}>{L(lang, { id: "Tarik modalmu kapan saja", en: "Withdraw anytime" })}</h1>
          <p className="muted" style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 18 }}>{L(lang, { id: "Modalmu selalu milikmu. Tarik sebagian atau semuanya.", en: "Your principal is always yours. Take part or all." })}</p>
          <div className="card card-sage" style={{ padding: "18px 20px", marginBottom: 14 }}>
            <div className="row aic" style={{ justifyContent: "center", gap: 8 }}>
              <input className="amount-input" style={{ width: "auto", maxWidth: 180, fontSize: 44 }}
                value={amt}
                onChange={(e) => setAmt(Math.max(0, Math.min(principalNum, +e.target.value.replace(/\D/g, "") || 0)))}
                inputMode="numeric" />
              <span className="head" style={{ fontSize: 20, color: "var(--ink-45)" }}>USDC</span>
            </div>
            <div className="row gap-8" style={{ justifyContent: "center", marginTop: 12 }}>
              <button className={"chip" + (amt === Math.floor(principalNum / 2) ? " chip-on" : "")} style={{ cursor: "pointer" }} onClick={() => setAmt(Math.floor(principalNum / 2))}>{L(lang, { id: "Sebagian", en: "Partial" })}</button>
              <button className={"chip" + (amt === Math.floor(principalNum) ? " chip-on" : "")} style={{ cursor: "pointer" }} onClick={() => setAmt(Math.floor(principalNum))}>{L(lang, { id: `Semua (${Math.floor(principalNum)})`, en: `All (${Math.floor(principalNum)})` })}</button>
            </div>
          </div>
          <div className="tiny muted" style={{ lineHeight: 1.5, marginBottom: 18, padding: "0 4px" }}>{L(lang, { id: "Sisa modal tetap bekerja. Bunga yang sudah masuk Kolam ronde ini tetap diundi.", en: "Remaining principal keeps working. Yield already in this round's Pool still enters the draw." })}</div>
          {err && <div className="tiny" style={{ color: "var(--danger)", marginBottom: 10, textAlign: "center" }}>{err}</div>}
          {state === "loading" ? <StatePill tone="load">{L(lang, { id: "Menarik…", en: "Withdrawing…" })}</StatePill> : (
            <div className="row gap-10">
              <button className="btn btn-ghost" onClick={onClose}>{L(lang, { id: "Batal", en: "Cancel" })}</button>
              <button className="btn btn-primary grow btn-lg" onClick={doWithdraw}>{L(lang, { id: "Tarik", en: "Withdraw" })}</button>
            </div>
          )}
        </>
      )}
    </ModalSheet>
  );
}

function ModalCabut({ lang, onClose }) {
  const wallet = useWallet();
  const [state, setState] = useState("idle"); // idle, loading, ok, error
  const [err, setErr] = useState("");

  const doRevoke = async () => {
    setState("loading"); setErr("");
    try {
      await wallet.revokeDelegation();
      setState("ok");
    } catch (e) {
      setErr(e.message || "Revoke failed");
      setState("idle");
    }
  };

  const impacts = [
    { id: "AI berhenti total", en: "AI stops entirely" },
    { id: "Modal tetap aman & milikmu", en: "Principal stays safe & yours" },
    { id: "Bisa diaktifkan ulang kapan saja", en: "Re-enable anytime" },
  ];
  return (
    <ModalSheet onClose={onClose}>
      {state === "ok" ? (
        <div className="center reveal" style={{ padding: "10px 0 6px" }}>
          <div style={{ display: "grid", placeItems: "center", marginBottom: 12 }}><Icon.shieldLeaf size={56} stroke="var(--danger)" /></div>
          <h1 style={{ fontSize: 23, marginBottom: 6 }}>{L(lang, { id: "Izin dicabut", en: "Permission revoked" })}</h1>
          <p className="muted" style={{ fontSize: 14, marginBottom: 20 }}>{L(lang, { id: "Pemelihara AI dinonaktifkan. Modalmu tetap di dompetmu.", en: "The AI keeper is disabled. Your principal stays in your wallet." })}</p>
          <button className="btn btn-primary btn-block btn-lg" onClick={onClose}>{L(lang, { id: "Selesai", en: "Done" })}</button>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", placeItems: "center", marginBottom: 12 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "color-mix(in srgb,var(--danger) 12%, transparent)", display: "grid", placeItems: "center" }}>
              <Icon.shieldLeaf size={32} stroke="var(--danger)" />
            </div>
          </div>
          <h1 style={{ fontSize: 24, marginBottom: 8, textAlign: "center" }}>{L(lang, { id: "Cabut izin pemelihara AI", en: "Revoke AI keeper permission" })}</h1>
          <p className="muted" style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 18, textAlign: "center" }}>
            {L(lang, { id: "Begitu dicabut, agen AI langsung lumpuh, tak bisa lagi memindahkan atau menyapu apa pun. Modalmu tidak terpengaruh dan tetap di dompetmu. Kamu bisa beri izin lagi nanti.",
                       en: "Once revoked, the AI agent is instantly disabled, it can no longer move or sweep anything. Your principal is unaffected and stays in your wallet. You can grant permission again later." })}
          </p>
          <div className="card" style={{ padding: "14px 16px", marginBottom: 18 }}>
            {impacts.map((im, i) => (
              <div key={i} className="row aic gap-10" style={{ padding: "7px 0" }}>
                <Icon.check size={17} stroke="var(--clover)" sw={2.4} /><span style={{ fontSize: 13.5, fontWeight: 500 }}>{L(lang, im)}</span>
              </div>
            ))}
          </div>
          {err && <div className="tiny" style={{ color: "var(--danger)", marginBottom: 10, textAlign: "center" }}>{err}</div>}
          {state === "loading" ? <StatePill tone="load">{L(lang, { id: "Mencabut…", en: "Revoking…" })}</StatePill> : (
            <div className="row gap-10">
              <button className="btn btn-ghost" onClick={onClose}>{L(lang, { id: "Batal", en: "Cancel" })}</button>
              <button className="btn btn-danger grow btn-lg" onClick={doRevoke}>{L(lang, { id: "Ya, Cabut Izin", en: "Yes, Revoke" })}</button>
            </div>
          )}
        </>
      )}
    </ModalSheet>
  );
}

export { ScreenUndian, ScreenDetailRonde, ScreenRiwayat, ScreenPengaturan, ModalTarik, ModalCabut };
