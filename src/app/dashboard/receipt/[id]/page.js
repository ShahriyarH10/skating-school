"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Icon } from "@/components/Icons";
import { PageLoading, EmptyState, cx } from "@/components/ui";
import Link from "next/link";

const METHOD_LABEL = { cash: "Cash", bkash: "bKash", nagad: "Nagad", rocket: "Rocket", bank_transfer: "Bank Transfer" };
const TYPE_LABEL = { monthly_fee: "Monthly Fee", admission_fee: "Admission Fee", equipment: "Equipment", event_fee: "Event Fee" };

export default function ReceiptPage() {
  const { id } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api(`/api/receipts?id=${id}`).then(setReceipt).catch(() => setNotFound(true)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoading statCards={0} />;
  if (notFound || !receipt) return <div className={cx.card}><EmptyState icon={Icon.CreditCard} title="Receipt not found" /></div>;

  const methodLabel = METHOD_LABEL[receipt.method] || receipt.method;
  const typeLabel = TYPE_LABEL[receipt.type] || receipt.type;

  // A real anchor + wa.me is far more resistant to popup blockers than a
  // window.open() call — production browsers are noticeably stricter about
  // JS-triggered popups than most people's dev setups are.
  const waHref = `https://wa.me/?text=${encodeURIComponent(
    `Payment Receipt - Online Skating School\n\nReceipt: ${receipt.receiptNo}\nStudent: ${receipt.studentName}\nAmount: ৳${receipt.amount.toLocaleString()}\nDate: ${receipt.date}\nType: ${typeLabel} (${receipt.month})\nMethod: ${methodLabel}\n\nThank you for your payment!`
  )}`;

  const infoRows = [
    { icon: Icon.User, label: "Student", value: receipt.studentName },
    { icon: Icon.Users, label: "Guardian", value: receipt.guardian || "—" },
    { icon: Icon.Building, label: "Branch", value: receipt.club || "—" },
    { icon: Icon.Sparkles, label: "Program", value: receipt.program },
  ];
  const paymentRows = [
    { icon: Icon.Calendar, label: "Payment For", value: `${typeLabel} — ${receipt.month}` },
    { icon: Icon.CreditCard, label: "Method", value: methodLabel },
    { icon: Icon.Clock, label: "Date", value: receipt.date },
  ];

  return (
    <div className="space-y-5">
      <Link href="/dashboard/fees" className={cx.link + " inline-flex items-center gap-1 no-print"}>
        <Icon.ArrowLeft width={14} height={14} /> Back to Payments
      </Link>

      <div className="print-area max-w-2xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-teal/40 overflow-hidden animate-scaleIn">
          {/* Header band */}
          <div className="relative bg-gradient-to-br from-navy via-teal-dark to-teal px-7 pt-7 pb-8 text-center overflow-hidden">
            <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "20px 20px" }} />
            <span className="absolute top-4 right-4 inline-flex items-center gap-1 bg-emerald-400 text-emerald-950 text-[11px] font-extrabold px-2.5 py-1 rounded-full tracking-wide">
              <Icon.Check width={12} height={12} strokeWidth={3} /> PAID
            </span>
            <div className="relative w-12 h-12 rounded-2xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center text-2xl mx-auto mb-3">⛸</div>
            <h2 className="relative text-lg font-extrabold text-white">Online Skating School</h2>
            <p className="relative text-[11px] text-teal-100/90 mt-1">Dhaka, Bangladesh · +880 1707 080 260</p>
            <p className="relative text-[11px] text-teal-100/90">onlineskatingschool@gmail.com</p>
          </div>

          {/* Receipt number strip */}
          <div className="flex items-center justify-between px-7 py-3 bg-amber-50 border-b border-dashed border-amber-200">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-widest">Receipt No.</span>
            <span className="font-mono font-bold text-sm text-amber-800 tracking-wide">{receipt.receiptNo}</span>
          </div>

          <div className="px-7 py-6 space-y-5">
            <div>
              <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Student</h3>
              <div className="space-y-2.5">
                {infoRows.map((r) => (
                  <div key={r.label} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-teal/10 text-teal-dark flex items-center justify-center flex-shrink-0">
                      <r.icon width={14} height={14} />
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 w-20 flex-shrink-0">{r.label}</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 text-right flex-1 truncate">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-dashed border-slate-200 dark:border-slate-700" />

            <div>
              <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Payment</h3>
              <div className="space-y-2.5">
                {paymentRows.map((r) => (
                  <div key={r.label} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-amber/10 text-amber-700 flex items-center justify-center flex-shrink-0">
                      <r.icon width={14} height={14} />
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 w-20 flex-shrink-0">{r.label}</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 text-right flex-1 truncate">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/70 rounded-xl px-5 py-4 flex items-center justify-between">
              <span className="text-sm font-bold text-emerald-800">Amount Paid</span>
              <span className="text-2xl font-extrabold text-emerald-700 tracking-tight">৳{receipt.amount.toLocaleString()}</span>
            </div>

            <div className="text-center text-[11px] text-slate-400 dark:text-slate-500 pt-1">
              <p>Thank you for your payment.</p>
              <p>This is a computer-generated receipt and needs no signature.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="no-print max-w-2xl mx-auto">
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="flex-1 bg-navy text-white font-semibold py-3 rounded-xl hover:bg-navy-light active:scale-[0.98] transition-all duration-150 text-sm flex items-center justify-center gap-2 shadow-sm">
            <Icon.Download width={16} height={16} /> Export PDF
          </button>
          <a href={waHref} target="_blank" rel="noopener noreferrer" className="flex-1 bg-emerald-500 text-white font-semibold py-3 rounded-xl hover:bg-emerald-600 active:scale-[0.98] transition-all duration-150 text-sm flex items-center justify-center gap-2 shadow-sm">
            <Icon.MessageCircle width={16} height={16} /> Share via WhatsApp
          </a>
        </div>
        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-3">
          "Export PDF" opens your browser's print dialog — choose <span className="font-medium text-slate-500 dark:text-slate-400">"Save as PDF"</span> as the destination.
        </p>
      </div>
    </div>
  );
}
