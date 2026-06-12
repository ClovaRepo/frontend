"use client";

// Replaces the root layout when the layout itself throws, so it must render
// <html>/<body> and can't rely on the global stylesheet, inline styles only.
export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif", background: "#F4F1E8", color: "#143A2A" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
          <div style={{ maxWidth: 420 }}>
            <h1 style={{ fontSize: 26, marginBottom: 8 }}>Clova hit a snag</h1>
            <p style={{ color: "rgba(37,52,43,.7)", marginBottom: 20, lineHeight: 1.55 }}>
              An unexpected error occurred. Please reload the page.
            </p>
            <button
              onClick={() => reset()}
              style={{ background: "#2FA56B", color: "#F4FBF6", border: "none", borderRadius: 999, padding: "14px 26px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}
            >
              Reload
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
