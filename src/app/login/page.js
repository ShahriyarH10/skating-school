"use client";

import { useState } from "react";
import { Icon } from "@/components/Icons";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      // A hard navigation guarantees the new HTTP-only cookie is included in the
      // first request for the protected server component tree.
      window.location.assign("/dashboard");
    } catch {
      setError("Unable to reach the server. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-navy">
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #0891B2 1px, transparent 0)", backgroundSize: "36px 36px" }} />
        <div className="absolute top-[-15%] right-[-15%] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(8,145,178,0.18)_0%,transparent_70%)] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[350px] h-[350px] bg-[radial-gradient(circle,rgba(245,158,11,0.10)_0%,transparent_70%)] rounded-full" />
        <div className="relative z-10 max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal to-teal-light flex items-center justify-center text-3xl mb-8 shadow-glow-teal">⛸</div>
          <h1 className="text-4xl font-black text-white leading-tight tracking-tight mb-4">Run your school <span className="text-teal-light">from anywhere</span>.</h1>
          <p className="text-slate-400 text-[15px] leading-relaxed">Attendance, fees, schedules, and staff — all in one dashboard built for Online Skating School&apos;s branches across Dhaka.</p>
          <div className="flex items-center gap-6 mt-10 text-slate-500 text-xs font-medium">
            <span className="flex items-center gap-1.5"><Icon.Shield width={14} height={14} /> Role-based access</span>
            <span className="flex items-center gap-1.5"><Icon.CreditCard width={14} height={14} /> Digital receipts</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 py-12 bg-slate-50 lg:rounded-l-[2.5rem]">
        <div className="w-full max-w-sm animate-scaleIn">
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal to-teal-light flex items-center justify-center text-xl">⛸</div>
            <div className="text-xl font-extrabold tracking-tight text-slate-900">Online <span className="text-teal">Skating</span> School</div>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Welcome back</h2>
          <p className="text-sm text-slate-500 mb-7">Sign in to your dashboard to continue.</p>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-5 flex items-center gap-2 animate-slideUp" role="alert">
              <Icon.AlertTriangle width={16} height={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Email</label>
              <input type="email" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-[15px] bg-white text-slate-800 transition-all duration-150 focus:border-teal focus:ring-4 focus:ring-teal/10 outline-none" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" autoComplete="username" required />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} className="w-full px-4 py-3 pr-11 border border-slate-200 rounded-xl text-[15px] bg-white text-slate-800 transition-all duration-150 focus:border-teal focus:ring-4 focus:ring-teal/10 outline-none" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" required />
                <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label={showPassword ? "Hide password" : "Show password"}>
                  <Icon.Eye width={16} height={16} />
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-teal text-white font-semibold py-3 rounded-xl hover:bg-teal-dark active:scale-[0.98] transition-all duration-150 disabled:opacity-60 shadow-sm hover:shadow-glow-teal flex items-center justify-center gap-2">
              {loading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Signing in…</> : "Sign In"}
            </button>
          </form>

          <p className="text-xs text-slate-400 text-center mt-8">New student? <Link href="/admission" className="text-teal font-semibold hover:underline">Apply for admission</Link></p>
          <p className="text-xs text-slate-400 text-center mt-2">Instructor or admin? Contact your branch administrator for credentials.</p>
        </div>
      </div>
    </div>
  );
}
