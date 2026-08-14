"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Icon } from "@/components/Icons";
import { PageLoading, Toast, cx } from "@/components/ui";

const FIELDS = [
  { key: "school_name", label: "School Name" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "address", label: "Address" },
];
const FEE_FIELDS = [
  { key: "admission_fee", label: "Admission Fee (৳)" },
  { key: "monthly_fee", label: "Monthly Fee (৳)" },
];

export default function SettingsPage() {
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { api("/api/settings").then(setValues).finally(() => setLoading(false)); }, []);

  const u = (k, v) => setValues((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const keys = [...FIELDS, ...FEE_FIELDS].map((f) => f.key);
      await Promise.all(keys.map((key) => api("/api/settings", { method: "PUT", body: JSON.stringify({ key, value: values[key] ?? "" }) })));
      setToast({ message: "Settings saved", tone: "emerald" });
    } catch (e) {
      setToast({ message: e.message, tone: "red" });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  if (loading) return <PageLoading statCards={0} />;

  return (
    <div className={cx.card + " p-6 max-w-xl"}>
      <div className="flex items-center gap-3 mb-1">
        <Icon.Settings width={18} height={18} className="text-teal" />
        <h3 className="font-bold text-slate-800 dark:text-slate-100">School Settings</h3>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">These values appear on receipts and across the public site.</p>

      <div className="space-y-4">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className={cx.label}>{f.label}</label>
            <input className={cx.input} value={values[f.key] || ""} onChange={(e) => u(f.key, e.target.value)} />
          </div>
        ))}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEE_FIELDS.map((f) => (
            <div key={f.key}>
              <label className={cx.label}>{f.label}</label>
              <input type="number" className={cx.input} value={values[f.key] || ""} onChange={(e) => u(f.key, e.target.value)} />
            </div>
          ))}
        </div>
        <button onClick={save} disabled={saving} className={cx.btnPrimary + " disabled:opacity-60"}>
          {saving ? "Saving…" : <><Icon.Check width={16} height={16} /> Save Settings</>}
        </button>
      </div>
      <Toast message={toast?.message} tone={toast?.tone} onClose={() => setToast(null)} />
    </div>
  );
}
