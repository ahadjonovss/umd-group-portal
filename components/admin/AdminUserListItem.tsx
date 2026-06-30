import Link from "next/link";
import type { AdminUser } from "@/lib/firestore/users";
import { formatDate } from "@/lib/labels";

export function AdminUserListItem({ user }: { user: AdminUser }) {
  const initial = (user.fullName || user.email || "?").charAt(0).toUpperCase();
  const isAdmin = user.role === "admin";

  return (
    <Link
      href={`/admin/user/${user.uid}`}
      className="bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/40 hover:shadow-md hover:border-slate-300 transition-all flex items-center gap-3 p-4"
    >
      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold flex-shrink-0">
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-slate-900 truncate">{user.fullName || "—"}</p>
          {isAdmin && <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white text-[10px] font-semibold">ADMIN</span>}
        </div>
        <p className="text-xs text-slate-500 truncate">{user.email}</p>
        <p className="text-xs text-slate-400 truncate">
          {user.phone || "—"} · {user.appCount ?? 0} ariza · {formatDate(user.createdAt)}
        </p>
      </div>
      <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
