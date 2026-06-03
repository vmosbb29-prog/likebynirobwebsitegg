import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { Key, CheckCircle, XCircle, Clock } from "lucide-react";

interface KeyInfo {
  key: string;
  expiresAt: string;
  likeUsed: boolean;
  visitUsed: boolean;
  usedCount: number;
  useLimit: number | null;
}

export default function CheckKey() {
  const { t } = useLang();
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<KeyInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const r = await fetch("/api/public/check-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: key.trim() }),
      });
      const data = await r.json() as KeyInfo & { message?: string };
      if (!r.ok) setError(data.message ?? "Error");
      else setResult(data);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  const isExpired = result ? new Date(result.expiresAt).getTime() < Date.now() : false;

  return (
    <div className="mx-auto max-w-xl px-4 py-10 animate-fade-in-up">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600/20 text-amber-400 ring-1 ring-amber-700/30">
          <Key size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">{t.checkKey}</h1>
          <p className="text-xs text-slate-400">Verify your access key status</p>
        </div>
      </div>
      <form onSubmit={handleCheck} className="card-glass rounded-2xl p-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">{t.enterKey}</label>
          <input className="w-full rounded-xl border border-blue-900/40 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/30" placeholder="XXXX-XXXX-XXXX" value={key} onChange={e => setKey(e.target.value)} required />
        </div>
        <button type="submit" disabled={loading || !key.trim()} className="w-full rounded-xl bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
          {loading ? t.loading : t.checkKeyBtn}
        </button>
      </form>
      {error && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-red-800/40 bg-red-900/20 p-4 animate-fade-in-up">
          <XCircle size={18} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}
      {result && (
        <div className={`mt-4 card-glass rounded-2xl p-5 space-y-4 animate-fade-in-up border ${isExpired ? "border-red-800/40" : "border-green-800/40"}`}>
          <div className="flex items-center gap-3">
            {isExpired ? <XCircle size={22} className="text-red-400" /> : <CheckCircle size={22} className="text-green-400" />}
            <div>
              <p className="text-sm font-semibold text-white">{isExpired ? t.expiredKey : t.validKey}</p>
              <p className="text-xs text-slate-400 font-mono">{result.key}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-slate-800/50 p-3">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1"><Clock size={12} /> {t.expiresAt}</div>
              <p className="text-white font-medium">{new Date(result.expiresAt).toLocaleDateString()}</p>
            </div>
            <div className="rounded-xl bg-slate-800/50 p-3">
              <div className="flex items-center gap-1.5 text-slate-400 mb-1"><Key size={12} /> {t.usedCount}</div>
              <p className="text-white font-medium">{result.usedCount} / {result.useLimit ?? "∞"}</p>
            </div>
            <div className={`rounded-xl p-3 ${result.likeUsed ? "bg-pink-900/20 border border-pink-800/30" : "bg-slate-800/50"}`}>
              <p className="text-slate-400 text-xs mb-1">{t.likeUsed}</p>
              <p className={`text-sm font-semibold ${result.likeUsed ? "text-pink-400" : "text-green-400"}`}>{result.likeUsed ? "✓ Used" : "Available"}</p>
            </div>
            <div className={`rounded-xl p-3 ${result.visitUsed ? "bg-purple-900/20 border border-purple-800/30" : "bg-slate-800/50"}`}>
              <p className="text-slate-400 text-xs mb-1">{t.visitUsed}</p>
              <p className={`text-sm font-semibold ${result.visitUsed ? "text-purple-400" : "text-green-400"}`}>{result.visitUsed ? "✓ Used" : "Available"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
