import React, { useEffect, useState } from "react";
import GenericPage from "./GenericPage";
import { apiGet } from "../api";

export default function AdminDashboard() {
  const [a, setA] = useState({});
  useEffect(() => { apiGet("/admin/overview").then(setA).catch(() => {}); }, []);
  return <GenericPage title="Admin Dashboard" description="Institution-wide academic and operational overview.">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[
      ["Students", a.students], ["Faculty", a.faculty], ["Departments", a.departments], ["Courses", a.courses], ["Average GPA", a.averageGpa], ["Average Quiz", `${a.averageQuiz ?? "—"}%`], ["Attendance Records", a.attendanceRecords]
    ].map(([x,y]) => <div key={x} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase text-slate-400">{x}</p><p className="mt-3 text-3xl font-black">{y ?? "—"}</p></div>)}</div>
  </GenericPage>;
}
