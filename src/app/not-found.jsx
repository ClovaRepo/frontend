import Link from "next/link";

const LEAVES = [0, 90, 180, 270];

function CloverMark({ size = 84 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" style={{ display: "block", margin: "0 auto" }}>
      <g fill="var(--clover, #2FA56B)">
        {LEAVES.map((a) => (
          <g key={a} transform={`rotate(${a} 32 32)`}>
            <path d="M32 32 C30 20 18 18 18 26 C18 33 26 33 32 32 Z" />
            <path d="M32 32 C34 20 46 18 46 26 C46 33 38 33 32 32 Z" />
          </g>
        ))}
      </g>
      <circle cx="32" cy="32" r="3" fill="var(--clover-deep, #248355)" />
    </svg>
  );
}

export default function NotFound() {
  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
      <div style={{ maxWidth: 420 }}>
        <CloverMark />
        <h1 className="head" style={{ fontSize: 30, margin: "18px 0 8px" }}>Page not found</h1>
        <p style={{ color: "var(--ink-60)", fontSize: 15, lineHeight: 1.55, marginBottom: 24 }}>
          This page hasn't grown in our garden yet. Let's head back home.
        </p>
        <Link href="/" className="btn btn-primary btn-lg">Back to home</Link>
      </div>
    </main>
  );
}
