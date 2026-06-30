"use client";

import { useTransition } from "react";
import type { AdminUser } from "@/lib/firestore/users";
import { formatDate } from "@/lib/labels";
import { actSetUserRole } from "@/app/admin/actions";

export function AdminUserRow({ user }: { user: AdminUser }) {
  const [pending, start] = useTransition();
  const isAdmin = user.role === "admin";
  const initial = (user.fullName || user.email || "?").charAt(0).toUpperCase();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold flex-shrink-0">
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-slate-900 truncate">{user.fullName || "—"}</p>
          {isAdmin && (
            <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white text-[10px] font-semibold">ADMIN</span>
          )}
        </div>
        <p className="text-xs text-slate-500 truncate">{user.email}</p>
        <p className="text-xs text-slate-400 truncate">
          {user.phone || "—"} · {user.appCount ?? 0} ariza · {formatDate(user.createdAt)}
        </p>
      </div>
      <button
        disabled={pending}
        onClick={() => start(() => actSetUserRole(user.uid, !isAdmin))}
        className={`h-8 px-3 rounded-lg text-xs font-semibold flex-shrink-0 disabled:opacity-50 ${
          isAdmin
            ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
            : "bg-slate-900 text-white hover:bg-slate-800"
        }`}
      >
        {isAdmin ? "Adminlikni olish" : "Admin qilish"}
      </button>
    </div>
  );
}
