"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReviewModal } from "@/components/ReviewModal";

export function ReviewButton({
  appId,
  reviewed,
}: {
  appId: string;
  reviewed: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(reviewed);

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-medium ring-1 ring-emerald-200">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        Baholangan
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-semibold hover:from-amber-500 hover:to-amber-600 active:scale-95 transition-all shadow-sm shadow-amber-200"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
        Baholash
      </button>

      {open && (
        <ReviewModal
          onClose={() => setOpen(false)}
          onSuccess={() => {
            setOpen(false);
            setDone(true);
            router.refresh();
          }}
          endpoint="/api/reviews/app"
          extraPayload={{ appId }}
          title="Xizmatni baholang"
          subtitle="Tajribangiz haqida fikr bildiring"
          hideName
        />
      )}
    </>
  );
}
