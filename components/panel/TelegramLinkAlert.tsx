// Kabinet: Telegram ulash taklifi / yana akkaunt qo'shish.
// Tugma bosilganda /api/telegram/link ga o'tadi — u token yaratib botga yo'naltiradi.
export function TelegramLinkAlert({ count = 0 }: { count?: number }) {
  // Allaqachon ulangan bo'lsa — kichik "yana ulash" qatori
  if (count > 0) {
    return (
      <a
        href="/api/telegram/link"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-700 self-start"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Yana Telegram akkaunt ulash
        <span className="text-slate-400">({count} ta ulangan)</span>
      </a>
    );
  }

  return (
    <a
      href="/api/telegram/link"
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex items-center gap-3.5 rounded-2xl ring-1 ring-sky-200/70 bg-gradient-to-r from-sky-50 to-blue-50 shadow-sm shadow-sky-100/60 px-4 py-3.5 animate-slide-down hover:ring-sky-300 transition-colors"
    >
      <span className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-sky-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-sky-900">Telegramga ulaning</p>
        <p className="text-xs text-sky-700">
          Ilovalaringiz bo&apos;yicha barcha yangiliklarni — status, to&apos;lov, so&apos;rovlar — Telegramda olib turing
        </p>
      </div>
      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-semibold flex-shrink-0 group-hover:bg-sky-700 transition-colors">
        Ulash
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </span>
    </a>
  );
}
