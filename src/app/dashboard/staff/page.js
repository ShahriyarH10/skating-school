"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Icon } from "@/components/Icons";
import { Badge, PageLoading, EmptyState, Toast, ModalShell, cx } from "@/components/ui";

export default function StaffPage() {
  const { user: me } = useAuth();
  const [data, setData] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = () => api("/api/staff").then(setData).finally(() => setLoading(false));
  useEffect(() => { load(); api("/api/clubs?all=1").then(setClubs).catch(() => {}); }, []);

  const notify = (message, tone = "emerald") => { setToast({ message, tone }); setTimeout(() => setToast(null), 3800); };

  const addInstructor = async (form) => {
    await api("/api/instructors", { method: "POST", body: JSON.stringify(form) });
    setShowAdd(false);
    notify(`${form.name} added as instructor`);
    load();
  };

  const saveEdit = async (form) => {
    await api("/api/instructors", { method: "PATCH", body: JSON.stringify({ id: editing.instructorId, ...form }) });
    setEditing(null);
    notify("Instructor updated");
    load();
  };

  const transferRole = async (person, nextRole) => {
    const verb = nextRole === "admin" ? "promote" : "demote";
    if (!confirm(`${verb === "promote" ? "Promote" : "Demote"} ${person.name} to ${nextRole}?`)) return;
    setBusyId(person.userId);
    try {
      await api("/api/staff/role", { method: "PATCH", body: JSON.stringify({ userId: person.userId, role: nextRole }) });
      notify(`${person.name} is now ${nextRole === "admin" ? "an admin" : "an instructor"}`);
      load();
    } catch (e) { notify(e.message, "red"); }
    finally { setBusyId(null); }
  };

  const remove = async (person) => {
    if (!confirm(`Remove ${person.name} from staff? This can't be undone.`)) return;
    setBusyId(person.userId);
    try {
      await api(`/api/staff?userId=${person.userId}`, { method: "DELETE" });
      notify("Staff member removed");
      load();
    } catch (e) { notify(e.message, "red"); }
    finally { setBusyId(null); }
  };

  if (loading) return <PageLoading statCards={2} />;

  const { admins = [], instructors = [], adminCount = 0 } = data || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg">
          Admins have full access across every branch. Instructors are scoped to their assigned branch.
          Promote or demote staff below — the last remaining admin can&apos;t be demoted or removed.
        </p>
        <button onClick={() => setShowAdd(true)} className={cx.btnPrimary}><Icon.Plus width={16} height={16} /> Add Instructor</button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className={`${cx.card} p-5 flex items-center gap-4`}>
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber to-amber-light flex items-center justify-center text-white flex-shrink-0">
            <Icon.Crown width={20} height={20} />
          </div>
          <div><div className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 leading-none">{adminCount}</div><div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Administrator{adminCount !== 1 ? "s" : ""}</div></div>
        </div>
        <div className={`${cx.card} p-5 flex items-center gap-4`}>
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal to-teal-light flex items-center justify-center text-white flex-shrink-0">
            <Icon.Shield width={20} height={20} />
          </div>
          <div><div className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 leading-none">{instructors.length}</div><div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Instructor{instructors.length !== 1 ? "s" : ""}</div></div>
        </div>
      </div>

      {/* Admins */}
      <div className={cx.card}>
        <div className={cx.cardHeader}>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2"><Icon.Crown width={16} height={16} className="text-amber" /> Administrators</h3>
        </div>
        {admins.length === 0 ? <div className="p-6"><EmptyState icon={Icon.Crown} title="No administrators" /></div> : (
          <>
            <div className="md:hidden divide-y divide-slate-100">
              {admins.map((a) => (
                <div key={a.userId} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber to-amber-light flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{a.avatar || a.name[0]}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">{a.name}</span>
                        {a.userId === me.id && <Badge tone="teal">You</Badge>}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{a.email}{a.phone ? ` · ${a.phone}` : ""}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      disabled={busyId === a.userId || a.userId === me.id || adminCount <= 1}
                      onClick={() => transferRole(a, "instructor")}
                      className={cx.btnGhost + " disabled:opacity-30 disabled:pointer-events-none"}
                    >
                      <Icon.Swap width={13} height={13} /> Make Instructor
                    </button>
                    <button
                      disabled={busyId === a.userId || a.userId === me.id || adminCount <= 1}
                      onClick={() => remove(a)}
                      className={cx.btnDangerGhost + " ml-auto disabled:opacity-30 disabled:pointer-events-none"}
                    >
                      <Icon.Trash width={13} height={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className={cx.thead}><th className={cx.th}>Name</th><th className={cx.th}>Email</th><th className={cx.th}>Phone</th><th className={cx.th}>Actions</th></tr></thead>
                <tbody>
                  {admins.map((a) => (
                    <tr key={a.userId} className={cx.tr}>
                      <td className={cx.td}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber to-amber-light flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">{a.avatar || a.name[0]}</div>
                          <span className="font-semibold text-slate-800 dark:text-slate-100">{a.name}</span>
                          {a.userId === me.id && <Badge tone="teal">You</Badge>}
                        </div>
                      </td>
                      <td className={cx.td}>{a.email}</td>
                      <td className={cx.td}>{a.phone || "—"}</td>
                      <td className={cx.td}>
                        <div className="flex items-center gap-1">
                          <button
                            disabled={busyId === a.userId || a.userId === me.id || adminCount <= 1}
                            onClick={() => transferRole(a, "instructor")}
                            title={a.userId === me.id ? "You cannot change your own role" : adminCount <= 1 ? "Cannot demote the last admin" : "Demote to instructor"}
                            className={cx.btnGhost + " disabled:opacity-30 disabled:pointer-events-none"}
                          >
                            <Icon.Swap width={13} height={13} /> Make Instructor
                          </button>
                          <button
                            disabled={busyId === a.userId || a.userId === me.id || adminCount <= 1}
                            onClick={() => remove(a)}
                            title={a.userId === me.id ? "You cannot remove your own account" : adminCount <= 1 ? "Cannot remove the last admin" : "Remove"}
                            className={cx.btnDangerGhost + " ml-auto disabled:opacity-30 disabled:pointer-events-none"}
                          >
                            <Icon.Trash width={13} height={13} />
                          </button>
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

      {/* Instructors */}
      <div className={cx.card}>
        <div className={cx.cardHeader}>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2"><Icon.Shield width={16} height={16} className="text-teal" /> Instructors</h3>
        </div>
        {instructors.length === 0 ? (
          <div className="p-6"><EmptyState icon={Icon.Shield} title="No instructors yet" hint="Add your first instructor to assign schedules and mark attendance." /></div>
        ) : (
          <>
            <div className="md:hidden divide-y divide-slate-100">
              {instructors.map((i) => (
                <div key={i.userId} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal to-teal-light flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{i.avatar || i.name[0]}</div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-800 dark:text-slate-100 truncate">{i.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{i.specialization || "No specialization"} · {i.email}</div>
                    </div>
                    {i.club ? <Badge tone="teal">{i.club}</Badge> : <span className="text-slate-400 dark:text-slate-500 text-[11px] flex-shrink-0">Unassigned</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <button onClick={() => setEditing(i)} className={cx.btnGhost}><Icon.Edit width={13} height={13} /> Edit</button>
                    <button disabled={busyId === i.userId} onClick={() => transferRole(i, "admin")} className={cx.btnGhost + " disabled:opacity-40"}>
                      <Icon.Swap width={13} height={13} /> Make Admin
                    </button>
                    <button disabled={busyId === i.userId} onClick={() => remove(i)} className={cx.btnDangerGhost + " ml-auto disabled:opacity-30"}>
                      <Icon.Trash width={13} height={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className={cx.thead}><th className={cx.th}>Name</th><th className={cx.th}>Branch</th><th className={cx.th}>Specialization</th><th className={cx.th}>Contact</th><th className={cx.th}>Actions</th></tr></thead>
                <tbody>
                  {instructors.map((i) => (
                    <tr key={i.userId} className={cx.tr}>
                      <td className={cx.td}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal to-teal-light flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">{i.avatar || i.name[0]}</div>
                          <span className="font-semibold text-slate-800 dark:text-slate-100">{i.name}</span>
                        </div>
                      </td>
                      <td className={cx.td}>{i.club ? <Badge tone="teal">{i.club}</Badge> : <span className="text-slate-400 dark:text-slate-500 text-xs">Unassigned</span>}</td>
                      <td className={cx.td}>{i.specialization || "—"}</td>
                      <td className={cx.td}>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-col gap-0.5">
                          <span>{i.email}</span>
                          {i.phone && <span>{i.phone}</span>}
                        </div>
                      </td>
                      <td className={cx.td}>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditing(i)} className={cx.btnGhost}><Icon.Edit width={13} height={13} /> Edit</button>
                          <button
                            disabled={busyId === i.userId}
                            onClick={() => transferRole(i, "admin")}
                            className={cx.btnGhost + " disabled:opacity-40"}
                          >
                            <Icon.Swap width={13} height={13} /> Make Admin
                          </button>
                          <button disabled={busyId === i.userId} onClick={() => remove(i)} className={cx.btnDangerGhost + " ml-auto disabled:opacity-30"}>
                            <Icon.Trash width={13} height={13} />
                          </button>
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

      {showAdd && <InstructorModal title="Add Instructor" clubs={clubs} onClose={() => setShowAdd(false)} onSave={addInstructor} />}
      {editing && <EditInstructorModal title="Edit Instructor" clubs={clubs} initial={editing} onClose={() => setEditing(null)} onSave={saveEdit} />}

      <Toast message={toast?.message} tone={toast?.tone} onClose={() => setToast(null)} />
    </div>
  );
}

function InstructorModal({ title, clubs, onClose, onSave }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", specialization: "", clubId: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const u = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setError(""); setSubmitting(true);
    try { await onSave(form); } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const valid = form.name.trim().length >= 2 && /\S+@\S+\.\S+/.test(form.email) && form.password.length >= 8;

  return (
    <ModalShell
      title={title}
      onClose={onClose}
      footer={<>
        <button onClick={onClose} className={cx.btnSecondary}>Cancel</button>
        <button disabled={!valid || submitting} onClick={submit} className={cx.btnPrimary}>{submitting ? "Creating…" : "Create Instructor"}</button>
      </>}
    >
      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}
      <div><label className={cx.label}>Full name *</label><input className={cx.input} value={form.name} onChange={(e) => u("name", e.target.value)} /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className={cx.label}>Email *</label><input type="email" className={cx.input} value={form.email} onChange={(e) => u("email", e.target.value)} /></div>
        <div><label className={cx.label}>Phone</label><input className={cx.input} value={form.phone} onChange={(e) => u("phone", e.target.value)} /></div>
      </div>
      <div><label className={cx.label}>Temporary password * <span className="text-slate-400 dark:text-slate-500 font-normal">(min 8 chars)</span></label><input type="password" className={cx.input} value={form.password} onChange={(e) => u("password", e.target.value)} /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className={cx.label}>Specialization</label><input className={cx.input} placeholder="e.g. Speed Skating" value={form.specialization} onChange={(e) => u("specialization", e.target.value)} /></div>
        <div><label className={cx.label}>Branch</label>
          <select className={cx.input} value={form.clubId} onChange={(e) => u("clubId", e.target.value)}>
            <option value="">No branch yet</option>
            {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
    </ModalShell>
  );
}

function EditInstructorModal({ title, clubs, initial, onClose, onSave }) {
  const [form, setForm] = useState({ name: initial.name, phone: initial.phone || "", specialization: initial.specialization || "", clubId: initial.clubId || "" });
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
      title={title}
      onClose={onClose}
      footer={<>
        <button onClick={onClose} className={cx.btnSecondary}>Cancel</button>
        <button disabled={!form.name || submitting} onClick={submit} className={cx.btnPrimary}>{submitting ? "Saving…" : "Save"}</button>
      </>}
    >
      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}
      <div><label className={cx.label}>Full name *</label><input className={cx.input} value={form.name} onChange={(e) => u("name", e.target.value)} /></div>
      <div><label className={cx.label}>Phone</label><input className={cx.input} value={form.phone} onChange={(e) => u("phone", e.target.value)} /></div>
      <div><label className={cx.label}>Specialization</label><input className={cx.input} value={form.specialization} onChange={(e) => u("specialization", e.target.value)} /></div>
      <div><label className={cx.label}>Branch</label>
        <select className={cx.input} value={form.clubId} onChange={(e) => u("clubId", e.target.value)}>
          <option value="">No branch</option>
          {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
    </ModalShell>
  );
}
