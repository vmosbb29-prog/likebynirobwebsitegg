import { useEffect, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";

interface SupportLinks {
  telegramUrl: string;
  whatsappUrl: string;
  telegramChannelUrl: string;
  telegramGroupUrl: string;
}

const DEFAULT_LINKS: SupportLinks = {
  telegramUrl: "https://t.me/NIROBFF360",
  whatsappUrl: "",
  telegramChannelUrl: "https://t.me/likebynirob",
  telegramGroupUrl: "https://t.me/likebynirobgp",
};

export function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [links, setLinks] = useState<SupportLinks>(DEFAULT_LINKS);

  useEffect(() => {
    fetch("/api/public/config")
      .then(r => r.json())
      .then(data => { if (data?.supportLinks) setLinks({ ...DEFAULT_LINKS, ...data.supportLinks }); })
      .catch(() => {});
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="mb-1 w-60 rounded-2xl border border-blue-800/40 bg-slate-900/95 shadow-2xl shadow-blue-900/20 backdrop-blur-xl overflow-hidden animate-fade-in-up">
          <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Support</p>
              <p className="text-xs text-blue-200">We&apos;re here to help!</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-blue-200 hover:text-white"><X size={16} /></button>
          </div>
          <div className="p-3 flex flex-col gap-2">
            {links.telegramUrl && (
              <a href={links.telegramUrl} target="_blank" rel="noopener" className="flex items-center gap-3 rounded-xl bg-blue-600/10 border border-blue-700/30 px-3 py-2 text-sm text-blue-300 hover:bg-blue-600/20 hover:text-white transition-all">
                <Send size={15} /> <span>Chat with NIROB</span>
              </a>
            )}
            {links.telegramChannelUrl && (
              <a href={links.telegramChannelUrl} target="_blank" rel="noopener" className="flex items-center gap-3 rounded-xl bg-slate-800/50 border border-slate-700/30 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all">
                <MessageCircle size={15} /> <span>Join Channel</span>
              </a>
            )}
            {links.telegramGroupUrl && (
              <a href={links.telegramGroupUrl} target="_blank" rel="noopener" className="flex items-center gap-3 rounded-xl bg-slate-800/50 border border-slate-700/30 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all">
                <MessageCircle size={15} /> <span>Join Group</span>
              </a>
            )}
            {links.whatsappUrl && (
              <a href={links.whatsappUrl} target="_blank" rel="noopener" className="flex items-center gap-3 rounded-xl bg-green-700/10 border border-green-700/30 px-3 py-2 text-sm text-green-300 hover:bg-green-700/20 hover:text-white transition-all">
                <MessageCircle size={15} /> <span>WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 shadow-lg shadow-blue-600/30 hover:bg-blue-500 hover:shadow-blue-500/40 transition-all duration-300 animate-pulse-glow"
      >
        <MessageCircle size={22} className="text-white" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
        </span>
      </button>
    </div>
  );
}
