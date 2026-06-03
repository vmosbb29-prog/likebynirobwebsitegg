import { useEffect, useState } from "react";
import { Heart, Clock, TrendingUp, CheckCircle, XCircle, RefreshCw, Zap } from "lucide-react";

interface AutoLikeTask {
  id: number;
  uid: string;
  region: string;
  days: number;
  remaining: number;
  totalLikesSent: number;
  likesLastRun: number;
  playerNickname: string | null;
  playerLevel: string | null;
  likesBeforeLast: string | null;
  likesAfterLast: string | null;
  lastRunAt: string | null;
  active: boolean;
  createdAt: string;
}

export default function AutoLike() {
  const [tasks, setTasks] = useState<AutoLikeTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextRun, setNextRun] = useState<string | null>(null);

  const fetchTasks = () => {
    setLoading(true);
    fetch("/api/public/auto-like")
      .then(r => r.json())
      .then(data => {
        setTasks((data.tasks ?? []) as AutoLikeTask[]);
        setNextRun(data.nextRun ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTasks(); }, []);

  const activeTasks = tasks.filter(t => t.active);
  const expiredTasks = tasks.filter(t => !t.active);
  const totalLikesSent = tasks.reduce((s, t) => s + t.totalLikesSent, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 animate-fade-in-up space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-600/20 text-pink-400 ring-1 ring-pink-700/30 animate-pulse-glow">
            <Heart size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Auto Like</h1>
            <p className="text-xs text-slate-400">Daily automatic likes — sent every day at 4:00 AM BST</p>
          </div>
        </div>
        <button onClick={fetchTasks} className="flex items-center gap-1.5 rounded-xl border border-blue-800/30 bg-blue-950/30 px-3 py-1.5 text-xs text-blue-400 hover:text-white transition-all">
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card-glass rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Zap size={11} className="text-green-400" /> Active UIDs</p>
          <p className="text-2xl font-bold text-green-400">{activeTasks.length}</p>
        </div>
        <div className="card-glass rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Heart size={11} className="text-pink-400" /> Total Likes Sent</p>
          <p className="text-2xl font-bold text-pink-400">{totalLikesSent.toLocaleString()}</p>
        </div>
        <div className="card-glass rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><TrendingUp size={11} className="text-blue-400" /> Last Batch</p>
          <p className="text-2xl font-bold text-blue-400">{tasks.reduce((s, t) => s + t.likesLastRun, 0).toLocaleString()}</p>
        </div>
        <div className="card-glass rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Clock size={11} className="text-amber-400" /> Next Run</p>
          <p className="text-sm font-semibold text-amber-400">{nextRun ?? "04:00 BST"}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="animate-spin h-8 w-8 border-2 border-pink-500/30 border-t-pink-500 rounded-full" />
        </div>
      ) : (
        <>
          {activeTasks.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <CheckCircle size={14} className="text-green-400" /> Active Auto Like UIDs
                <span className="rounded-full bg-green-900/30 text-green-400 text-xs px-2 py-0.5">{activeTasks.length}</span>
              </h2>
              <div className="grid md:grid-cols-2 gap-3">
                {activeTasks.map(task => <TaskCard key={task.id} task={task} />)}
              </div>
            </div>
          )}
          {activeTasks.length === 0 && (
            <div className="card-glass rounded-2xl p-12 text-center space-y-3">
              <Heart size={36} className="mx-auto text-slate-700" />
              <p className="text-slate-500 text-sm">No active auto-like UIDs right now.</p>
              <p className="text-slate-600 text-xs">Contact admin to purchase auto-like service.</p>
            </div>
          )}
          {expiredTasks.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-500 mb-3 flex items-center gap-2">
                <XCircle size={14} className="text-red-400/60" /> Expired
                <span className="rounded-full bg-slate-800 text-slate-500 text-xs px-2 py-0.5">{expiredTasks.length}</span>
              </h2>
              <div className="grid md:grid-cols-2 gap-3 opacity-50">
                {expiredTasks.slice(0, 4).map(task => <TaskCard key={task.id} task={task} expired />)}
              </div>
            </div>
          )}
        </>
      )}

      <div className="card-glass rounded-2xl p-6 text-center space-y-3 border-pink-900/20">
        <Heart size={24} className="mx-auto text-pink-400 animate-float" />
        <p className="text-white font-semibold text-sm">Want Daily Auto Likes?</p>
        <p className="text-slate-400 text-xs">Purchase auto-like and your UID gets likes every day automatically.</p>
        <a href="https://t.me/NIROBFF360" target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-5 py-2 text-sm font-semibold text-white hover:bg-pink-500 transition-all">
          Contact @NIROBFF360
        </a>
      </div>
    </div>
  );
}

function TaskCard({ task, expired = false }: { task: AutoLikeTask; expired?: boolean }) {
  const donePercent = Math.round(((task.days - task.remaining) / task.days) * 100);
  return (
    <div className={`card-glass rounded-2xl p-4 space-y-3 transition-all ${!expired ? "hover:border-pink-800/40" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-white text-sm">{task.playerNickname ?? "Player"}</p>
          <p className="text-xs text-slate-500 font-mono">{task.uid}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${task.active ? "bg-green-900/30 text-green-400" : "bg-red-900/20 text-red-400"}`}>
            {task.active ? "Active" : "Expired"}
          </span>
          <span className="text-xs text-slate-500">{task.region.toUpperCase()}</span>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Days used: {task.days - task.remaining}/{task.days}</span>
          <span className="text-pink-400">{task.remaining}d left</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-slate-800">
          <div className="h-1.5 rounded-full bg-gradient-to-r from-pink-600 to-pink-400 transition-all" style={{ width: `${donePercent}%` }} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="rounded-lg bg-slate-800/50 p-2 text-center">
          <p className="text-slate-500">Total Sent</p>
          <p className="text-pink-400 font-bold">{task.totalLikesSent.toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-slate-800/50 p-2 text-center">
          <p className="text-slate-500">Last Run</p>
          <p className="text-blue-400 font-bold">+{task.likesLastRun}</p>
        </div>
        <div className="rounded-lg bg-slate-800/50 p-2 text-center">
          <p className="text-slate-500">Level</p>
          <p className="text-amber-400 font-bold">{task.playerLevel ?? "—"}</p>
        </div>
      </div>
      {task.lastRunAt && (
        <p className="text-xs text-slate-600 flex items-center gap-1">
          <Clock size={10} /> Last run: {new Date(task.lastRunAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
