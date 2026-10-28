import React from "react";
import Layout from "../components/Layout";

export default function GenericPage({ title, description, children }) {
  return (
    <Layout>
      <div className="space-y-5">
        <div><p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">AcadX</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">{title}</h1><p className="mt-2 text-sm text-slate-500">{description}</p></div>
        {children || <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">This module is ready for institutional data.</div>}
      </div>
    </Layout>
  );
}
