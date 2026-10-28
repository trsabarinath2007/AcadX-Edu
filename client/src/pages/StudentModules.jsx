import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import GenericPage from "./GenericPage";
import { apiGet } from "../api";

export function Courses() {
  const [courses, setCourses] = useState([]);
  useEffect(() => { apiGet("/courses").then(r => setCourses(r.courses || [])).catch(() => {}); }, []);
  return <GenericPage title="My Courses" description="Courses assigned to your department, semester and section.">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{courses.map(c => <div key={c._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold text-emerald-700">{c.code}</p><h2 className="mt-2 font-extrabold">{c.name}</h2><p className="mt-2 text-xs text-slate-500">{c.credits} credits • Semester {c.semester}</p><Link to={`/learning-materials/${c._id}`} className="mt-4 inline-block text-xs font-bold text-emerald-700">View materials →</Link></div>)}</div>
  </GenericPage>;
}

export function Attendance() {
  const [courses, setCourses] = useState([]);
  useEffect(() => { apiGet("/attendance/student").then(r => setCourses(r.courses || [])).catch(() => {}); }, []);
  return <GenericPage title="Attendance" description="Monitor course-wise and overall attendance.">
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Course</th><th>Present</th><th>Total</th><th>Percentage</th></tr></thead><tbody>{courses.map(c => <tr key={c.course._id} className="border-t border-slate-100"><td className="px-5 py-4 font-bold">{c.course.code} — {c.course.name}</td><td>{c.present}</td><td>{c.total}</td><td className="font-bold text-emerald-700">{c.percentage}%</td></tr>)}</tbody></table></div>
  </GenericPage>;
}

export function Assignments() {
  const [items, setItems] = useState([]);
  useEffect(() => { apiGet("/assignments/student").then(r => setItems(r.assignments || [])).catch(() => {}); }, []);
  return <GenericPage title="Assignments" description="View assignments, submit work and track feedback.">
    <div className="space-y-3">{items.map(a => <div key={a._id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs font-bold text-emerald-700">{a.course?.code}</p><h2 className="mt-1 font-extrabold">{a.title}</h2><p className="mt-1 text-xs text-slate-500">{a.description}</p></div><span className="text-xs font-bold text-slate-500">{a.submission?.status || "Not submitted"}</span></div></div>)}</div>
  </GenericPage>;
}

export function Quizzes() {
  const [items, setItems] = useState([]);
  useEffect(() => { apiGet("/quizzes").then(r => setItems(r.quizzes || [])).catch(() => {}); }, []);
  return <GenericPage title="Quizzes & Tests" description="Attempt published quizzes and review your quiz activity.">
    <div className="grid gap-4 md:grid-cols-2">{items.map(q => <div key={q._id} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold text-blue-700">{q.course?.code}</p><h2 className="mt-1 font-extrabold">{q.title}</h2><p className="mt-2 text-xs text-slate-500">{q.questions?.length || 0} questions • {q.durationMinutes} minutes</p></div>)}</div>
  </GenericPage>;
}

export function Results() {
  return <GenericPage title="Results & Academic Records" description="Review marks, grades, GPA and academic history." />;
}

export function Performance() {
  const [data, setData] = useState(null);
  useEffect(() => { apiGet("/analytics/student").then(r => setData(r.analytics)).catch(() => {}); }, []);
  return <GenericPage title="Performance Insights" description="AcadX combines academic activity into academic intelligence.">
    <div className="grid gap-4 md:grid-cols-3">
      {[
        ["Engagement", data?.engagement ?? "—", "%"],
        ["Risk Score", data?.riskScore ?? "—", ""],
        ["Risk Level", data?.riskLevel ?? "—", ""]
      ].map(([a,b,c]) => <div key={a} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold text-slate-400 uppercase">{a}</p><p className="mt-3 text-3xl font-black">{b}{c}</p></div>)}
    </div>
    <div className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-extrabold">Recommendations</h2><ul className="mt-3 space-y-2 text-sm text-slate-600">{(data?.recommendations || ["Complete your academic activities consistently."]).map(x => <li key={x}>• {x}</li>)}</ul></div>
  </GenericPage>;
}

export function Announcements() {
  const [items, setItems] = useState([]);
  useEffect(() => { apiGet("/announcements").then(r => setItems(r.announcements || [])).catch(() => {}); }, []);
  return <GenericPage title="Announcements" description="Academic and institutional updates."><div className="space-y-3">{items.map(a => <div key={a._id} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold text-blue-700">{a.createdBy?.name}</p><h2 className="mt-1 font-extrabold">{a.title}</h2><p className="mt-2 text-sm text-slate-600">{a.body}</p></div>)}</div></GenericPage>;
}
