import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Menu, X, Zap } from "lucide-react";

const NAV_LINKS = [
  { to: "/", key: "home" as const },
  { to: "/check-key", key: "checkKey" as const },
  { to: "/like", key: "like" as const },
  { to: "/visit", key: "visit" as const },
  { to: "/auto-like", key: "autoLike" as const },
  { to: "/price-list", key: "priceList" as const },
];

export function Navbar() {
  const { t, lang, setLang } = useLang();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-blue-900/40 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-14 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 ring-1 ring-blue-500/40">
              <Zap size={16} className="text-blue-400" />
            </div>
            <span className="font-bold text-white text-sm tracking-wide">
              LIKE BY <span className="text-blue-400">NIROB</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {NAV_LINKS.map(({ to, key }) => (
              <Link
                key={to}
                href={to}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm transition-all duration-200",
                  location === to
                    ? "bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/40"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                {t[key]}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setLang(lang === "en" ? "bn" : "en")}
              className="flex items-center gap-1.5 rounded-lg border border-blue-800/40 bg-slate-900/60 px-2.5 py-1 text-xs font-medium text-slate-300 hover:border-blue-500/50 hover:text-white transition-all"
            >
              <span className="text-base leading-none">{lang === "en" ? "🇧🇩" : "🇺🇸"}</span>
              <span>{lang === "en" ? "বাংলা" : "EN"}</span>
            </button>
            <button
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
              onClick={() => setMobileOpen(o => !o)}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-blue-900/30 bg-slate-950/95 px-4 pb-4 pt-3">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map(({ to, key }) => (
              <Link
                key={to}
                href={to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm transition-all",
                  location === to
                    ? "bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                {t[key]}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
