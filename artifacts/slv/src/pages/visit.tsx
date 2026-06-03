import { useState } from "react";
import { useLang, REGIONS } from "@/lib/i18n";
import { Eye, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export default function Visit() {
  const { t } = useLang();
  const [key, setKey] = useState("");
  const [uid, setUid] = useState("");
  const [region, setRegion] = useState("IND");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; maintenance?: boolean } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch("/api/public/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.trim(), uid: uid.trim(), region }),
      });
      const data = await r.json() as { success?: boolean; message?: string; maintenance?: boolean };
      if (!r.ok) {
        setResult({ success: false, message: data.message ?? "Error", maintenance: data.maintenance });
      } else {
        setResult({ success: data.success ?? true, message: data.message ?? "Done!" });
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
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400 ring-1 ring-purple-700/30">
          <Eye size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">{t.visitTitle}</h1>
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
        <button type="submit" disabled={loading} className="w-full rounded-xl bg-purple-600 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
          {loading ? <><span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />{t.loading}</> : <><Eye size={16} />{t.sendVisit}</>}
        </button>
      </form>
      {result && (
        <div className={`mt-4 flex items-start gap-3 rounded-xl p-4 border animate-fade-in-up ${result.maintenance ? "border-amber-800/40 bg-amber-900/20" : result.success ? "border-green-800/40 bg-green-900/20" : "border-red-800/40 bg-red-900/20"}`}>
          {result.maintenance ? <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" /> : result.success ? <CheckCircle size={18} className="text-green-400 shrink-0 mt-0.5" /> : <XCircle size={18} className="text-red-400 shrink-0 mt-0.5" />}
          <p className={`text-sm ${result.maintenance ? "text-amber-300" : result.success ? "text-green-300" : "text-red-300"}`}>{result.message}</p>
        </div>
      )}
    </div>
  );
}
