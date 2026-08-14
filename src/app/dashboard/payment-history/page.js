"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Icon } from "@/components/Icons";
import { Badge, PageLoading, EmptyState, cx } from "@/components/ui";
import Link from "next/link";

const monthLabel = (y, m) => new Date(y, m, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

// Last 12 calendar months (most recent first), so the picker always has
// somewhere useful to land even before any payments exist for a given month.
function recentMonths(count = 12) {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return monthLabel(d.getFullYear(), d.getMonth());
  });
}

export default function PaymentHistoryPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(recentMonths(1)[0]);
  const [search, setSearch] = useState("");
  const [clubFilter, setClubFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | paid | unpaid

  useEffect(() => {
    Promise.all([api("/api/students"), api("/api/payments")])
      .then(([s, p]) => { setStudents(s); setPayments(p); })
      .finally(() => setLoading(false));
    if (user.role === "admin") api("/api/clubs?all=1").then(setClubs).catch(() => {});
  }, [user.role]);

  // Union of the last 12 months and any month label that actually appears in
  // the data, so older/irregular month values already on record never just
  // silently disappear from the picker.
  const monthOptions = useMemo(() => {
    const base = recentMonths(12);
    const fromData = payments.filter((p) => p.type === "monthly_fee").map((p) => p.month);
    return Array.from(new Set([...base, ...fromData]));
  }, [payments]);

  const paidByStudent = useMemo(() => {
    const map = new Map();
    payments.forEach((p) => {
      if (p.type === "monthly_fee" && p.month === month) map.set(p.studentId, p);
    });
    return map;
  }, [payments, month]);

  const rows = useMemo(() => {
    return students
      .filter((s) => !clubFilter || s.clubId === clubFilter)
      .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || (s.guardian || "").toLowerCase().includes(search.toLowerCase()))
      .map((s) => ({ student: s, payment: paidByStudent.get(s.id) || null }))
      .filter((r) => statusFilter === "all" || (statusFilter === "paid" ? r.payment : !r.payment));
  }, [students, paidByStudent, search, clubFilter, statusFilter]);

  if (loading) return <PageLoading />;

  const paidCount = students.filter((s) => paidByStudent.has(s.id)).length;
  const unpaidCount = students.length - paidCount;
  const collected = Array.from(paidByStudent.values()).reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Icon.Calendar width={15} height={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <select className={cx.input + " pl-9 w-48 font-medium"} value={month} onChange={(e) => setMonth(e.target.value)}>
            {monthOptions.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Icon.Search width={15} height={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input className={cx.input + " pl-9"} placeholder="Search by name or guardian…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {user.role === "admin" && (
          <select className={cx.input + " w-44"} value={clubFilter} onChange={(e) => setClubFilter(e.target.value)}>
            <option value="">All branches</option>
            {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={Icon.Users} label="Students" value={students.length} tone="navy" />
        <SummaryCard icon={Icon.Check} label={`Paid — ${month}`} value={paidCount} tone="emerald" onClick={() => setStatusFilter(statusFilter === "paid" ? "all" : "paid")} active={statusFilter === "paid"} />
        <SummaryCard icon={Icon.AlertTriangle} label="Unpaid" value={unpaidCount} tone={unpaidCount ? "red" : "slate"} onClick={() => setStatusFilter(statusFilter === "unpaid" ? "all" : "unpaid")} active={statusFilter === "unpaid"} />
        <SummaryCard icon={Icon.Wallet} label="Collected" value={`৳${collected.toLocaleString()}`} tone="amber" />
      </div>

      <div className={cx.card}>
        {rows.length === 0 ? (
          <EmptyState icon={Icon.Wallet} title="No students match" hint="Try a different search, branch, or status filter." />
        ) : (
          <>
            <div className="md:hidden divide-y divide-slate-100">
              {rows.map(({ student: s, payment: p }) => (
                <div key={s.id} className="flex items-center gap-3 p-4">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal to-amber flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">{s.avatar || s.name[0]}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{s.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{s.club || "Unassigned"} · {s.program}</div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {p ? (
                      <>
                        <Badge tone="emerald">Paid</Badge>
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">৳{p.amount.toLocaleString()}</div>
                      </>
                    ) : (
                      <Badge tone="red">Unpaid</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className={cx.thead}>
                  <th className={cx.th}>Student</th><th className={cx.th}>Branch</th><th className={cx.th}>Program</th>
                  <th className={cx.th}>Status</th><th className={cx.th}>Amount</th><th className={cx.th}>Date</th><th className={cx.th}>Receipt</th>
                </tr></thead>
                <tbody>
                  {rows.map(({ student: s, payment: p }) => (
                    <tr key={s.id} className={cx.tr}>
                      <td className={cx.td}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal to-amber flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">{s.avatar || s.name[0]}</div>
                          <span className="font-semibold text-slate-800 dark:text-slate-100">{s.name}</span>
                        </div>
                      </td>
                      <td className={cx.td + " text-xs"}>{s.club || "Unassigned"}</td>
                      <td className={cx.td}>{s.program}</td>
                      <td className={cx.td}>{p ? <Badge tone="emerald">Paid</Badge> : <Badge tone="red">Unpaid</Badge>}</td>
                      <td className={cx.td + " font-bold text-slate-800 dark:text-slate-100"}>{p ? `৳${p.amount.toLocaleString()}` : "—"}</td>
                      <td className={cx.td + " text-slate-400 dark:text-slate-500"}>{p ? p.date : "—"}</td>
                      <td className={cx.td}>{p ? <Link href={`/dashboard/receipt/${p.id}`} className={cx.link}>View →</Link> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ icon: IconComp, label, value, tone, onClick, active }) {
  const tones = { navy: "from-navy to-navy-light", emerald: "from-emerald-500 to-emerald-400", amber: "from-amber to-amber-light", red: "from-red-500 to-red-400", slate: "from-slate-400 to-slate-300" };
  const Comp = onClick ? "button" : "div";
  return (
    <Comp onClick={onClick} className={`${cx.card} p-4 sm:p-5 text-left w-full transition-all ${active ? "ring-2 ring-teal ring-offset-2" : ""} ${onClick ? "hover:shadow-md active:scale-[0.98]" : ""}`}>
      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${tones[tone]} flex items-center justify-center text-white mb-3`}>
        <IconComp width={16} height={16} />
      </div>
      <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight truncate">{value}</div>
      <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{label}</div>
    </Comp>
  );
}
