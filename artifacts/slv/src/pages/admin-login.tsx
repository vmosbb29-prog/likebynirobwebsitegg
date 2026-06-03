import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Shield, Lock } from "lucide-react";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (localStorage.getItem("slv_admin_token")) {
      navigate("/nirobff360adminp/dashboard");
    }
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await r.json() as { token?: string; message?: string };
      if (r.ok && data.token) {
        localStorage.setItem("slv_admin_token", data.token);
        navigate("/nirobff360adminp/dashboard");
      } else {
        setError(data.message ?? "Invalid password");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 animate-fade-in-up">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/20 ring-1 ring-blue-500/30">
            <Shield size={26} className="text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Login</h1>
          <p className="text-xs text-slate-500">Like By Nirob — Admin Panel</p>
        </div>
        <form onSubmit={handleLogin} className="card-glass rounded-2xl p-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-400">Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                className="w-full rounded-xl border border-blue-900/40 bg-slate-900/60 pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500/60 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                placeholder="Enter admin password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          {error && <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            {loading ? "Logging in…" : "Login"}
          </button>
        </form>
        <p className="text-center text-xs text-slate-600">Default password: nirob360</p>
      </div>
    </div>
  );
}
