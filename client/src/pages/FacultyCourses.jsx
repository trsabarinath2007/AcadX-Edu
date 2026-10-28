import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  GraduationCap,
  Layers3,
  Users,
  Search,
  Loader2,
  CalendarDays,
  Building2
} from "lucide-react";

import GenericPage from "./GenericPage";
import { apiGet } from "../api";

export default function FacultyCourses() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    try {
      setLoading(true);
      setError("");

      const response = await apiGet("/courses");

      setCourses(response?.courses || []);
    } catch (err) {
      console.error("Faculty courses error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load assigned courses."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     SEMESTERS
  ========================================================= */

  const semesters = useMemo(() => {
    const values = courses
      .map((course) => course.semester)
      .filter(
        (semester) =>
          semester !== null &&
          semester !== undefined &&
          semester !== ""
      );

    return [
      "All",
      ...Array.from(new Set(values)).sort(
        (a, b) => Number(a) - Number(b)
      )
    ];
  }, [courses]);

  /* =========================================================
     FILTER COURSES
  ========================================================= */

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return courses.filter((course) => {
      const code = String(course.code || "").toLowerCase();
      const name = String(course.name || "").toLowerCase();
      const department = String(
        course.department?.name ||
          course.department?.code ||
          ""
      ).toLowerCase();

      const matchesSearch =
        !query ||
        code.includes(query) ||
        name.includes(query) ||
        department.includes(query);

      const matchesSemester =
        semesterFilter === "All" ||
        String(course.semester) ===
          String(semesterFilter);

      return matchesSearch && matchesSemester;
    });
  }, [courses, search, semesterFilter]);

  /* =========================================================
     SUMMARY
  ========================================================= */

  const totalSections = useMemo(() => {
    return courses.reduce(
      (total, course) =>
        total +
        (Array.isArray(course.sections)
          ? course.sections.length
          : 0),
      0
    );
  }, [courses]);

  const totalCredits = useMemo(() => {
    return courses.reduce(
      (total, course) =>
        total + Number(course.credits || 0),
      0
    );
  }, [courses]);

  const departmentCount = useMemo(() => {
    const values = courses
      .map(
        (course) =>
          course.department?._id ||
          course.department?.code ||
          course.department?.name
      )
      .filter(Boolean);

    return new Set(values.map(String)).size;
  }, [courses]);

  return (
    <GenericPage
      title="My Courses"
      description="Courses assigned to you by the Admin."
    >
      <div className="space-y-5">

        {/* ==================================================
            SUMMARY CARDS
        ================================================== */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <SummaryCard
            icon={BookOpen}
            label="Assigned Courses"
            value={courses.length}
          />

          <SummaryCard
            icon={Layers3}
            label="Sections"
            value={totalSections}
          />

          <SummaryCard
            icon={GraduationCap}
            label="Credits"
            value={totalCredits}
          />

          <SummaryCard
            icon={Building2}
            label="Departments"
            value={departmentCount}
          />

        </div>

        {/* ==================================================
            SEARCH + FILTER
        ================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4">

          <div className="grid gap-3 lg:grid-cols-[1fr_220px]">

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Search
                size={17}
                className="shrink-0 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search by course code, name or department..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>

            <select
              value={semesterFilter}
              onChange={(e) =>
                setSemesterFilter(e.target.value)
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-600"
            >
              {semesters.map((semester) => (
                <option
                  key={semester}
                  value={semester}
                >
                  {semester === "All"
                    ? "All Semesters"
                    : `Semester ${semester}`}
                </option>
              ))}
            </select>

          </div>
        </div>

        {/* ==================================================
            CONTENT
        ================================================== */}

        {loading ? (
          <div className="flex min-h-[350px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
              <Loader2
                size={20}
                className="animate-spin text-emerald-600"
              />
              Loading your courses...
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="font-bold text-red-800">
              Unable to load courses
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>

            <button
              onClick={loadCourses}
              className="mt-4 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800"
            >
              Try Again
            </button>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <BookOpen size={25} />
            </div>

            <h3 className="mt-4 font-extrabold text-slate-900">
              No courses found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {courses.length === 0
                ? "No courses have been assigned to you yet."
                : "No courses match your current search or filter."}
            </p>

          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

            {filteredCourses.map((course) => (
              <CourseCard
                key={course._id}
                course={course}
              />
            ))}

          </div>
        )}

      </div>
    </GenericPage>
  );
}

/* ============================================================
   COURSE CARD
============================================================ */

function CourseCard({ course }) {
  const sections = Array.isArray(course.sections)
    ? course.sections
    : [];

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-sm">

      {/* TOP */}

      <div className="flex items-start justify-between gap-3">

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <BookOpen size={22} />
        </div>

        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-emerald-700">
          Assigned
        </span>

      </div>

      {/* COURSE INFO */}

      <div className="mt-5">

        <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-700">
          {course.code || "COURSE"}
        </p>

        <h2 className="mt-1 text-lg font-extrabold leading-tight text-slate-900">
          {course.name || "Unnamed Course"}
        </h2>

      </div>

      {/* DETAILS */}

      <div className="mt-5 space-y-3">

        <DetailRow
          icon={GraduationCap}
          label="Semester"
          value={
            course.semester
              ? `Semester ${course.semester}`
              : "Not specified"
          }
        />

        <DetailRow
          icon={Building2}
          label="Department"
          value={
            course.department?.code ||
            course.department?.name ||
            "Not specified"
          }
        />

        <DetailRow
          icon={Users}
          label="Sections"
          value={
            sections.length
              ? sections.join(", ")
              : "No sections"
          }
        />

        <DetailRow
          icon={CalendarDays}
          label="Credits"
          value={
            course.credits
              ? `${course.credits} credits`
              : "Not specified"
          }
        />

      </div>

      {/* SECTION BADGES */}

      {sections.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-4">

          <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-slate-400">
            Assigned Sections
          </p>

          <div className="flex flex-wrap gap-2">

            {sections.map((section) => (
              <span
                key={section}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700"
              >
                Section {section}
              </span>
            ))}

          </div>

        </div>
      )}

    </div>
  );
}

/* ============================================================
   DETAIL ROW
============================================================ */

function DetailRow({
  icon: Icon,
  label,
  value
}) {
  return (
    <div className="flex items-center gap-3">

      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
        <Icon size={15} />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="truncate text-sm font-semibold text-slate-700">
          {value}
        </p>
      </div>

    </div>
  );
}

/* ============================================================
   SUMMARY CARD
============================================================ */

function SummaryCard({
  icon: Icon,
  label,
  value
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p className="mt-3 text-3xl font-black text-slate-900">
            {value}
          </p>
        </div>

        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
          <Icon size={19} />
        </div>

      </div>

    </div>
  );
}