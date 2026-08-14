"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Icon } from "@/components/Icons";
import { PageLoading, cx } from "@/components/ui";

export default function ReportsPage() {
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api("/api/students"), api("/api/payments")])
      .then(([s, p]) => { setStudents(s); setPayments(p); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoading />;

  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);
  const byClub = {}; students.forEach((s) => { const k = s.club || "Unassigned"; byClub[k] = (byClub[k] || 0) + 1; });
  const byProgram = {}; students.forEach((s) => { byProgram[s.program] = (byProgram[s.program] || 0) + 1; });
  const maxClub = Math.max(1, ...Object.values(byClub));
  const maxProgram = Math.max(1, ...Object.values(byProgram));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Icon.Users} label="Total Students" value={students.length} tone="teal" />
        <StatCard icon={Icon.Wallet} label="Total Revenue" value={`৳${totalRevenue.toLocaleString()}`} tone="emerald" />
        <StatCard icon={Icon.CreditCard} label="Payments Recorded" value={payments.length} tone="amber" />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className={cx.card}>
          <div className={cx.cardHeader}><h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Students by Branch</h3></div>
          <div className="p-5 space-y-3">
            {Object.entries(byClub).map(([k, v]) => (
              <div key={k}>
                <div className="flex justify-between text-sm mb-1"><span className="text-slate-600 dark:text-slate-300">{k}</span><span className="font-bold text-slate-800 dark:text-slate-100">{v}</span></div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-gradient-to-r from-teal to-teal-light rounded-full" style={{ width: `${(v / maxClub) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className={cx.card}>
          <div className={cx.cardHeader}><h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Students by Program</h3></div>
          <div className="p-5 space-y-3">
            {Object.entries(byProgram).map(([k, v]) => (
              <div key={k}>
                <div className="flex justify-between text-sm mb-1"><span className="text-slate-600 dark:text-slate-300">{k}</span><span className="font-bold text-slate-800 dark:text-slate-100">{v}</span></div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-gradient-to-r from-amber to-amber-light rounded-full" style={{ width: `${(v / maxProgram) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: IconComp, label, value, tone }) {
  const tones = { teal: "from-teal to-teal-light", emerald: "from-emerald-500 to-emerald-400", amber: "from-amber to-amber-light" };
  return (
    <div className={cx.card + " p-5"}>
      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${tones[tone]} flex items-center justify-center text-white mb-3`}>
        <IconComp width={16} height={16} />
      </div>
      <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">{value}</div>
      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}
