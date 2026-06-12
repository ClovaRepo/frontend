import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { L, fmt, useCountUp, CountUp, Clover, Wordmark, LeafShape, LeafFall, CloverWatermark, Ic, Icon, ChainIcon, Gardener, VineStepper, CountdownArc, Plant, Confetti, AreaChart, Collapse, Reveal, TopBar, Toast } from './shared.jsx';
import { useWallet } from './wallet-context.jsx';
import { formatUnits } from 'viem';

/* ============================================================
   CLOVA, Onboarding steps 1..5
   ============================================================ */

function useFlow(initial = "idle") {
  const [state, setState] = useState(initial);
  const run = (steps) => {
    let i = 0;
    const next = () => {
      if (i >= steps.length) return;
      const [s, ms] = steps[i++];
      setState(s);
      if (i < steps.length) setTimeout(next, ms);
    };
    next();
  };
  return [state, setState, run];
}

const OB_LABELS = (lang) => [
  L(lang, { id: "Hubungkan", en: "Connect" }),
  L(lang, { id: "Tiketmu", en: "Tickets" }),
  L(lang, { id: "Aktifkan", en: "Activate" }),
  L(lang, { id: "Izin Aman", en: "Permit" }),
  L(lang, { id: "Setor", en: "Deposit" }),
];

function OBShell({ lang, step, t, children, leafDensity = 0.5 }) {
  return (
    <div className="screen">
      <LeafFall density={(t.leafDensity ?? 1) * leafDensity} />
      <CloverWatermark corner="tr" size={160} opacity={0.045} />
      <div style={{ padding: "20px 16px 6px", position: "relative", zIndex: 2 }}>
        <div className="row between aic" style={{ marginBottom: 18 }}>
          <Wordmark size={22} />
          <span className="badge badge-soft tnum">{L(lang, { id: "Langkah", en: "Step" })} {step}/5</span>
        </div>
        <VineStepper step={step} labels={OB_LABELS(lang)} />
      </div>
      <div style={{ padding: "16px 18px 30px", position: "relative", zIndex: 2 }}>{children}</div>
    </div>
  );
}

function StatePill({ tone = "load", children }) {
  const map = { load: ["var(--sage)", "var(--clover-deep)"], ok: ["var(--sage-2)", "var(--clover-deep)"] };
  const [bg, fg] = map[tone];
  return (
    <div className="row aic gap-10" style={{ background: bg, color: fg, borderRadius: 14, padding: "13px 16px", fontWeight: 600, fontSize: 14.5 }}>
      {tone === "load" && <span className="spin-dot" style={{ width: 16, height: 16, borderRadius: "50%", border: "2.5px solid color-mix(in srgb,var(--clover) 30%, transparent)", borderTopColor: "var(--clover)", animation: "spinClover .8s linear infinite", display: "inline-block" }} />}
      {tone === "ok" && <Icon.check size={18} stroke="var(--clover)" sw={2.4} />}
      {children}
    </div>
  );
}

/* Wallets offered in the picker. `domain` resolves each wallet's real logo;
   `detected` shows a subtle "installed" hint. */
const WALLETS = [
  { id: "metamask", name: "MetaMask", bg: "#E2761B", domain: "metamask.io", detected: true },
  { id: "coinbase", name: "Coinbase Wallet", bg: "#1652F0", domain: "coinbase.com" },
  { id: "walletconnect", name: "WalletConnect", bg: "#3B99FC", domain: "walletconnect.com" },
  { id: "rabby", name: "Rabby", bg: "#7084FF", domain: "rabby.io" },
  { id: "trust", name: "Trust Wallet", bg: "#3375BB", domain: "trustwallet.com" },
];

/* Each wallet's real logo (its official site icon), with a tinted monogram
   fallback if the logo can't load (e.g. offline). */
function WalletGlyph({ w, size = 34, radius = 10 }) {
  const [err, setErr] = useState(false);
  const showLogo = w.domain && !err;
  return (
    <span style={{ width: size, height: size, borderRadius: radius, background: "var(--canvas-2)",
      display: "grid", placeItems: "center", flex: "0 0 auto", overflow: "hidden",
      boxShadow: `inset 0 0 0 1.5px color-mix(in srgb, ${w.bg} 26%, transparent)` }}>
      {showLogo ? (
        <img src={`https://www.google.com/s2/favicons?domain=${w.domain}&sz=128`} alt={`${w.name} logo`}
          width={Math.round(size * 0.6)} height={Math.round(size * 0.6)} loading="lazy"
          style={{ display: "block", borderRadius: 6 }} onError={() => setErr(true)} />
      ) : (
        <span style={{ color: w.bg, fontWeight: 800, fontSize: size * 0.46, lineHeight: 1, fontFamily: "var(--font-head)" }}>{w.name[0]}</span>
      )}
    </span>
  );
}

/* Wallet chooser, centered dialog, works inside both the phone frame
   and the web onboarding column (fixed + flex-centered). */
function WalletPicker({ lang, onPick, onClose }) {
  return (
    <div onClick={onClose} role="dialog" aria-modal="true"
      style={{ position: "fixed", inset: 0, zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center", padding: 18,
        background: "color-mix(in srgb,var(--forest) 45%, transparent)", backdropFilter: "blur(3px)", animation: "riseIn .22s var(--ease-soft)" }}>
      <div onClick={(e) => e.stopPropagation()} className="card"
        style={{ width: "100%", maxWidth: 380, padding: "20px 20px 18px", boxShadow: "0 24px 60px rgba(20,58,42,.28)", animation: "bloomPop .32s var(--ease-back)" }}>
        <div className="row between aic" style={{ marginBottom: 4 }}>
          <h2 className="head" style={{ fontSize: 20 }}>{L(lang, { id: "Pilih dompet", en: "Choose a wallet" })}</h2>
          <button className="icon-btn" aria-label={L(lang, { id: "Tutup", en: "Close" })} onClick={onClose}
            style={{ width: 40, height: 40, borderRadius: 12, border: "none", background: "var(--sage)", display: "grid", placeItems: "center", cursor: "pointer" }}>
            <Icon.x size={16} stroke="var(--clover-deep)" />
          </button>
        </div>
        <p className="muted tiny" style={{ marginBottom: 14 }}>{L(lang, { id: "Hubungkan dompet pilihanmu. Kunci tetap milikmu.", en: "Connect with your wallet of choice. Your keys stay yours." })}</p>
        <div className="col gap-8">
          {WALLETS.map((w) => (
            <button key={w.id} className="wallet-row" onClick={() => onPick(w)}>
              <WalletGlyph w={w} />
              <span className="head" style={{ fontSize: 15.5, flex: 1, textAlign: "left" }}>{w.name}</span>
              {w.detected && <span className="badge badge-active tiny">{L(lang, { id: "Terpasang", en: "Detected" })}</span>}
              <Icon.arrow size={16} stroke="var(--clover-deep)" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -------- 3. OB1, Connect wallet -------- */
function ScreenOB1({ lang, go, t }) {
  const wallet = useWallet();
  const [state, setState] = useState(wallet.account ? "connected" : "idle");
  const [picking, setPicking] = useState(false);
  const [err, setErr] = useState("");
  const [walletInfo, setWalletInfo] = useState(null);

  const pick = async (w) => {
    setWalletInfo(w);
    setPicking(false);
    setState("loading");
    setErr("");
    try {
      await wallet.connect();
      setState("connected");
    } catch (e) {
      setErr(e.message || "Connection failed");
      setState("idle");
    }
  };

  // Skip onboarding if user already has a deposit on-chain
  const handleContinue = () => {
    if (wallet.principalUsdc > 0n && wallet.hasDelegation) {
      go("dashboard");
    } else if (wallet.principalUsdc > 0n && !wallet.hasDelegation) {
      // Principal exists but delegation was revoked/missing — skip to ob4 to re-sign
      go("ob4");
    } else {
      go("ob2");
    }
  };
  return (
    <OBShell lang={lang} step={1} t={t}>
      <div className="card reveal" style={{ padding: "26px 22px", overflow: "hidden" }}>
        <CloverWatermark corner="br" size={120} opacity={0.05} />
        <div style={{ width: 58, height: 58, borderRadius: 18, background: "var(--sage)", display: "grid", placeItems: "center", marginBottom: 16 }}>
          <Icon.wallet size={30} stroke="var(--clover-deep)" />
        </div>
        <h1 style={{ fontSize: 27, marginBottom: 8 }}>{L(lang, { id: "Hubungkan dompetmu", en: "Connect your wallet" })}</h1>
        <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.55, marginBottom: 20 }}>
          {L(lang, { id: "Pilih dompet untuk mulai. Kami tidak pernah menyimpan kunci atau danamu, semuanya tetap milikmu.",
                     en: "Pick a wallet to get started. We don't hold your keys or your funds — everything stays in your wallet." })}
        </p>

        {state === "connected" ? (
          <div className="reveal">
            <div className="row between aic" style={{ background: "var(--sage)", borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}>
              <div className="row aic gap-10">
                {walletInfo ? <WalletGlyph w={walletInfo} size={36} radius={999} /> : (
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--canvas-2)", display: "grid", placeItems: "center" }}>
                    <Icon.wallet size={19} stroke="var(--clover-deep)" />
                  </div>
                )}
                <div>
                  {walletInfo && <div className="tiny" style={{ fontWeight: 700, color: "var(--clover-deep)" }}>{walletInfo.name}</div>}
                  <div className="head tnum" style={{ fontSize: 16 }}>
                    {wallet.account ? wallet.account.slice(0, 6) + "…" + wallet.account.slice(-4) : "0x…"}
                  </div>
                </div>
              </div>
              <span className="badge badge-active"><span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--clover)" }} /> {L(lang, { id: "Terhubung", en: "Connected" })}</span>
            </div>
            <button className="btn btn-primary btn-block btn-lg" onClick={handleContinue}>
              {wallet.principalUsdc > 0n && wallet.hasDelegation
                ? L(lang, { id: "Buka Dashboard →", en: "Open Dashboard →" })
                : wallet.principalUsdc > 0n
                ? <>{L(lang, { id: "Aktifkan Ulang Izin →", en: "Re-activate Permission →" })} <Icon.arrow size={18} stroke="#F4FBF6" /></>
                : <>{L(lang, { id: "Lanjut", en: "Continue" })} <Icon.arrow size={18} stroke="#F4FBF6" /></>}
            </button>
          </div>
        ) : state === "loading" ? (
          <StatePill tone="load">{L(lang, { id: `Menghubungkan ${walletInfo?.name || ""}…`.trim(), en: `Connecting ${walletInfo?.name || ""}…`.trim() })}</StatePill>
        ) : (
          <>
            <button className="btn btn-primary btn-block btn-lg" onClick={() => setPicking(true)}>
              <Icon.wallet size={20} stroke="#F4FBF6" />
              {L(lang, { id: "Hubungkan dompet", en: "Connect wallet" })}
            </button>
            {err && <div className="tiny" style={{ color: "var(--danger)", marginTop: 8, textAlign: "center" }}>{err}</div>}
          </>
        )}
        <div className="muted tiny center" style={{ marginTop: 14 }}>{L(lang, { id: "Tanpa biaya. Tanpa registrasi. Bisa keluar kapan saja.", en: "No fees. No sign-up. Leave anytime." })}</div>
      </div>

      {picking && <WalletPicker lang={lang} onPick={pick} onClose={() => setPicking(false)} />}

      <div className="col gap-10" style={{ marginTop: 16 }}>
        <Collapse q={L(lang, { id: "Apakah aman?", en: "Is it safe?" })}>
          {L(lang, { id: "Ya. Clova tidak pernah memegang kunci privatmu. Dompet tetap di kendalimu; kamu hanya menandatangani izin berpagar yang bisa dicabut kapan saja.",
                     en: "Yes. Clova does not hold your private key. Your wallet stays under your control; you only sign a bounded permission that you can revoke anytime." })}
        </Collapse>
        <Collapse q={L(lang, { id: "Jaringan apa?", en: "Which network?" })}>
          {L(lang, { id: "Clova berjalan di jaringan Base, cepat dan biaya rendah.", en: "Clova runs on the Base network, fast and low-cost." })}
        </Collapse>
      </div>
    </OBShell>
  );
}

/* -------- 4. OB2, Proportional Ticket Explanation -------- */
function ScreenOB2({ lang, go, t }) {
  const users = [
    { label: { id: "Kamu · $500", en: "You · $500" }, weight: 0.5, highlight: true },
    { label: { id: "Penanam A · $300", en: "Planter A · $300" }, weight: 0.3, highlight: false },
    { label: { id: "Penanam B · $200", en: "Planter B · $200" }, weight: 0.2, highlight: false },
  ];
  return (
    <OBShell lang={lang} step={2} t={t}>
      <div className="card reveal" style={{ padding: "26px 22px", overflow: "hidden" }}>
        <CloverWatermark corner="bl" size={130} opacity={0.05} />
        <h1 style={{ fontSize: 25, marginBottom: 8 }}>{L(lang, { id: "Tiketmu = depositmu 🍀", en: "Your ticket = your deposit 🍀" })}</h1>
        <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.55, marginBottom: 20 }}>
          {L(lang, { id: "Peluang menangmu proporsional dengan seberapa besar kontribusimu ke kolam. Deposit lebih besar berarti peluang lebih besar.",
                     en: "Your winning chance is proportional to how much you contribute to the pool. A bigger deposit means a bigger chance." })}
        </p>

        {/* Proportion bars */}
        <div className="col gap-10" style={{ marginBottom: 20 }}>
          {users.map((u, i) => (
            <div key={i}>
              <div className="row between aic" style={{ marginBottom: 4 }}>
                <span className="tiny" style={{ fontWeight: 700, color: u.highlight ? "var(--clover-deep)" : "var(--ink-45)" }}>{L(lang, u.label)}</span>
                <span className="tnum tiny" style={{ fontWeight: 700, color: u.highlight ? "var(--clover)" : "var(--ink-45)" }}>{Math.round(u.weight * 100)}%</span>
              </div>
              <div style={{ height: 10, borderRadius: 6, background: "var(--sage)" }}>
                <div style={{ height: "100%", borderRadius: 6, width: `${u.weight * 100}%`,
                  background: u.highlight ? "var(--clover)" : "color-mix(in srgb,var(--clover) 40%, transparent)",
                  transition: "width .6s var(--ease-back)" }} />
              </div>
            </div>
          ))}
        </div>

        <div className="card card-sage row aic gap-10" style={{ padding: "13px 15px", marginBottom: 18 }}>
          <Icon.shieldLeaf size={22} stroke="var(--clover-deep)" />
          <span className="tiny" style={{ lineHeight: 1.4, fontWeight: 600, color: "var(--forest)" }}>
            {L(lang, { id: "Anti-kecurangan: memecah $1.000 ke 10 dompet × $100 tidak menguntungkan, bobot total tetap sama.", en: "Cheat-proof: splitting $1,000 into 10 wallets × $100 is no advantage, total weight stays identical." })}
          </span>
        </div>

        <button className="btn btn-primary btn-block btn-lg" onClick={() => go("ob3")}>
          {L(lang, { id: "Lanjut", en: "Continue" })} <Icon.arrow size={18} stroke="#F4FBF6" />
        </button>
      </div>
    </OBShell>
  );
}

/* -------- 5. OB3, Activate Smart Account -------- */
function ScreenOB3({ lang, go, t }) {
  const wallet = useWallet();
  const [state, setState] = useState(wallet.isUpgraded ? "ok" : "idle");
  const [err, setErr] = useState("");

  const handleUpgrade = async () => {
    setState("loading");
    setErr("");
    try {
      await wallet.upgradeToSmartAccount();
      setState("ok");
    } catch (e) {
      setErr(e.message || L(lang, { id: "Upgrade gagal. Coba lagi.", en: "Upgrade failed. Please try again." }));
      setState("idle");
    }
  };

  const benefits = [
    { id: "Agen hanya bisa bertindak dalam batas izin yang kamu tanda tangani", en: "Agent can only act within the permission boundaries you sign" },
    { id: "Izin bisa dicabut kapan saja — satu klik", en: "Permission revocable anytime — one click" },
    { id: "Dompet & kunci tetap sepenuhnya milikmu", en: "Wallet and keys remain entirely yours" },
  ];

  return (
    <OBShell lang={lang} step={3} t={t}>
      <div className="card reveal" style={{ padding: "26px 22px", overflow: "hidden" }}>
        <CloverWatermark corner="br" size={120} opacity={0.05} />
        <h1 style={{ fontSize: 25, marginBottom: 8 }}>
          {L(lang, { id: "Aktifkan Smart Account", en: "Activate Smart Account" })}
        </h1>
        <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.55, marginBottom: 20 }}>
          {L(lang, {
            id: "Dompetmu perlu di-upgrade ke Smart Account (EIP-7702) agar Clova bisa memberi izin presisi ke agen di langkah berikutnya. Kunci tetap milikmu — ini hanya menambah kemampuan izin.",
            en: "Your wallet needs to be upgraded to a Smart Account (EIP-7702) so Clova can grant the agent a precise, bounded permission in the next step. Your keys stay yours — this only adds permission capability.",
          })}
        </p>

        {/* visual: EOA → Smart Account */}
        <div className="row aic between" style={{ background: "var(--sage)", borderRadius: 18, padding: "18px 16px", marginBottom: 18 }}>
          <div className="col aic gap-6" style={{ flex: 1 }}>
            <Icon.wallet size={34} stroke="var(--forest-70)" />
            <span className="tiny muted" style={{ textAlign: "center" }}>
              {L(lang, { id: "EOA biasa", en: "Regular EOA" })}
            </span>
          </div>
          <div style={{ flex: "0 0 auto", textAlign: "center" }}>
            <svg width="46" height="20" viewBox="0 0 46 20" fill="none">
              <path d="M2 10 H 40" stroke="var(--clover)" strokeWidth="2.4" strokeDasharray="2 4" strokeLinecap="round" />
              <path d="M36 5l6 5-6 5" stroke="var(--clover)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            <div className="tiny" style={{ color: "var(--clover-deep)", fontWeight: 600, marginTop: 2 }}>EIP-7702</div>
          </div>
          <div className="col aic gap-6" style={{ flex: 1 }}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)" }}>
                <Clover size={20} color="var(--leaf)" stem={false} />
              </div>
              <Icon.wallet size={34} stroke="var(--clover)" />
            </div>
            <span className="tiny" style={{ fontWeight: 700, color: "var(--clover-deep)", textAlign: "center" }}>
              {L(lang, { id: "Smart Account", en: "Smart Account" })}
            </span>
          </div>
        </div>

        <div className="col gap-10" style={{ marginBottom: 20 }}>
          {benefits.map((b, i) => (
            <div key={i} className="row gap-10 aic">
              <Icon.shield size={19} stroke="var(--clover)" />
              <span style={{ fontSize: 13.5, fontWeight: 500 }}>{L(lang, b)}</span>
            </div>
          ))}
        </div>

        {err && (
          <div className="col gap-10" style={{ marginBottom: 14 }}>
            <div className="row aic gap-8" style={{ background: "color-mix(in srgb,#ef4444 10%, var(--canvas-2))", borderRadius: 12, padding: "11px 14px" }}>
              <Icon.x size={16} stroke="#ef4444" />
              <span style={{ fontSize: 13, color: "#ef4444", fontWeight: 500 }}>{err}</span>
            </div>
            {err.includes("7702") && (
              <button className="btn btn-secondary btn-block" onClick={() => { setErr(""); go("ob4"); }}>
                {L(lang, { id: "Lewati langkah ini → Lanjut ke Izin", en: "Skip this step → Continue to Permission" })}
              </button>
            )}
          </div>
        )}

        {state === "ok" ? (
          <div className="reveal">
            <div className="row aic gap-10" style={{ background: "var(--sage-2)", borderRadius: 14, padding: "13px 16px", marginBottom: 14 }}>
              <Icon.check size={18} stroke="var(--clover)" sw={2.4} />
              <span className="tiny" style={{ fontWeight: 600, color: "var(--forest)" }}>
                {L(lang, { id: "Smart Account aktif. Kamu siap memberi izin di langkah berikutnya.", en: "Smart Account active. You're ready to grant permission in the next step." })}
              </span>
            </div>
            <button className="btn btn-primary btn-block btn-lg" onClick={() => go("ob4")}>
              {L(lang, { id: "Lanjut — Beri Izin", en: "Continue — Grant Permission" })}
              <Icon.arrow size={18} stroke="#F4FBF6" />
            </button>
          </div>
        ) : (
          <button
            className="btn btn-primary btn-block btn-lg"
            disabled={state === "loading"}
            onClick={handleUpgrade}
          >
            {state === "loading" ? (
              <>{L(lang, { id: "Menunggu konfirmasi...", en: "Waiting for confirmation..." })}<span className="spin-dot" style={{ width: 16, height: 16, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,.3)", borderTopColor: "#fff", animation: "spinClover .8s linear infinite", display: "inline-block", marginLeft: 8 }} /></>
            ) : (
              <>{L(lang, { id: "Aktifkan Smart Account", en: "Activate Smart Account" })}<Icon.arrow size={18} stroke="#F4FBF6" /></>
            )}
          </button>
        )}
      </div>
    </OBShell>
  );
}

/* -------- 6. OB4, Safe Permission (caveats), the HEART -------- */
function PermitCol({ tone, title, items }) {
  const ok = tone === "ok";
  return (
    <div style={{ flex: 1, minWidth: 0, background: ok ? "var(--sage)" : "color-mix(in srgb,var(--danger) 8%, var(--canvas-2))",
      borderRadius: 20, padding: "16px 15px", boxShadow: ok ? "inset 0 0 0 1.5px color-mix(in srgb,var(--clover) 20%, transparent)" : "inset 0 0 0 1.5px color-mix(in srgb,var(--danger) 22%, transparent)" }}>
      <div className="row aic gap-8" style={{ marginBottom: 12 }}>
        <span style={{ width: 26, height: 26, borderRadius: "50%", background: ok ? "var(--clover)" : "var(--danger)", display: "grid", placeItems: "center" }}>
          {ok ? <Icon.check size={16} stroke="#fff" sw={2.6} /> : <Icon.x size={15} stroke="#fff" sw={2.6} />}
        </span>
        <span className="head" style={{ fontSize: 14, color: ok ? "var(--clover-deep)" : "var(--danger)" }}>{title}</span>
      </div>
      <div className="col gap-12">
        {items.map((it, i) => (
          <div key={i} style={{ fontSize: 12.8, lineHeight: 1.4, color: "var(--ink)", display: "flex", gap: 7 }}>
            <span style={{ color: ok ? "var(--clover)" : "var(--danger)", flex: "0 0 auto", marginTop: 1 }}>{ok ? "🌿" : "✕"}</span>
            <span>{it}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScreenOB4({ lang, go, t }) {
  const wallet = useWallet();
  const [state, setState] = useState(wallet.hasDelegation ? "ok" : "idle");
  const [err, setErr] = useState("");
  return (
    <OBShell lang={lang} step={4} t={t} leafDensity={0.28}>
      <Reveal>
        <h1 style={{ fontSize: 26, marginBottom: 8 }}>{L(lang, { id: "Beri izin terbatas ke pemelihara AI", en: "Grant the AI tender limited permission" })}</h1>
        <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.55, marginBottom: 20 }}>
          {L(lang, { id: "Kamu menandatangani SATU izin berpagar. Batas ditegakkan dua lapis: MetaMask membatasi jumlah, kontrak on-chain menolak jika modal disentuh.",
                     en: "You sign ONE fenced permission. Protection is two-layered: MetaMask caps the amount, the on-chain contract rejects if principal is touched." })}
        </p>
      </Reveal>

      <Reveal delay={80} className="row gap-10" style={{ alignItems: "stretch", marginBottom: 16 }}>
        <PermitCol tone="ok" title={L(lang, { id: "AI BOLEH", en: "AI MAY" })} items={[
          L(lang, { id: "Menyapu bunga ke Kolam Hadiah (maks 5 USDC per izin).", en: "Sweep yield into the Prize Pool (max 5 USDC per permission)." }),
          L(lang, { id: "Merotasi posisi antar protokol tepercaya via kontrak atomik (Aave ↔ Moonwell).", en: "Rotate position between trusted protocols via atomic contract (Aave ↔ Moonwell)." }),
          L(lang, { id: "Membayar biaya operasinya sendiri (batas harian kecil, hanya ke fasilitator resmi).", en: "Pay its own operating costs (small daily cap, official facilitator only)." }),
        ]} />
        <PermitCol tone="no" title={L(lang, { id: "AI TIDAK BISA", en: "AI CANNOT" })} items={[
          L(lang, { id: "Mengambil lebih dari 5 USDC per izin (ditegakkan MetaMask).", en: "Take more than 5 USDC per permission (enforced by MetaMask)." }),
          L(lang, { id: "Menyentuh modal pokok (kontrak on-chain menolak otomatis).", en: "Touch your principal (on-chain contract auto-rejects)." }),
          L(lang, { id: "Mengubah daftar putih protokol (hanya admin).", en: "Change the protocol whitelist (admin only)." }),
          L(lang, { id: "Memilih pemenang (itu lewat undian acak/VRF).", en: "Pick the winner (that's random VRF)." }),
        ]} />
      </Reveal>

      <Reveal delay={140} className="card card-sage row aic gap-12" style={{ padding: "15px 16px", marginBottom: 16 }}>
        <Icon.shieldLeaf size={28} stroke="var(--clover-deep)" />
        <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.4, color: "var(--forest)" }}>
          {L(lang, { id: "Kamu bisa CABUT izin ini kapan saja, langsung, tanpa izin siapa pun.", en: "You can REVOKE this permission anytime, instantly, without anyone's approval." })}
        </div>
      </Reveal>

      <div style={{ marginBottom: 18 }}>
        <Collapse q={L(lang, { id: "Lihat detail izin (untuk yang penasaran)", en: "View permission details (for the curious)" })}>
          <div className="tnum" style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, lineHeight: 1.7, color: "var(--forest-70)" }}>
            type: erc20-token-allowance (MetaMask ERC-7715)<br />
            token: aUSDC (Aave interest-bearing USDC)<br />
            ceiling: 5 USDC per permission (MetaMask enforced)<br />
            principal guard: depositYield() on-chain check<br />
            rotation: RotationHelper atomic contract<br />
            delegate: 1Shot relayer · revocable anytime
          </div>
        </Collapse>
      </div>

      {state === "ok" ? (
        <div className="reveal">
          <div className="row aic gap-10" style={{ background: "var(--sage-2)", borderRadius: 16, padding: "14px 16px", marginBottom: 14, justifyContent: "center" }}>
            <Clover size={26} color="var(--clover)" stem={false} />
            <span className="head" style={{ fontSize: 16, color: "var(--clover-deep)" }}>{L(lang, { id: "Izin aman aktif", en: "Safe permission active" })}</span>
          </div>
          <button className="btn btn-primary btn-block btn-lg" onClick={() => wallet.principalUsdc > 0n ? go("dashboard") : go("ob5")}>
            {wallet.principalUsdc > 0n
              ? L(lang, { id: "Buka Dashboard →", en: "Open Dashboard →" })
              : <>{L(lang, { id: "Lanjut", en: "Continue" })} <Icon.arrow size={18} stroke="#F4FBF6" /></>}
          </button>
        </div>
      ) : state === "loading" ? (
        <StatePill tone="load">{L(lang, { id: "Menunggu tanda tangan…", en: "Waiting for signature…" })}</StatePill>
      ) : (
        <>
          <div className="row gap-10">
            <button className="btn btn-ghost" onClick={() => wallet.principalUsdc > 0n ? go("ob1") : go("ob3")}>{L(lang, { id: "Kembali", en: "Back" })}</button>
            <button className="btn btn-primary grow btn-lg" onClick={async () => {
              setState("loading"); setErr("");
              try {
                await wallet.signAndStoreDelegation();
                setState("ok");
              } catch (e) {
                setErr(e.message || "Signing failed");
                setState("idle");
              }
            }}>{L(lang, { id: "Setujui & Tanda Tangani", en: "Approve & Sign" })}</button>
          </div>
          {err && <div className="tiny" style={{ color: "var(--danger)", marginTop: 8, textAlign: "center" }}>{err}</div>}
        </>
      )}
    </OBShell>
  );
}

/* -------- 7. OB5, Deposit & start planting -------- */
const CROSS_CHAINS = [
  { id: "base", label: "Base", icon: "🔵", native: true },
  { id: "eth", label: "Ethereum", icon: "⟠" },
  { id: "arb", label: "Arbitrum", icon: "🔷" },
  { id: "op", label: "Optimism", icon: "🔴" },
  { id: "polygon", label: "Polygon", icon: "🟣" },
];

function ScreenOB5({ lang, go, t }) {
  const wallet = useWallet();
  const [amt, setAmt] = useState(10);
  const [state, setState] = useState("idle"); // idle, approve, deposit, ok
  const [srcChain, setSrcChain] = useState("base");
  const [showChains, setShowChains] = useState(false);
  const [err, setErr] = useState("");
  const balance = wallet.usdcBalance > 0n ? Number(formatUnits(wallet.usdcBalance, 6)) : 0;

  // Auto-refresh balance saat layar ini aktif (user mungkin baru dapat USDC dari faucet)
  useEffect(() => {
    wallet.refreshBalance?.();
    const id = setInterval(() => wallet.refreshBalance?.(), 30000);
    return () => clearInterval(id);
  }, []);
  const grow = Math.min(1, amt / 300);
  const quick = [10, 50, 100];
  const selectedChain = CROSS_CHAINS.find((c) => c.id === srcChain);

  if (state === "ok") {
    return (
      <OBShell lang={lang} step={5} t={t} leafDensity={0.3}>
        <div className="card reveal center" style={{ padding: "30px 22px", position: "relative", overflow: "hidden" }}>
          <Confetti go count={46} />
          <div style={{ display: "grid", placeItems: "center", marginBottom: 8, animation: "bloomPop .8s var(--ease-back)" }}>
            <Plant grow={1} size={150} />
          </div>
          <h1 style={{ fontSize: 26, marginBottom: 8 }}>{L(lang, { id: "Benih pertamamu tumbuh! 🌱", en: "Your first seed is growing! 🌱" })}</h1>
          <span className="badge badge-active" style={{ marginBottom: 8 }}><Clover size={14} color="var(--clover-deep)" stem={false} /> {L(lang, { id: "Kamu sudah ikut ronde #12!", en: "You're in round #12!" })}</span>
          <p className="muted" style={{ fontSize: 14, marginBottom: 20 }}>{L(lang, { id: "Modalmu tetap milikmu. Hanya bunga yang ikut diundi.", en: "Your principal stays yours. Only the yield enters the draw." })}</p>
          <button className="btn btn-primary btn-block btn-lg" onClick={() => go("dashboard")}>{L(lang, { id: "Buka Dashboard", en: "Open Dashboard" })} <Icon.arrow size={18} stroke="#F4FBF6" /></button>
        </div>
      </OBShell>
    );
  }

  return (
    <OBShell lang={lang} step={5} t={t} leafDensity={0.4}>
      <Reveal><h1 style={{ fontSize: 26, marginBottom: 16 }}>{L(lang, { id: "Tanam benih pertamamu", en: "Plant your first seed" })}</h1></Reveal>

      <div className="card reveal" style={{ padding: "22px 20px" }}>
        <div className="center" style={{ marginBottom: 6 }}><Plant grow={grow} size={108} /></div>

        {/* Amount input — clearly editable */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--sage)", borderRadius: 16, padding: "10px 20px 8px" }}>
            <input
              className="amount-input"
              style={{ width: "auto", maxWidth: 160 }}
              value={amt === 0 ? "" : amt}
              placeholder="0"
              onChange={(e) => { const v = +e.target.value.replace(/\D/g, "") || 0; setAmt(Math.min(balance > 0 ? balance : 999999, v)); }}
              inputMode="numeric"
              autoComplete="off"
            />
            <span className="head" style={{ fontSize: 22, color: "var(--ink-45)" }}>USDC</span>
          </div>
          <div className="muted tiny center" style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--clover-deep)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
            </svg>
            {L(lang, { id: "Ketuk kotak hijau untuk ubah jumlah", en: "Tap the green box to type an amount" })}
          </div>
        </div>
        <div className="muted tiny center" style={{ marginTop: 4 }}>{L(lang, { id: "Saldo dompet", en: "Wallet balance" })}: <span className="tnum">{balance > 0 ? fmt(balance, 2) : "—"} USDC</span></div>

        <div className="row gap-8" style={{ marginTop: 16, justifyContent: "center" }}>
          {quick.map((q) => (
            <button key={q} className={"chip" + (amt === q ? " chip-on" : "")} style={{ cursor: "pointer" }} onClick={() => setAmt(q)}>{q}</button>
          ))}
          <button className={"chip" + (amt === balance ? " chip-on" : "")} style={{ cursor: "pointer" }} onClick={() => setAmt(balance)}>Max</button>
        </div>
      </div>

      <div className="card card-sage reveal" style={{ padding: "16px 18px", marginTop: 14 }}>
        <div className="row between aic" style={{ marginBottom: 8 }}>
          <span className="muted" style={{ fontSize: 13.5 }}>{L(lang, { id: "Modal awal (baseline)", en: "Baseline principal" })}</span>
          <span className="head tnum" style={{ fontSize: 16 }}>{fmt(amt, 0)} USDC</span>
        </div>
        <div className="row between aic">
          <span className="muted" style={{ fontSize: 13.5 }}>{L(lang, { id: "Protokol awal", en: "Starting protocol" })}</span>
          <span className="row aic gap-6" style={{ fontSize: 14, fontWeight: 600, color: "var(--forest)" }}><Icon.leaf size={16} stroke="var(--clover)" /> Aave v3</span>
        </div>
        <div className="vine-divide" style={{ margin: "12px 0" }} />
        <div className="tiny muted" style={{ lineHeight: 1.5 }}>{L(lang, { id: "Selalu bisa kamu tarik. Perkiraan bunga jadi tiket hadiah tiap ronde.", en: "Always withdrawable. Estimated yield becomes your prize ticket each round." })}</div>
      </div>

      {/* Cross-chain deposit via LI.FI */}
      <div className="reveal" style={{ marginTop: 14 }}>
        <button className="row between aic" style={{ width: "100%", background: "var(--canvas-2)", border: "1.5px solid var(--hairline)", borderRadius: 14, padding: "12px 16px", cursor: "pointer" }}
          onClick={() => setShowChains(!showChains)}>
          <span className="row aic gap-8 tiny" style={{ fontWeight: 600, color: "var(--ink)" }}>
            <Icon.globe size={16} stroke="var(--forest-70)" />
            {L(lang, { id: "Dari chain lain?", en: "From another chain?" })}
            <span style={{ fontWeight: 400, color: "var(--ink-45)" }}>{L(lang, { id: ", LI.FI akan jembatani otomatis", en: ", LI.FI bridges automatically" })}</span>
          </span>
          <span className="row aic gap-6" style={{ fontSize: 14, fontWeight: 700, color: "var(--clover)", marginLeft: 8 }}>
            <ChainIcon name={selectedChain?.label} size={16} /> {selectedChain?.label}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-45)" strokeWidth="2.5" strokeLinecap="round" style={{ marginLeft: 4, transform: showChains ? "rotate(180deg)" : "none", transition: "transform .2s" }}><path d="M6 9l6 6 6-6" /></svg>
          </span>
        </button>
        {showChains && (
          <div className="reveal" style={{ background: "var(--canvas-2)", border: "1.5px solid var(--hairline)", borderRadius: 14, padding: "10px 8px", marginTop: 4 }}>
            <div className="row gap-6 wrap" style={{ padding: "4px 6px" }}>
              {CROSS_CHAINS.map((c) => (
                <button key={c.id} onClick={() => { setSrcChain(c.id); setShowChains(false); }}
                  className={"chip" + (srcChain === c.id ? " chip-on" : "")} style={{ cursor: "pointer", fontSize: 13, gap: 7 }}>
                  <ChainIcon name={c.label} size={16} /> {c.label}
                </button>
              ))}
            </div>
            {srcChain !== "base" && (
              <div className="tiny muted" style={{ padding: "8px 8px 4px", lineHeight: 1.4 }}>
                {L(lang, { id: "LI.FI otomatis jembatani USDC dari", en: "LI.FI will automatically bridge USDC from" })} {selectedChain?.label} → Base. {L(lang, { id: "Biaya jembatan ditampilkan sebelum konfirmasi.", en: "Bridge fee shown before you confirm." })}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        {state === "approve" ? <StatePill tone="load">{L(lang, { id: "Mengizinkan USDC…", en: "Approving USDC…" })}</StatePill>
          : state === "deposit" ? <StatePill tone="load">{srcChain !== "base" ? L(lang, { id: "Menjembatani & menanam…", en: "Bridging & planting…" }) : L(lang, { id: "Menanam…", en: "Planting…" })}</StatePill>
          : (
            <>
              <button className="btn btn-primary btn-block btn-lg" disabled={amt < 1 || state === "approve" || state === "deposit"} onClick={async () => {
                setErr("");
                setState("approve");
                try {
                  setState("deposit");
                  await wallet.deposit(amt);
                  setState("ok");
                } catch (e) {
                  setErr(e.message || "Deposit failed");
                  setState("idle");
                }
              }}>
                <Icon.sprout size={19} stroke="#F4FBF6" />
                {srcChain !== "base"
                  ? L(lang, { id: "Jembatani & Setor", en: "Bridge & Deposit" })
                  : L(lang, { id: "Setor & Mulai", en: "Deposit & Start" })}
              </button>
              <div className="muted tiny center" style={{ marginTop: 12 }}>{L(lang, { id: "Modalmu tetap milikmu. Hanya bunga yang ikut diundi.", en: "Your principal stays yours. Only the yield enters the draw." })}</div>
              {err && <div className="tiny" style={{ color: "var(--danger)", marginTop: 6, textAlign: "center" }}>{err}</div>}
            </>
          )}
      </div>
    </OBShell>
  );
}

export { ScreenOB1, ScreenOB2, ScreenOB3, ScreenOB4, ScreenOB5, useFlow, StatePill, OBShell };
