import type { ReactNode } from "react";
import type { ServiceType } from "@/types";

export const PLAY_ICON = (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3.18 23.76c.3.17.64.24.99.2l.1-.04 11.35-6.55-2.47-2.47-9.97 8.86zM.13 1.55C.05 1.8 0 2.06 0 2.35v19.3c0 .29.05.56.13.8l.07.07 10.82-10.82v-.26L.2 1.48l-.07.07zM19.82 9.65l-2.56-1.48-2.78 2.78 2.78 2.78 2.58-1.49c.74-.43.74-1.13-.02-1.59zm-16.64 14.1l.1-.06 12.06-6.96-2.47-2.47-9.69 9.49z" />
  </svg>
);
export const APPLE_ICON = (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

export const ACCOUNT_ICON = (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export const SERVICE_THEME: Record<
  ServiceType,
  { gradient: string; accent: string; soft: string; text: string; icon: ReactNode }
> = {
  "play-market": {
    gradient: "from-emerald-400 to-emerald-600",
    accent: "from-emerald-400 to-emerald-600",
    soft: "bg-emerald-50",
    text: "text-emerald-600",
    icon: PLAY_ICON,
  },
  "app-store": {
    gradient: "from-blue-400 to-blue-600",
    accent: "from-blue-400 to-blue-600",
    soft: "bg-blue-50",
    text: "text-blue-600",
    icon: APPLE_ICON,
  },
  "google-transfer": {
    gradient: "from-orange-400 to-orange-600",
    accent: "from-orange-400 to-orange-600",
    soft: "bg-orange-50",
    text: "text-orange-600",
    icon: PLAY_ICON,
  },
  "apple-transfer": {
    gradient: "from-purple-400 to-purple-600",
    accent: "from-purple-400 to-purple-600",
    soft: "bg-purple-50",
    text: "text-purple-600",
    icon: APPLE_ICON,
  },
  account: {
    gradient: "from-teal-400 to-teal-600",
    accent: "from-teal-400 to-teal-600",
    soft: "bg-teal-50",
    text: "text-teal-600",
    icon: ACCOUNT_ICON,
  },
};

// Ilova logosi (Storage URL bo'lsa rasm, aks holda gradient placeholder).
export function ServiceLogo({
  serviceType,
  iconUrl,
  appName,
}: {
  serviceType: ServiceType;
  iconUrl: string | null;
  appName: string | null;
}) {
  const theme = SERVICE_THEME[serviceType];
  if (iconUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={iconUrl}
        alt={appName ?? "Ilova"}
        className="w-14 h-14 rounded-2xl object-cover border border-slate-200 flex-shrink-0 shadow-sm"
      />
    );
  }
  return (
    <div
      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center flex-shrink-0 shadow-sm text-white`}
    >
      {theme.icon}
    </div>
  );
}
