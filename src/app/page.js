"use client";

import Link from "next/link";
import { Icon } from "@/components/Icons";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0F172A] text-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0F172A]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-[#0891B2] to-[#06B6D4] flex items-center justify-center text-xs sm:text-sm flex-shrink-0">⛸</div>
            <span className="font-extrabold text-sm sm:text-lg whitespace-nowrap truncate">
              Online <span className="text-[#06B6D4]">Skating</span><span className="hidden sm:inline"> School</span>
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link href="/login" className="text-xs sm:text-sm font-medium text-slate-300 hover:text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-white/5 transition">Login</Link>
            <Link href="/admission" className="hidden sm:inline-flex text-sm font-semibold bg-[#0891B2] px-5 py-2 rounded-lg hover:bg-[#0E7490] transition">Apply Now</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[100svh] flex items-center px-5 sm:px-6 pt-20 sm:pt-24 pb-16">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #0891B2 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        <div className="absolute top-[-200px] right-[-200px] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(8,145,178,0.15)_0%,transparent_70%)] rounded-full" />
        <div className="max-w-6xl mx-auto relative z-10 w-full pb-20 lg:pb-0">
          <div className="inline-flex items-center gap-2 bg-[#0891B2]/10 border border-[#0891B2]/25 px-4 py-1.5 rounded-full text-[#06B6D4] text-xs font-semibold tracking-wide mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-pulse" />
            ADMISSIONS OPEN 2026
          </div>
          <h1 className="text-[2.75rem] sm:text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            Where Young<br />Champions<br />
            <span className="text-[#06B6D4]">Learn to</span>{" "}
            <span className="text-[#F59E0B]">Skate</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-lg leading-relaxed mb-10">
            Bangladesh's leading roller skating school. Professional coaching for ages 3 and up — across Dhaka's top skating venues.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link href="/admission" className="bg-[#0891B2] text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-[#0E7490] active:scale-[0.98] transition inline-flex items-center gap-2">
              Start Admission →
            </Link>
            <a href="#programs" className="bg-white/5 border border-white/10 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-white/10 active:scale-[0.98] transition">
              View Programs
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white text-[#0F172A] border-b border-slate-200">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4">
          {[
            { val: "1000+", lbl: "Active Skaters" },
            { val: "6+", lbl: "Affiliated Clubs" },
            { val: "2020", lbl: "Established" },
            { val: "4 Months", lbl: "Course Duration" },
          ].map((s) => (
            <div key={s.lbl} className="py-6 sm:py-8 px-4 sm:px-6 text-center border-r-0 md:border-r md:last:border-r-0">
              <div className="text-3xl font-extrabold tracking-tight">{s.val}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">{s.lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="scroll-mt-14 sm:scroll-mt-16 bg-white text-[#0F172A] py-14 sm:py-20 px-5 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold tracking-widest text-[#0891B2] mb-2">PROGRAMS</p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Training Programs</h2>
          <p className="text-slate-500 max-w-xl mb-12">Structured courses for every skill level. Safety training and competition pathways included.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Beginner", age: "Age 3+", fee: "৳2,000/mo", color: "#0891B2", desc: "Balance, forward skating, stopping, basic turns. Full safety gear guidance." },
              { title: "Intermediate", age: "Age 6+", fee: "৳2,500/mo", color: "#F59E0B", desc: "Crossovers, backward skating, speed control, inline techniques." },
              { title: "Advanced", age: "Age 8+", fee: "৳3,000/mo", color: "#EF4444", desc: "Speed skating, rollball, competition prep. National event pathway." },
            ].map((p) => (
              <div key={p.title} className="border border-slate-200 rounded-xl p-6 sm:p-8 hover:shadow-lg transition relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: p.color }} />
                <span className="inline-block text-xs font-semibold px-3 py-1 rounded-md mb-4" style={{ background: p.color + "15", color: p.color }}>{p.age}</span>
                <h3 className="text-xl font-bold mb-2">{p.title} Course</h3>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">{p.desc}</p>
                <div className="text-2xl font-extrabold">{p.fee}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-[#0F172A] via-[#0E7490] to-[#0F172A] py-14 sm:py-20 px-5 sm:px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Ready to Start Skating?</h2>
          <p className="text-slate-300 mb-8">Join 1000+ students across Bangladesh. Admission is open for all age groups.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/admission" className="bg-[#F59E0B] text-[#0F172A] font-bold px-8 py-3.5 rounded-xl hover:bg-[#FCD34D] transition">
              Apply for Admission →
            </Link>
            <a href="https://wa.me/8801707080260" target="_blank" rel="noopener noreferrer" className="bg-white/5 border border-white/10 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-white/10 transition">
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0F172A] pt-12 pb-24 lg:pb-12 px-5 sm:px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-8">
          <div className="max-w-xs">
            <div className="font-extrabold text-lg mb-2">Online <span className="text-[#06B6D4]">Skating</span> School</div>
            <p className="text-sm text-slate-400 leading-relaxed">Professional roller skating coaching since 2020. Dhaka, Bangladesh.</p>
          </div>
          <div className="flex gap-12 text-sm">
            <div>
              <h5 className="text-slate-300 font-semibold mb-3 text-xs uppercase tracking-wider">Quick Links</h5>
              <div className="flex flex-col gap-2 text-slate-400">
                <a href="#programs" className="hover:text-[#06B6D4]">Programs</a>
                <Link href="/login" className="hover:text-[#06B6D4]">Login</Link>
              </div>
            </div>
            <div>
              <h5 className="text-slate-300 font-semibold mb-3 text-xs uppercase tracking-wider">Contact</h5>
              <div className="flex flex-col gap-2 text-slate-400">
                <span>+880 1707 080 260</span>
                <span>onlineskatingschool@gmail.com</span>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-white/5 text-xs text-slate-500">
          © 2020–2026 Online Skating School. All rights reserved.
        </div>
      </footer>

      {/* Persistent mobile CTA — admissions is the site's one job, so on phones
          it stays one thumb-tap away no matter how far the visitor has scrolled. */}
      <div
        className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-[#0F172A]/95 backdrop-blur-md border-t border-white/10 px-5 py-3 flex items-center gap-3"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <a href="https://wa.me/8801707080260" target="_blank" rel="noopener noreferrer" className="w-11 h-11 flex-shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 active:bg-white/10 transition">
          <span className="sr-only">Chat on WhatsApp</span>
          <Icon.MessageCircle width={19} height={19} />
        </a>
        <Link href="/admission" className="flex-1 bg-[#0891B2] text-white font-semibold py-3 rounded-xl active:scale-[0.98] transition text-center">
          Apply for Admission →
        </Link>
      </div>
    </main>
  );
}