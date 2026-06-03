import { useState } from "react";
import { useLang, REGIONS } from "@/lib/i18n";
import { Heart, CheckCircle, XCircle, AlertTriangle, TrendingUp, User } from "lucide-react";

interface LikeResult {
  success: boolean;
  message: string;
  maintenance?: boolean;
  likesBefore?: number | null;
  likesAfter?: number | null;
  likesGiven?: number | null;
  playerNickname?: string | null;
  playerLevel?: string | null;
}

export default function Like() {
  const { t } = useLang();
  const [key, setKey] = useState("");
  const [uid, setUid] = useState("");
  const [region, setRegion] = useState("IND");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LikeResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch("/api/public/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.trim(), uid: uid.trim(), region }),
      });
      const data = await r.json() as LikeResult;
      if (!r.ok) {
        setResult({ success: false, message: data.message ?? "Error", maintenance: data.maintenance });
      } else {
        setResult(data);
      }
    } catch {
      setResult({ success: false, message: "Network error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10 animate-fade-in-up">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-600/20 text-pink-400 ring-1 ring-pink-700/30">
          <Heart size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">{t.likeTitle}</h1>
          <p className="text-xs text-slate-400">{t.heroSub}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card-glass rounded-2xl p-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">{t.enterKey}</label>
          <input className="w-full rounded-xl border border-blue-900/40 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/30" placeholder="Your access key" value={key} onChange={e => setKey(e.target.value)} required />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">{t.enterUid}</label>
          <input className="w-full rounded-xl border border-blue-900/40 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/30" placeholder="Free Fire UID" value={uid} onChange={e => setUid(e.target.value)} required />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">{t.selectRegion}</label>
          <select className="w-full rounded-xl border border-blue-900/40 bg-slate-900/60 px-4 py-2.5 text-sm text-white focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/30" value={region} onChange={e => setRegion(e.target.value)}>
            {REGIONS.map(r => <option key={r} value={r}>{r} — {t.regions[r]}</option>)}
          </select>
        </div>
        <button type="submit" disabled={loading} className="w-full rounded-xl bg-pink-600 py-2.5 text-sm font-semibold text-white hover:bg-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
          {loading ? <><span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />{t.loading}</> : <><Heart size={16} />{t.sendLike}</>}
        </button>
      </form>

      {result && (
        <div className={`mt-4 rounded-2xl border animate-fade-in-up overflow-hidden ${result.maintenance ? "border-amber-800/40 bg-amber-900/20" : result.success ? "border-green-800/40 bg-green-900/20" : "border-red-800/40 bg-red-900/20"}`}>
          {/* Header */}
          <div className="flex items-center gap-3 p-4">
            {result.maintenance ? <AlertTriangle size={18} className="text-amber-400 shrink-0" /> : result.success ? <CheckCircle size={18} className="text-green-400 shrink-0" /> : <XCircle size={18} className="text-red-400 shrink-0" />}
            <p className={`text-sm font-medium ${result.maintenance ? "text-amber-300" : result.success ? "text-green-300" : "text-red-300"}`}>{result.message}</p>
          </div>

          {/* Likes stats — only show on success with data */}
          {result.success && (result.likesGiven != null || result.likesBefore != null || result.likesAfter != null) && (
            <div className="border-t border-green-800/30 px-4 pb-4 pt-3 space-y-3">
              {/* Player info */}
              {(result.playerNickname || result.playerLevel) && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <User size={13} className="text-blue-400" />
                  {result.playerNickname && <span className="text-white font-semibold">{result.playerNickname}</span>}
                  {result.playerLevel && <span className="text-slate-500">Lv.{result.playerLevel}</span>}
                </div>
              )}
              {/* Likes breakdown */}
              <div className="grid grid-cols-3 gap-2">
                {result.likesBefore != null && (
                  <div className="rounded-xl bg-slate-900/60 p-3 text-center">
                    <p className="text-[10px] text-slate-500 mb-1">Before</p>
                    <p className="text-lg font-bold text-slate-300">{result.likesBefore.toLocaleString()}</p>
                  </div>
                )}
                {result.likesGiven != null && (
                  <div className="rounded-xl bg-pink-900/30 ring-1 ring-pink-700/40 p-3 text-center">
                    <p className="text-[10px] text-pink-400 mb-1 flex items-center justify-center gap-0.5"><TrendingUp size={10} /> Sent</p>
                    <p className="text-lg font-bold text-pink-300">+{result.likesGiven.toLocaleString()}</p>
                  </div>
                )}
                {result.likesAfter != null && (
                  <div className="rounded-xl bg-slate-900/60 p-3 text-center">
                    <p className="text-[10px] text-slate-500 mb-1">After</p>
                    <p className="text-lg font-bold text-green-300">{result.likesAfter.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
