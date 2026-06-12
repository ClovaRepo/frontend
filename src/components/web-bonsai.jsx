import React, { useRef, useState, useEffect, useMemo } from "react";
import { L, Icon } from "./shared.jsx";

/* ============================================================
   SAFETY BONSAI, an annotated pixel-art bonsai. Each safety
   guarantee is a callout wired by a thin connector to a branch
   of the tree. The whole scene grows from the roots up on
   scroll, lines draw themselves in, then the foliage breathes.
   Coordinate space is a fixed 1000×560 viewBox; the HTML
   callouts are positioned from the same coords so connectors
   and boxes always line up.
   ============================================================ */

const VB_W = 1000, VB_H = 560, CELL = 13;

const LEAF = ["#7FB069", "#5E9A52", "#43773B", "#9CC97F", "#356A2F", "#6F8F4E"];
const LEAF_DARK = ["#2C4A23", "#37402B"];
const LEAF_LIGHT = "#BBD89A";
const WEATHER = ["#9AA08F", "#B4B7A8"];
const BARK = ["#7A5B3A", "#6B4E32", "#5A4129", "#8A6A45", "#4A3623"];
const BARK_GREY = ["#9A8F80", "#6F6557"];

// deterministic pseudo-random so SSR / re-renders are stable
const hash = (x, y) => {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const pick = (arr, h) => arr[Math.floor(h * arr.length) % arr.length];

// foliage pads (ellipses), top-left heavy, cascading down-right
const PADS = [
  { cx: 250, cy: 165, rx: 185, ry: 82 },
  { cx: 375, cy: 120, rx: 95, ry: 52 },
  { cx: 470, cy: 250, rx: 150, ry: 70 },
  { cx: 575, cy: 320, rx: 120, ry: 60 },
];

// trunk + branches as thick tapering segments [x0,y0,x1,y1,w0,w1]
const SEGS = [
  // trunk now runs all the way to the very bottom of the canvas
  [430, 560, 434, 528, 19, 17],
  [434, 528, 446, 488, 17, 15],
  [446, 488, 420, 442, 15, 14],
  [420, 442, 452, 402, 14, 12],
  [452, 402, 472, 362, 12, 11],
  [472, 362, 442, 322, 11, 9],
  // branch → top-left canopy
  [452, 360, 384, 300, 8, 6],
  [384, 300, 300, 240, 6, 5],
  [300, 240, 250, 192, 5, 4],
  // branch → mid pad
  [472, 360, 482, 308, 7, 5],
  [482, 308, 470, 282, 5, 4],
  // branch → lower-right pad
  [480, 402, 542, 372, 7, 5],
  [542, 372, 575, 338, 5, 4],
  // roots: splay out and bend along the ground, then dip toward the bottom edge
  [430, 540, 374, 552, 9, 5],
  [374, 552, 322, 558, 5, 3],
  [438, 540, 500, 552, 9, 5],
  [500, 552, 556, 558, 5, 3],
  [433, 548, 436, 560, 7, 4],
];

function segDist(px, py, s) {
  const [x0, y0, x1, y1, w0, w1] = s;
  const dx = x1 - x0, dy = y1 - y0;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - x0) * dx + (py - y0) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = x0 + t * dx, cy = y0 + t * dy;
  const d = Math.hypot(px - cx, py - cy);
  return d - (w0 + (w1 - w0) * t); // <=0 → inside trunk
}

function useBonsaiPixels() {
  return useMemo(() => {
    const cols = Math.ceil(VB_W / CELL), rows = Math.ceil(VB_H / CELL);
    const px = [];
    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        const x = gx * CELL + CELL / 2, y = gy * CELL + CELL / 2;
        const h = hash(gx, gy);
        // trunk first (foreground at the base)
        let trunk = false;
        for (const s of SEGS) { if (segDist(x, y, s) <= 0) { trunk = true; break; } }
        if (trunk) {
          let fill = pick(BARK, h);
          if (h > 0.86) fill = pick(BARK_GREY, h);
          else if (h < 0.08) fill = "#2E2113";
          px.push({ x: gx * CELL, y: gy * CELL, fill, row: gy });
          continue;
        }
        // foliage, ragged ellipse edges via noise
        let inside = false;
        for (const p of PADS) {
          const e = ((x - p.cx) ** 2) / (p.rx * p.rx) + ((y - p.cy) ** 2) / (p.ry * p.ry);
          if (e <= 1 + (h - 0.5) * 0.4) { inside = true; break; }
        }
        if (!inside) continue;
        let fill, leaf = true;
        if (h < 0.12) fill = pick(LEAF_DARK, h);
        else if (h < 0.17) { fill = pick(WEATHER, h); leaf = false; }
        else if (h > 0.93) fill = LEAF_LIGHT;
        else fill = pick(LEAF, h);
        px.push({ x: gx * CELL, y: gy * CELL, fill, row: gy, leaf });
      }
    }
    const maxRow = rows;
    return { px, maxRow };
  }, []);
}

/* callouts: anchor on the tree → elbow path → label box on the right */
const CALLOUTS = [
  {
    n: "01", kick: { id: "Modal pokok", en: "Principal" },
    text: { id: "AI tak bisa menyentuh modal pokokmu.", en: "The AI cannot touch your principal." },
    anchor: [432, 150], path: [[432, 150], [672, 150], [700, 140]], labelY: 140,
  },
  {
    n: "02", kick: { id: "Daftar putih", en: "Whitelist" },
    text: { id: "AI tak bisa kirim dana ke luar daftar putih.", en: "The AI cannot send funds outside the whitelist." },
    anchor: [612, 250], path: [[612, 250], [672, 250], [700, 300]], labelY: 300,
  },
  {
    n: "03", kick: { id: "Cabut izin", en: "Revoke" },
    text: { id: "Kamu bisa cabut izin kapan saja, langsung.", en: "You can revoke permission anytime, instantly." },
    anchor: [662, 332], path: [[662, 332], [690, 332], [700, 452]], labelY: 452,
  },
];

const polyLen = (pts) => pts.reduce((a, p, i) => i ? a + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0, 0);
const toPath = (pts) => pts.map((p, i) => (i ? "L" : "M") + p[0] + " " + p[1]).join(" ");

export function SafetyBonsai({ lang }) {
  const { px, maxRow } = useBonsaiPixels();
  const ref = useRef(null);
  const [grown, setGrown] = useState(false);
  const [drawn, setDrawn] = useState(false);
  const [idle, setIdle] = useState(false);
  const rowStep = 0.022;

  useEffect(() => {
    const el = ref.current;
    const start = () => { setGrown(true); };
    if (!el || typeof IntersectionObserver === "undefined") { start(); }
    else {
      const io = new IntersectionObserver((es) => {
        if (es.some((e) => e.isIntersecting)) { start(); io.disconnect(); }
      }, { threshold: 0.25 });
      io.observe(el);
      return () => io.disconnect();
    }
  }, []);

  useEffect(() => {
    if (!grown) return;
    const growMs = (maxRow * rowStep + 0.45) * 1000;
    const t1 = setTimeout(() => { setDrawn(true); setIdle(true); }, growMs);
    return () => clearTimeout(t1);
  }, [grown, maxRow]);

  // faint blueprint grid
  const grid = [];
  for (let x = 0; x <= VB_W; x += 40) grid.push(<line key={"vx" + x} x1={x} y1={0} x2={x} y2={VB_H} />);
  for (let y = 0; y <= VB_H; y += 40) grid.push(<line key={"hy" + y} x1={0} y1={y} x2={VB_W} y2={y} />);

  return (
    <div ref={ref} className={"bonsai-scene" + (drawn ? " drawn" : "")}>
      <div className="bonsai-canvas">
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="bonsai-svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <g className="bonsai-grid">{grid}</g>
          <g className={"pixeltree" + (grown ? " grown" : "") + (idle ? " idle" : "")}>
            {px.map((p, i) => (
              <rect key={i} className={p.leaf ? "pt-px leaf" : "pt-px"} x={p.x} y={p.y} width={CELL - 1} height={CELL - 1} rx={2}
                fill={p.fill} style={{ "--d": ((maxRow - p.row) * rowStep).toFixed(3) + "s", "--t": ((hash(p.x, p.y)) * 2.6).toFixed(2) + "s" }} />
            ))}
          </g>
          {CALLOUTS.map((c, i) => {
            const len = Math.ceil(polyLen(c.path));
            const end = c.path[c.path.length - 1];
            return (
              <g key={i}>
                <path className="bonsai-line" d={toPath(c.path)} fill="none"
                  style={{ "--len": len, "--d": (0.15 + i * 0.18) + "s" }} />
                <rect className="bonsai-mark" x={c.anchor[0] - 5} y={c.anchor[1] - 5} width={10} height={10}
                  style={{ "--d": (i * 0.18) + "s" }} />
                <circle className="bonsai-mark" cx={end[0]} cy={end[1]} r={3.2} style={{ "--d": (0.5 + i * 0.18) + "s" }} />
              </g>
            );
          })}
        </svg>

        {/* HTML callout labels, positioned from the same viewBox coords */}
        {CALLOUTS.map((c, i) => (
          <div key={i} className="bonsai-co" style={{ left: (700 / VB_W * 100) + "%", top: (c.labelY / VB_H * 100) + "%", "--d": (0.55 + i * 0.18) + "s" }}>
            <div className="bonsai-co-kick">{c.n} · {L(lang, c.kick).toUpperCase()}</div>
            <div className="bonsai-co-text">{L(lang, c.text)}</div>
          </div>
        ))}
      </div>

      {/* stacked fallback for narrow widths */}
      <div className="bonsai-list">
        {CALLOUTS.map((c, i) => (
          <div key={i} className="bonsai-li">
            <span className="bonsai-li-n">{c.n}</span>
            <div>
              <div className="bonsai-co-kick">{L(lang, c.kick).toUpperCase()}</div>
              <div className="bonsai-co-text">{L(lang, c.text)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
