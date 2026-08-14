"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Icon } from "@/components/Icons";
import { Badge, PageLoading, EmptyState, Toast, ModalShell, cx } from "@/components/ui";

const DAY_ORDER = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PROGRAM_TONE = { Beginner: "emerald", Intermediate: "amber", Advanced: "red" };

export default function SchedulePage() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState(null);

  // Only admins get the add-slot UI: assigning an instructor to a slot requires
  // seeing the full instructor roster, which is an admin-only endpoint.
  const canEdit = user.role === "admin";

  const load = () => api("/api/schedules").then(setSchedules).finally(() => setLoading(false));
  useEffect(() => {
    load();
    if (canEdit) {
      api("/api/clubs").then(setClubs).catch(() => {});
      api("/api/staff").then((d) => setInstructors(d.instructors || [])).catch(() => {});
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addSchedule = async (form) => {
    await api("/api/schedules", { method: "POST", body: JSON.stringify(form) });
    setShowAdd(false);
    setToast({ message: "Schedule slot added", tone: "emerald" });
    setTimeout(() => setToast(null), 3000);
    load();
  };

  if (loading) return <PageLoading statCards={0} />;

  return (
    <div className="space-y-5">
      {canEdit && (
        <div className="flex justify-end">
          <button onClick={() => setShowAdd(true)} className={cx.btnPrimary}><Icon.Plus width={16} height={16} /> Add Schedule</button>
        </div>
      )}

      <div className={cx.card}>
        <div className={cx.cardHeader}><h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Weekly Training Schedule</h3></div>
        {schedules.length === 0 ? (
          <EmptyState icon={Icon.Calendar} title="No schedule slots yet" hint={canEdit ? "Add your first training slot." : "Check back once your branch schedule is set."} />
        ) : (
          <>
            <div className="md:hidden divide-y divide-slate-100">
              {DAY_ORDER.filter((day) => schedules.some((s) => s.day === day)).map((day) => (
                <div key={day} className="p-4">
                  <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">{day}</div>
                  <div className="space-y-2.5">
                    {schedules.filter((s) => s.day === day).map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/40 rounded-xl p-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <Icon.Clock width={13} height={13} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />{s.time}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{s.instructor} · {s.club}</div>
                        </div>
                        <Badge tone={PROGRAM_TONE[s.program] || "slate"}>{s.program}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className={cx.thead}>
                  <th className={cx.th}>Day</th><th className={cx.th}>Time</th><th className={cx.th}>Program</th><th className={cx.th}>Branch</th><th className={cx.th}>Instructor</th>
                </tr></thead>
                <tbody>
                  {DAY_ORDER.flatMap((day) => {
                    const daySchedules = schedules.filter((s) => s.day === day);
                    return daySchedules.map((s, i) => (
                      <tr key={s.id} className={cx.tr}>
                        {i === 0 && <td rowSpan={daySchedules.length} className="px-4 py-3.5 font-bold align-top text-slate-800 dark:text-slate-100">{day}</td>}
                        <td className={cx.td}><span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300"><Icon.Clock width={13} height={13} className="text-slate-400 dark:text-slate-500" />{s.time}</span></td>
                        <td className={cx.td}><Badge tone={PROGRAM_TONE[s.program] || "slate"}>{s.program}</Badge></td>
                        <td className={cx.td + " text-xs"}>{s.club}</td>
                        <td className={cx.td}>{s.instructor}</td>
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {showAdd && <ScheduleModal clubs={clubs} instructors={instructors} onClose={() => setShowAdd(false)} onSave={addSchedule} />}
      <Toast message={toast?.message} tone={toast?.tone} onClose={() => setToast(null)} />
    </div>
  );
}

function ScheduleModal({ clubs, instructors, onClose, onSave }) {
  const [form, setForm] = useState({ day: DAY_ORDER[0], time: "", program: "Beginner", clubId: clubs[0]?.id || "", instructorId: instructors[0]?.instructorId || "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const u = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const clubInstructors = instructors.length
    ? instructors.filter((i) => i.clubId === form.clubId)
    : [];

  const submit = async () => {
    setError(""); setSubmitting(true);
    try { await onSave(form); } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const valid = form.day && form.time.trim().length >= 3 && form.clubId && form.instructorId;

  return (
    <ModalShell
      title="Add Schedule Slot"
      onClose={onClose}
      footer={<>
        <button onClick={onClose} className={cx.btnSecondary}>Cancel</button>
        <button disabled={!valid || submitting} onClick={submit} className={cx.btnPrimary}>{submitting ? "Adding…" : "Add Slot"}</button>
      </>}
    >
      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className={cx.label}>Day *</label>
          <select className={cx.input} value={form.day} onChange={(e) => u("day", e.target.value)}>
            {DAY_ORDER.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div><label className={cx.label}>Time *</label><input className={cx.input} placeholder="4:00 PM - 5:00 PM" value={form.time} onChange={(e) => u("time", e.target.value)} /></div>
      </div>
      <div><label className={cx.label}>Program *</label>
        <select className={cx.input} value={form.program} onChange={(e) => u("program", e.target.value)}>
          <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
        </select>
      </div>
      <div><label className={cx.label}>Branch *</label>
        <select className={cx.input} value={form.clubId} onChange={(e) => { u("clubId", e.target.value); u("instructorId", ""); }}>
          {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div><label className={cx.label}>Instructor * <span className="text-slate-400 dark:text-slate-500 font-normal">(must belong to selected branch)</span></label>
        <select className={cx.input} value={form.instructorId} onChange={(e) => u("instructorId", e.target.value)}>
          <option value="">Select instructor…</option>
          {clubInstructors.map((i) => <option key={i.instructorId} value={i.instructorId}>{i.name}</option>)}
        </select>
        {form.clubId && clubInstructors.length === 0 && <p className="text-xs text-amber-600 mt-1.5">No instructor assigned to this branch yet.</p>}
      </div>
    </ModalShell>
  );
}
