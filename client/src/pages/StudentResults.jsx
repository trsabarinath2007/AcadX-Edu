import React, { useEffect, useState } from "react";
import {
  GraduationCap,
  Award,
  TrendingUp,
  Loader2
} from "lucide-react";

import GenericPage from "./GenericPage";
import { apiGet } from "../api";

export default function StudentResults() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, []);

  async function loadResults() {
    try {
      const response = await apiGet(
        "/analytics/student"
      );

      setAnalytics(response?.analytics || null);
    } catch (error) {
      console.error("Results error:", error);
    } finally {
      setLoading(false);
    }
  }

  const gpa =
    Number(analytics?.academics?.gpa || 0);

  const quizAverage =
    Number(
      analytics?.academics?.quizAverage || 0
    );

  return (
    <GenericPage
      title="Results & Records"
      description="View your academic performance, GPA and assessment results."
    >
      <div className="space-y-5">

        {loading ? (
          <div className="flex justify-center rounded-2xl border bg-white py-16">
            <Loader2
              size={18}
              className="animate-spin"
            />
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">

              <Stat
                label="CGPA"
                value={`${gpa.toFixed(2)} / 10`}
                icon={GraduationCap}
              />

              <Stat
                label="Quiz Average"
                value={`${quizAverage.toFixed(1)}%`}
                icon={TrendingUp}
              />

              <Stat
                label="Courses"
                value={
                  analytics?.courses?.length || 0
                }
                icon={Award}
              />

            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-100 p-5">
                <h2 className="font-extrabold">
                  Academic Records
                </h2>

                <p className="text-xs text-slate-500">
                  Courses currently associated with your academic profile
                </p>
              </div>

              <div className="divide-y divide-slate-100">

                {(analytics?.courses || []).map(
                  (course) => (
                    <div
                      key={course._id}
                      className="flex items-center justify-between gap-4 p-5"
                    >
                      <div>
                        <p className="text-xs font-black text-emerald-700">
                          {course.code}
                        </p>

                        <p className="font-bold text-slate-900">
                          {course.name}
                        </p>
                      </div>

                      <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500">
                        Active Course
                      </span>
                    </div>
                  )
                )}

                {(!analytics?.courses ||
                  analytics.courses.length === 0) && (
                  <div className="p-10 text-center text-sm text-slate-500">
                    No course records available.
                  </div>
                )}

              </div>

            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <div className="flex gap-3">
                <GraduationCap
                  size={20}
                  className="text-emerald-700"
                />

                <div>
                  <h3 className="font-extrabold text-emerald-900">
                    Academic Summary
                  </h3>

                  <p className="mt-1 text-sm text-emerald-800">
                    Your current GPA is{" "}
                    <strong>
                      {gpa.toFixed(2)}
                    </strong>{" "}
                    and your average quiz performance is{" "}
                    <strong>
                      {quizAverage.toFixed(1)}%
                    </strong>.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </GenericPage>
  );
}

function Stat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <Icon
        size={20}
        className="text-emerald-700"
      />

      <p className="mt-3 text-xs font-bold uppercase text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-3xl font-black">
        {value}
      </p>
    </div>
  );
}