import React, {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  Search,
  Users,
  BookOpen,
  GraduationCap,
  Mail,
  Loader2,
  UserRound
} from "lucide-react";

import GenericPage from "./GenericPage";
import { apiGet } from "../api";

export default function FacultyStudents() {
  const [students, setStudents] =
    useState([]);

  const [courses, setCourses] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [courseFilter, setCourseFilter] =
    useState("All");

  const [sectionFilter, setSectionFilter] =
    useState("All");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    try {
      setLoading(true);
      setError("");

      const response =
        await apiGet(
          "/analytics/faculty/students"
        );

      setStudents(
        response?.students || []
      );

      setCourses(
        response?.courses || []
      );
    } catch (err) {
      console.error(
        "Faculty students error:",
        err
      );

      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load students."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     SECTIONS
  ========================================================= */

  const sections = useMemo(() => {
    const values =
      students
        .map(
          (student) =>
            student.section
        )
        .filter(Boolean)
        .map((section) =>
          String(section)
            .trim()
            .toUpperCase()
        );

    return [
      "All",
      ...Array.from(
        new Set(values)
      )
    ];
  }, [students]);

  /* =========================================================
     FILTER STUDENTS
  ========================================================= */

  const filteredStudents =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return students.filter(
        (student) => {
          const name =
            student.name || "";

          const email =
            student.email || "";

          const registerNumber =
            student.registerNumber ||
            "";

          const matchesSearch =
            !query ||
            name
              .toLowerCase()
              .includes(query) ||
            email
              .toLowerCase()
              .includes(query) ||
            registerNumber
              .toLowerCase()
              .includes(query);

          const matchesSection =
            sectionFilter === "All" ||
            String(
              student.section || ""
            )
              .trim()
              .toUpperCase() ===
              sectionFilter;

          const matchesCourse =
            courseFilter === "All" ||
            student.courses?.some(
              (course) =>
                String(course._id) ===
                String(courseFilter)
            );

          return (
            matchesSearch &&
            matchesSection &&
            matchesCourse
          );
        }
      );
    }, [
      students,
      search,
      sectionFilter,
      courseFilter
    ]);

  return (
    <GenericPage
      title="Students"
      description="View students associated with your assigned courses."
    >
      <div className="space-y-5">

        {/* ==================================================
            SUMMARY
        ================================================== */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          <SummaryCard
            icon={Users}
            label="Total Students"
            value={students.length}
          />

          <SummaryCard
            icon={BookOpen}
            label="My Courses"
            value={courses.length}
          />

          <SummaryCard
            icon={GraduationCap}
            label="Visible Students"
            value={
              filteredStudents.length
            }
          />

        </div>

        {/* ==================================================
            FILTERS
        ================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4">

          <div className="grid gap-3 lg:grid-cols-[1fr_220px_160px]">

            {/* SEARCH */}

            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Search
                size={17}
                className="text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search by name, register number or email..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>

            {/* COURSE */}

            <select
              value={courseFilter}
              onChange={(e) =>
                setCourseFilter(
                  e.target.value
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-600"
            >
              <option value="All">
                All Courses
              </option>

              {courses.map(
                (course) => (
                  <option
                    key={course._id}
                    value={course._id}
                  >
                    {course.code} —{" "}
                    {course.name}
                  </option>
                )
              )}
            </select>

            {/* SECTION */}

            <select
              value={sectionFilter}
              onChange={(e) =>
                setSectionFilter(
                  e.target.value
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-600"
            >
              {sections.map(
                (section) => (
                  <option
                    key={section}
                    value={section}
                  >
                    Section {section}
                  </option>
                )
              )}
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

              Loading students...
            </div>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="font-bold text-red-800">
              Unable to load students
            </p>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>

            <button
              onClick={loadStudents}
              className="mt-4 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800"
            >
              Try Again
            </button>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <UserRound size={24} />
            </div>

            <h3 className="mt-4 font-extrabold text-slate-900">
              No students found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              No students match the selected
              filters.
            </p>

          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

            {/* TABLE HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="font-extrabold text-slate-900">
                  Student List
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {filteredStudents.length}{" "}
                  students shown
                </p>
              </div>
            </div>

            {/* DESKTOP TABLE */}

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">

                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">

                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-wide text-slate-400">
                      Student
                    </th>

                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-wide text-slate-400">
                      Register Number
                    </th>

                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-wide text-slate-400">
                      Semester
                    </th>

                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-wide text-slate-400">
                      Section
                    </th>

                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-wide text-slate-400">
                      Courses
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filteredStudents.map(
                    (student) => (
                      <tr
                        key={student._id}
                        className="hover:bg-slate-50"
                      >

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm font-black text-emerald-700">
                              {(
                                student.name ||
                                "S"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-900">
                                {student.name}
                              </p>

                              <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                                <Mail
                                  size={11}
                                />

                                <span className="truncate">
                                  {student.email}
                                </span>
                              </div>
                            </div>

                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                          {student.registerNumber ||
                            "—"}
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                            Semester{" "}
                            {student.semester ||
                              "—"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                            {student.section ||
                              "—"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {student.courses?.map(
                              (course) => (
                                <span
                                  key={
                                    course._id
                                  }
                                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-600"
                                >
                                  {
                                    course.code
                                  }
                                </span>
                              )
                            )}
                          </div>
                        </td>

                      </tr>
                    )
                  )}

                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}

            <div className="divide-y divide-slate-100 md:hidden">

              {filteredStudents.map(
                (student) => (
                  <div
                    key={student._id}
                    className="p-4"
                  >

                    <div className="flex items-start gap-3">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 font-black text-emerald-700">
                        {(
                          student.name ||
                          "S"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">

                        <p className="font-bold text-slate-900">
                          {student.name}
                        </p>

                        <p className="mt-0.5 truncate text-xs text-slate-400">
                          {student.email}
                        </p>

                        <p className="mt-2 text-xs font-semibold text-slate-600">
                          {student.registerNumber ||
                            "No register number"}
                        </p>

                      </div>

                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] font-bold uppercase text-slate-400">
                          Semester
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-800">
                          {student.semester ||
                            "—"}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] font-bold uppercase text-slate-400">
                          Section
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-800">
                          {student.section ||
                            "—"}
                        </p>
                      </div>

                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {student.courses?.map(
                        (course) => (
                          <span
                            key={
                              course._id
                            }
                            className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700"
                          >
                            {course.code}
                          </span>
                        )
                      )}
                    </div>

                  </div>
                )
              )}

            </div>

          </div>
        )}

      </div>
    </GenericPage>
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