"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Icon } from "@/components/Icons";
import { Badge, PageLoading, EmptyState, Toast, ModalShell, cx } from "@/components/ui";
import Link from "next/link";

const PROGRAM_TONE = { Beginner: "emerald", Intermediate: "amber", Advanced: "red" };

export default function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = () => api("/api/students").then(setStudents).finally(() => setLoading(false));
  useEffect(() => { load(); api("/api/clubs").then(setClubs).catch(() => {}); }, []);

  const notify = (message, tone = "emerald") => { setToast({ message, tone }); setTimeout(() => setToast(null), 3800); };

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.guardian || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (form) => {
    await api("/api/students", { method: "POST", body: JSON.stringify(form) });
    setShowModal(false);
    notify(`${form.name} enrolled`);
    load();
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Remove ${name}? This can't be undone.`)) return;
    setBusyId(id);
    try {
      await api(`/api/students?id=${id}`, { method: "DELETE" });
      notify("Student removed");
      load();
    } catch (e) { notify(e.message, "red"); }
    finally { setBusyId(null); }
  };

  if (loading) return <PageLoading />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Icon.Search width={16} height={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className={cx.input + " pl-10"}
            placeholder="Search by name or guardian..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {user.role !== "student" && (
          <button onClick={() => setShowModal(true)} className={cx.btnPrimary}><Icon.Plus width={16} height={16} /> Add Student</button>
        )}
      </div>

      <div className={cx.card}>
        {filtered.length === 0 ? (
          <EmptyState icon={Icon.Users} title={search ? "No matches found" : "No students yet"} hint={search ? "Try a different search term." : "Add your first student to get started."} />
        ) : (
          <>
            {/* Mobile: tap a row to open the student. Full table on md+. */}
            <div className="md:hidden divide-y divide-slate-100">
              {filtered.map((s) => (
                <Link key={s.id} href={`/dashboard/students/${s.id}`} className="flex items-center gap-3 p-4 active:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal to-amber flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{s.avatar || s.name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[15px] text-slate-800 truncate">{s.name}</span>
                      <Badge tone={PROGRAM_TONE[s.program] || "slate"}>{s.program}</Badge>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 truncate">
                      {s.guardian || "No guardian"} · {s.club || "Unassigned"}{s.age != null ? ` · Age ${s.age}` : ""}
                    </div>
                  </div>
                  <Icon.ChevronRight width={18} height={18} className="text-slate-300 flex-shrink-0" />
                </Link>
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className={cx.thead}>
                  <th className={cx.th}>Name</th><th className={cx.th}>Age</th><th className={cx.th}>Guardian</th>
                  <th className={cx.th}>Branch</th><th className={cx.th}>Program</th><th className={cx.th}>Actions</th>
                </tr></thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} className={cx.tr}>
                      <td className={cx.td}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal to-amber flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">{s.avatar || s.name[0]}</div>
                          <span className="font-semibold text-slate-800">{s.name}</span>
                        </div>
                      </td>
                      <td className={cx.td}>{s.age ?? "—"}</td>
                      <td className={cx.td}>{s.guardian || "—"}</td>
                      <td className={cx.td + " text-xs"}>{s.club || "Unassigned"}</td>
                      <td className={cx.td}><Badge tone={PROGRAM_TONE[s.program] || "slate"}>{s.program}</Badge></td>
                      <td className={cx.td}>
                        <div className="flex items-center gap-1">
                          <Link href={`/dashboard/students/${s.id}`} className={cx.btnGhost}><Icon.Eye width={13} height={13} /> View</Link>
                          {user.role === "admin" && (
                            <button disabled={busyId === s.id} onClick={() => handleDelete(s.id, s.name)} className={cx.btnDangerGhost + " disabled:opacity-40"}>
                              <Icon.Trash width={13} height={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {showModal && <AddStudentModal clubs={clubs} isInstructor={user.role === "instructor"} onClose={() => setShowModal(false)} onAdd={handleAdd} />}
      <Toast message={toast?.message} tone={toast?.tone} onClose={() => setToast(null)} />
    </div>
  );
}

function AddStudentModal({ clubs, isInstructor, onClose, onAdd }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", age: "", guardian: "", program: "Beginner", clubId: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const u = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setError(""); setSubmitting(true);
    try { await onAdd(form); } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const valid = form.name.trim().length >= 2 && /\S+@\S+\.\S+/.test(form.email) && form.password.length >= 8 && form.guardian.trim().length >= 2;

  return (
    <ModalShell
      title="Add Student"
      onClose={onClose}
      footer={<>
        <button onClick={onClose} className={cx.btnSecondary}>Cancel</button>
        <button disabled={!valid || submitting} onClick={submit} className={cx.btnPrimary}>{submitting ? "Enrolling…" : "Enroll Student"}</button>
      </>}
    >
      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}
      <div><label className={cx.label}>Full name *</label><input className={cx.input} value={form.name} onChange={(e) => u("name", e.target.value)} /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className={cx.label}>Email *</label><input type="email" className={cx.input} value={form.email} onChange={(e) => u("email", e.target.value)} /></div>
        <div><label className={cx.label}>Age</label><input type="number" className={cx.input} value={form.age} onChange={(e) => u("age", e.target.value)} /></div>
      </div>
      <div><label className={cx.label}>Temporary password * <span className="text-slate-400 font-normal">(min 8 chars)</span></label><input type="password" className={cx.input} value={form.password} onChange={(e) => u("password", e.target.value)} /></div>
      <div><label className={cx.label}>Guardian name *</label><input className={cx.input} value={form.guardian} onChange={(e) => u("guardian", e.target.value)} /></div>
      <div><label className={cx.label}>Phone</label><input className={cx.input} value={form.phone} onChange={(e) => u("phone", e.target.value)} /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className={cx.label}>Program</label>
          <select className={cx.input} value={form.program} onChange={(e) => u("program", e.target.value)}>
            <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
          </select>
        </div>
        {!isInstructor && (
          <div><label className={cx.label}>Branch</label>
            <select className={cx.input} value={form.clubId} onChange={(e) => u("clubId", e.target.value)}>
              <option value="">Unassigned</option>
              {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
