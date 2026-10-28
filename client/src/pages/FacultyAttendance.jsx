import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  Check,
  Users,
  Save,
  Loader2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

import GenericPage from "./GenericPage";
import { apiGet, apiPost } from "../api";

export default function FacultyAttendance() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);

  const [courseId, setCourseId] = useState("");
  const [section, setSection] = useState("");
  const [date, setDate] = useState(getToday());

  // true = present
  // false = absent
  const [attendance, setAttendance] = useState({});

  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // LOAD FACULTY COURSES
  // ============================================================

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    try {
      setLoadingCourses(true);
      setError("");

      const response = await apiGet(
        "/attendance/faculty/courses"
      );

      const data = response?.courses || [];

      setCourses(data);

      if (data.length > 0) {
        setCourseId(data[0]._id);

        const firstSection =
          data[0].sections?.[0] || "";

        setSection(firstSection);
      }
    } catch (err) {
      console.error(
        "Faculty attendance courses:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load courses."
      );
    } finally {
      setLoadingCourses(false);
    }
  }

  // ============================================================
  // SELECTED COURSE
  // ============================================================

  const selectedCourse = useMemo(() => {
    return courses.find(
      (course) =>
        String(course._id) === String(courseId)
    );
  }, [courses, courseId]);

  const sections = selectedCourse?.sections || [];

  // ============================================================
  // KEEP SECTION VALID
  // ============================================================

  useEffect(() => {
    if (!selectedCourse) return;

    const sectionExists = sections.some(
      (item) =>
        String(item).toUpperCase() ===
        String(section).toUpperCase()
    );

    if (!sectionExists) {
      setSection(sections[0] || "");
    }
  }, [selectedCourse, sections, section]);

  // ============================================================
  // LOAD STUDENTS
  // ============================================================

  async function loadStudents() {
    if (!courseId || !section || !date) {
      setError(
        "Please select a course, section and date."
      );
      return;
    }

    try {
      setLoadingStudents(true);
      setError("");
      setSuccess("");

      setStudents([]);
      setAttendance({});

      const query =
        `?courseId=${encodeURIComponent(courseId)}` +
        `&section=${encodeURIComponent(section)}` +
        `&date=${encodeURIComponent(date)}`;

      const response = await apiGet(
        `/attendance/faculty/students${query}`
      );

      const data = response?.students || [];

      setStudents(data);

      // Initialize attendance
      const initialAttendance = {};

      data.forEach((student) => {
        /*
          If backend already returns attendanceStatus,
          use it.

          Otherwise default to absent.
        */
        const status =
          student.attendanceStatus ||
          student.attendance ||
          null;

        initialAttendance[student._id] =
          status === "present";
      });

      setAttendance(initialAttendance);
    } catch (err) {
      console.error(
        "Faculty attendance students:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load students."
      );
    } finally {
      setLoadingStudents(false);
    }
  }

  // ============================================================
  // TOGGLE INDIVIDUAL STUDENT
  // ============================================================

  function toggleStudent(studentId) {
    setAttendance((current) => ({
      ...current,
      [studentId]: !current[studentId],
    }));

    setSuccess("");
  }

  // ============================================================
  // MARK ALL PRESENT
  // ============================================================

  function markAllPresent() {
    const next = {};

    students.forEach((student) => {
      next[student._id] = true;
    });

    setAttendance(next);
    setSuccess("");
  }

  // ============================================================
  // MARK ALL ABSENT
  // ============================================================

  function markAllAbsent() {
    const next = {};

    students.forEach((student) => {
      next[student._id] = false;
    });

    setAttendance(next);
    setSuccess("");
  }

  // ============================================================
  // SAVE ATTENDANCE
  // ============================================================

  async function saveAttendance() {
    if (!courseId) {
      setError("Please select a course.");
      return;
    }

    if (!section) {
      setError("Please select a section.");
      return;
    }

    if (!date) {
      setError("Please select a date.");
      return;
    }

    if (!students.length) {
      setError(
        "No students available to save attendance."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      /*
        Backend expects:

        {
          courseId,
          section,
          date,
          records: [
            {
              studentId,
              status: "present" / "absent"
            }
          ]
        }
      */

      const records = students.map((student) => ({
        studentId: student._id,
        status: attendance[student._id]
          ? "present"
          : "absent",
      }));

      console.log(
        "Saving attendance:",
        {
          courseId,
          section,
          date,
          records,
        }
      );

      const response = await apiPost(
        "/attendance/faculty/mark",
        {
          courseId,
          section,
          date,
          records,
        }
      );

      setSuccess(
        response?.message ||
          `Attendance saved successfully for ${students.length} students.`
      );

      /*
        Reload from database after saving.
      */
      await loadStudents();
    } catch (err) {
      console.error(
        "Save attendance error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save attendance."
      );
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // SUMMARY
  // ============================================================

  const presentCount = students.filter(
    (student) =>
      attendance[student._id] === true
  ).length;

  const absentCount =
    students.length - presentCount;

  const attendancePercentage =
    students.length
      ? Math.round(
          (presentCount / students.length) *
            100
        )
      : 0;

  // ============================================================
  // UI
  // ============================================================

  return (
    <GenericPage
      title="Attendance"
      description="Record attendance only for courses assigned to you."
    >
      <div className="space-y-5">

        {/* ==================================================
            CONTROLS
        ================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5">

          <div className="grid gap-4 lg:grid-cols-3">

            {/* COURSE */}

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                Course
              </label>

              <select
                value={courseId}
                onChange={(e) => {
                  setCourseId(e.target.value);
                  setStudents([]);
                  setAttendance({});
                  setSuccess("");
                  setError("");
                }}
                disabled={loadingCourses}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-600"
              >
                {courses.length === 0 ? (
                  <option value="">
                    No assigned courses
                  </option>
                ) : (
                  courses.map((course) => (
                    <option
                      key={course._id}
                      value={course._id}
                    >
                      {course.code} — {course.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* SECTION */}

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                Section
              </label>

              <select
                value={section}
                onChange={(e) => {
                  setSection(e.target.value);
                  setStudents([]);
                  setAttendance({});
                  setSuccess("");
                  setError("");
                }}
                disabled={!sections.length}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-600"
              >
                {!sections.length ? (
                  <option value="">
                    No sections
                  </option>
                ) : (
                  sections.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      Section {item}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* DATE */}

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                Date
              </label>

              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setStudents([]);
                  setAttendance({});
                  setSuccess("");
                  setError("");
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-600"
              />
            </div>

          </div>

          <button
            onClick={loadStudents}
            disabled={
              loadingStudents ||
              !courseId ||
              !section ||
              !date
            }
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingStudents ? (
              <Loader2
                size={17}
                className="animate-spin"
              />
            ) : (
              <Users size={17} />
            )}

            Load Students
          </button>
        </div>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">

            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>
              <p className="text-sm font-bold text-red-800">
                Attendance error
              </p>

              <p className="mt-1 text-sm text-red-600">
                {error}
              </p>
            </div>

          </div>
        )}

        {/* ==================================================
            SUCCESS
        ================================================== */}

        {success && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-bold text-emerald-800">
              {success}
            </p>
          </div>
        )}

        {/* ==================================================
            SUMMARY
        ================================================== */}

        {students.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-3">

            <SummaryCard
              icon={Users}
              label="Total Students"
              value={students.length}
            />

            <SummaryCard
              icon={Check}
              label="Present"
              value={presentCount}
            />

            <SummaryCard
              icon={CalendarCheck}
              label="Attendance"
              value={`${attendancePercentage}%`}
            />

          </div>
        )}

        {/* ==================================================
            STUDENT LIST
        ================================================== */}

        {students.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

            {/* HEADER */}

            <div className="border-b border-slate-100 p-5">

              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                <div>
                  <h2 className="font-extrabold text-slate-900">
                    Mark Attendance
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {selectedCourse?.code} · Section{" "}
                    {section} ·{" "}
                    {formatDisplayDate(date)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">

                  <button
                    onClick={markAllPresent}
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                  >
                    <Check size={14} />
                    Mark All Present
                  </button>

                  <button
                    onClick={markAllAbsent}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    <RotateCcw size={14} />
                    Mark All Absent
                  </button>

                </div>

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
                      Section
                    </th>

                    <th className="px-5 py-3 text-right text-[11px] font-black uppercase tracking-wide text-slate-400">
                      Status
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {students.map((student) => {

                    const isPresent =
                      attendance[student._id] ===
                      true;

                    return (
                      <tr
                        key={student._id}
                        className="hover:bg-slate-50"
                      >

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-xs font-black text-emerald-700">
                              {(
                                student.name || "S"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {student.name}
                              </p>

                              <p className="text-xs text-slate-400">
                                {student.email}
                              </p>
                            </div>

                          </div>

                        </td>

                        <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                          {student.registerNumber ||
                            "—"}
                        </td>

                        <td className="px-5 py-4">

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                            {student.section ||
                              section}
                          </span>

                        </td>

                        <td className="px-5 py-4 text-right">

                          <button
                            onClick={() =>
                              toggleStudent(
                                student._id
                              )
                            }
                            className={`inline-flex min-w-[105px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition ${
                              isPresent
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                            }`}
                          >

                            {isPresent && (
                              <Check size={14} />
                            )}

                            {isPresent
                              ? "Present"
                              : "Absent"}

                          </button>

                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>

            {/* MOBILE */}

            <div className="divide-y divide-slate-100 md:hidden">

              {students.map((student) => {

                const isPresent =
                  attendance[student._id] ===
                  true;

                return (
                  <div
                    key={student._id}
                    className="p-4"
                  >

                    <div className="flex items-center justify-between gap-3">

                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm font-black text-emerald-700">
                          {(
                            student.name || "S"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">

                          <p className="truncate text-sm font-bold text-slate-900">
                            {student.name}
                          </p>

                          <p className="text-xs text-slate-400">
                            {student.registerNumber ||
                              "No register number"}
                          </p>

                        </div>

                      </div>

                      <button
                        onClick={() =>
                          toggleStudent(
                            student._id
                          )
                        }
                        className={`shrink-0 rounded-xl px-3 py-2 text-xs font-black ${
                          isPresent
                            ? "bg-emerald-600 text-white"
                            : "border border-slate-200 bg-white text-slate-500"
                        }`}
                      >
                        {isPresent
                          ? "Present"
                          : "Absent"}
                      </button>

                    </div>

                  </div>
                );
              })}

            </div>

            {/* SAVE */}

            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="text-sm font-bold text-slate-800">
                  {presentCount} Present ·{" "}
                  {absentCount} Absent
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  Review the attendance before saving.
                </p>

              </div>

              <button
                onClick={saveAttendance}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {saving ? (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={17} />
                )}

                {saving
                  ? "Saving..."
                  : "Save Attendance"}

              </button>

            </div>

          </div>
        )}

        {/* ==================================================
            EMPTY STATE
        ================================================== */}

        {!loadingCourses &&
          !loadingStudents &&
          students.length === 0 &&
          !error && (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <CalendarCheck size={25} />
              </div>

              <h3 className="mt-4 font-extrabold text-slate-900">
                Select a course and load students
              </h3>

              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                Choose your assigned course, section
                and date, then click Load Students to
                begin marking attendance.
              </p>

            </div>
          )}

      </div>
    </GenericPage>
  );
}

// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  icon: Icon,
  label,
  value,
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

// ============================================================
// HELPERS
// ============================================================

function getToday() {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value) {
  if (!value) return "";

  const date = new Date(
    `${value}T00:00:00`
  );

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}