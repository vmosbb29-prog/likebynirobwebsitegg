import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useLang } from "@/lib/i18n";
import { Heart, Eye, Key, List, Zap, Users, Shield, ChevronRight, Clock, TrendingUp } from "lucide-react";

interface AutoLikeStats {
  activeCount: number;
  totalLikesSent: number;
  nextRun: string;
  hoursLeft: string;
  autoLikeEnabled: boolean;
}

export default function Home() {
  const { t } = useLang();
  const [online, setOnline] = useState<number | null>(null);
  const [autoStats, setAutoStats] = useState<AutoLikeStats | null>(null);

  useEffect(() => {
    fetch("/api/public/config").then(r => r.json()).catch(() => {});

    const fetchOnline = () =>
      fetch("/api/public/online")
        .then(r => r.json())
        .then(d => setOnline(d?.count ?? null))
        .catch(() => {});
    fetchOnline();
    const id = setInterval(fetchOnline, 30000);

    fetch("/api/public/auto-like")
      .then(r => r.json())
      .then(d => setAutoStats(d as AutoLikeStats))
      .catch(() => {});

    return () => clearInterval(id);
  }, []);

  const features = [
    { to: "/like", icon: Heart, label: t.like, sub: "Send likes instantly", color: "from-pink-600/20 to-pink-700/10 border-pink-800/40 text-pink-400" },
    { to: "/visit", icon: Eye, label: t.visit, sub: "Send profile visits", color: "from-purple-600/20 to-purple-700/10 border-purple-800/40 text-purple-400" },
    { to: "/auto-like", icon: Zap, label: t.autoLike, sub: "Daily automatic likes", color: "from-amber-600/20 to-amber-700/10 border-amber-800/40 text-amber-400" },
    { to: "/check-key", icon: Key, label: t.checkKey, sub: "Verify your key", color: "from-blue-600/20 to-blue-700/10 border-blue-800/40 text-blue-400" },
    { to: "/price-list", icon: List, label: t.priceList, sub: "View pricing", color: "from-green-600/20 to-green-700/10 border-green-800/40 text-green-400" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-16 animate-fade-in-up">
      <section className="text-center space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-800/40 bg-blue-900/20 px-4 py-1.5 text-xs text-blue-300 mb-2">
          <Zap size={12} /> Free Fire Boost Platform
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
          <span className="text-glow bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-400 bg-clip-text text-transparent">
            {t.heroTitle}
          </span>
        </h1>
        <p className="mx-auto max-w-xl text-slate-400 text-base md:text-lg">{t.heroSub}</p>

        {online !== null && (
          <div className="inline-flex items-center gap-2 rounded-full border border-green-800/40 bg-green-900/20 px-4 py-1.5 text-sm text-green-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <Users size={14} /> {online} online now
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link href="/like" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-all hover:shadow-lg hover:shadow-blue-600/30">
            <Heart size={16} /> {t.sendLike}
          </Link>
          <Link href="/visit" className="inline-flex items-center gap-2 rounded-xl border border-blue-800/50 bg-blue-950/50 px-6 py-3 text-sm font-semibold text-blue-300 hover:border-blue-600/60 hover:text-white transition-all">
            <Eye size={16} /> {t.sendVisit}
          </Link>
        </div>
      </section>

      <section>
        <Link href="/auto-like" className="group block card-glass rounded-2xl p-5 md:p-6 border border-amber-800/30 bg-gradient-to-r from-amber-950/40 to-slate-950/40 hover:border-amber-700/50 transition-all">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 ring-1 ring-amber-600/30 animate-pulse-glow">
                <Zap size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="font-bold text-white text-base">Auto Like Service</h2>
                  <span className="rounded-full bg-amber-900/40 text-amber-400 text-xs px-2 py-0.5 border border-amber-800/40">NEW</span>
                </div>
                <p className="text-xs text-slate-400">Get daily automatic likes sent to your UID every day at 4:00 AM BST</p>
              </div>
            </div>
            <div className="flex gap-4 md:gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-400">{autoStats?.activeCount ?? "—"}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 justify-center"><Zap size={10} /> Active UIDs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-pink-400">{autoStats ? autoStats.totalLikesSent.toLocaleString() : "—"}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 justify-center"><Heart size={10} /> Likes Sent</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-blue-400">{autoStats?.nextRun ?? "4:00 BST"}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 justify-center"><Clock size={10} /> Next Run</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-500 group-hover:text-amber-400 transition-colors hidden md:block" />
          </div>
        </Link>
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {features.map(({ to, icon: Icon, label, sub, color }) => (
          <Link key={to} href={to} className={`group card-glass card-glass-hover rounded-2xl p-5 flex flex-col gap-3 transition-all duration-300 cursor-pointer bg-gradient-to-br ${color.split(" ").slice(0, 2).join(" ")} border ${color.split(" ")[2]}`}>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ${color.split(" ")[3]}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
            </div>
            <ChevronRight size={14} className="text-slate-500 group-hover:text-slate-300 transition-colors self-end" />
          </Link>
        ))}
      </section>

      <section className="grid sm:grid-cols-3 gap-6 text-center">
        {[
          { icon: Zap, label: "Instant Delivery", sub: "Processed in seconds" },
          { icon: Shield, label: "Secure & Safe", sub: "Key-protected access" },
          { icon: TrendingUp, label: "Daily Auto Like", sub: "Runs every day at 4 AM BST" },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="card-glass rounded-2xl p-6 space-y-2">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400">
              <Icon size={20} />
            </div>
            <p className="font-semibold text-white text-sm">{label}</p>
            <p className="text-xs text-slate-500">{sub}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
