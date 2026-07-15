export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white mt-auto">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-3 h-3 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <rect x="1" y="3" width="15" height="13" rx="1" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            </svg>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Courier Collection System
          </p>
        </div>
        <div className="flex items-center gap-5">
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Tracking Services Live
          </span>
          <p className="text-xs text-slate-400">
            Stage 1 — Collection App · {year}
          </p>
        </div>
      </div>
    </footer>
  );
}
