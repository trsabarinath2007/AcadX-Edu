import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  AlertTriangle,
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Users,
} from "lucide-react";

import GenericPage from "./GenericPage";
import { apiGet } from "../api";

function StatCard({
  icon: Icon,
  label,
  value,
  suffix = "",
  description,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-3xl font-black text-slate-900">
            {value}
            {suffix}
          </p>

          {description && (
            <p className="mt-1 text-xs text-slate-500">
              {description}
            </p>
          )}
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function ProgressBar({
  value,
  label,
}) {
  const safeValue = Math.max(
    0,
    Math.min(100, Number(value) || 0)
  );

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">
          {label}
        </span>

        <span className="text-xs font-black text-slate-800">
          {safeValue.toFixed(1)}%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-600 transition-all"
          style={{
            width: `${safeValue}%`,
          }}
        />
      </div>
    </div>
  );
}

function RiskBadge({
  score,
}) {
  const risk =
    score >= 65
      ? "High"
      : score >= 35
      ? "Moderate"
      : "Low";

  const classes =
    risk === "High"
      ? "bg-red-50 text-red-700"
      : risk === "Moderate"
      ? "bg-amber-50 text-amber-700"
      : "bg-emerald-50 text-emerald-700";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${classes}`}
    >
      {risk}
    </span>
  );
}

export default function FacultyAnalytics() {
  const [analytics, setAnalytics] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError("");

      const response = await apiGet(
        "/analytics/faculty"
      );

      setAnalytics(
        response?.analytics || null
      );
    } catch (err) {
      console.error(
        "Faculty analytics error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load analytics."
      );
    } finally {
      setLoading(false);
    }
  }

  const coursePerformance =
    analytics?.coursePerformance || [];

  const atRiskStudents =
    analytics?.atRiskStudents || [];

  const gradeDistribution =
    analytics?.gradeDistribution || [];

  const attendanceTrend =
    analytics?.attendanceTrend || [];

  const maxGradeCount = useMemo(
    () =>
      Math.max(
        ...gradeDistribution.map(
          (item) => item.count
        ),
        1
      ),
    [gradeDistribution]
  );

  const maxTrendValue = useMemo(
    () =>
      Math.max(
        ...attendanceTrend.map(
          (item) => item.attendance
        ),
        100
      ),
    [attendanceTrend]
  );

  if (loading) {
    return (
      <GenericPage
        title="Analytics"
        description="Monitor class performance, attendance and academic engagement."
      >
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
            <Loader2
              size={20}
              className="animate-spin text-emerald-600"
            />
            Loading faculty analytics...
          </div>
        </div>
      </GenericPage>
    );
  }

  if (error) {
    return (
      <GenericPage
        title="Analytics"
        description="Monitor class performance, attendance and academic engagement."
      >
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          <p className="font-bold">
            Unable to load analytics
          </p>

          <p className="mt-1">
            {error}
          </p>

          <button
            onClick={loadAnalytics}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white"
          >
            Try Again
          </button>
        </div>
      </GenericPage>
    );
  }

  return (
    <GenericPage
      title="Analytics"
      description="Monitor class performance, attendance and academic engagement."
    >
      <div className="space-y-6">

        {/* =====================================================
            SUMMARY
        ===================================================== */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

          <StatCard
            icon={Users}
            label="Students"
            value={analytics?.students || 0}
            description="Students in your teaching scope"
          />

          <StatCard
            icon={BookOpen}
            label="Courses"
            value={analytics?.courses || 0}
            description="Courses assigned to you"
          />

          <StatCard
            icon={CheckCircle2}
            label="Attendance"
            value={
              analytics?.averageAttendance?.toFixed(
                1
              ) || "0.0"
            }
            suffix="%"
            description="Overall attendance"
          />

          <StatCard
            icon={GraduationCap}
            label="Average GPA"
            value={
              analytics?.averageGpa?.toFixed(
                2
              ) || "0.00"
            }
            description="Across academic records"
          />

          <StatCard
            icon={Award}
            label="Quiz Average"
            value={
              analytics?.averageQuiz?.toFixed(
                1
              ) || "0.0"
            }
            suffix="%"
            description="Average quiz performance"
          />

        </div>

        {/* =====================================================
            ENGAGEMENT
        ===================================================== */}

        <div className="grid gap-5 lg:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Class Engagement
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Combined view of attendance, quizzes and submissions.
                </p>
              </div>

              <Activity
                size={21}
                className="text-emerald-600"
              />
            </div>

            <div className="mt-6 flex items-center gap-6">

              <div
                className="relative flex h-36 w-36 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(#059669 ${
                    analytics?.engagement || 0
                  }%, #e2e8f0 0)`,
                }}
              >
                <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
                  <span className="text-3xl font-black text-slate-900">
                    {analytics?.engagement || 0}
                  </span>

                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Score
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-4">

                <ProgressBar
                  label="Attendance"
                  value={
                    analytics?.averageAttendance || 0
                  }
                />

                <ProgressBar
                  label="Quiz Performance"
                  value={
                    analytics?.averageQuiz || 0
                  }
                />

                <ProgressBar
                  label="Overall Engagement"
                  value={
                    analytics?.engagement || 0
                  }
                />

              </div>

            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle
                size={20}
                className="text-amber-600"
              />

              <h2 className="text-base font-black text-slate-900">
                Students Needing Attention
              </h2>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Students with low attendance, GPA or quiz performance.
            </p>

            <div className="mt-5">

              {atRiskStudents.length === 0 ? (
                <div className="rounded-xl bg-emerald-50 p-5 text-center">
                  <CheckCircle2
                    size={25}
                    className="mx-auto text-emerald-600"
                  />

                  <p className="mt-2 text-sm font-bold text-emerald-800">
                    No students currently flagged
                  </p>

                  <p className="mt-1 text-xs text-emerald-700">
                    Your current class indicators look healthy.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {atRiskStudents
                    .slice(0, 5)
                    .map((student) => (
                      <div
                        key={student._id}
                        className="rounded-xl border border-slate-100 bg-slate-50 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">

                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-800">
                              {student.name}
                            </p>

                            <p className="text-[10px] text-slate-400">
                              {student.registerNumber ||
                                "No register number"}
                            </p>
                          </div>

                          <RiskBadge
                            score={
                              student.riskScore
                            }
                          />
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2 text-center">

                          <div>
                            <p className="text-xs font-black text-slate-800">
                              {student.attendance}%
                            </p>

                            <p className="text-[9px] uppercase text-slate-400">
                              Attendance
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-black text-slate-800">
                              {student.gpa}
                            </p>

                            <p className="text-[9px] uppercase text-slate-400">
                              GPA
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-black text-slate-800">
                              {student.quizAverage}%
                            </p>

                            <p className="text-[9px] uppercase text-slate-400">
                              Quiz
                            </p>
                          </div>

                        </div>

                        {student.reasons?.length >
                          0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {student.reasons.map(
                              (reason) => (
                                <span
                                  key={reason}
                                  className="rounded-md bg-white px-2 py-1 text-[9px] font-bold text-slate-500"
                                >
                                  {reason}
                                </span>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}

            </div>
          </div>

        </div>

        {/* =====================================================
            COURSE PERFORMANCE
        ===================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900">
                Course Performance
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Compare attendance, GPA and quiz performance across your courses.
              </p>
            </div>

            <BarChart3
              size={21}
              className="text-emerald-600"
            />
          </div>

          {coursePerformance.length === 0 ? (
            <div className="mt-6 rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">
              No course analytics available yet.
            </div>
          ) : (
            <div className="mt-6 space-y-6">

              {coursePerformance.map(
                (course) => (
                  <div
                    key={course._id}
                    className="rounded-xl border border-slate-100 p-4"
                  >
                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                      <div>
                        <p className="text-sm font-black text-slate-900">
                          {course.code}
                        </p>

                        <p className="text-xs text-slate-500">
                          {course.name}
                        </p>
                      </div>

                      <div className="text-xs text-slate-400">
                        {course.students} students
                      </div>

                    </div>

                    <div className="grid gap-4 md:grid-cols-3">

                      <ProgressBar
                        label="Attendance"
                        value={
                          course.attendance
                        }
                      />

                      <ProgressBar
                        label="Quiz"
                        value={
                          course.quizAverage
                        }
                      />

                      <div>
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-600">
                            Average GPA
                          </span>

                          <span className="text-xs font-black text-slate-800">
                            {course.gpa}
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-600"
                            style={{
                              width: `${Math.min(
                                100,
                                (Number(
                                  course.gpa
                                ) /
                                  10) *
                                  100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                )
              )}

            </div>
          )}

        </div>

        {/* =====================================================
            ATTENDANCE TREND + GRADES
        ===================================================== */}

        <div className="grid gap-5 lg:grid-cols-2">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <h2 className="text-base font-black text-slate-900">
              Attendance Trend
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Attendance percentage across recorded months.
            </p>

            {attendanceTrend.length === 0 ? (
              <div className="mt-8 text-center text-sm text-slate-400">
                No attendance trend data available.
              </div>
            ) : (
              <div className="mt-6 flex h-52 items-end gap-3 overflow-x-auto">

                {attendanceTrend.map(
                  (item) => (
                    <div
                      key={item.month}
                      className="flex min-w-12 flex-1 flex-col items-center justify-end gap-2"
                    >
                      <span className="text-[10px] font-bold text-slate-500">
                        {item.attendance}%
                      </span>

                      <div className="flex h-36 w-full items-end rounded-lg bg-slate-50">
                        <div
                          className="w-full rounded-lg bg-emerald-600 transition-all"
                          style={{
                            height: `${
                              maxTrendValue
                                ? (item.attendance /
                                    maxTrendValue) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>

                      <span className="text-[10px] font-bold text-slate-400">
                        {item.month}
                      </span>
                    </div>
                  )
                )}

              </div>
            )}

          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <h2 className="text-base font-black text-slate-900">
              Grade Distribution
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Distribution of grades recorded for your courses.
            </p>

            <div className="mt-6 space-y-3">

              {gradeDistribution.map(
                (item) => (
                  <div
                    key={item.grade}
                    className="flex items-center gap-3"
                  >

                    <span className="w-8 text-xs font-black text-slate-700">
                      {item.grade}
                    </span>

                    <div className="h-7 flex-1 overflow-hidden rounded-lg bg-slate-100">
                      <div
                        className="flex h-full items-center rounded-lg bg-emerald-600 px-2"
                        style={{
                          width: `${
                            (item.count /
                              maxGradeCount) *
                            100
                          }%`,
                          minWidth:
                            item.count > 0
                              ? "24px"
                              : "0",
                        }}
                      >
                        {item.count > 0 && (
                          <span className="text-[10px] font-black text-white">
                            {item.count}
                          </span>
                        )}
                      </div>
                    </div>

                  </div>
                )
              )}

            </div>

          </div>

        </div>

        {/* =====================================================
            FOOTER SUMMARY
        ===================================================== */}

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">

          <div className="flex items-start gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700">
              <GraduationCap size={20} />
            </div>

            <div>
              <h3 className="text-sm font-black text-emerald-900">
                Academic Intelligence Summary
              </h3>

              <p className="mt-1 text-xs leading-5 text-emerald-800">
                Your analytics currently cover{" "}
                <strong>
                  {analytics?.students || 0}
                </strong>{" "}
                students across{" "}
                <strong>
                  {analytics?.courses || 0}
                </strong>{" "}
                courses, with{" "}
                <strong>
                  {analytics?.averageAttendance?.toFixed(
                    1
                  ) || "0.0"}%
                </strong>{" "}
                average attendance and{" "}
                <strong>
                  {analytics?.averageGpa?.toFixed(
                    2
                  ) || "0.00"}
                </strong>{" "}
                average GPA.
              </p>
            </div>

          </div>

        </div>

      </div>
    </GenericPage>
  );
}