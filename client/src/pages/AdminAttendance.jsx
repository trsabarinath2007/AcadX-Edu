import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
const API_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const getToken = () => localStorage.getItem("token");

async function apiGet(endpoint) {
  const token = getToken();

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    },
    credentials: "include",
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.message || `Request failed (${response.status})`
    );
  }

  return data;
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getPercentageColor(value) {
  const percentage = Number(value) || 0;

  if (percentage >= 75) {
    return "text-emerald-600";
  }

  if (percentage >= 65) {
    return "text-amber-600";
  }

  return "text-red-600";
}

function getBadgeColor(value) {
  const percentage = Number(value) || 0;

  if (percentage >= 75) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (percentage >= 65) {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-red-50 text-red-700";
}

export default function AdminAttendance() {
  const [data, setData] = useState({
    statistics: {
      totalStudents: 0,
      totalRecords: 0,
      presentRecords: 0,
      absentRecords: 0,
      overallPercentage: 0,
    },
    students: [],
    attendance: [],
  });

  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);

  const [filters, setFilters] = useState({
    department: "",
    semester: "",
    section: "",
    courseId: "",
    date: "",
  });

  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState("");

  /* =========================================================
     LOAD FILTER OPTIONS
  ========================================================= */

  async function loadFilterOptions() {
    try {
      const [departmentResponse, courseResponse] =
        await Promise.all([
          apiGet("/admin/departments"),
          apiGet("/admin/courses"),
        ]);

      setDepartments(
        departmentResponse.departments || []
      );

      setCourses(courseResponse.courses || []);
    } catch (error) {
      console.error("Filter loading error:", error);
    }
  }

  /* =========================================================
     LOAD ATTENDANCE
  ========================================================= */

  async function loadAttendance(
    selectedFilters = filters,
    initial = false
  ) {
    try {
      if (initial) {
        setLoading(true);
      } else {
        setFilterLoading(true);
      }

      setError("");

      const params = new URLSearchParams();

      if (selectedFilters.department) {
        params.append(
          "department",
          selectedFilters.department
        );
      }

      if (selectedFilters.semester) {
        params.append(
          "semester",
          selectedFilters.semester
        );
      }

      if (selectedFilters.section) {
        params.append(
          "section",
          selectedFilters.section
        );
      }

      if (selectedFilters.courseId) {
        params.append(
          "courseId",
          selectedFilters.courseId
        );
      }

      if (selectedFilters.date) {
        params.append(
          "date",
          selectedFilters.date
        );
      }

      const query = params.toString();

      const result = await apiGet(
        `/attendance/admin/overview${
          query ? `?${query}` : ""
        }`
      );

      setData({
        statistics: {
          totalStudents:
            result.statistics?.totalStudents || 0,

          totalRecords:
            result.statistics?.totalRecords || 0,

          presentRecords:
            result.statistics?.presentRecords || 0,

          absentRecords:
            result.statistics?.absentRecords || 0,

          overallPercentage:
            result.statistics?.overallPercentage || 0,
        },

        students: result.students || [],

        attendance: result.attendance || [],
      });
    } catch (error) {
      console.error("Attendance error:", error);

      setError(
        error.message ||
          "Unable to load attendance data"
      );
    } finally {
      setLoading(false);
      setFilterLoading(false);
    }
  }

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    loadFilterOptions();
    loadAttendance(filters, true);
  }, []);

  /* =========================================================
     FILTER DATA
  ========================================================= */

  const semesters = useMemo(() => {
    const values = courses
      .map((course) => course.semester)
      .filter(
        (semester) =>
          semester !== undefined &&
          semester !== null
      );

    return [...new Set(values)].sort(
      (a, b) => Number(a) - Number(b)
    );
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const departmentId =
        course.department?._id ||
        course.department;

      const departmentMatch =
        !filters.department ||
        String(departmentId) ===
          String(filters.department);

      const semesterMatch =
        !filters.semester ||
        Number(course.semester) ===
          Number(filters.semester);

      return (
        departmentMatch &&
        semesterMatch
      );
    });
  }, [
    courses,
    filters.department,
    filters.semester,
  ]);

  const sections = useMemo(() => {
    const result = [];

    filteredCourses.forEach((course) => {
      if (Array.isArray(course.sections)) {
        course.sections.forEach((section) => {
          if (section) {
            result.push(
              String(section)
                .trim()
                .toUpperCase()
            );
          }
        });
      }
    });

    return [...new Set(result)].sort();
  }, [filteredCourses]);

  /* =========================================================
     LOW ATTENDANCE
  ========================================================= */

  const lowAttendanceStudents =
    useMemo(() => {
      return [...data.students]
        .filter(
          (student) =>
            Number(student.percentage || 0) < 75
        )
        .sort(
          (a, b) =>
            Number(a.percentage || 0) -
            Number(b.percentage || 0)
        );
    }, [data.students]);

  /* =========================================================
     HANDLERS
  ========================================================= */

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function applyFilters() {
    loadAttendance(filters);
  }

  function clearFilters() {
    const cleared = {
      department: "",
      semester: "",
      section: "",
      courseId: "",
      date: "",
    };

    setFilters(cleared);
    loadAttendance(cleared);
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <Layout>
      <div className="min-h-screen bg-[#f7faf8]">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="border-b border-slate-200 bg-white">

        <div className="mx-auto max-w-[1600px] px-5 py-6 sm:px-8">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <div className="flex items-center gap-2">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                  <svg
                    className="h-5 w-5 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a3 3 0 006 0M9 5h6"
                    />
                  </svg>
                </div>

                <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                  Attendance
                </h1>

              </div>

              <p className="mt-1 text-sm text-slate-500">
                Monitor attendance across students,
                courses and departments.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                loadAttendance(filters)
              }
              disabled={
                loading || filterLoading
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h5M20 20v-5h-5M5.5 9A7 7 0 0117 5.5L20 9M18.5 15A7 7 0 017 18.5L4 15"
                />
              </svg>

              Refresh
            </button>

          </div>

        </div>

      </div>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="mx-auto max-w-[1600px] px-5 py-6 sm:px-8">

        {/* ERROR */}

        {error && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">

            <div className="flex items-center gap-3">

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-sm font-bold text-red-600">
                !
              </div>

              <div>
                <p className="text-sm font-semibold text-red-700">
                  Unable to load attendance
                </p>

                <p className="text-xs text-red-600">
                  {error}
                </p>
              </div>

            </div>

            <button
              onClick={() =>
                loadAttendance(filters)
              }
              className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
            >
              Retry
            </button>

          </div>
        )}

        {/* ===================================================
            STATISTICS
        =================================================== */}

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">

          {/* Total Students */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Students
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {data.statistics.totalStudents}
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-2.5">
                <svg
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                  />
                </svg>
              </div>

            </div>

            <p className="mt-3 text-xs text-slate-400">
              Students with attendance records
            </p>

          </div>

          {/* Total Records */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Records
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {data.statistics.totalRecords}
                </p>
              </div>

              <div className="rounded-xl bg-violet-50 p-2.5">
                <svg
                  className="h-5 w-5 text-violet-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M9 5h6M9 9h6M9 13h4M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"
                  />
                </svg>
              </div>

            </div>

            <p className="mt-3 text-xs text-slate-400">
              Attendance entries recorded
            </p>

          </div>

          {/* Present */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Present
                </p>

                <p className="mt-2 text-2xl font-bold text-emerald-600">
                  {data.statistics.presentRecords}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 p-2.5">
                <svg
                  className="h-5 w-5 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

            </div>

            <p className="mt-3 text-xs text-slate-400">
              Students marked present
            </p>

          </div>

          {/* Overall */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Overall Attendance
                </p>

                <p
                  className={`mt-2 text-2xl font-bold ${getPercentageColor(
                    data.statistics
                      .overallPercentage
                  )}`}
                >
                  {data.statistics.overallPercentage}%
                </p>
              </div>

              <div className="relative flex h-11 w-11 items-center justify-center">

                <svg
                  className="h-11 w-11 -rotate-90"
                  viewBox="0 0 40 40"
                >
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="4"
                  />

                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="#059669"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="100"
                    strokeDashoffset={
                      100 -
                      Math.min(
                        Number(
                          data.statistics
                            .overallPercentage
                        ) || 0,
                        100
                      )
                    }
                    pathLength="100"
                  />
                </svg>

              </div>

            </div>

            <p className="mt-3 text-xs text-slate-400">
              Institution-wide attendance rate
            </p>

          </div>

        </div>

        {/* ===================================================
            FILTERS
        =================================================== */}

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Attendance Filters
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Narrow down the attendance data.
                </p>
              </div>

            </div>

          </div>

          <div className="p-5 sm:p-6">

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">

              {/* Department */}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Department
                </label>

                <select
                  name="department"
                  value={filters.department}
                  onChange={handleFilterChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-50"
                >
                  <option value="">
                    All Departments
                  </option>

                  {departments.map(
                    (department) => (
                      <option
                        key={department._id}
                        value={department._id}
                      >
                        {department.code ||
                          department.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Semester */}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Semester
                </label>

                <select
                  name="semester"
                  value={filters.semester}
                  onChange={handleFilterChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-50"
                >
                  <option value="">
                    All Semesters
                  </option>

                  {semesters.map(
                    (semester) => (
                      <option
                        key={semester}
                        value={semester}
                      >
                        Semester {semester}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Section */}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Section
                </label>

                <select
                  name="section"
                  value={filters.section}
                  onChange={handleFilterChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-50"
                >
                  <option value="">
                    All Sections
                  </option>

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

              {/* Course */}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Course
                </label>

                <select
                  name="courseId"
                  value={filters.courseId}
                  onChange={handleFilterChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-50"
                >
                  <option value="">
                    All Courses
                  </option>

                  {filteredCourses.map(
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
              </div>

              {/* Date */}

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Date
                </label>

                <input
                  type="date"
                  name="date"
                  value={filters.date}
                  onChange={handleFilterChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-50"
                />
              </div>

            </div>

            <div className="mt-5 flex items-center justify-end gap-3">

              <button
                type="button"
                onClick={clearFilters}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={applyFilters}
                disabled={filterLoading}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {filterLoading
                  ? "Applying..."
                  : "Apply Filters"}
              </button>

            </div>

          </div>

        </section>

        {/* ===================================================
            ATTENDANCE OVERVIEW
        =================================================== */}

        <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-3">

          {/* Overview */}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-base font-bold text-slate-900">
              Attendance Overview
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Current filtered attendance distribution.
            </p>

            <div className="mt-8 flex items-center justify-center">

              <div className="relative h-44 w-44">

                <svg
                  className="h-full w-full -rotate-90"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="10"
                  />

                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#059669"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray="251.2"
                    strokeDashoffset={
                      251.2 -
                      (251.2 *
                        Math.min(
                          Number(
                            data.statistics
                              .overallPercentage
                          ) || 0,
                          100
                        )) /
                        100
                    }
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">

                  <span
                    className={`text-3xl font-bold ${getPercentageColor(
                      data.statistics
                        .overallPercentage
                    )}`}
                  >
                    {data.statistics.overallPercentage}%
                  </span>

                  <span className="mt-1 text-xs text-slate-400">
                    Overall
                  </span>

                </div>

              </div>

            </div>

            <div className="mt-7 grid grid-cols-2 gap-3">

              <div className="rounded-xl bg-emerald-50 p-3">

                <div className="flex items-center gap-2">

                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

                  <span className="text-xs font-medium text-slate-600">
                    Present
                  </span>

                </div>

                <p className="mt-1 text-lg font-bold text-emerald-700">
                  {data.statistics.presentRecords}
                </p>

              </div>

              <div className="rounded-xl bg-red-50 p-3">

                <div className="flex items-center gap-2">

                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />

                  <span className="text-xs font-medium text-slate-600">
                    Absent
                  </span>

                </div>

                <p className="mt-1 text-lg font-bold text-red-700">
                  {data.statistics.absentRecords}
                </p>

              </div>

            </div>

          </section>

          {/* Low Attendance */}

          <section className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Students Requiring Attention
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Students below 75% attendance.
                </p>
              </div>

              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                {lowAttendanceStudents.length}
              </span>

            </div>

            {lowAttendanceStudents.length ===
            0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center px-5 text-center">

                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50">

                  <svg
                    className="h-5 w-5 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>

                </div>

                <p className="text-sm font-semibold text-slate-800">
                  No students below 75%
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Attendance is currently above
                  the threshold.
                </p>

              </div>
            ) : (
              <div className="max-h-[280px] overflow-y-auto">

                {lowAttendanceStudents.map(
                  (item) => {
                    const student =
                      item.student || {};

                    return (
                      <div
                        key={student._id}
                        className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0"
                      >

                        <div className="min-w-0">

                          <p className="truncate text-sm font-semibold text-slate-900">
                            {student.name ||
                              "Unknown Student"}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {student.registerNumber ||
                              "—"}
                            {" · "}
                            {student.department
                              ?.code ||
                              student.department
                                ?.name ||
                              "—"}
                            {" · "}
                            Section{" "}
                            {student.section ||
                              "—"}
                          </p>

                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${getBadgeColor(
                            item.percentage
                          )}`}
                        >
                          {item.percentage || 0}%
                        </span>

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </section>

        </div>

        {/* ===================================================
            STUDENT ATTENDANCE TABLE
        =================================================== */}

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-base font-bold text-slate-900">
                Student Attendance
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Attendance summary for recorded students.
              </p>
            </div>

            <span className="text-xs font-medium text-slate-400">
              {data.students.length} students
            </span>

          </div>

          {data.students.length === 0 ? (
            <div className="px-5 py-12 text-center">

              <p className="text-sm font-semibold text-slate-700">
                No attendance data available
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Try changing the selected filters.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[850px]">

                <thead className="bg-slate-50">

                  <tr>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Student
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Register No.
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Department
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Section
                    </th>

                    <th className="px-5 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Present
                    </th>

                    <th className="px-5 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Absent
                    </th>

                    <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Attendance
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {data.students.map(
                    (item) => {
                      const student =
                        item.student || {};

                      return (
                        <tr
                          key={student._id}
                          className="transition hover:bg-slate-50/70"
                        >

                          <td className="px-5 py-4">

                            <p className="text-sm font-semibold text-slate-900">
                              {student.name ||
                                "—"}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              {student.email ||
                                ""}
                            </p>

                          </td>

                          <td className="px-5 py-4 text-sm font-medium text-slate-600">
                            {student.registerNumber ||
                              "—"}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {student.department
                              ?.code ||
                              student.department
                                ?.name ||
                              "—"}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {student.section ||
                              "—"}
                          </td>

                          <td className="px-5 py-4 text-center text-sm font-semibold text-emerald-600">
                            {item.present ||
                              0}
                          </td>

                          <td className="px-5 py-4 text-center text-sm font-semibold text-red-500">
                            {item.absent ||
                              0}
                          </td>

                          <td className="px-5 py-4 text-right">

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${getBadgeColor(
                                item.percentage
                              )}`}
                            >
                              {item.percentage ||
                                0}
                              %
                            </span>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>
          )}

        </section>

        {/* ===================================================
            DETAILED RECORDS
        =================================================== */}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

            <div>
              <h2 className="text-base font-bold text-slate-900">
                Attendance Records
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Individual attendance entries.
              </p>
            </div>

            <span className="text-xs font-medium text-slate-400">
              {data.attendance.length} records
            </span>

          </div>

          {data.attendance.length === 0 ? (
            <div className="px-5 py-12 text-center">

              <p className="text-sm font-semibold text-slate-700">
                No detailed records
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Attendance records will appear here
                once they are marked.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[950px]">

                <thead className="bg-slate-50">

                  <tr>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Date
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Student
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Course
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Section
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Status
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Marked By
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {data.attendance.map(
                    (record) => {
                      const student =
                        record.student || {};

                      const course =
                        record.course || {};

                      const markedBy =
                        record.markedBy || {};

                      const present =
                        record.status ===
                        "present";

                      return (
                        <tr
                          key={record._id}
                          className="transition hover:bg-slate-50/70"
                        >

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {formatDate(
                              record.date
                            )}
                          </td>

                          <td className="px-5 py-4">

                            <p className="text-sm font-semibold text-slate-900">
                              {student.name ||
                                "—"}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              {student.registerNumber ||
                                ""}
                            </p>

                          </td>

                          <td className="px-5 py-4">

                            <p className="text-sm font-semibold text-slate-800">
                              {course.code ||
                                "—"}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              {course.name ||
                                ""}
                            </p>

                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {record.section ||
                              student.section ||
                              "—"}
                          </td>

                          <td className="px-5 py-4">

                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                                present
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >

                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  present
                                    ? "bg-emerald-500"
                                    : "bg-red-500"
                                }`}
                              />

                              {present
                                ? "Present"
                                : "Absent"}

                            </span>

                          </td>

                          <td className="px-5 py-4">

                            <p className="text-sm font-medium text-slate-700">
                              {markedBy.name ||
                                "—"}
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

        </section>

      </main>
    </div>
    </Layout>
  );
}