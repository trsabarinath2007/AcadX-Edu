import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BrainCircuit, GraduationCap, ShieldCheck, Sparkles, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f5f7f5]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-700 text-white">
            <GraduationCap size={22} />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">AcadX</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">Academic Intelligence</div>
          </div>
        </div>
        <Link to="/login" className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">
          Sign In
        </Link>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-16 pt-10 sm:px-8 lg:pt-20">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
            <Sparkles size={13} />
            From Academic Data to Academic Intelligence
          </span>

          <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-900 sm:text-6xl">
            One academic platform for the entire institution.
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            AcadX connects academic administration, teaching, student learning, communication, analytics and AI-powered academic insights in one controlled platform.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/login" className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800">
              Enter AcadX <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [ShieldCheck, "Controlled access", "Admin-managed institutional accounts and role-based access."],
            [Users, "Admin • Faculty • Student", "Each role sees only the academic tools relevant to it."],
            [BrainCircuit, "Academic intelligence", "Attendance, assessments and activity become useful indicators."],
            [Sparkles, "AI assistance", "Study support, academic analysis, class insights and quiz generation."]
          ].map(([Icon, title, text]) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Icon size={19} />
              </div>
              <h2 className="mt-4 text-sm font-extrabold text-slate-900">{title}</h2>
              <p className="mt-2 text-xs leading-5 text-slate-500">{text}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
