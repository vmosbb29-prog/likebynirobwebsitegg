import type { ReactNode } from "react";
import { Navbar } from "@/components/navbar";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#020b18" }}>
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-blue-900/20 py-6 text-center text-xs text-slate-600">
        <p>
          © 2025 Like By Nirob — by{" "}
          <a href="https://t.me/NIROBFF360" target="_blank" rel="noopener" className="text-blue-500 hover:text-blue-400">
            @NIROBFF360
          </a>
        </p>
        <div className="mt-1 flex justify-center gap-4">
          <a href="https://t.me/likebynirob" target="_blank" rel="noopener" className="hover:text-slate-400">Channel</a>
          <a href="https://t.me/likebynirobgp" target="_blank" rel="noopener" className="hover:text-slate-400">Group</a>
        </div>
      </footer>
    </div>
  );
}
