"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Icon } from "@/components/Icons";
import { PageLoading, EmptyState, Toast, cx } from "@/components/ui";

export default function AttendancePage() {
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [marks, setMarks] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api("/api/students").then(setStudents).finally(() => setLoading(false)); }, []);

  useEffect(() => {
    api(`/api/attendance?date=${date}`).then((records) => {
      const m = {};
      records.forEach((r) => { m[r.studentId] = r.status; });
      setMarks(m);
    });
  }, [date]);

  const toggle = (sid, status) => setMarks((prev) => ({ ...prev, [sid]: prev[sid] === status ? undefined : status }));

  const save = async () => {
    setSaving(true);
    const records = Object.entries(marks).filter(([, status]) => status).map(([studentId, status]) => ({ studentId, status }));
    try {
      await api("/api/attendance", { method: "POST", body: JSON.stringify({ date, records }) });
      setToast({ message: `Attendance saved for ${records.length} student${records.length !== 1 ? "s" : ""}`, tone: "emerald" });
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      setToast({ message: e.message, tone: "red" });
      setTimeout(() => setToast(null), 3000);
    } finally { setSaving(false); }
  };

  if (loading) return <PageLoading statCards={0} />;

  const markedCount = Object.values(marks).filter(Boolean).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Icon.Calendar width={15} height={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input type="date" className={cx.input + " pl-9 w-48"} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <span className="text-sm text-slate-500 dark:text-slate-400">{markedCount} / {students.length} marked</span>
        <div className="flex-1" />
        <button onClick={save} disabled={saving} className={cx.btnPrimary + " disabled:opacity-60"}>
          {saving ? "Saving…" : <><Icon.Check width={16} height={16} /> Save Attendance</>}
        </button>
      </div>

      {students.length === 0 ? (
        <div className={cx.card}><EmptyState icon={Icon.Clipboard} title="No students to mark" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {students.map((s) => {
            const state = marks[s.id];
            return (
              <div key={s.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-colors duration-150 bg-white dark:bg-slate-800 ${
                state === "present" ? "border-emerald-300 bg-emerald-50/60" : state === "absent" ? "border-red-300 bg-red-50/60" : "border-slate-200 dark:border-slate-700"
              }`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal to-amber flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">{s.avatar || s.name[0]}</div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{s.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{s.program} · {s.club || "Unassigned"}</div>
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => toggle(s.id, "present")}
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-150 ${
                      state === "present" ? "bg-emerald-500 text-white border-emerald-500 shadow-sm" : "border-slate-200 dark:border-slate-700 text-emerald-500 hover:bg-emerald-50"
                    }`}
                  ><Icon.Check width={15} height={15} /></button>
                  <button
                    onClick={() => toggle(s.id, "absent")}
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all duration-150 ${
                      state === "absent" ? "bg-red-500 text-white border-red-500 shadow-sm" : "border-slate-200 dark:border-slate-700 text-red-500 hover:bg-red-50"
                    }`}
                  ><Icon.X width={15} height={15} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Toast message={toast?.message} tone={toast?.tone} onClose={() => setToast(null)} />
    </div>
  );
}
