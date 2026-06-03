import { Link } from "wouter";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 text-center animate-fade-in-up">
      <div className="space-y-5">
        <p className="text-8xl font-black text-blue-600/20">404</p>
        <h1 className="text-2xl font-bold text-white">Page Not Found</h1>
        <p className="text-slate-500 text-sm">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-all">
          <Home size={16} /> Go Home
        </Link>
      </div>
    </div>
  );
}
