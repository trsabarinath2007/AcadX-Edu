import React, { useEffect, useState } from "react";
import {
  Users,
  BookOpen,
  CalendarCheck,
  Brain,
  GraduationCap,
  AlertTriangle,
  ClipboardList,
  FileQuestion,
  TrendingUp,
  Loader2
} from "lucide-react";

import GenericPage from "./GenericPage";
import { apiGet } from "../api";

export default function FacultyDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const response =
        await apiGet("/analytics/faculty");

      setAnalytics(
        response?.analytics || {}
      );
    } catch (err) {
      console.error(
        "Faculty dashboard error:",
        err
      );

      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load faculty dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  const stats = [
    {
      label: "Students",
      value:
        analytics?.students ?? "—",
      icon: Users
    },
    {
      label: "My Courses",
      value:
        analytics?.courses ?? "—",
      icon: BookOpen
    },
    {
      label: "Average Attendance",
      value:
        analytics
          ? `${analytics.averageAttendance ?? 0}%`
          : "—",
      icon: CalendarCheck
    },
    {
      label: "Average Quiz",
      value:
        analytics
          ? `${analytics.averageQuiz ?? 0}%`
          : "—",
      icon: Brain
    },
    {
      label: "Average GPA",
      value:
        analytics?.averageGpa ?? "—",
      icon: GraduationCap
    },
    {
      label: "At-Risk Students",
      value:
        analytics
          ? analytics.atRiskStudents?.length ?? 0
          : "—",
      icon: AlertTriangle
    },
    {
      label: "Assignments",
      value:
        analytics?.assignments ?? "—",
      icon: ClipboardList
    },
    {
      label: "Quiz Attempts",
      value:
        analytics?.quizAttempts ?? "—",
      icon: FileQuestion
    }
  ];

  return (
    <GenericPage
      title="Faculty Dashboard"
      description="Teaching activity, student monitoring and class intelligence."
    >
      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
            <Loader2
              size={20}
              className="animate-spin text-emerald-600"
            />
            Loading faculty dashboard...
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="font-bold text-red-800">
            Unable to load dashboard
          </p>

          <p className="mt-1 text-sm text-red-600">
            {error}
          </p>

          <button
            onClick={loadDashboard}
            className="mt-4 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="space-y-5">

          {/* ==================================================
              STAT CARDS
          ================================================== */}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map(
              ({
                label,
                value,
                icon: Icon
              }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-start justify-between">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      {label}
                    </p>

                    <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
                      <Icon size={17} />
                    </div>
                  </div>

                  <p className="mt-4 text-3xl font-black tracking-tight text-slate-900">
                    {value}
                  </p>
                </div>
              )
            )}
          </div>

          {/* ==================================================
              COURSE PERFORMANCE
          ================================================== */}

          <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">

            <div className="rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-extrabold text-slate-900">
                      Course Performance
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Performance across your assigned courses.
                    </p>
                  </div>

                  <TrendingUp
                    size={20}
                    className="text-emerald-600"
                  />
                </div>
              </div>

              {analytics?.coursePerformance?.length ? (
                <div className="divide-y divide-slate-100">
                  {analytics.coursePerformance.map(
                    (course) => (
                      <div
                        key={course._id}
                        className="p-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-extrabold text-slate-900">
                              {course.code}
                            </p>

                            <p className="text-sm text-slate-500">
                              {course.name}
                            </p>
                          </div>

                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                            {course.students} students
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-3">
                          <Metric
                            label="Attendance"
                            value={`${course.attendance}%`}
                          />

                          <Metric
                            label="Quiz"
                            value={`${course.quiz}%`}
                          />

                          <Metric
                            label="GPA"
                            value={course.gpa}
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-slate-500">
                  No assigned course data available.
                </div>
              )}
            </div>

            {/* ==================================================
                AT-RISK STUDENTS
            ================================================== */}

            <div className="rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-amber-50 p-2 text-amber-700">
                    <AlertTriangle size={18} />
                  </div>

                  <div>
                    <h2 className="font-extrabold text-slate-900">
                      Students Needing Attention
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Students with lower academic indicators.
                    </p>
                  </div>
                </div>
              </div>

              {analytics?.atRiskStudents?.length ? (
                <div className="divide-y divide-slate-100">
                  {analytics.atRiskStudents
                    .slice(0, 6)
                    .map((student) => (
                      <div
                        key={student._id}
                        className="p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {student.name}
                            </p>

                            <p className="text-xs text-slate-500">
                              {student.registerNumber ||
                                student.email}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                              student.risk ===
                              "High"
                                ? "bg-red-50 text-red-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {student.risk}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                          <Metric
                            label="Attendance"
                            value={`${student.attendance}%`}
                          />

                          <Metric
                            label="Quiz"
                            value={`${student.quiz}%`}
                          />

                          <Metric
                            label="GPA"
                            value={student.gpa}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                    <GraduationCap size={22} />
                  </div>

                  <p className="mt-3 text-sm font-bold text-slate-800">
                    No students currently flagged
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Your current class indicators look healthy.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ==================================================
              QUICK ACTIONS
          ================================================== */}

          <div className="grid gap-5 md:grid-cols-2">

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-extrabold text-slate-900">
                Quick Actions
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Use the sidebar to manage attendance,
                assignments, submissions, quizzes,
                learning materials and marks.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white p-2 text-emerald-700">
                  <Brain size={19} />
                </div>

                <div>
                  <h2 className="font-extrabold text-emerald-900">
                    AI Class Intelligence
                  </h2>

                  <p className="mt-1 text-sm text-emerald-800">
                    AI insights can analyze class performance,
                    identify weak areas and suggest teaching actions.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </GenericPage>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 font-extrabold text-slate-800">
        {value}
      </p>
    </div>
  );
}