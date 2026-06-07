import React, { useState, useEffect, useRef, useCallback, useMemo, useId, createContext, useContext } from 'react';

/* ============================================================
   CLOVA, shared primitives, motifs, icons, hooks
   Exposes everything on window for the screen files.
   ============================================================ */

/* ---------- bilingual helper ----------
   L(lang, {id:"...", en:"..."}) -> string for current language    */
function L(lang, pair) {
  if (pair == null) return "";
  if (typeof pair === "string") return pair;
  return pair[lang] != null ? pair[lang] : (pair.id || "");
}

/* ---------- number formatting (follows the active UI language) ----------
   The app keeps <html lang> in sync with the language toggle, so number
   output matches: en → 1,284.00 · id → 1.284,00 */
function currentLocale() {
  if (typeof document !== "undefined" && document.documentElement.lang === "id") return "id-ID";
  return "en-US";
}
function fmt(n, dec = 2) {
  return Number(n).toLocaleString(currentLocale(), { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
/* Re-localize an Indonesian-formatted numeric literal ("1.284,50", "12,5%",
   "$1,2B") to the active language by swapping separators. Use on number-only
   strings, never on prose. */
function nfmt(lang, s) {
  return lang === "en" ? String(s).replace(/[.,]/g, (m) => (m === "." ? "," : ".")) : s;
}

/* Map a USDC balance to a plant growth level (0..1) on a log curve, so the
   plant's size reflects the user's principal: ~100 -> 0.6, ~1k -> 0.8,
   5k+ -> nearly full, while tiny balances stay a small sprout. */
function growFromUsdc(usdc) {
  const v = Math.max(0, Number(usdc) || 0);
  const ratio = Math.log10(1 + v) / Math.log10(1 + 5000);
  return Math.max(0.12, Math.min(0.96, 0.2 + 0.75 * ratio));
}

/* ---------- count-up hook ---------- */
function useCountUp(target, { duration = 1100, dec = 2, start = true } = {}) {
  const [val, setVal] = useState(0);
  const raf = useRef();
  useEffect(() => {
    if (!start) return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setVal(target); return; }
    let t0, finished = false;
    const ease = (x) => 1 - Math.pow(1 - x, 3);
    const tick = (t) => {
      if (!t0) t0 = t;
      const p = Math.min(1, (t - t0) / duration);
      setVal(target * ease(p));
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else finished = true;
    };
    raf.current = requestAnimationFrame(tick);
    // failsafe: rAF doesn't run while the tab is hidden; timers do. Snap to final.
    const fs = setTimeout(() => { if (!finished) setVal(target); }, duration + 500);
    return () => { cancelAnimationFrame(raf.current); clearTimeout(fs); };
  }, [target, duration, start]);
  return fmt(val, dec);
}

function CountUp({ value, dec = 2, prefix = "", suffix = "", start = true, className = "" }) {
  const v = useCountUp(value, { dec, start });
  return <span className={"tnum " + className}>{prefix}{v}{suffix}</span>;
}

/* ============================================================
   MOTIFS
   ============================================================ */

/* Four-leaf clover (the brand mark glyph). size in px. */
function Clover({ size = 40, color = "var(--clover)", stem = true, breathe = false, spin = false, style }) {
  const anim = spin ? "spinClover 3.4s linear infinite"
            : breathe ? "breathe 3.2s var(--ease-soft) infinite" : "none";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none"
         style={{ display: "block", animation: anim, transformOrigin: "32px 30px", ...style }}>
      {stem && <path d="M32 36 C32 46 30 52 26 58" stroke={color} strokeWidth="3"
                     strokeLinecap="round" opacity=".85" fill="none" />}
      {/* four heart-ish leaves around center */}
      {[0, 90, 180, 270].map((a) => (
        <g key={a} transform={`rotate(${a} 32 30)`}>
          <path d="M32 30 C30 18 18 16 18 24 C18 31 26 31 32 30 Z"
                fill={color} opacity={a % 180 === 0 ? 1 : .92}
                transform="translate(0 -1)" />
          <path d="M32 30 C34 18 46 16 46 24 C46 31 38 31 32 30 Z"
                fill={color} opacity={a % 180 === 0 ? .82 : .74} />
        </g>
      ))}
      <circle cx="32" cy="30" r="3" fill="color-mix(in srgb, var(--forest) 55%, transparent)" />
    </svg>
  );
}

/* Wordmark: Clova with clover as the "o" */
function Wordmark({ size = 30, light = false }) {
  const c1 = light ? "#F4FBF6" : "var(--forest)";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: size * 0.04,
                   fontFamily: "var(--font-mark)", fontWeight: 700,
                   fontSize: size, color: c1, letterSpacing: "-.01em", lineHeight: 1 }}>
      Cl
      <Clover size={size * 0.92} color={light ? "#6BCB95" : "var(--clover)"} stem={false}
              style={{ margin: `0 ${-size * 0.02}px` }} />
      va
    </span>
  );
}

/* A single leaf shape (used for falling + decoration) */
function LeafShape({ size = 22, color = "var(--clover)", style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <path d="M21 3C10 3 3 9 3 19c0 1 1 2 2 2 10 0 18-7 18-18 0 0 0 0-2 0Z" fill={color} />
      <path d="M6 18C9 13 13 9 19 6" stroke="color-mix(in srgb, var(--forest) 30%, transparent)"
            strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/* Falling leaves + clovers background. density 0..1. */
function LeafFall({ density = 1, golden = false, zIndex = 0 }) {
  const reduce = typeof window !== "undefined" &&
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const count = reduce ? 0 : Math.round(16 * density);
  const items = React.useMemo(() => {
    const palette = golden
      ? ["var(--clover)", "var(--leaf)", "var(--gold)", "var(--leaf)"]
      : ["var(--clover)", "var(--leaf)", "var(--clover-deep)", "var(--gold)"];
    return Array.from({ length: count }, (_, i) => {
      const isClover = i % 5 === 0;
      const size = 12 + Math.random() * 22;
      const dur = 9 + Math.random() * 12;
      return {
        i, isClover, size,
        left: Math.random() * 100,
        delay: -Math.random() * dur,
        dur,
        drift: (Math.random() * 80 - 40) + "px",
        rot0: Math.floor(Math.random() * 360) + "deg",
        rot1: Math.floor(360 + Math.random() * 540) + "deg",
        maxop: 0.5 + Math.random() * 0.4,
        color: i === 4 || (golden && i % 6 === 0) ? "var(--gold)" : palette[i % palette.length],
      };
    });
  }, [count, golden]);

  return (
    <div className="leaf-layer" aria-hidden="true" style={{
      position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex }}>
      {items.map((it) => (
        <div key={it.i} style={{
          position: "absolute", top: 0, left: it.left + "%",
          "--drift": it.drift, "--rot0": it.rot0, "--rot1": it.rot1, "--maxop": it.maxop,
          animation: `fall ${it.dur}s linear ${it.delay}s infinite`,
          willChange: "transform, opacity",
        }}>
          {it.isClover
            ? <Clover size={it.size} color={it.color} stem={false} />
            : <LeafShape size={it.size} color={it.color} />}
        </div>
      ))}
    </div>
  );
}

/* Soft corner clover watermark */
function CloverWatermark({ corner = "br", size = 180, opacity = 0.05 }) {
  const pos = {
    br: { right: -size * 0.28, bottom: -size * 0.28 },
    tr: { right: -size * 0.28, top: -size * 0.28 },
    tl: { left: -size * 0.28, top: -size * 0.28 },
    bl: { left: -size * 0.28, bottom: -size * 0.28 },
  }[corner];
  return (
    <div aria-hidden="true" style={{ position: "absolute", pointerEvents: "none", opacity, ...pos }}>
      <Clover size={size} color="var(--clover)" stem={false} />
    </div>
  );
}

/* ============================================================
   ICONS, rounded outline, consistent 24 grid
   ============================================================ */
function Ic({ d, size = 22, stroke = "currentColor", sw = 1.9, fill = "none", children, vb = 24, ...rest }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} fill={fill} stroke={stroke}
         strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      {d ? <path d={d} /> : children}
    </svg>
  );
}
const Icon = {
  leaf:   (p) => <Ic {...p} d="M20 4C9 4 4 10 4 18c8 0 16-5 16-14ZM4 18C8 13 13 8 18 6" />,
  sprout: (p) => <Ic {...p}><path d="M12 20v-7" /><path d="M12 13c0-3-2-5-6-5 0 4 3 5 6 5Z" /><path d="M12 11c0-3 2-5 6-5 0 4-3 5-6 5Z" /></Ic>,
  seed:   (p) => <Ic {...p}><path d="M12 3c4 3 6 7 6 11a6 6 0 0 1-12 0c0-4 2-8 6-11Z" /></Ic>,
  drop:   (p) => <Ic {...p} d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11Z" />,
  sun:    (p) => <Ic {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" /></Ic>,
  shield: (p) => <Ic {...p}><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z" /><path d="M9.5 12l2 2 3.5-4" /></Ic>,
  shieldLeaf: (p) => <Ic {...p}><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z" /><path d="M15 9c-4 0-6 2-6 5 3 0 6-2 6-5Z" /></Ic>,
  lock:   (p) => <Ic {...p}><rect x="5" y="11" width="14" height="9" rx="2.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Ic>,
  bell:   (p) => <Ic {...p}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 19a2 2 0 0 0 4 0" /></Ic>,
  check:  (p) => <Ic {...p} d="M5 12.5l4.5 4.5L19 7" />,
  x:      (p) => <Ic {...p} d="M6 6l12 12M18 6L6 18" />,
  arrow:  (p) => <Ic {...p} d="M5 12h14M13 6l6 6-6 6" />,
  back:   (p) => <Ic {...p} d="M19 12H5M11 6l-6 6 6 6" />,
  copy:   (p) => <Ic {...p}><rect x="9" y="9" width="11" height="11" rx="2.5" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></Ic>,
  plus:   (p) => <Ic {...p} d="M12 5v14M5 12h14" />,
  info:   (p) => <Ic {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></Ic>,
  chevron:(p) => <Ic {...p} d="M9 6l6 6-6 6" />,
  chevDown:(p)=> <Ic {...p} d="M6 9l6 6 6-6" />,
  robot:  (p) => <Ic {...p}><rect x="5" y="8" width="14" height="11" rx="4" /><path d="M9 13h.01M15 13h.01" /><path d="M12 8V5M9 19v2M15 19v2" /><path d="M12 3c2 0 3 2 1 4" /></Ic>,
  trophy: (p) => <Ic {...p}><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" /><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" /><path d="M12 13v4M9 21h6M10 17h4" /></Ic>,
  coin:   (p) => <Ic {...p}><circle cx="12" cy="12" r="8" /><path d="M12 8v8M9.5 10c0-1.2 1.1-2 2.5-2s2.5.8 2.5 2-1.1 2-2.5 2-2.5.8-2.5 2 1.1 2 2.5 2 2.5-.8 2.5-2" /></Ic>,
  wallet: (p) => <Ic {...p}><rect x="3" y="6" width="18" height="13" rx="3" /><path d="M3 10h18M16 14h2" /></Ic>,
  home:   (p) => <Ic {...p}><path d="M4 11l8-7 8 7" /><path d="M6 10v9h12v-9" /></Ic>,
  pool:   (p) => <Ic {...p}><path d="M3 16c2 0 2-2 4.5-2s2.5 2 4.5 2 2-2 4.5-2 2.5 2 4.5 2" /><path d="M3 20c2 0 2-2 4.5-2s2.5 2 4.5 2 2-2 4.5-2 2.5 2 4.5 2" /><circle cx="12" cy="7" r="3" /></Ic>,
  scroll: (p) => <Ic {...p}><path d="M6 4h11a1 1 0 0 1 1 1v13a2 2 0 0 0 2 2H8a2 2 0 0 1-2-2V4Z" /><path d="M6 4a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2M10 9h5M10 13h5" /></Ic>,
  gear:   (p) => <Ic {...p}><circle cx="12" cy="12" r="3" /><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8L6 18M18 6l1.8-1.8" /></Ic>,
  history:(p) => <Ic {...p}><path d="M3 12a9 9 0 1 0 3-6.7M3 4v4h4" /><path d="M12 8v4l3 2" /></Ic>,
  globe:  (p) => <Ic {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></Ic>,
  spark:  (p) => <Ic {...p}><path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z" /></Ic>,
};

/* Activity / notification icon, maps a log category to a real SVG icon
   inside a tinted circular badge (replaces the old emoji glyphs). */
const ACT_ICON = { ai: "robot", yield: "drop", draw: "trophy", deposit: "sprout" };
function ActivityIcon({ cat, win = false, safe = false, size = 34 }) {
  let key = ACT_ICON[cat] || "spark";
  if (cat === "ai" && safe) key = "shieldLeaf";
  const I = Icon[key] || Icon.spark;
  const gold = win || (cat === "draw" && win);
  const fg = gold ? "var(--gold-deep)" : "var(--clover-deep)";
  const bg = gold ? "color-mix(in srgb,var(--gold) 18%, var(--canvas-2))" : "var(--sage)";
  return (
    <span style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "grid", placeItems: "center", flex: "0 0 auto",
      boxShadow: gold ? "inset 0 0 0 1.5px color-mix(in srgb,var(--gold) 30%, transparent)" : "inset 0 0 0 1.5px color-mix(in srgb,var(--clover) 16%, transparent)" }}>
      <I size={size * 0.52} stroke={fg} />
    </span>
  );
}

/* Gardener AI avatar, robot with a leaf sprout */
function Gardener({ size = 44, ring = true }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%",
      background: ring ? "radial-gradient(circle at 35% 28%, var(--sage), var(--sage-2))" : "transparent",
      display: "grid", placeItems: "center", flex: "0 0 auto",
      boxShadow: ring ? "inset 0 0 0 1.5px color-mix(in srgb,var(--clover) 22%, transparent)" : "none" }}>
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none">
        <path d="M12 6c2 0 3.4-1.8 1.6-4C11.4 4 11 5 12 6Z" fill="var(--leaf)" />
        <rect x="5" y="7.5" width="14" height="10.5" rx="4.2" fill="var(--clover)" />
        <circle cx="9.4" cy="12.6" r="1.5" fill="#F4FBF6" />
        <circle cx="14.6" cy="12.6" r="1.5" fill="#F4FBF6" />
        <path d="M10 15.6c1.2.8 2.8.8 4 0" stroke="#F4FBF6" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M5 12.5H3.6M19 12.5h1.4" stroke="var(--clover)" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/* ============================================================
   VINE STEPPER, onboarding progress (5 leaf nodes on a vine)
   ============================================================ */
function VineStepper({ step = 1, total = 5, labels = [] }) {
  return (
    <div style={{ padding: "4px 4px 2px" }}>
      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {/* vine line */}
        <svg style={{ position: "absolute", left: 14, right: 14, top: "50%", width: "calc(100% - 28px)", transform: "translateY(-50%)", height: 14 }}
             viewBox="0 0 300 14" preserveAspectRatio="none">
          <path d="M0 7 Q 75 0 150 7 T 300 7" fill="none"
                stroke="color-mix(in srgb,var(--clover) 22%, transparent)" strokeWidth="2.5" strokeDasharray="1 5" strokeLinecap="round" />
          <path d="M0 7 Q 75 0 150 7 T 300 7" fill="none" stroke="var(--clover)" strokeWidth="2.6"
                strokeLinecap="round" pathLength="100"
                strokeDasharray="100" strokeDashoffset={100 - ((step - 1) / (total - 1)) * 100}
                style={{ transition: "stroke-dashoffset .6s var(--ease-soft)" }} />
        </svg>
        {Array.from({ length: total }, (_, i) => {
          const n = i + 1;
          const done = n < step, active = n === step;
          return (
            <div key={n} style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 56 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", display: "grid", placeItems: "center",
                background: (active || done) ? "var(--clover)" : "var(--canvas-2)",
                boxShadow: active ? "0 0 0 5px color-mix(in srgb,var(--clover) 16%, transparent)" : (done ? "none" : "inset 0 0 0 2px color-mix(in srgb,var(--clover) 30%, transparent)"),
                transition: "all .4s var(--ease-back)" }}>
                {done
                  ? <Icon.check size={16} stroke="#F4FBF6" sw={2.4} />
                  : <Clover size={18} color={active ? "#F4FBF6" : "color-mix(in srgb,var(--clover) 45%, transparent)"} stem={false} />}
              </div>
              {labels[i] && <span style={{ fontSize: 9.5, fontWeight: 700, textAlign: "center", lineHeight: 1.1,
                color: active ? "var(--forest)" : "var(--ink-45)", maxWidth: 56 }}>{labels[i]}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   COUNTDOWN, organic sun-arc
   ============================================================ */
function CountdownArc({ pct = 0.62, label, sub, size = 150, gold = false }) {
  const r = 62, c = Math.PI * r; // half circle
  const col = gold ? "var(--gold)" : "var(--clover)";
  // place a handle exactly at the tip of the filled arc (no stray dot on the line)
  const ang = Math.PI * (1 - pct);
  const dotX = 75 + 62 * Math.cos(ang);
  const dotY = 88 - 62 * Math.sin(ang);
  return (
    <div style={{ position: "relative", width: size, height: size * 0.62, margin: "0 auto" }}>
      <svg width={size} height={size * 0.62} viewBox="0 0 150 95">
        <path d="M13 88 A 62 62 0 0 1 137 88" fill="none"
              stroke="color-mix(in srgb,var(--forest) 10%, transparent)" strokeWidth="10" strokeLinecap="round" />
        <path d="M13 88 A 62 62 0 0 1 137 88" fill="none" stroke={col} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
              style={{ transition: "stroke-dashoffset 1s var(--ease-soft)" }} />
        {/* progress handle sitting on the tip */}
        <circle cx={dotX} cy={dotY} r="7.5" fill="var(--canvas-2)" stroke={col} strokeWidth="3.5"
                style={{ transition: "all 1s var(--ease-soft)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, top: "42%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div className="head tnum" style={{ fontSize: 24, color: gold ? "var(--gold-deep)" : "var(--forest)" }}>{label}</div>
        {sub && <div className="muted" style={{ fontSize: 11.5, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ============================================================
   GROWING PLANT, height scales with amount (0..1).
   On mount it animates from a sprout up to `grow` (the existing
   CSS transitions tween the stem + leaves), then sways gently so
   it feels alive. It settles at a height that reflects the value,
   it doesn't grow forever, but re-grows whenever `grow` increases.
   ============================================================ */
function Plant({ grow = 0.5, size = 120, potColor = "var(--sage-2)", animate = true }) {
  const [g, setG] = useState(animate ? 0.1 : grow);
  useEffect(() => {
    if (!animate) { setG(grow); return; }
    const reduce = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setG(grow); return; }
    const id = setTimeout(() => setG(grow), 140); // mount as a sprout, then grow up
    return () => clearTimeout(id);
  }, [grow, animate]);
  const h = 0.25 + g * 0.75; // stem growth fraction
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      {/* pot (stays planted) */}
      <path d="M38 96 L82 96 L77 116 L43 116 Z" fill={potColor} />
      <rect x="34" y="88" width="52" height="11" rx="5" fill="color-mix(in srgb,var(--forest) 12%, var(--sage-2))" />
      {/* everything above the soil sways gently as one */}
      <g className="plant-sway" style={{ transformOrigin: "60px 92px" }}>
        {/* stem */}
        <path d={`M60 90 C60 ${90 - 40 * h} 60 ${90 - 50 * h} 60 ${90 - 56 * h}`}
              stroke="var(--clover)" strokeWidth="4" strokeLinecap="round"
              style={{ transition: "all .9s var(--ease-soft)" }} />
        {/* leaves */}
        <g style={{ transition: "all .9s var(--ease-soft)", transformOrigin: "60px 90px" }}>
          <path d={`M60 ${88 - 30 * h} C44 ${84 - 30 * h} 40 ${72 - 30 * h} 50 ${70 - 30 * h} C58 ${69 - 30 * h} 60 ${80 - 30 * h} 60 ${88 - 30 * h}Z`} fill="var(--leaf)" />
          <path d={`M60 ${82 - 38 * h} C76 ${78 - 38 * h} 80 ${66 - 38 * h} 70 ${64 - 38 * h} C62 ${63 - 38 * h} 60 ${74 - 38 * h} 60 ${82 - 38 * h}Z`} fill="var(--clover)" />
        </g>
        {/* crown clover once grown, pure SVG, four petals around the stem tip */}
        {g > 0.55 && (
          <g style={{ transformOrigin: `60px ${90 - 56 * h}px`, animation: "bloomPop .6s var(--ease-back)" }}>
            {[0, 90, 180, 270].map((a) => (
              <ellipse key={a} cx="60" cy={90 - 56 * h - 7} rx="5" ry="7" fill="var(--clover)"
                       transform={`rotate(${a} 60 ${90 - 56 * h})`} opacity={a % 180 === 0 ? 1 : 0.85} />
            ))}
            <circle cx="60" cy={90 - 56 * h} r="2.4" fill="color-mix(in srgb, var(--forest) 50%, transparent)" />
          </g>
        )}
      </g>
    </svg>
  );
}

/* ============================================================
   PIXEL TREE, botanical pixel-art that grows by `stage` (1..4).
   Same 11×13 grid for every stage so they sit on a shared ground
   line; the canopy fills more rows as the stage rises, reading as
   sprout → sapling → young tree → lush fruiting tree.
   ============================================================ */
const PIXEL_TREE_STAGES = [
  // stage 1, seedling
  [
    "...........", "...........", "...........", "...........",
    "...........", "...........", "...........", "....l.l....",
    "....lll....", ".....t.....", ".....t.....", "....ggg....",
    "ggggggggggg",
  ],
  // stage 2, sapling
  [
    "...........", "...........", "...........", "...........",
    ".....l.....", "....lll....", "...lldll...", "....lll....",
    ".....t.....", ".....t.....", ".....t.....", "....ggg....",
    "ggggggggggg",
  ],
  // stage 3, young tree
  [
    ".....l.....", "....lll....", "...lllll...", "..llldlll..",
    "..lllllll..", "...lldll...", "....lll....", ".....t.....",
    ".....t.....", "....ttt....", ".....t.....", "...ggggg...",
    "ggggggggggg",
  ],
  // stage 4, lush, fruiting tree
  [
    "...lllll...", "..lllllll..", ".lllodllll.", "olllldllllo",
    ".lldllolll.", "..llllldd..", "...lllll...", "....ttt....",
    "....ttt....", "...ttttt...", "....ttt....", "..ggggggg..",
    "ggggggggggg",
  ],
];
const PIXEL_TREE_COLORS = {
  l: "var(--leaf)",
  d: "var(--clover)",
  o: "var(--gold)",
  t: "#9C6B43",
  g: "color-mix(in srgb, #B79366 70%, var(--sage))",
};
function PixelTree({ stage = 1, cell = 7, sway = true, animate = true, rowStep = 0.05, style }) {
  const grid = PIXEL_TREE_STAGES[Math.max(0, Math.min(3, stage - 1))];
  const cols = grid[0].length, rows = grid.length;
  const w = cols * cell, h = rows * cell, gap = Math.max(0.4, cell * 0.08);
  const ref = useRef(null);
  const [grown, setGrown] = useState(!animate);
  const [idle, setIdle] = useState(!animate);

  // grow once the tree scrolls into view (roots-up, see CSS row stagger)
  useEffect(() => {
    if (!animate || grown) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setGrown(true); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setGrown(true); io.disconnect(); }
    }, { threshold: 0.35, rootMargin: "0px 0px -8% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [animate, grown]);

  // after the grow finishes, switch the leaves into a living idle shimmer
  useEffect(() => {
    if (!grown || idle) return;
    const ms = ((rows - 1) * rowStep + 0.6) * 1000;
    const id = setTimeout(() => setIdle(true), ms);
    return () => clearTimeout(id);
  }, [grown, idle, rows, rowStep]);

  const rects = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const ch = grid[y][x];
      const fill = PIXEL_TREE_COLORS[ch];
      if (!fill) continue;
      const isLeaf = ch === "l" || ch === "d" || ch === "o";
      // bottom rows first (roots → crown), with a touch of per-column jitter
      const d = (rows - 1 - y) * rowStep + ((x * 7) % 5) * 0.012;
      const tw = (((x * 7 + y * 5) % 11) / 11) * 2.6;
      rects.push(
        <rect key={`${x}-${y}`} className={isLeaf ? "pt-px leaf" : "pt-px"}
          x={x * cell + gap / 2} y={y * cell + gap / 2}
          width={cell - gap} height={cell - gap} rx={cell * 0.16} fill={fill}
          style={{ "--d": d + "s", "--t": tw + "s" }} />
      );
    }
  }
  return (
    <svg ref={ref} width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" aria-hidden="true"
      style={{ display: "block", ...style }}>
      <g className={sway ? "pixeltree-sway" : undefined} style={{ transformOrigin: `${w / 2}px ${h}px` }}>
        <g className={"pixeltree" + (grown ? " grown" : "") + (idle ? " idle" : "")}>
          {rects}
        </g>
      </g>
    </svg>
  );
}

/* ============================================================
   CONFETTI, leaf + gold burst (fires once)
   ============================================================ */
function Confetti({ go = true, count = 42, gold = true }) {
  const pieces = React.useMemo(() => Array.from({ length: count }, (_, i) => ({
    i, left: Math.random() * 100,
    delay: Math.random() * 0.5,
    dur: 1.6 + Math.random() * 1.6,
    cx: (Math.random() * 200 - 100) + "px",
    cr: (Math.random() * 720) + "deg",
    size: 8 + Math.random() * 12,
    gold: gold && i % 3 === 0,
  })), [count, gold]);
  if (!go) return null;
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 40 }}>
      {pieces.map((p) => (
        <div key={p.i} style={{ position: "absolute", top: "26%", left: p.left + "%",
          "--cx": p.cx, "--cr": p.cr,
          animation: `confettiFall ${p.dur}s var(--ease-soft) ${p.delay}s forwards` }}>
          {p.gold
            ? <LeafShape size={p.size} color="var(--gold)" />
            : <LeafShape size={p.size} color={p.i % 2 ? "var(--leaf)" : "var(--clover)"} />}
        </div>
      ))}
    </div>
  );
}

/* ---------- smooth, responsive area chart ----------
   Measures its own width (1:1 pixel coords) so the stroke never distorts,
   draws a Catmull-Rom smoothed curve with soft gridlines + an end marker. */
function AreaChart({ data = [], h = 96, color = "var(--clover)", animate = true, pad = 12, grid = true }) {
  const wrapRef = useRef(null);
  const [w, setW] = useState(0);
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setW(el.clientWidth || 0);
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = max - min || 1;
  const innerH = Math.max(1, h - pad * 2);
  const pts = w > 0 && data.length > 1
    ? data.map((d, i) => [(i / (data.length - 1)) * w, pad + (1 - (d - min) / span) * innerH])
    : [];

  let linePath = "";
  if (pts.length >= 2) {
    linePath = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      linePath += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
  }
  const areaPath = linePath ? `${linePath} L ${w.toFixed(1)} ${h} L 0 ${h} Z` : "";
  const last = pts.length ? pts[pts.length - 1] : null;

  return (
    <div ref={wrapRef} style={{ width: "100%", height: h }}>
      {w > 0 && (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", overflow: "visible" }}>
          <defs>
            <linearGradient id={`ac${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity=".24" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {grid && [0.25, 0.5, 0.75].map((g) => (
            <line key={g} x1="0" x2={w} y1={(pad + innerH * g).toFixed(1)} y2={(pad + innerH * g).toFixed(1)}
              stroke="var(--hairline)" strokeWidth="1" strokeDasharray="2 6" />
          ))}
          {areaPath && <path d={areaPath} fill={`url(#ac${id})`} />}
          {linePath && (
            <path d={linePath} fill="none" stroke={color} strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" pathLength="100" strokeDasharray="100"
              style={animate ? { animation: "growVine 1.4s var(--ease-soft) forwards", "--len": 100 } : undefined} />
          )}
          {last && (
            <>
              <circle cx={last[0].toFixed(1)} cy={last[1].toFixed(1)} r="6" fill={color} opacity=".16" />
              <circle cx={last[0].toFixed(1)} cy={last[1].toFixed(1)} r="3.3" fill={color} stroke="var(--canvas-2)" strokeWidth="1.8" />
            </>
          )}
        </svg>
      )}
    </div>
  );
}

/* ---------- collapsible (FAQ / detail) ---------- */
function Collapse({ q, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderRadius: 14, background: "color-mix(in srgb,var(--forest) 4%, transparent)", overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", background: "none", border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
        padding: "13px 15px", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14.5, color: "var(--forest)", textAlign: "left" }}>
        {q}
        <span style={{ transition: "transform .3s", transform: open ? "rotate(180deg)" : "none", flex: "0 0 auto" }}>
          <Icon.chevDown size={18} stroke="var(--clover)" />
        </span>
      </button>
      {open && <div className="muted reveal" style={{ padding: "0 15px 14px", fontSize: 13.5, lineHeight: 1.55, animationDuration: ".4s" }}>{children}</div>}
    </div>
  );
}

/* ---------- reveal-on-mount wrapper with stagger ---------- */
function Reveal({ delay = 0, children, style, className = "", as: Tag = "div", ...rest }) {
  return (
    <Tag className={"reveal " + className} style={{ animationDelay: delay + "ms", ...style }} {...rest}>
      {children}
    </Tag>
  );
}

/* ---------- top bar with back ---------- */
function TopBar({ onBack, title, right, transparent }) {
  return (
    <div className="row between aic" style={{ padding: "16px 18px 8px", position: "sticky", top: 0, zIndex: 20,
      background: transparent ? "transparent" : "linear-gradient(var(--canvas), color-mix(in srgb,var(--canvas) 88%, transparent))",
      backdropFilter: "blur(6px)" }}>
      <div className="row aic gap-10">
        {onBack && (
          <button onClick={onBack} aria-label="back" style={{ width: 40, height: 40, borderRadius: "50%", border: "none",
            background: "var(--canvas-2)", boxShadow: "var(--shadow-card)", display: "grid", placeItems: "center", cursor: "pointer", flex: "0 0 auto" }}>
            <Icon.back size={20} stroke="var(--forest)" />
          </button>
        )}
        {title && <div className="head" style={{ fontSize: 20 }}>{title}</div>}
      </div>
      {right}
    </div>
  );
}

/* ---------- toast ---------- */
function Toast({ show, children, tone = "safe" }) {
  if (!show) return null;
  const bg = tone === "win" ? "var(--gold)" : tone === "danger" ? "var(--danger)" : "var(--clover)";
  return (
    <div className="reveal" style={{ position: "absolute", bottom: 92, left: 16, right: 16, zIndex: 60,
      background: bg, color: "#fff", borderRadius: 16, padding: "13px 16px", fontWeight: 600, fontSize: 14,
      boxShadow: "var(--shadow-lift)", display: "flex", alignItems: "center", gap: 10 }}>
      {children}
    </div>
  );
}

/* ==================== exports ==================== */

export { L, fmt, nfmt, growFromUsdc, useCountUp, CountUp, Clover, Wordmark, LeafShape, LeafFall, CloverWatermark, Ic, Icon, ActivityIcon, Gardener, VineStepper, CountdownArc, Plant, PixelTree, Confetti, AreaChart, Collapse, Reveal, TopBar, Toast };
