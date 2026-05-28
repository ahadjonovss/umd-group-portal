import Link from "next/link";
import { ReactNode } from "react";

interface ServiceCardProps {
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  badge?: string;
  badgeColor?: "green" | "blue" | "orange" | "purple";
}

const badgeColors = {
  green: "bg-green-100 text-green-700",
  blue: "bg-blue-100 text-blue-700",
  orange: "bg-orange-100 text-orange-700",
  purple: "bg-purple-100 text-purple-700",
};

export function ServiceCard({ title, description, href, icon, badge, badgeColor = "blue" }: ServiceCardProps) {
  return (
    <Link href={href} className="group block">
      <div className="h-full bg-white rounded-2xl border border-gray-200 shadow-sm p-6 transition-all duration-200 hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {title}
              </h3>
              {badge && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeColors[badgeColor]}`}>
                  {badge}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
          </div>
          <svg
            className="flex-shrink-0 w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
