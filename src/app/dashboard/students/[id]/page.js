"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Icon } from "@/components/Icons";
import { Badge, PageLoading, EmptyState, cx } from "@/components/ui";
import Link from "next/link";

const PROGRAM_TONE = { Beginner: "emerald", Intermediate: "amber", Advanced: "red" };
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function StudentDetailPage() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    Promise.all([api(`/api/students?id=${id}`), api(`/api/payments?studentId=${id}`), api(`/api/attendance?studentId=${id}`)])
      .then(([s, p, a]) => { setStudent(s); setPayments(p); setAttendance(a); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoading />;
  if (notFound || !student) return <div className={cx.card}><EmptyState icon={Icon.Users} title="Student not found" /></div>;

  const presentCount = attendance.filter((a) => a.status === "present").length;
  const attRate = attendance.length ? Math.round((presentCount / attendance.length) * 100) : 0;
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-5">
      <Link href="/dashboard/students" className={cx.link + " inline-flex items-center gap-1"}><Icon.ArrowLeft width={14} height={14} /> Back to Students</Link>

      <div className={cx.card + " p-6"}>
        <div className="flex flex-wrap items-center gap-5 mb-6">
          {student.photo ? (
            // eslint-disable-next-line @next/next/no-img-element -- inline base64 data URL, nothing for next/image to optimize
            <img src={student.photo} alt={student.name} className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 border border-slate-200 dark:border-slate-700" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal to-amber flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {student.avatar || student.name[0]}
            </div>
          )}
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{student.name}</h2>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge tone={PROGRAM_TONE[student.program] || "slate"}>{student.program}</Badge>
              <span className="text-xs text-slate-500 dark:text-slate-400">{student.club || "Unassigned"}</span>
              {student.gender && <span className="text-xs text-slate-400 dark:text-slate-500">· {student.gender === "MALE" ? "Male" : "Female"}</span>}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 pt-5 border-t border-slate-100 dark:border-slate-700">
          {[
            ["Age", student.age ?? "—"],
            ["Guardian", student.guardian || "—"],
            ["Phone", student.phone || "—"],
            ["Enrolled", fmtDate(student.enrollDate)],
            ["Attendance Rate", <span key="r" className={attRate >= 75 ? "text-emerald-600" : attRate > 0 ? "text-red-500" : "text-slate-400 dark:text-slate-500"}>{attendance.length ? `${attRate}%` : "No data"}</span>],
            ["Total Paid", `৳${totalPaid.toLocaleString()}`],
          ].map(([lbl, val]) => (
            <div key={lbl}><div className="text-xs text-slate-400 dark:text-slate-500 font-medium">{lbl}</div><div className="text-sm font-semibold mt-0.5 text-slate-800 dark:text-slate-100">{val}</div></div>
          ))}
        </div>
      </div>

      <div className={cx.card}>
        <div className="px-5 pt-3">
          <div className="flex gap-1 border-b border-slate-100 dark:border-slate-700 -mx-5 px-5">
            {[["overview", "Profile"], ["payments", "Payments"]].map(([id_, label]) => (
              <button key={id_} onClick={() => setTab(id_)} className={`px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === id_ ? "border-teal text-teal" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {tab === "overview" ? (
          <div className="p-6 space-y-6">
            <DetailSection title="Address" fields={[
              ["Present address", student.presentAddress],
              ["Permanent address", student.permanentAddress],
            ]} />
            <DetailSection title="Guardian — Father" fields={[
              ["Name", student.fatherName], ["NID", student.fatherNid], ["Occupation", student.fatherOccupation],
              ["Occupation type", student.fatherOccupationType], ["Mobile", student.fatherMobile],
            ]} />
            <DetailSection title="Guardian — Mother" fields={[
              ["Name", student.motherName], ["NID", student.motherNid], ["Occupation", student.motherOccupation],
              ["Occupation type", student.motherOccupationType], ["Mobile", student.motherMobile],
            ]} />
            <DetailSection title="Personal details" fields={[
              ["Date of birth", fmtDate(student.dob)], ["Birth registration", student.birthReg], ["Blood group", student.bloodGroup],
              ["Present school", student.presentSchool], ["Religion", student.religion],
            ]} />
            <DetailSection title="Admission details" fields={[
              ["Session", student.session], ["Shift", student.shift],
            ]} />
          </div>
        ) : (
          <>
            {payments.length === 0 ? <EmptyState icon={Icon.CreditCard} title="No payments recorded" /> : (
              <>
                <div className="sm:hidden divide-y divide-slate-100">
                  {payments.map((p) => (
                    <Link key={p.id} href={`/dashboard/receipt/${p.id}`} className="flex items-center justify-between gap-3 p-4 active:bg-slate-50 dark:active:bg-slate-700/60">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 dark:text-slate-100 truncate">{p.receiptNo}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{p.type.replace(/_/g, " ")} · {p.date}</div>
                      </div>
                      <div className="font-bold text-slate-800 dark:text-slate-100 flex-shrink-0">৳{p.amount.toLocaleString()}</div>
                    </Link>
                  ))}
                </div>
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className={cx.thead}><th className={cx.th}>Receipt</th><th className={cx.th}>Amount</th><th className={cx.th}>Type</th><th className={cx.th}>Date</th><th className={cx.th}>Action</th></tr></thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr key={p.id} className={cx.tr}>
                          <td className={cx.td + " font-semibold"}>{p.receiptNo}</td>
                          <td className={cx.td + " font-bold text-slate-800 dark:text-slate-100"}>৳{p.amount.toLocaleString()}</td>
                          <td className={cx.td}>{p.type.replace(/_/g, " ")}</td>
                          <td className={cx.td + " text-slate-400 dark:text-slate-500"}>{p.date}</td>
                          <td className={cx.td}><Link href={`/dashboard/receipt/${p.id}`} className={cx.link}>View Receipt →</Link></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DetailSection({ title, fields }) {
  const visible = fields.filter(([, v]) => v);
  if (visible.length === 0) return null;
  return (
    <div>
      <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">{title}</h3>
      <div className="grid sm:grid-cols-2 gap-x-5 gap-y-3">
        {visible.map(([lbl, val]) => (
          <div key={lbl}><div className="text-xs text-slate-400 dark:text-slate-500 font-medium">{lbl}</div><div className="text-sm font-semibold mt-0.5 text-slate-800 dark:text-slate-100 whitespace-pre-wrap">{val}</div></div>
        ))}
      </div>
    </div>
  );
}
