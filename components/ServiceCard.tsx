import Link from "next/link";
import { ReactNode } from "react";

interface ServiceCardProps {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  badge?: string;
  badgeColor?: "green" | "blue" | "orange" | "purple";
  delay?: number;
}

const badgeStyles = {
  green:  "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  blue:   "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  orange: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
  purple: "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
};

const iconBg = {
  green:  "bg-emerald-50 group-hover:bg-emerald-100",
  blue:   "bg-blue-50 group-hover:bg-blue-100",
  orange: "bg-orange-50 group-hover:bg-orange-100",
  purple: "bg-purple-50 group-hover:bg-purple-100",
};

export function ServiceCard({ title, description, href, icon, badge, badgeColor = "blue", delay = 0 }: ServiceCardProps) {
  return (
    <Link href={href} className="group block animate-slide-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="
        h-full bg-white rounded-2xl border border-slate-200/80
        p-5 transition-all duration-300 ease-out
        hover:shadow-lg hover:shadow-slate-200/60
        hover:-translate-y-1 hover:border-blue-200
        active:translate-y-0 active:shadow-md
      ">
        <div className="flex items-start gap-4">
          <div className={`
            flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center
            transition-all duration-300 ${iconBg[badgeColor]}
          `}>
            {icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors duration-200">
                {title}
              </h3>
              {badge && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeStyles[badgeColor]}`}>
                  {badge}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
          </div>

          <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-lg bg-slate-50 group-hover:bg-blue-50 flex items-center justify-center transition-all duration-200 group-hover:translate-x-0.5">
            <svg className="w-3 h-3 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
