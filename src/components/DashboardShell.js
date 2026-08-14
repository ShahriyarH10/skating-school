"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { Icon } from "@/components/Icons";

const MENU = [
  { href: "/dashboard", label: "Dashboard", icon: Icon.Home, roles: ["admin", "instructor", "student"], exact: true },
  { section: "Management" },
  { href: "/dashboard/students", label: "Students", icon: Icon.Users, roles: ["admin", "instructor"] },
  { href: "/dashboard/staff", label: "Staff", icon: Icon.Shield, roles: ["admin"] },
  { href: "/dashboard/branches", label: "Branches", icon: Icon.Building, roles: ["admin"] },
  { section: "Operations" },
  { href: "/dashboard/attendance", label: "Mark Attendance", icon: Icon.Clipboard, roles: ["admin", "instructor"] },
  { href: "/dashboard/fees", label: "Fee & Payments", icon: Icon.Wallet, roles: ["admin", "instructor", "student"] },
  { href: "/dashboard/payment-history", label: "Payment History", icon: Icon.TrendingUp, roles: ["admin", "instructor"] },
  { href: "/dashboard/schedule", label: "Schedule", icon: Icon.Calendar, roles: ["admin", "instructor", "student"] },
  { section: "Communications" },
  { href: "/dashboard/notices", label: "Notices", icon: Icon.Bell, roles: ["admin", "instructor", "student"] },
  { section: "Admin" },
  { href: "/dashboard/reports", label: "Reports", icon: Icon.BarChart, roles: ["admin"] },
  { href: "/dashboard/settings", label: "Settings", icon: Icon.Settings, roles: ["admin"] },
  { section: "Account" },
  { href: "/dashboard/profile", label: "My Profile", icon: Icon.User, roles: ["admin", "instructor", "student"] },
];

// The four destinations every role gets, kept identical across
// admin/instructor/student so the tab bar never has to reshuffle. Everything
// else (role-specific management pages, reports/settings, profile, logout)
// lives one tap away behind "More".
const TABS = [
  { href: "/dashboard", label: "Home", icon: Icon.Home, exact: true },
  { href: "/dashboard/fees", label: "Fees", icon: Icon.Wallet },
  { href: "/dashboard/schedule", label: "Schedule", icon: Icon.Calendar },
  { href: "/dashboard/notices", label: "Notices", icon: Icon.Bell },
];

function isActive(pathname, item) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

function MenuList({ pathname, role, onNavigate, variant }) {
  return MENU.map((item, i) => {
    if (item.section) {
      const sectionItems = [];
      for (let j = i + 1; j < MENU.length && !MENU[j].section; j++) {
        if (MENU[j].roles?.includes(role)) sectionItems.push(MENU[j]);
      }
      if (sectionItems.length === 0) return null;
      return (
        <div key={item.section} className={`mt-5 mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest first:mt-2 ${variant === "sheet" ? "text-slate-400" : "text-slate-500"}`}>
          {item.section}
        </div>
      );
    }

    if (!item.roles?.includes(role)) return null;

    const active = isActive(pathname, item);
    if (variant === "sheet") {
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={`flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-medium mb-0.5 active:bg-slate-100 transition-colors ${active ? "bg-teal/10 text-teal-dark" : "text-slate-700"}`}
        >
          <item.icon width={19} height={19} className={active ? "text-teal-dark" : "text-slate-400"} />
          {item.label}
        </Link>
      );
    }
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-all duration-150 ${
          active ? "bg-teal/15 text-teal-light" : "text-slate-400 hover:bg-white/5 hover:text-white"
        }`}
      >
        {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-teal-light" />}
        <item.icon width={17} height={17} className={active ? "text-teal-light" : "text-slate-500 group-hover:text-slate-300"} />
        {item.label}
      </Link>
    );
  });
}

export default function DashboardShell({ user, children }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const pathname = usePathname();
  const { logout } = useAuth();

  const activeItem = [...MENU].reverse().find((m) => m.href && isActive(pathname, m));
  const onATab = TABS.some((t) => isActive(pathname, t));

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-150">
      {/* Desktop sidebar — untouched, hidden below md */}
      <aside className="hidden md:flex md:flex-col fixed top-0 left-0 bottom-0 w-64 bg-navy z-50">
        <div className="px-5 py-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal to-teal-light flex items-center justify-center text-base flex-shrink-0 shadow-glow-teal">⛸</div>
          <div className="text-white font-extrabold text-[15px] tracking-tight">Online <span className="text-teal-light">Skating</span></div>
        </div>
        <nav className="flex-1 py-2 px-3 overflow-y-auto">
          <MenuList pathname={pathname} role={user.role} variant="sidebar" />
        </nav>
        <div className="px-3 py-4 border-t border-white/5 mx-2">
          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal to-amber flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user.avatar || user.name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-semibold truncate">{user.name}</div>
              <div className="text-slate-500 text-[11px] capitalize">{user.role}</div>
            </div>
            <ThemeToggleButton className="text-slate-500 hover:text-white hover:bg-white/5 w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0" />
            <button onClick={logout} className="text-slate-500 hover:text-white hover:bg-white/5 w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0" title="Log out">
              <Icon.LogOut width={16} height={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 md:ml-64 flex flex-col min-w-0 pb-16 md:pb-0">
        <header className="h-14 bg-white/90 dark:bg-slate-800/90 backdrop-blur border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-5 sticky top-0 z-30">
          <h1 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 truncate">
            {activeItem?.label || "Dashboard"}
          </h1>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span className="capitalize font-medium text-slate-500 dark:text-slate-400">{user.role}</span>
            {user.club && user.club !== "All Clubs" && (<><span>·</span><span>{user.club}</span></>)}
          </div>
        </header>
        <main className="p-4 sm:p-5 flex-1 animate-fadeIn">{children}</main>
      </div>

      {/* Mobile bottom tab bar — the primary nav surface on phones, replacing the
          hamburger-only pattern so the app reads as a native app, not a squeezed website. */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur border-t border-slate-200 dark:border-slate-700 flex items-stretch"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {TABS.map((tab) => {
          const active = isActive(pathname, tab);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${active ? "text-teal" : "text-slate-400 active:text-slate-600 dark:active:text-slate-300"}`}
            >
              <tab.icon width={21} height={21} strokeWidth={active ? 2.2 : 1.8} />
              <span className={`text-[10px] ${active ? "font-bold" : "font-medium"}`}>{tab.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setSheetOpen(true)}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${!onATab ? "text-teal" : "text-slate-400 active:text-slate-600 dark:active:text-slate-300"}`}
        >
          <Icon.Menu width={21} height={21} strokeWidth={!onATab ? 2.2 : 1.8} />
          <span className={`text-[10px] ${!onATab ? "font-bold" : "font-medium"}`}>More</span>
        </button>
      </nav>

      {/* "More" sheet — everything not on the tab bar: role-specific management
          pages, reports/settings, profile, and logout. Slides up from the bottom
          like a native action sheet instead of a website's left-hand drawer. */}
      {sheetOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] z-50 animate-fadeIn" onClick={() => setSheetOpen(false)} />
          <div
            className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-slate-800 rounded-t-3xl max-h-[82vh] flex flex-col animate-slideUp shadow-popover"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="w-10 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />
            <div className="px-5 py-3.5 flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal to-amber flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {user.avatar || user.name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-slate-800 dark:text-slate-100 text-sm font-semibold truncate">{user.name}</div>
                <div className="text-slate-400 text-[11px] capitalize">
                  {user.role}{user.club && user.club !== "All Clubs" ? ` · ${user.club}` : ""}
                </div>
              </div>
              <ThemeToggleButton className="text-slate-400 active:text-teal active:bg-teal/10 w-9 h-9 rounded-lg flex items-center justify-center transition-colors flex-shrink-0" />
              <button onClick={logout} className="text-slate-400 active:text-red-500 active:bg-red-50 dark:active:bg-red-500/10 w-9 h-9 rounded-lg flex items-center justify-center transition-colors flex-shrink-0" title="Log out">
                <Icon.LogOut width={17} height={17} />
              </button>
            </div>
            <div className="overflow-y-auto px-3 py-2">
              <MenuList pathname={pathname} role={user.role} onNavigate={() => setSheetOpen(false)} variant="sheet" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ThemeToggleButton({ className }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} className={className} title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
      {theme === "dark" ? <Icon.Sun width={16} height={16} /> : <Icon.Moon width={16} height={16} />}
    </button>
  );
}
