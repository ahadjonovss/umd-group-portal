import Link from "next/link";
import { ReactNode } from "react";
import { Logo } from "@/components/Logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col">
      <header className="px-4 py-4">
        <Link href="/" className="inline-flex items-center gap-2">
          <Logo size={30} color="#3a3733" />
          <span className="text-sm font-bold text-slate-900">UMD GROUP</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6 animate-slide-up">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/50 p-6 animate-slide-up">
            {children}
          </div>
          <p className="text-center text-sm text-slate-500 mt-5">{footer}</p>
        </div>
      </main>
    </div>
  );
}
