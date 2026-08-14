"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Icon } from "@/components/Icons";
import { Badge, cx } from "@/components/ui";

export default function ProfilePage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const u = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setMsg(""); setErr("");
    if (form.newPassword !== form.confirm) { setErr("New passwords do not match"); return; }
    setSubmitting(true);
    try {
      await api("/api/auth/password", { method: "POST", body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }) });
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
      setMsg("Password changed successfully.");
    } catch (e) { setErr(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="grid md:grid-cols-2 gap-5 max-w-4xl">
      <div className={cx.card + " p-6"}>
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal to-amber flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {user.avatar || user.name?.[0]}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{user.name}</h2>
            <Badge tone="teal">{user.role}</Badge>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[["Email", user.email], ["Phone", user.phone || "—"], ["Branch", user.club || "—"], ["Role", user.role]].map(([l, v]) => (
            <div key={l}><div className="text-xs text-slate-400 dark:text-slate-500 font-medium">{l}</div><div className="text-sm font-semibold mt-0.5 text-slate-800 dark:text-slate-100 capitalize">{v}</div></div>
          ))}
        </div>
      </div>

      <div className={cx.card + " p-6"}>
        <div className="flex items-center gap-2 mb-1">
          <Icon.Lock width={16} height={16} className="text-teal" />
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Change Password</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">Use at least 8 characters with upper, lower and a number.</p>
        {err && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4">{err}</div>}
        {msg && <div className="bg-emerald-50 text-emerald-700 text-sm p-3 rounded-xl mb-4">{msg}</div>}
        <div className="space-y-3">
          <input type="password" placeholder="Current password" className={cx.input} value={form.currentPassword} onChange={(e) => u("currentPassword", e.target.value)} />
          <input type="password" placeholder="New password" className={cx.input} value={form.newPassword} onChange={(e) => u("newPassword", e.target.value)} />
          <input type="password" placeholder="Confirm new password" className={cx.input} value={form.confirm} onChange={(e) => u("confirm", e.target.value)} />
          <button onClick={submit} disabled={submitting || !form.currentPassword || !form.newPassword} className={cx.btnPrimary + " w-full disabled:opacity-60"}>
            {submitting ? "Updating…" : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
}
