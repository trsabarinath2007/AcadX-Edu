import React, {
  useEffect,
  useMemo,
  useState
} from "react";

import GenericPage from "./GenericPage";
import { apiGet } from "../api";

function StatCard({
  label,
  value,
  description
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-slate-900">
        {value}
      </p>

      {description && (
        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );
}

export default function AdminAssignments() {
  const [assignments, setAssignments] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  async function loadAssignments() {
    try {
      setLoading(true);
      setError("");

      const response =
        await apiGet("/assignments");

      setAssignments(
        response?.assignments || []
      );
    } catch (err) {
      console.error(
        "Admin assignments error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load assignments"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAssignments();
  }, []);

  const filteredAssignments =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return assignments;
      }

      return assignments.filter(
        (assignment) => {
          const title =
            assignment.title ||
            "";

          const courseCode =
            assignment.course?.code ||
            "";

          const courseName =
            assignment.course?.name ||
            "";

          const creator =
            assignment.createdBy?.name ||
            "";

          return (
            title
              .toLowerCase()
              .includes(query) ||
            courseCode
              .toLowerCase()
              .includes(query) ||
            courseName
              .toLowerCase()
              .includes(query) ||
            creator
              .toLowerCase()
              .includes(query)
          );
        }
      );
    }, [assignments, search]);

  const totalAssignments =
    assignments.length;

  const totalCourses =
    new Set(
      assignments
        .map(
          (assignment) =>
            assignment.course?._id
        )
        .filter(Boolean)
    ).size;

  const totalCreators =
    new Set(
      assignments
        .map(
          (assignment) =>
            assignment.createdBy?._id
        )
        .filter(Boolean)
    ).size;

  const today = new Date();

  const activeAssignments =
    assignments.filter(
      (assignment) => {
        if (!assignment.dueDate) {
          return false;
        }

        return (
          new Date(
            assignment.dueDate
          ) >= today
        );
      }
    ).length;

  return (
    <GenericPage
      title="Assignment Management"
      description="Monitor faculty-created assignments across the institution. Admin access is read-only."
    >
      <div className="space-y-5">
        {/* SECURITY NOTICE */}

        <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-900">
              Admin Monitoring Mode
            </p>

            <p className="mt-1 text-xs text-emerald-700">
              Admin can view assignment details,
              marks and the faculty who created them.
              Assignment creation and grading are
              faculty-only.
            </p>
          </div>

          <div className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-emerald-700 shadow-sm">
            VIEW ONLY
          </div>
        </div>

        {/* STATS */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Assignments"
            value={totalAssignments}
            description="Faculty-created assignments"
          />

          <StatCard
            label="Active"
            value={activeAssignments}
            description="Upcoming deadlines"
          />

          <StatCard
            label="Courses"
            value={totalCourses}
            description="Courses with assignments"
          />

          <StatCard
            label="Faculty Creators"
            value={totalCreators}
            description="Faculty who created assignments"
          />
        </div>

        {/* MAIN CARD */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* HEADER */}

          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Faculty Assignments
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Admin can monitor academic
                assignments but cannot create or
                grade them.
              </p>
            </div>

            <div className="flex gap-2">
              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search assignment, course or faculty..."
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-500 md:w-80"
              />

              <button
                type="button"
                onClick={loadAssignments}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* CONTENT */}

          {loading ? (
            <div className="p-12 text-center">
              <p className="text-sm font-semibold text-slate-500">
                Loading assignments...
              </p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="font-bold text-red-600">
                {error}
              </p>

              <button
                type="button"
                onClick={loadAssignments}
                className="mt-4 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white"
              >
                Try Again
              </button>
            </div>
          ) : filteredAssignments.length ===
            0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl">
                📝
              </div>

              <p className="mt-4 font-bold text-slate-700">
                No assignments found
              </p>

              <p className="mt-1 text-xs text-slate-500">
                No faculty-created assignments
                match your search.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Assignment
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Course
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Maximum Marks
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Due Date
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Created By
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredAssignments.map(
                    (assignment) => {
                      const maximumMarks =
                        assignment.totalMarks ??
                        assignment.maxMarks ??
                        assignment.marks ??
                        "—";

                      return (
                        <tr
                          key={
                            assignment._id
                          }
                          className="transition hover:bg-slate-50/70"
                        >
                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-900">
                              {assignment.title ||
                                "Untitled Assignment"}
                            </p>

                            {assignment.description && (
                              <p className="mt-1 max-w-xs truncate text-xs text-slate-400">
                                {
                                  assignment.description
                                }
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-slate-800">
                              {assignment
                                .course
                                ?.code ||
                                "—"}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              {assignment
                                .course
                                ?.name ||
                                ""}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                              {maximumMarks}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {formatDate(
                              assignment.dueDate
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-slate-800">
                              {assignment
                                .createdBy
                                ?.name ||
                                "Unknown Faculty"}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              {assignment
                                .createdBy
                                ?.email ||
                                ""}
                            </p>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </GenericPage>
  );
}