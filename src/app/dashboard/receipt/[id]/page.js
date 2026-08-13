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

  useEffect(() => { api(`/api/receipts?id=${id}`).then(setReceipt).finally(() => setLoading(false)); }, [id]);

  if (loading) return <PageLoading statCards={0} />;
  if (!receipt) return <div className={cx.card}><EmptyState icon={Icon.CreditCard} title="Receipt not found" /></div>;

  const methodLabel = METHOD_LABEL[receipt.method] || receipt.method;
  const typeLabel = TYPE_LABEL[receipt.type] || receipt.type;

  const exportPDF = () => {
    const w = window.open("", "_blank");
    w.document.write(`<!DOCTYPE html><html><head><title>Receipt ${receipt.receiptNo}</title>
    <style>body{font-family:Arial,sans-serif;padding:20px;color:#0F172A;max-width:500px;margin:0 auto}
    .hdr{text-align:center;border-bottom:2px solid #0F172A;padding-bottom:16px;margin-bottom:16px}
    .hdr h2{margin:0 0 4px;font-size:18px}.hdr p{margin:2px 0;font-size:12px;color:#64748B}
    .row{display:flex;justify-content:space-between;padding:6px 0;font-size:13px}
    .total{border-top:2px solid #0F172A;margin-top:8px;padding-top:10px;font-weight:800;font-size:16px}
    .ft{margin-top:24px;text-align:center;font-size:11px;color:#94A3B8;border-top:1px dashed #CBD5E1;padding-top:16px}
    @media print{body{padding:0}}</style></head><body>
    <div style="border:2px solid #0F172A;padding:32px">
    <div class="hdr"><h2>Online Skating School</h2><p>Dhaka, Bangladesh · +880 1707 080 260</p><p>onlineskatingschool@gmail.com</p></div>
    <div style="text-align:center;font-size:14px;font-weight:700;margin-bottom:16px;letter-spacing:2px">PAYMENT RECEIPT</div>
    <div class="row"><span>Receipt No:</span><strong>${receipt.receiptNo}</strong></div>
    <div class="row"><span>Date:</span><span>${receipt.date}</span></div>
    <hr style="border:none;border-top:1px dashed #CBD5E1;margin:10px 0">
    <div class="row"><span>Student:</span><span>${receipt.studentName}</span></div>
    <div class="row"><span>Guardian:</span><span>${receipt.guardian || "—"}</span></div>
    <div class="row"><span>Branch:</span><span>${receipt.club}</span></div>
    <div class="row"><span>Program:</span><span>${receipt.program}</span></div>
    <hr style="border:none;border-top:1px dashed #CBD5E1;margin:10px 0">
    <div class="row"><span>Payment For:</span><span>${typeLabel} — ${receipt.month}</span></div>
    <div class="row"><span>Method:</span><span>${methodLabel}</span></div>
    <div class="row total"><span>Amount Paid:</span><span>৳${receipt.amount.toLocaleString()}</span></div>
    <div class="ft"><p>Thank you for your payment.</p><p>This is a computer-generated receipt.</p></div>
    </div><script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `Payment Receipt - Online Skating School\n\nReceipt: ${receipt.receiptNo}\nStudent: ${receipt.studentName}\nAmount: ৳${receipt.amount.toLocaleString()}\nDate: ${receipt.date}\nType: ${typeLabel} (${receipt.month})\nMethod: ${methodLabel}\n\nThank you for your payment!`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const rows = [
    ["Receipt No", receipt.receiptNo],
    ["Date", receipt.date],
    null,
    ["Student Name", receipt.studentName],
    ["Guardian", receipt.guardian || "—"],
    ["Branch", receipt.club],
    ["Program", receipt.program],
    null,
    ["Payment For", `${typeLabel} — ${receipt.month}`],
    ["Payment Method", methodLabel],
  ];

  return (
    <div className="space-y-5">
      <Link href="/dashboard/fees" className={cx.link + " inline-flex items-center gap-1"}><Icon.ArrowLeft width={14} height={14} /> Back to Payments</Link>

      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-card border-2 border-navy p-8 animate-scaleIn">
        <div className="text-center border-b-2 border-navy pb-4 mb-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal to-teal-light flex items-center justify-center text-xl mx-auto mb-2">⛸</div>
          <h2 className="text-lg font-extrabold text-slate-900">Online Skating School</h2>
          <p className="text-xs text-slate-500">Dhaka, Bangladesh · +880 1707 080 260</p>
          <p className="text-xs text-slate-500">onlineskatingschool@gmail.com</p>
        </div>

        <div className="text-center text-sm font-bold tracking-widest uppercase mb-4 text-slate-700">Payment Receipt</div>

        {rows.map((row, i) => row === null
          ? <hr key={i} className="border-none border-t border-dashed border-slate-300 my-2" />
          : (
            <div key={i} className="flex justify-between py-1.5 text-sm">
              <span className="text-slate-500">{row[0]}:</span>
              <span className="font-semibold text-slate-800">{row[1]}</span>
            </div>
          ))}

        <div className="flex justify-between py-2 mt-2 border-t-2 border-navy font-extrabold text-lg text-slate-900">
          <span>Amount Paid:</span>
          <span>৳{receipt.amount.toLocaleString()}</span>
        </div>

        <div className="mt-6 text-center text-xs text-slate-400 border-t border-dashed border-slate-300 pt-4">
          <p>Thank you for your payment.</p>
          <p>This is a computer-generated receipt.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto flex gap-3">
        <button onClick={exportPDF} className="flex-1 bg-navy text-white font-semibold py-3 rounded-xl hover:bg-navy-light active:scale-[0.98] transition-all duration-150 text-sm flex items-center justify-center gap-2 shadow-sm">
          <Icon.Download width={16} height={16} /> Export PDF
        </button>
        <button onClick={shareWhatsApp} className="flex-1 bg-emerald-500 text-white font-semibold py-3 rounded-xl hover:bg-emerald-600 active:scale-[0.98] transition-all duration-150 text-sm flex items-center justify-center gap-2 shadow-sm">
          <Icon.MessageCircle width={16} height={16} /> Share via WhatsApp
        </button>
      </div>
    </div>
  );
}
