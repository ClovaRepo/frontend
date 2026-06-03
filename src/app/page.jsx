"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// One app, one URL. The experience is chosen by viewport width:
//   phones (< 768px)      → the mobile phone-frame design
//   tablets/desktop (≥)   → the web sidebar/landing design
// It switches live when the window crosses the breakpoint, and only the
// chosen experience's chunk is downloaded (client-only, no SSR).
const MobileApp = dynamic(() => import("../components/mobile-app.jsx"), { ssr: false });
const WebApp = dynamic(() => import("../components/web-root.jsx"), { ssr: false });

const MOBILE_QUERY = "(max-width: 767px)";

export default function Page() {
  const [isMobile, setIsMobile] = useState(null);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Until we've measured the viewport, paint the bare garden canvas (no flash).
  if (isMobile === null) {
    return <div style={{ minHeight: "100dvh", background: "var(--canvas)" }} />;
  }
  return isMobile ? <MobileApp /> : <WebApp />;
}
