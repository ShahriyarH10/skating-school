"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Icon } from "@/components/Icons";
import { PageLoading, EmptyState, Toast, ModalShell, cx } from "@/components/ui";
import Link from "next/link";

const METHOD_LABEL = { cash: "Cash", bkash: "bKash", nagad: "Nagad", rocket: "Rocket", bank_transfer: "Bank Transfer" };
const TYPE_LABEL = { monthly_fee: "Monthly Fee", admission_fee: "Admission Fee", equipment: "Equipment", event_fee: "Event Fee" };

export default function FeesPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const load = () => Promise.all([api("/api/payments"), api("/api/students")]).then(([p, s]) => { setPayments(p); setStudents(s); }).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const canRecord = user.role !== "student";

  const handleAdd = async (form) => {
    const res = await api("/api/payments", { method: "POST", body: JSON.stringify(form) });
    setShowModal(false);
    setToast({ message: `Payment recorded · ${res.receiptNo}`, tone: "emerald" });
    setTimeout(() => setToast(null), 3500);
    load();
  };

  if (loading) return <PageLoading />;

  const total = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Icon.Wallet width={15} height={15} />
          <span className="font-semibold text-slate-700 dark:text-slate-300">৳{total.toLocaleString()}</span> total across {payments.length} payment{payments.length !== 1 ? "s" : ""}
        </div>
        {canRecord && <button onClick={() => setShowModal(true)} className={cx.btnPrimary}><Icon.Plus width={16} height={16} /> Record Payment</button>}
      </div>

      <div className={cx.card}>
        {payments.length === 0 ? (
          <EmptyState icon={Icon.CreditCard} title="No payments recorded" />
        ) : (
          <>
            <div className="md:hidden divide-y divide-slate-100">
              {payments.map((p) => (
                <Link key={p.id} href={`/dashboard/receipt/${p.id}`} className="block p-4 active:bg-slate-50 dark:active:bg-slate-700/60 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {canRecord && <div className="font-semibold text-[15px] text-slate-800 dark:text-slate-100 truncate">{p.studentName}</div>}
                      <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{p.receiptNo} · {p.date}</div>
                    </div>
                    <div className="font-bold text-slate-800 dark:text-slate-100 text-[15px] flex-shrink-0">৳{p.amount.toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="bg-slate-100 rounded-full px-2.5 py-1 font-medium">{TYPE_LABEL[p.type] || p.type}</span>
                    <span className="bg-slate-100 rounded-full px-2.5 py-1 font-medium">{METHOD_LABEL[p.method] || p.method}</span>
                    <span className="truncate">{p.month}</span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className={cx.thead}>
                  {canRecord && <th className={cx.th}>Student</th>}
                  <th className={cx.th}>Receipt #</th><th className={cx.th}>Amount</th><th className={cx.th}>Type</th>
                  <th className={cx.th}>Month</th><th className={cx.th}>Method</th><th className={cx.th}>Date</th><th className={cx.th}>Action</th>
                </tr></thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className={cx.tr}>
                      {canRecord && <td className={cx.td + " font-semibold"}>{p.studentName}</td>}
                      <td className={cx.td + " font-semibold text-slate-600 dark:text-slate-300"}>{p.receiptNo}</td>
                      <td className={cx.td + " font-bold text-slate-800 dark:text-slate-100"}>৳{p.amount.toLocaleString()}</td>
                      <td className={cx.td}>{TYPE_LABEL[p.type] || p.type}</td>
                      <td className={cx.td}>{p.month}</td>
                      <td className={cx.td}>{METHOD_LABEL[p.method] || p.method}</td>
                      <td className={cx.td + " text-slate-400 dark:text-slate-500"}>{p.date}</td>
                      <td className={cx.td}><Link href={`/dashboard/receipt/${p.id}`} className={cx.link}>View Receipt →</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {showModal && <AddPaymentModal students={students} onClose={() => setShowModal(false)} onAdd={handleAdd} />}
      <Toast message={toast?.message} tone={toast?.tone} onClose={() => setToast(null)} />
    </div>
  );
}

// Native <input type="month"> gives "2026-08"; payments store/display a
// human label like "August 2026" everywhere else (receipts, tables), so
// convert on the way out rather than changing that stored format.
function monthInputToLabel(value) {
  if (!value) return "";
  const [y, m] = value.split("-").map(Number);
  if (!y || !m) return "";
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function AddPaymentModal({ students, onClose, onAdd }) {
  const thisMonth = new Date().toISOString().slice(0, 7); // "2026-08"
  const [form, setForm] = useState({ studentId: students[0]?.id || "", amount: "2000", method: "cash", type: "monthly_fee", month: monthInputToLabel(thisMonth) });
  const [monthRaw, setMonthRaw] = useState(thisMonth);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const u = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setError(""); setSubmitting(true);
    try { await onAdd({ ...form, amount: Number(form.amount) }); } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <ModalShell
      title="Record Payment"
      onClose={onClose}
      footer={<>
        <button onClick={onClose} className={cx.btnSecondary}>Cancel</button>
        <button disabled={!form.studentId || !form.amount || !form.month || submitting} onClick={submit} className={cx.btnPrimary}>{submitting ? "Recording…" : "Record Payment"}</button>
      </>}
    >
      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}
      {students.length === 0 ? (
        <div className="text-sm text-slate-500 dark:text-slate-400">No students available. Add a student first.</div>
      ) : (
        <div><label className={cx.label}>Student *</label>
          <select className={cx.input} value={form.studentId} onChange={(e) => u("studentId", e.target.value)}>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className={cx.label}>Amount (৳) *</label><input type="number" min="1" className={cx.input} value={form.amount} onChange={(e) => u("amount", e.target.value)} /></div>
        <div><label className={cx.label}>Method</label>
          <select className={cx.input} value={form.method} onChange={(e) => u("method", e.target.value)}>
            {Object.entries(METHOD_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className={cx.label}>Type</label>
          <select className={cx.input} value={form.type} onChange={(e) => {
            const t = e.target.value;
            u("type", t);
            if (t === "monthly_fee") u("month", monthInputToLabel(monthRaw));
          }}>
            {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        {form.type === "monthly_fee" ? (
          <div><label className={cx.label}>Month *</label>
            <input type="month" className={cx.input} value={monthRaw} onChange={(e) => { setMonthRaw(e.target.value); u("month", monthInputToLabel(e.target.value)); }} />
          </div>
        ) : (
          <div><label className={cx.label}>Description *</label><input className={cx.input} placeholder="e.g. Skates - Size 8" value={form.month} onChange={(e) => u("month", e.target.value)} /></div>
        )}
      </div>
    </ModalShell>
  );
}
