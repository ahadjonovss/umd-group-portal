"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { useSearchParams } from "next/navigation";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

// Telegram Mini App ichida ochilганда — initData orqali avtomatik login qiladi.
// Oddiy brauzerda (initData yo'q) hech narsa qilmaydi.
declare global {
  interface Window {
    Telegram?: { WebApp?: { initData?: string; ready?: () => void; expand?: () => void } };
  }
}

export function MiniAppAutoLogin() {
  const search = useSearchParams();
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (!scriptReady) return;
    const wa = window.Telegram?.WebApp;
    const initData = wa?.initData;
    if (!wa || !initData) return; // Telegram tashqarisida

    let cancelled = false;
    (async () => {
      setStatus("working");
      try {
        wa.ready?.();
        wa.expand?.();
        const res = await fetch("/api/telegram/miniapp-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData }),
        });
        const data = await res.json();
        if (!data.success) {
          // Ulanmagan bo'lsa — oddiy login formasi ko'rinib qolaveradi
          if (!cancelled) setStatus(data.error === "not_linked" ? "idle" : "error");
          return;
        }
        const cred = await signInWithCustomToken(auth, data.token);
        const idToken = await cred.user.getIdToken();
        const sess = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        if (!sess.ok) throw new Error("session");
        if (cancelled) return;
        const next = search.get("next") || "/panel";
        // To'liq navigatsiya — httpOnly session cookie proxy tomonidan o'qilishi uchun
        window.location.replace(next);
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scriptReady, search]);

  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="afterInteractive" onLoad={() => setScriptReady(true)} />
      {status === "working" && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-white">
          <div className="w-9 h-9 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin" />
          <p className="text-sm text-slate-500">Kabinetга kirilyapti…</p>
        </div>
      )}
      {status === "error" && (
        <p className="text-center text-xs text-amber-600 mt-3">Avtomatik kirish bo&apos;lmadi — quyida qo&apos;lda kiring.</p>
      )}
    </>
  );
}
