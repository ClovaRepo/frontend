"use client";
import dynamic from "next/dynamic";

// One app, one URL. Every viewport gets the web sidebar/landing design —
// phones render the same experience as desktop (client-only, no SSR).
const WebApp = dynamic(() => import("../components/web-root.jsx"), { ssr: false });

export default function Page() {
  return <WebApp />;
}
