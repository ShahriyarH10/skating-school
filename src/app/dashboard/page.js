"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Icon } from "@/components/Icons";
import { Badge, PageLoading, EmptyState, cx } from "@/components/ui";
import Link from "next/link";

export default function DashboardHome() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api("/api/students"), api("/api/payments"), api("/api/notices")])
      .then(([s, p, n]) => { setStudents(s); setPayments(p); setNotices(n); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoading statCards={4} />;

  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);
  const urgentNotices = notices.filter((n) => n.urgent);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthRevenue = payments.filter((p) => p.date.startsWith(thisMonth)).reduce((s, p) => s + p.amount, 0);

  const greeting = user.role === "student" ? "Here's what's happening with your training." : "Here's what's happening across your branch today.";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900">Welcome back, {user.name.split(" ")[0]}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{greeting}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Icon.Users} label={user.role === "student" ? "My Program" : "Total Students"} value={user.role === "student" ? (students[0]?.program || "—") : students.length} tone="teal" />
        {user.role !== "student" && <StatCard icon={Icon.Wallet} label="Total Revenue" value={`৳${totalRevenue.toLocaleString()}`} tone="emerald" />}
        {user.role !== "student" && <StatCard icon={Icon.TrendingUp} label="This Month" value={`৳${monthRevenue.toLocaleString()}`} tone="amber" />}
        <StatCard icon={Icon.CreditCard} label="Payments" value={payments.length} tone="navy" />
        <StatCard icon={Icon.Bell} label="Urgent Notices" value={urgentNotices.length} tone={urgentNotices.length ? "red" : "slate"} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className={cx.card}>
          <div className={cx.cardHeader}>
            <h3 className="font-bold text-sm text-slate-800">Recent Payments</h3>
            <Link href="/dashboard/fees" className={cx.link}>View all →</Link>
          </div>
          {payments.length === 0 ? (
            <EmptyState icon={Icon.CreditCard} title="No payments yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className={cx.thead}><th className={cx.th}>Student</th><th className={cx.th}>Amount</th><th className={cx.th}>Date</th></tr></thead>
                <tbody>
                  {payments.slice(0, 6).map((p) => (
                    <tr key={p.id} className={cx.tr}>
                      <td className={cx.td + " font-semibold"}>{p.studentName}</td>
                      <td className={cx.td + " font-bold text-slate-800"}>৳{p.amount.toLocaleString()}</td>
                      <td className={cx.td + " text-slate-400"}>{p.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={cx.card}>
          <div className={cx.cardHeader}>
            <h3 className="font-bold text-sm text-slate-800">Notices</h3>
            <Link href="/dashboard/notices" className={cx.link}>View all →</Link>
          </div>
          {notices.length === 0 ? (
            <EmptyState icon={Icon.Bell} title="No notices yet" />
          ) : (
            <div className="p-4 space-y-2.5">
              {notices.slice(0, 4).map((n) => (
                <div key={n.id} className={`p-3.5 rounded-xl border-l-[3px] bg-slate-50/70 ${n.urgent ? "border-l-red-500" : "border-l-teal"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] text-slate-400">{n.date}</span>
                    {n.urgent && <Badge tone="red">Urgent</Badge>}
                  </div>
                  <div className="font-semibold text-sm text-slate-800">{n.title}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: IconComp, label, value, tone = "slate" }) {
  const tones = {
    teal: "from-teal to-teal-light",
    emerald: "from-emerald-500 to-emerald-400",
    amber: "from-amber to-amber-light",
    navy: "from-navy to-navy-light",
    red: "from-red-500 to-red-400",
    slate: "from-slate-400 to-slate-300",
  };
  return (
    <div className={cx.card + " p-4 sm:p-5"}>
      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${tones[tone]} flex items-center justify-center text-white mb-3`}>
        <IconComp width={16} height={16} />
      </div>
      <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight truncate">{value}</div>
      <div className="text-xs font-medium text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}
