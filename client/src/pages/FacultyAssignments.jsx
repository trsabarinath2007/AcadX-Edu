import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  CalendarDays,
  BookOpen,
  Users,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowUpRight,
} from "lucide-react";

import GenericPage from "./GenericPage";
import { apiGet, apiPost } from "../api";

export default function FacultyAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");

  const [showCreate, setShowCreate] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    course: "",
    dueDate: "",
    totalMarks: "",
  });

  /* =========================================================
     LOAD ASSIGNMENTS + COURSES
  ========================================================= */

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [assignmentResponse, courseResponse] =
        await Promise.all([
          apiGet("/assignments"),
          apiGet("/courses"),
        ]);

      setAssignments(
        assignmentResponse?.assignments || []
      );

      setCourses(
        courseResponse?.courses || []
      );
    } catch (err) {
      console.error("Faculty assignments load error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load assignments"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* =========================================================
     FILTER ASSIGNMENTS
  ========================================================= */

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return assignments.filter((assignment) => {
      const matchesSearch =
        !query ||
        assignment.title
          ?.toLowerCase()
          .includes(query) ||
        assignment.description
          ?.toLowerCase()
          .includes(query) ||
        assignment.course?.name
          ?.toLowerCase()
          .includes(query) ||
        assignment.course?.code
          ?.toLowerCase()
          .includes(query);

      const matchesCourse =
        courseFilter === "all" ||
        String(assignment.course?._id) ===
          String(courseFilter);

      return matchesSearch && matchesCourse;
    });
  }, [assignments, search, courseFilter]);

  /* =========================================================
     STATISTICS
  ========================================================= */

  const stats = useMemo(() => {
    const now = new Date();

    const active = assignments.filter(
      (assignment) =>
        assignment.dueDate &&
        new Date(assignment.dueDate) >= now
    ).length;

    const overdue = assignments.filter(
      (assignment) =>
        assignment.dueDate &&
        new Date(assignment.dueDate) < now
    ).length;

    return {
      total: assignments.length,
      active,
      overdue,
      courses: new Set(
        assignments
          .map((a) => a.course?._id)
          .filter(Boolean)
      ).size,
    };
  }, [assignments]);

  /* =========================================================
     FORM HANDLING
  ========================================================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      course: "",
      dueDate: "",
      totalMarks: "",
    });
  };

  /* =========================================================
     CREATE ASSIGNMENT
  ========================================================= */

  const createAssignment = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!form.title.trim()) {
      setError("Assignment title is required.");
      return;
    }

    if (!form.course) {
      setError("Please select a course.");
      return;
    }

    if (!form.dueDate) {
      setError("Please select a due date.");
      return;
    }

    if (!form.totalMarks || Number(form.totalMarks) <= 0) {
      setError("Total marks must be greater than 0.");
      return;
    }

    try {
      setSaving(true);

      const response = await apiPost("/assignments", {
        title: form.title.trim(),
        description: form.description.trim(),
        course: form.course,
        dueDate: form.dueDate,
        totalMarks: Number(form.totalMarks),
        maxMarks: Number(form.totalMarks),
      });

      const created =
        response?.assignment;

      if (created) {
        setAssignments((previous) => [
          created,
          ...previous,
        ]);
      } else {
        await loadData();
      }

      resetForm();
      setShowCreate(false);

      setMessage(
        "Assignment created successfully."
      );
    } catch (err) {
      console.error("Create assignment error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create assignment."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     DATE FORMAT
  ========================================================= */

  const formatDate = (date) => {
    if (!date) return "No due date";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const isOverdue = (date) => {
    if (!date) return false;

    return new Date(date) < new Date();
  };

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <GenericPage
      title="Assignments"
      description="Create and manage assignments for your assigned courses."
    >
      <div className="space-y-5">

        {/* =====================================================
            SUCCESS / ERROR
        ===================================================== */}

        {message && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <CheckCircle2 size={18} />
            {message}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <AlertCircle size={18} />
            <span>{error}</span>

            <button
              onClick={() => setError("")}
              className="ml-auto"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* =====================================================
            HEADER ACTION
        ===================================================== */}

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              My Assignments
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Create assignments for courses assigned to you.
            </p>
          </div>

          <button
            onClick={() => {
              setMessage("");
              setError("");
              setShowCreate(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
          >
            <Plus size={17} />
            Create Assignment
          </button>
        </div>

        {/* =====================================================
            STAT CARDS
        ===================================================== */}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

          <StatCard
            icon={<FileText size={20} />}
            label="Total Assignments"
            value={stats.total}
          />

          <StatCard
            icon={<CheckCircle2 size={20} />}
            label="Active"
            value={stats.active}
          />

          <StatCard
            icon={<AlertCircle size={20} />}
            label="Overdue"
            value={stats.overdue}
          />

          <StatCard
            icon={<BookOpen size={20} />}
            label="Courses"
            value={stats.courses}
          />

        </div>

        {/* =====================================================
            SEARCH / FILTER
        ===================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="grid gap-3 md:grid-cols-[1fr_220px]">

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
              <Search
                size={17}
                className="text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search assignments..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>

            <select
              value={courseFilter}
              onChange={(event) =>
                setCourseFilter(event.target.value)
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-emerald-500"
            >
              <option value="all">
                All Courses
              </option>

              {courses.map((course) => (
                <option
                  key={course._id}
                  value={course._id}
                >
                  {course.code} — {course.name}
                </option>
              ))}
            </select>

          </div>
        </div>

        {/* =====================================================
            ASSIGNMENT LIST
        ===================================================== */}

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
              <Loader2
                size={20}
                className="animate-spin"
              />
              Loading assignments...
            </div>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <FileText
              size={40}
              className="mx-auto text-slate-300"
            />

            <h3 className="mt-4 text-base font-black text-slate-800">
              No assignments found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Create your first assignment or change the filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">

            {filteredAssignments.map(
              (assignment) => {

                const overdue = isOverdue(
                  assignment.dueDate
                );

                return (
                  <div
                    key={assignment._id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >

                    {/* TOP */}

                    <div className="flex items-start justify-between gap-4">

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-emerald-700">
                            {assignment.course?.code ||
                              "Course"}
                          </span>

                          {overdue ? (
                            <span className="rounded-lg bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600">
                              Overdue
                            </span>
                          ) : (
                            <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600">
                              Active
                            </span>
                          )}

                        </div>

                        <h3 className="mt-3 text-lg font-black text-slate-900">
                          {assignment.title}
                        </h3>

                      </div>

                      <div className="rounded-xl bg-slate-50 p-2 text-slate-500">
                        <FileText size={19} />
                      </div>

                    </div>

                    {/* DESCRIPTION */}

                    {assignment.description && (
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
                        {assignment.description}
                      </p>
                    )}

                    {/* COURSE */}

                    <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <BookOpen
                        size={16}
                        className="text-emerald-600"
                      />

                      <span>
                        {assignment.course?.name ||
                          "Course"}
                      </span>
                    </div>

                    {/* DETAILS */}

                    <div className="mt-4 grid grid-cols-2 gap-3">

                      <InfoBox
                        icon={
                          <CalendarDays size={16} />
                        }
                        label="Due Date"
                        value={formatDate(
                          assignment.dueDate
                        )}
                        danger={overdue}
                      />

                      <InfoBox
                        icon={
                          <FileText size={16} />
                        }
                        label="Total Marks"
                        value={
                          assignment.totalMarks ??
                          assignment.maxMarks ??
                          0
                        }
                      />

                    </div>

                    {/* FOOTER */}

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">

                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Users size={14} />

                        {assignment.course?.sections?.length
                          ? `${assignment.course.sections.length} section(s)`
                          : "All sections"}
                      </div>

                      <button
                        onClick={() => {
                          window.location.href =
                            `/faculty-submissions?assignment=${assignment._id}`;
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
                      >
                        View Submissions
                        <ArrowUpRight size={14} />
                      </button>

                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}

      </div>

      {/* =======================================================
          CREATE ASSIGNMENT MODAL
      ======================================================= */}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">

              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Create Assignment
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Create an assignment for one of your assigned courses.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowCreate(false);
                  resetForm();
                }}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={createAssignment}
              className="space-y-5 p-5"
            >

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Assignment Title
                </label>

                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Example: Binary Tree Implementation"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Explain the assignment requirements..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                    Course
                  </label>

                  <select
                    name="course"
                    value={form.course}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500"
                  >
                    <option value="">
                      Select Course
                    </option>

                    {courses.map((course) => (
                      <option
                        key={course._id}
                        value={course._id}
                      >
                        {course.code} — {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                    Total Marks
                  </label>

                  <input
                    type="number"
                    name="totalMarks"
                    min="1"
                    value={form.totalMarks}
                    onChange={handleChange}
                    placeholder="100"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                  />
                </div>

              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                  Due Date
                </label>

                <input
                  type="datetime-local"
                  name="dueDate"
                  value={form.dueDate}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              {/* ACTIONS */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    resetForm();
                  }}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Create Assignment
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

    </GenericPage>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
          {icon}
        </div>

        <span className="text-2xl font-black text-slate-900">
          {value}
        </span>
      </div>

      <p className="mt-3 text-xs font-bold text-slate-500">
        {label}
      </p>
    </div>
  );
}

/* =========================================================
   INFO BOX
========================================================= */

function InfoBox({
  icon,
  label,
  value,
  danger = false,
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        danger
          ? "border-red-100 bg-red-50"
          : "border-slate-100 bg-slate-50"
      }`}
    >
      <div
        className={`flex items-center gap-1.5 text-[11px] font-bold ${
          danger
            ? "text-red-500"
            : "text-slate-400"
        }`}
      >
        {icon}
        {label}
      </div>

      <p
        className={`mt-1 text-sm font-black ${
          danger
            ? "text-red-700"
            : "text-slate-800"
        }`}
      >
        {value}
      </p>
    </div>
  );
}