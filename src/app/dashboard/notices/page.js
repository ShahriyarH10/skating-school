"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Icon } from "@/components/Icons";
import { Badge, PageLoading, EmptyState, Toast, ModalShell, cx } from "@/components/ui";

export default function NoticesPage() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const canPost = user.role !== "student";

  const load = () => api("/api/notices").then(setNotices).finally(() => setLoading(false));
  useEffect(() => { load(); if (user.role === "admin") api("/api/clubs").then(setClubs).catch(() => {}); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = async (form) => {
    await api("/api/notices", { method: "POST", body: JSON.stringify(form) });
    setShowModal(false);
    setToast({ message: "Notice posted", tone: "emerald" });
    setTimeout(() => setToast(null), 3000);
    load();
  };

  if (loading) return <PageLoading statCards={0} />;

  return (
    <div className="space-y-5">
      {canPost && (
        <div className="flex justify-end">
          <button onClick={() => setShowModal(true)} className={cx.btnPrimary}><Icon.Plus width={16} height={16} /> Post Notice</button>
        </div>
      )}

      {notices.length === 0 ? (
        <div className={cx.card}><EmptyState icon={Icon.Bell} title="No notices yet" /></div>
      ) : (
        <div className="space-y-3">
          {notices.map((n) => (
            <div key={n.id} className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-card border-l-[3px] p-5 ${n.urgent ? "border-l-red-500" : "border-l-teal"}`}>
              <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mb-2 flex-wrap">
                <span>{n.date}</span><span>·</span><span>{n.author}</span><span>·</span><span>{n.audience}</span>
                {n.urgent && <Badge tone="red">Urgent</Badge>}
              </div>
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-1">{n.title}</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{n.body}</p>
            </div>
          ))}
        </div>
      )}

      {showModal && <NoticeModal clubs={clubs} isInstructor={user.role === "instructor"} onClose={() => setShowModal(false)} onSave={handleAdd} />}
      <Toast message={toast?.message} tone={toast?.tone} onClose={() => setToast(null)} />
    </div>
  );
}

function NoticeModal({ clubs, isInstructor, onClose, onSave }) {
  const [form, setForm] = useState({ title: "", body: "", audience: "All", urgent: false });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const u = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setError(""); setSubmitting(true);
    try { await onSave(form); } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <ModalShell
      title="Post Notice"
      onClose={onClose}
      footer={<>
        <button onClick={onClose} className={cx.btnSecondary}>Cancel</button>
        <button disabled={form.title.trim().length < 2 || form.body.trim().length < 2 || submitting} onClick={submit} className={cx.btnPrimary}>{submitting ? "Posting…" : "Post Notice"}</button>
      </>}
    >
      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}
      <div><label className={cx.label}>Title *</label><input className={cx.input} value={form.title} onChange={(e) => u("title", e.target.value)} /></div>
      <div><label className={cx.label}>Message *</label><textarea className={cx.input + " min-h-[110px] resize-y"} value={form.body} onChange={(e) => u("body", e.target.value)} /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {!isInstructor && (
          <div><label className={cx.label}>Audience</label>
            <select className={cx.input} value={form.audience} onChange={(e) => u("audience", e.target.value)}>
              <option value="All">All Branches</option>
              {clubs.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        )}
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer self-end pb-2.5">
          <input type="checkbox" checked={form.urgent} onChange={(e) => u("urgent", e.target.checked)} className="w-4 h-4 accent-teal" /> Mark as Urgent
        </label>
      </div>
    </ModalShell>
  );
}
