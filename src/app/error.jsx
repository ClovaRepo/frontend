"use client";
import Link from "next/link";

const LEAVES = [0, 90, 180, 270];

function CloverMark({ size = 80 }) {
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

export default function Error({ error, reset }) {
  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
      <div style={{ maxWidth: 440 }}>
        <CloverMark />
        <h1 className="head" style={{ fontSize: 28, margin: "18px 0 8px" }}>Something went wrong</h1>
        <p style={{ color: "var(--ink-60)", fontSize: 15, lineHeight: 1.55, marginBottom: 24 }}>
          Sorry, an unexpected error occurred. Your principal is safe, try reloading.
        </p>
        <div className="row gap-12" style={{ justifyContent: "center" }}>
          <button className="btn btn-primary btn-lg" onClick={() => reset()}>Try again</button>
          <Link href="/" className="btn btn-secondary btn-lg">Home</Link>
        </div>
      </div>
    </main>
  );
}
