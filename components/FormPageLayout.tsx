import Link from "next/link";
import { ReactNode } from "react";
import { Logo } from "@/components/Logo";

interface FormPageLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function FormPageLayout({ title, subtitle, children }: FormPageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium group"
          >
            <span className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
              <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </span>
            Orqaga
          </Link>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <Logo size={28} color="#3a3733" />
            <span className="text-sm font-bold text-slate-900 hidden sm:block">UMD GROUP</span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Page title */}
        <div className="mb-6 animate-slide-down">
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/50 overflow-hidden animate-slide-up">
          {children}
        </div>
      </div>
    </div>
  );
}
