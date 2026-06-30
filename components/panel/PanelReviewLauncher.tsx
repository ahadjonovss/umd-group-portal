"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ReviewModal } from "@/components/ReviewModal";

export interface ReviewItem {
  id: string;
  label: string;
  reviewed: boolean;
  canReview: boolean;
}

type Mode = "idle" | "modal" | "already" | "notfound";

function InfoDialog({
  icon,
  title,
  desc,
  onClose,
}: {
  icon: string;
  title: string;
  desc: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center animate-scale-in">
        <div className="text-4xl mb-3">{icon}</div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500 mt-1">{desc}</p>
        <button
          onClick={onClose}
          className="mt-5 h-11 w-full rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 active:scale-[0.98] transition-all"
        >
          Yopish
        </button>
      </div>
    </div>
  );
}

// Deeplink (/panel?review=<appId>) — mos ilova uchun dialogni panel ustida ochadi.
export function PanelReviewLauncher({ apps }: { apps: ReviewItem[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const reviewId = params.get("review");

  const [mode, setMode] = useState<Mode>("idle");
  const [target, setTarget] = useState<ReviewItem | null>(null);

  useEffect(() => {
    if (!reviewId) return;
    const app = apps.find((a) => a.id === reviewId) ?? null;
    if (!app || !app.canReview) {
      setMode("notfound");
    } else if (app.reviewed) {
      setTarget(app);
      setMode("already");
    } else {
      setTarget(app);
      setMode("modal");
    }
    // URL'dan parametrni tozalaymiz (qayta ochilmasin)
    const url = new URL(window.location.href);
    url.searchParams.delete("review");
    window.history.replaceState({}, "", url.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewId]);

  const close = () => { setMode("idle"); setTarget(null); };

  if (mode === "modal" && target) {
    return (
      <ReviewModal
        onClose={close}
        onSuccess={() => { close(); router.refresh(); }}
        endpoint="/api/reviews/app"
        extraPayload={{ appId: target.id }}
        title="Xizmatni baholang"
        subtitle={target.label}
        hideName
      />
    );
  }
  if (mode === "already" && target) {
    return (
      <InfoDialog
        icon="✓"
        title="Allaqachon baholangan"
        desc={`"${target.label}" xizmati allaqachon baholangan. Rahmat!`}
        onClose={close}
      />
    );
  }
  if (mode === "notfound") {
    return (
      <InfoDialog
        icon="🔍"
        title="Baholab bo'lmaydi"
        desc="Bu ariza topilmadi yoki hali baholashga tayyor emas."
        onClose={close}
      />
    );
  }
  return null;
}
