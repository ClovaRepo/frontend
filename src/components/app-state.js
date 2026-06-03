"use client";
/* ============================================================
   CLOVA — shared app state across the mobile & web experiences.
   One source of truth so resizing across the breakpoint keeps you
   on the same logical place (and the same language).

   - lang   : "id" | "en"
   - stage  : "landing" | "app"     (are we on the marketing site or inside the app)
   - screen : canonical in-app view  ("dashboard" | "pool" | "keeper" | "log" | "settings")

   Mobile and web each map this canonical screen to their own vocabulary.
   ============================================================ */
import { useState, useEffect } from "react";

const K_LANG = "clova_lang";
const K_STAGE = "clova_stage";
const K_SCREEN = "clova_screen_v2";

const read = (key, fallback) => {
  try {
    return (typeof localStorage !== "undefined" && localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
};

export function useClovaState() {
  const [lang, setLang] = useState(() => read(K_LANG, "id"));
  const [stage, setStage] = useState(() => read(K_STAGE, "landing"));
  const [screen, setScreen] = useState(() => read(K_SCREEN, "dashboard"));

  useEffect(() => { try { localStorage.setItem(K_LANG, lang); } catch {} }, [lang]);
  useEffect(() => { try { localStorage.setItem(K_STAGE, stage); } catch {} }, [stage]);
  useEffect(() => { try { localStorage.setItem(K_SCREEN, screen); } catch {} }, [screen]);

  return { lang, setLang, stage, setStage, screen, setScreen };
}
