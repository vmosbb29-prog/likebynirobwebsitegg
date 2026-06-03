import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useRequireAdmin, adminFetch } from "@/hooks/use-admin";
import {
  BarChart2, Key, FileText, Settings, Shield, LogOut, Plus, Trash2,
  Users, Heart, Eye, Ban, RefreshCw, Save, Send, Lock, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "stats" | "keys" | "logs" | "settings" | "banned" | "autolike";

interface Stats { totalKeys: number; activeKeys: number; totalLikes: number; totalVisits: number; totalLogs: number; bannedIps: number; onlineUsers: number; }
interface KeyRow { key: string; expiresAt: string; likeUsed: boolean; visitUsed: boolean; usedCount: number; useLimit: number | null; createdAt: string; }
interface LogRow { id: number; key: string | null; uid: string | null; region: string | null; action: string; status: string; ipAddress: string | null; createdAt: string; }
interface BannedIp { ip: string; createdAt: string; }
interface AdminSettings {
  likeEnabled: boolean; visitEnabled: boolean; likeApiUrl: string; visitApiUrl: string;
  telegramBotToken: string; telegramChatId: string; autoLikeEnabled: boolean;
  autoLikeApiUrl: string; autoLikeScheduleHour: number; autoLikeScheduleMinute: number;
  priceList: { currency: string; contactInfo: string; likeItems: { label: string; price: string }[]; visitItems: { label: string; price: string }[]; autoLikeItems: { label: string; price: string }[]; };
  supportLinks: { telegramUrl: string; whatsappUrl: string; telegramChannelUrl: string; telegramGroupUrl: string; };
}
interface AutoLikeTask { id: number; uid: string; region: string; days: number; remaining: number; totalLikesSent: number; likesLastRun: number; playerNickname: string | null; playerLevel: string | null; lastRunAt: string | null; active: boolean; createdAt: string; }

const REGIONS = ["IND","BD","PK","SG","TH","VN","ID","MY","BR","US","EU","ME"];

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const token = useRequireAdmin();
  const [tab, setTab] = useState<Tab>("stats");
  const [stats, setStats] = useState<Stats | null>(null);
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [bannedIps, setBannedIps] = useState<BannedIp[]>([]);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [autoLikeTasks, setAutoLikeTasks] = useState<AutoLikeTask[]>([]);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [alUid, setAlUid] = useState(""); const [alRegion, setAlRegion] = useState("IND"); const [alDays, setAlDays] = useState(7); const [alRunning, setAlRunning] = useState(false);
  const [newKeyDays, setNewKeyDays] = useState(30); const [newKeyLimit, setNewKeyLimit] = useState<number | "">("");  const [newKeyCustom, setNewKeyCustom] = useState("");
  const [banIpInput, setBanIpInput] = useState("");
  const [oldPw, setOldPw] = useState(""); const [newPw, setNewPw] = useState("");

  const showMsg = (text: string, ok: boolean) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 3500); };

  const fetchStats = useCallback(async () => { const r = await adminFetch("/api/admin/stats"); if (r.ok) setStats(await r.json() as Stats); }, []);
  const fetchKeys = useCallback(async () => { const r = await adminFetch("/api/admin/keys"); if (r.ok) setKeys(await r.json() as KeyRow[]); }, []);
  const fetchLogs = useCallback(async () => { const r = await adminFetch("/api/admin/logs"); if (r.ok) setLogs(await r.json() as LogRow[]); }, []);
  const fetchBanned = useCallback(async () => { const r = await adminFetch("/api/admin/banned-ips"); if (r.ok) setBannedIps(await r.json() as BannedIp[]); }, []);
  const fetchSettings = useCallback(async () => { const r = await adminFetch("/api/admin/settings"); if (r.ok) setSettings(await r.json() as AdminSettings); }, []);
  const fetchAutoLikeTasks = useCallback(async () => { const r = await adminFetch("/api/admin/auto-like"); if (r.ok) setAutoLikeTasks(await r.json() as AutoLikeTask[]); }, []);

  useEffect(() => { if (!token) return; fetchStats(); fetchSettings(); }, [token, fetchStats, fetchSettings]);
  useEffect(() => { if (!token) return; if (tab === "keys") fetchKeys(); if (tab === "logs") fetchLogs(); if (tab === "banned") fetchBanned(); if (tab === "autolike") fetchAutoLikeTasks(); }, [tab, token, fetchKeys, fetchLogs, fetchBanned, fetchAutoLikeTasks]);

  function logout() { localStorage.removeItem("slv_admin_token"); navigate("/nirobff360adminp"); }

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    const r = await adminFetch("/api/admin/keys", { method: "POST", body: JSON.stringify({ validityDays: newKeyDays, useLimit: newKeyLimit === "" ? null : Number(newKeyLimit), customKey: newKeyCustom.trim() || undefined }) });
    const data = await r.json() as { key?: string; message?: string };
    if (r.ok) { showMsg(`Key created: ${data.key}`, true); setNewKeyCustom(""); fetchKeys(); fetchStats(); } else showMsg(data.message ?? "Error", false);
  }
  async function deleteKey(key: string) {
    if (!confirm(`Delete key: ${key}?`)) return;
    const r = await adminFetch(`/api/admin/keys/${encodeURIComponent(key)}`, { method: "DELETE" });
    if (r.ok) { showMsg("Key deleted", true); fetchKeys(); fetchStats(); } else showMsg("Error", false);
  }
  async function banIp(e: React.FormEvent) {
    e.preventDefault();
    const r = await adminFetch("/api/admin/ban-ip", { method: "POST", body: JSON.stringify({ ip: banIpInput.trim() }) });
    if (r.ok) { showMsg("IP banned", true); setBanIpInput(""); fetchBanned(); } else showMsg("Error", false);
  }
  async function unbanIp(ip: string) {
    const r = await adminFetch(`/api/admin/ban-ip/${encodeURIComponent(ip)}`, { method: "DELETE" });
    if (r.ok) { showMsg("IP unbanned", true); fetchBanned(); } else showMsg("Error", false);
  }
  async function saveSettings(e: React.FormEvent) {
    e.preventDefault(); if (!settings) return;
    const r = await adminFetch("/api/admin/settings", { method: "PUT", body: JSON.stringify(settings) });
    if (r.ok) showMsg("Settings saved!", true); else showMsg("Error saving settings", false);
  }
  async function testTelegram() {
    if (!settings) return;
    const r = await adminFetch("/api/admin/telegram-test", { method: "POST", body: JSON.stringify({ botToken: settings.telegramBotToken, chatId: settings.telegramChatId }) });
    const data = await r.json() as { success?: boolean; message?: string };
    showMsg(data.success ? "Telegram connected!" : (data.message ?? "Failed"), !!data.success);
  }
  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    const r = await adminFetch("/api/admin/password", { method: "PUT", body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }) });
    const data = await r.json() as { message?: string };
    if (r.ok) { showMsg("Password changed!", true); setOldPw(""); setNewPw(""); } else showMsg(data.message ?? "Error", false);
  }
  async function addAutoLikeTask(e: React.FormEvent) {
    e.preventDefault();
    const r = await adminFetch("/api/admin/auto-like", { method: "POST", body: JSON.stringify({ uid: alUid.trim(), region: alRegion, days: alDays }) });
    const data = await r.json() as { success?: boolean; extended?: boolean; message?: string };
    if (r.ok) { showMsg(data.extended ? `Days extended for ${alUid}` : `Added UID ${alUid}`, true); setAlUid(""); fetchAutoLikeTasks(); } else showMsg(data.message ?? "Error", false);
  }
  async function deleteAutoLikeTask(id: number, uid: string) {
    if (!confirm(`Remove auto-like for UID: ${uid}?`)) return;
    const r = await adminFetch(`/api/admin/auto-like/${id}`, { method: "DELETE" });
    if (r.ok) { showMsg("Task removed", true); fetchAutoLikeTasks(); } else showMsg("Error", false);
  }
  async function toggleAutoLikeTask(id: number, active: boolean) {
    const r = await adminFetch(`/api/admin/auto-like/${id}`, { method: "PATCH", body: JSON.stringify({ active }) });
    if (r.ok) fetchAutoLikeTasks();
  }
  async function runNow() {
    setAlRunning(true);
    try {
      const r = await adminFetch("/api/admin/auto-like/run-now", { method: "POST" });
      const data = await r.json() as { results?: { uid: string; likesGiven: number; success: boolean }[]; message?: string };
      if (r.ok) { const total = data.results?.reduce((s, x) => s + x.likesGiven, 0) ?? 0; showMsg(`Batch done! ${data.results?.length ?? 0} UIDs, ${total} likes given.`, true); fetchAutoLikeTasks(); }
      else showMsg(data.message ?? "Failed", false);
    } finally { setAlRunning(false); }
  }

  const TABS: { id: Tab; icon: typeof BarChart2; label: string }[] = [
    { id: "stats", icon: BarChart2, label: "Stats" }, { id: "keys", icon: Key, label: "Keys" },
    { id: "logs", icon: FileText, label: "Logs" }, { id: "autolike", icon: Zap, label: "Auto Like" },
    { id: "banned", icon: Ban, label: "Banned IPs" }, { id: "settings", icon: Settings, label: "Settings" },
  ];

  if (!token) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 ring-1 ring-blue-500/30"><Shield size={18} className="text-blue-400" /></div>
          <div><h1 className="text-lg font-bold text-white">Admin Dashboard</h1><p className="text-xs text-slate-500">Like By Nirob</p></div>
        </div>
        <button onClick={logout} className="flex items-center gap-1.5 rounded-xl border border-red-800/40 bg-red-900/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/30 transition-all"><LogOut size={13} /> Logout</button>
      </div>

      {msg && <div className={`mb-4 rounded-xl px-4 py-2.5 text-sm border animate-fade-in-up ${msg.ok ? "bg-green-900/20 border-green-800/40 text-green-300" : "bg-red-900/20 border-red-800/40 text-red-300"}`}>{msg.text}</div>}

      <div className="flex gap-1 overflow-x-auto mb-6 pb-1">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setTab(id)} className={cn("flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all", tab === id ? "bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/40" : "text-slate-400 hover:text-white hover:bg-white/5")}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* STATS */}
      {tab === "stats" && (
        <div className="space-y-4">
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Keys", value: stats.totalKeys, icon: Key, color: "text-amber-400" },
                { label: "Active Keys", value: stats.activeKeys, icon: Key, color: "text-green-400" },
                { label: "Total Likes", value: stats.totalLikes, icon: Heart, color: "text-pink-400" },
                { label: "Total Visits", value: stats.totalVisits, icon: Eye, color: "text-purple-400" },
                { label: "Online Users", value: stats.onlineUsers, icon: Users, color: "text-blue-400" },
                { label: "Total Logs", value: stats.totalLogs, icon: FileText, color: "text-slate-400" },
                { label: "Banned IPs", value: stats.bannedIps, icon: Ban, color: "text-red-400" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="card-glass rounded-xl p-4 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500"><Icon size={12} className={color} /> {label}</div>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          )}
          <button onClick={fetchStats} className="flex items-center gap-1.5 rounded-xl border border-blue-800/30 bg-blue-950/30 px-3 py-1.5 text-xs text-blue-400 hover:text-white transition-all"><RefreshCw size={12} /> Refresh</button>
        </div>
      )}

      {/* KEYS */}
      {tab === "keys" && (
        <div className="space-y-5">
          <form onSubmit={createKey} className="card-glass rounded-2xl p-5 space-y-4">
            <h2 className="font-semibold text-white text-sm flex items-center gap-2"><Plus size={14} className="text-blue-400" /> Create Key</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><label className="text-xs text-slate-400 block mb-1">Validity (days)</label><input type="number" min={1} className="input-field w-full" value={newKeyDays} onChange={e => setNewKeyDays(Number(e.target.value))} /></div>
              <div><label className="text-xs text-slate-400 block mb-1">Use Limit (blank = ∞)</label><input type="number" min={1} className="input-field w-full" value={newKeyLimit} onChange={e => setNewKeyLimit(e.target.value === "" ? "" : Number(e.target.value))} placeholder="∞" /></div>
              <div className="col-span-2"><label className="text-xs text-slate-400 block mb-1">Custom Key (optional)</label><input type="text" className="input-field w-full" value={newKeyCustom} onChange={e => setNewKeyCustom(e.target.value)} placeholder="Leave blank to auto-generate" /></div>
            </div>
            <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-all flex items-center gap-1.5"><Plus size={13} /> Create Key</button>
          </form>
          <div className="card-glass rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-blue-900/20">
              <h2 className="text-sm font-semibold text-white">{keys.length} Keys</h2>
              <button onClick={fetchKeys} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"><RefreshCw size={11} /> Refresh</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-blue-900/20 text-slate-500">{["Key","Expires","Like","Visit","Used","Limit","Action"].map(h => <th key={h} className="p-3 text-left font-medium">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-blue-900/10">
                  {keys.map(k => (
                    <tr key={k.key} className="hover:bg-white/2">
                      <td className="p-3 font-mono text-blue-300">{k.key}</td>
                      <td className={`p-3 ${new Date(k.expiresAt).getTime() < Date.now() ? "text-red-400" : "text-green-400"}`}>{new Date(k.expiresAt).toLocaleDateString()}</td>
                      <td className="p-3">{k.likeUsed ? <span className="text-pink-400">✓</span> : <span className="text-slate-600">—</span>}</td>
                      <td className="p-3">{k.visitUsed ? <span className="text-purple-400">✓</span> : <span className="text-slate-600">—</span>}</td>
                      <td className="p-3 text-slate-300">{k.usedCount}</td>
                      <td className="p-3 text-slate-400">{k.useLimit ?? "∞"}</td>
                      <td className="p-3"><button onClick={() => deleteKey(k.key)} className="text-red-400 hover:text-red-300"><Trash2 size={13} /></button></td>
                    </tr>
                  ))}
                  {keys.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-slate-600">No keys</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* LOGS */}
      {tab === "logs" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Last 200 Activity Logs</h2>
            <button onClick={fetchLogs} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"><RefreshCw size={11} /> Refresh</button>
          </div>
          <div className="card-glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-blue-900/20 text-slate-500">{["Time","Action","Status","Key","UID","Region","IP"].map(h => <th key={h} className="p-3 text-left font-medium">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-blue-900/10">
                  {logs.map(l => (
                    <tr key={l.id} className="hover:bg-white/2">
                      <td className="p-3 text-slate-500 whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
                      <td className="p-3"><span className={`rounded px-1.5 py-0.5 ${l.action === "like" ? "bg-pink-900/30 text-pink-400" : "bg-purple-900/30 text-purple-400"}`}>{l.action}</span></td>
                      <td className="p-3"><span className={l.status === "success" ? "text-green-400" : "text-red-400"}>{l.status}</span></td>
                      <td className="p-3 font-mono text-blue-300/70">{l.key ? l.key.slice(0, 12) + "…" : "—"}</td>
                      <td className="p-3 font-mono text-slate-400">{l.uid ?? "—"}</td>
                      <td className="p-3 text-slate-400">{l.region ?? "—"}</td>
                      <td className="p-3 font-mono text-slate-500">{l.ipAddress ?? "—"}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-slate-600">No logs</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* AUTO LIKE */}
      {tab === "autolike" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Zap size={14} className="text-amber-400" /> Auto Like Management</h2>
            <div className="flex gap-2">
              <button onClick={runNow} disabled={alRunning} className="flex items-center gap-1.5 rounded-xl border border-amber-800/40 bg-amber-900/20 px-3 py-1.5 text-xs text-amber-400 hover:bg-amber-900/30 transition-all disabled:opacity-50">
                {alRunning ? <span className="animate-spin h-3 w-3 border border-amber-400/30 border-t-amber-400 rounded-full" /> : <Zap size={12} />} Run Now
              </button>
              <button onClick={fetchAutoLikeTasks} className="flex items-center gap-1.5 rounded-xl border border-blue-800/30 bg-blue-950/30 px-3 py-1.5 text-xs text-blue-400 hover:text-white transition-all"><RefreshCw size={12} /> Refresh</button>
            </div>
          </div>
          <form onSubmit={addAutoLikeTask} className="card-glass rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Plus size={13} className="text-blue-400" /> Add / Extend UID</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="col-span-2"><label className="text-xs text-slate-400 block mb-1">Player UID</label><input type="text" className="input-field w-full" placeholder="Free Fire UID" value={alUid} onChange={e => setAlUid(e.target.value)} required /></div>
              <div><label className="text-xs text-slate-400 block mb-1">Region</label><select className="input-field w-full" value={alRegion} onChange={e => setAlRegion(e.target.value)}>{REGIONS.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
              <div><label className="text-xs text-slate-400 block mb-1">Days</label><input type="number" min={1} max={365} className="input-field w-full" value={alDays} onChange={e => setAlDays(Number(e.target.value))} /></div>
            </div>
            <button type="submit" className="rounded-xl bg-pink-600 px-4 py-2 text-xs font-semibold text-white hover:bg-pink-500 transition-all flex items-center gap-1.5"><Heart size={13} /> Add UID</button>
          </form>
          <div className="card-glass rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-blue-900/20"><h3 className="text-sm font-semibold text-white">{autoLikeTasks.length} UIDs</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-blue-900/20 text-slate-500">{["UID","Region","Days Left","Total","Last Run","Status","Actions"].map(h => <th key={h} className="p-3 text-left font-medium">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-blue-900/10">
                  {autoLikeTasks.map(t => (
                    <tr key={t.id} className="hover:bg-white/2">
                      <td className="p-3"><div className="font-mono text-blue-300">{t.uid}</div><div className="text-slate-500">{t.playerNickname ?? ""}</div></td>
                      <td className="p-3 text-slate-300">{t.region}</td>
                      <td className="p-3"><span className="text-pink-400">{t.remaining}</span> / {t.days}</td>
                      <td className="p-3 text-green-400">{t.totalLikesSent.toLocaleString()}</td>
                      <td className="p-3 text-slate-500 whitespace-nowrap">{t.lastRunAt ? new Date(t.lastRunAt).toLocaleString() : "Never"}</td>
                      <td className="p-3">
                        <button onClick={() => toggleAutoLikeTask(t.id, !t.active)} className={`rounded-full px-2 py-0.5 text-xs ${t.active ? "bg-green-900/30 text-green-400" : "bg-red-900/20 text-red-400"}`}>
                          {t.active ? "Active" : "Paused"}
                        </button>
                      </td>
                      <td className="p-3"><button onClick={() => deleteAutoLikeTask(t.id, t.uid)} className="text-red-400 hover:text-red-300"><Trash2 size={13} /></button></td>
                    </tr>
                  ))}
                  {autoLikeTasks.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-slate-600">No auto-like tasks</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* BANNED IPs */}
      {tab === "banned" && (
        <div className="space-y-5">
          <form onSubmit={banIp} className="card-glass rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Ban size={14} className="text-red-400" /> Ban IP</h2>
            <div className="flex gap-2">
              <input type="text" className="input-field flex-1" placeholder="IP address" value={banIpInput} onChange={e => setBanIpInput(e.target.value)} required />
              <button type="submit" className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 transition-all">Ban</button>
            </div>
          </form>
          <div className="card-glass rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-blue-900/20"><h2 className="text-sm font-semibold text-white">{bannedIps.length} Banned IPs</h2></div>
            <div className="divide-y divide-blue-900/10">
              {bannedIps.map(b => (
                <div key={b.ip} className="flex items-center justify-between p-3 text-xs">
                  <div><p className="font-mono text-slate-200">{b.ip}</p><p className="text-slate-500">{new Date(b.createdAt).toLocaleString()}</p></div>
                  <button onClick={() => unbanIp(b.ip)} className="rounded-lg border border-green-800/30 bg-green-900/20 px-2.5 py-1 text-green-400 hover:bg-green-900/40 transition-all">Unban</button>
                </div>
              ))}
              {bannedIps.length === 0 && <p className="p-6 text-center text-xs text-slate-600">No banned IPs</p>}
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS */}
      {tab === "settings" && settings && (
        <div className="space-y-5">
          <form onSubmit={saveSettings} className="space-y-5">
            <div className="card-glass rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-white">Service Status</h2>
              {[{ key: "likeEnabled" as const, label: "Like Service" }, { key: "visitEnabled" as const, label: "Visit Service" }].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-white">{label}</span>
                  <button type="button" onClick={() => setSettings(s => s ? { ...s, [key]: !s[key] } : s)} className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${settings[key] ? "bg-green-700/30 text-green-400 border border-green-700/40" : "bg-red-700/30 text-red-400 border border-red-700/40"}`}>{settings[key] ? "Enabled" : "Disabled"}</button>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <span className="text-sm text-white">Auto Like Service</span>
                <button type="button" onClick={() => setSettings(s => s ? { ...s, autoLikeEnabled: !s.autoLikeEnabled } : s)} className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${settings.autoLikeEnabled ? "bg-green-700/30 text-green-400 border border-green-700/40" : "bg-red-700/30 text-red-400 border border-red-700/40"}`}>{settings.autoLikeEnabled ? "Enabled" : "Disabled"}</button>
              </div>
            </div>
            <div className="card-glass rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-white">API URLs</h2>
              <p className="text-xs text-slate-500">Use <code className="text-blue-400">{"{uid}"}</code> and <code className="text-blue-400">{"{region}"}</code> as placeholders.</p>
              {[{ key: "likeApiUrl" as const, label: "Like API URL" }, { key: "visitApiUrl" as const, label: "Visit API URL" }, { key: "autoLikeApiUrl" as const, label: "Auto Like API URL" }].map(({ key, label }) => (
                <div key={key}><label className="text-xs text-slate-400 block mb-1">{label}</label><input className="input-field w-full" value={settings[key]} onChange={e => setSettings(s => s ? { ...s, [key]: e.target.value } : s)} /></div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-slate-400 block mb-1">Schedule Hour (BST)</label><input type="number" min={0} max={23} className="input-field w-full" value={settings.autoLikeScheduleHour} onChange={e => setSettings(s => s ? { ...s, autoLikeScheduleHour: Number(e.target.value) } : s)} /></div>
                <div><label className="text-xs text-slate-400 block mb-1">Schedule Minute</label><input type="number" min={0} max={59} className="input-field w-full" value={settings.autoLikeScheduleMinute} onChange={e => setSettings(s => s ? { ...s, autoLikeScheduleMinute: Number(e.target.value) } : s)} /></div>
              </div>
            </div>
            <div className="card-glass rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-white">Telegram Notifications</h2>
              <div><label className="text-xs text-slate-400 block mb-1">Bot Token</label><input type="password" className="input-field w-full" placeholder="123456:ABC..." value={settings.telegramBotToken} onChange={e => setSettings(s => s ? { ...s, telegramBotToken: e.target.value } : s)} /></div>
              <div><label className="text-xs text-slate-400 block mb-1">Chat ID</label><input className="input-field w-full" placeholder="-1001234567890" value={settings.telegramChatId} onChange={e => setSettings(s => s ? { ...s, telegramChatId: e.target.value } : s)} /></div>
              <button type="button" onClick={testTelegram} className="flex items-center gap-1.5 rounded-xl border border-blue-800/40 bg-blue-950/30 px-3 py-2 text-xs text-blue-400 hover:text-white transition-all"><Send size={12} /> Test Telegram</button>
            </div>
            <div className="card-glass rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-white">Support Links</h2>
              {[{ key: "telegramUrl" as const, label: "Telegram Support URL" }, { key: "whatsappUrl" as const, label: "WhatsApp URL" }, { key: "telegramChannelUrl" as const, label: "Telegram Channel URL" }, { key: "telegramGroupUrl" as const, label: "Telegram Group URL" }].map(({ key, label }) => (
                <div key={key}><label className="text-xs text-slate-400 block mb-1">{label}</label><input className="input-field w-full" value={settings.supportLinks[key]} onChange={e => setSettings(s => s ? { ...s, supportLinks: { ...s.supportLinks, [key]: e.target.value } } : s)} /></div>
              ))}
            </div>
            <div className="card-glass rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-semibold text-white">Price List</h2>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-slate-400 block mb-1">Currency Symbol</label><input className="input-field w-full" value={settings.priceList.currency} onChange={e => setSettings(s => s ? { ...s, priceList: { ...s.priceList, currency: e.target.value } } : s)} /></div>
                <div><label className="text-xs text-slate-400 block mb-1">Contact Info</label><input className="input-field w-full" value={settings.priceList.contactInfo} onChange={e => setSettings(s => s ? { ...s, priceList: { ...s.priceList, contactInfo: e.target.value } } : s)} /></div>
              </div>
              {[{ key: "likeItems" as const, label: "Like Items", color: "text-pink-400" }, { key: "visitItems" as const, label: "Visit Items", color: "text-purple-400" }, { key: "autoLikeItems" as const, label: "Auto Like Items", color: "text-amber-400" }].map(({ key, label, color }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium ${color}`}>{label}</span>
                    <button type="button" onClick={() => setSettings(s => s ? { ...s, priceList: { ...s.priceList, [key]: [...(s.priceList[key] ?? []), { label: "", price: "" }] } } : s)} className="text-xs text-blue-400 hover:text-blue-300">+ Add</button>
                  </div>
                  {(settings.priceList[key] ?? []).map((item, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input className="input-field flex-1" placeholder="Label" value={item.label} onChange={e => setSettings(s => { if (!s) return s; const items = [...(s.priceList[key] ?? [])]; items[i] = { ...items[i], label: e.target.value }; return { ...s, priceList: { ...s.priceList, [key]: items } }; })} />
                      <input className="input-field w-24" placeholder="Price" value={item.price} onChange={e => setSettings(s => { if (!s) return s; const items = [...(s.priceList[key] ?? [])]; items[i] = { ...items[i], price: e.target.value }; return { ...s, priceList: { ...s.priceList, [key]: items } }; })} />
                      <button type="button" onClick={() => setSettings(s => s ? { ...s, priceList: { ...s.priceList, [key]: (s.priceList[key] ?? []).filter((_, j) => j !== i) } } : s)} className="text-red-400 hover:text-red-300"><Trash2 size={13} /></button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <button type="submit" className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-all"><Save size={14} /> Save Settings</button>
          </form>
          <form onSubmit={changePassword} className="card-glass rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Lock size={14} className="text-blue-400" /> Change Password</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-400 block mb-1">Old Password</label><input type="password" className="input-field w-full" value={oldPw} onChange={e => setOldPw(e.target.value)} required /></div>
              <div><label className="text-xs text-slate-400 block mb-1">New Password</label><input type="password" className="input-field w-full" value={newPw} onChange={e => setNewPw(e.target.value)} required /></div>
            </div>
            <button type="submit" className="rounded-xl bg-slate-700 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-600 transition-all flex items-center gap-1.5"><Lock size={12} /> Change Password</button>
          </form>
        </div>
      )}

      <style>{`.input-field { border-radius: 0.75rem; border: 1px solid rgba(59,130,246,0.2); background: rgba(15,23,42,0.6); padding: 0.5rem 0.75rem; font-size: 0.75rem; color: white; outline: none; } .input-field:focus { border-color: rgba(59,130,246,0.5); box-shadow: 0 0 0 1px rgba(59,130,246,0.2); } .input-field::placeholder { color: rgba(148,163,184,0.5); }`}</style>
    </div>
  );
}
