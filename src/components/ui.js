"use client";
import { Icon } from "./Icons";

const TONES = {
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  red: "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  teal: "bg-teal/10 text-teal-dark dark:bg-teal/15 dark:text-teal-light",
};

export function Badge({ children, tone = "slate" }) {
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${TONES[tone]}`}>{children}</span>;
}

export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-slate-200/70 dark:bg-slate-700/60 rounded-lg ${className}`} />;
}

export function EmptyState({ icon, title, hint }) {
  const IconComp = icon || Icon.Inbox;
  return (
    <div className="text-center py-14 px-6">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3">
        <IconComp width={22} height={22} />
      </div>
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</p>
      {hint && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

export function PageLoading({ statCards = 4 }) {
  return (
    <div className="space-y-5">
      {statCards > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: statCards }).map((_, i) => <Skeleton key={i} className="h-[92px] rounded-2xl" />)}
        </div>
      )}
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );
}

export function Toast({ message, tone = "emerald", onClose }) {
  if (!message) return null;
  const tones = {
    emerald: "bg-emerald-600",
    red: "bg-red-600",
  };
  return (
    <div className={`fixed bottom-5 right-5 z-[100] ${tones[tone]} text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-popover animate-slideUp flex items-center gap-3`}>
      {message}
      {onClose && (
        <button onClick={onClose} className="opacity-70 hover:opacity-100">
          <Icon.X width={14} height={14} />
        </button>
      )}
    </div>
  );
}

export function ModalShell({ title, onClose, children, footer, maxWidth = "max-w-lg" }) {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <div className={`bg-white dark:bg-slate-800 rounded-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto shadow-popover animate-scaleIn`} onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur rounded-t-2xl">
          <h3 className="font-bold text-slate-900 dark:text-slate-100">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 w-8 h-8 rounded-lg flex items-center justify-center transition-colors">
            <Icon.X width={18} height={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2 sticky bottom-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
}

export const cx = {
  card: "bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-card",
  cardHeader: "px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3 flex-wrap",
  btnPrimary: "inline-flex items-center justify-center gap-2 bg-teal text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-sm hover:bg-teal-dark hover:shadow-md active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none",
  btnSecondary: "inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 hover:border-slate-300 dark:hover:border-slate-500 active:scale-[0.98] transition-all duration-150",
  btnDangerGhost: "inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-white hover:bg-red-500 px-2.5 py-1.5 rounded-lg transition-all duration-150",
  btnGhost: "inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition-all duration-150",
  link: "text-xs font-semibold text-teal hover:text-teal-dark dark:hover:text-teal-light hover:underline underline-offset-2 transition-colors",
  input: "w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-all duration-150 focus:border-teal focus:ring-4 focus:ring-teal/10 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500",
  label: "text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5",
  thead: "bg-slate-50/70 dark:bg-slate-900/40",
  th: "text-left px-4 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider",
  tr: "border-b border-slate-50 dark:border-slate-700/60 last:border-0 hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors",
  td: "px-4 py-3.5 text-sm text-slate-700 dark:text-slate-300",
};
