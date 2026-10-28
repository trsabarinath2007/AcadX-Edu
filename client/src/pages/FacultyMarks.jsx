import React, {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  BookOpen,
  CheckCircle2,
  Edit3,
  FileText,
  Loader2,
  Save,
  Search,
  Users
} from "lucide-react";

import GenericPage from "./GenericPage";
import {
  apiGet,
  apiPost
} from "../api";

export default function FacultyMarks() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);

  const [selectedCourse, setSelectedCourse] =
    useState("");

  const [selectedSection, setSelectedSection] =
    useState("");

  const [search, setSearch] = useState("");

  const [loadingCourses, setLoadingCourses] =
    useState(true);

  const [loadingStudents, setLoadingStudents] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  /* ============================================================
     LOAD FACULTY COURSES
  ============================================================ */

  const loadCourses = async () => {
    try {
      setLoadingCourses(true);
      setError("");

      const response =
        await apiGet("/courses");

      const facultyCourses =
        response?.courses || [];

      setCourses(facultyCourses);

      if (facultyCourses.length > 0) {
        const firstCourse =
          facultyCourses[0];

        setSelectedCourse(
          String(firstCourse._id)
        );

        const firstSection =
          firstCourse.sections?.[0] || "";

        setSelectedSection(
          String(firstSection)
        );
      }
    } catch (err) {
      console.error(
        "Faculty marks courses error:",
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
  };

  /* ============================================================
     LOAD STUDENTS + MARKS
  ============================================================ */

  const loadMarks = async () => {
    if (
      !selectedCourse ||
      !selectedSection
    ) {
      setStudents([]);
      return;
    }

    try {
      setLoadingStudents(true);
      setError("");
      setMessage("");

      const response =
        await apiGet(
          `/academic/faculty/marks?courseId=${encodeURIComponent(
            selectedCourse
          )}&section=${encodeURIComponent(
            selectedSection
          )}`
        );

      setStudents(
        response?.students || []
      );
    } catch (err) {
      console.error(
        "Faculty marks load error:",
        err
      );

      setStudents([]);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load student marks."
      );
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    loadMarks();
  }, [
    selectedCourse,
    selectedSection
  ]);

  /* ============================================================
     SELECTED COURSE
  ============================================================ */

  const currentCourse = useMemo(
    () =>
      courses.find(
        (course) =>
          String(course._id) ===
          String(selectedCourse)
      ),
    [courses, selectedCourse]
  );

  /* ============================================================
     COURSE CHANGE
  ============================================================ */

  const handleCourseChange = (value) => {
    setSelectedCourse(value);

    const course =
      courses.find(
        (item) =>
          String(item._id) ===
          String(value)
      );

    const firstSection =
      course?.sections?.[0] || "";

    setSelectedSection(
      String(firstSection)
    );

    setStudents([]);
    setMessage("");
    setError("");
  };

  /* ============================================================
     UPDATE MARK
  ============================================================ */

  const updateMark = (
    studentId,
    field,
    value
  ) => {
    setStudents((previous) =>
      previous.map((student) =>
        String(student._id) ===
        String(studentId)
          ? {
              ...student,
              [field]: value
            }
          : student
      )
    );
  };

  /* ============================================================
     SAVE MARKS
  ============================================================ */

  const saveMarks = async () => {
    if (!selectedCourse) {
      setError(
        "Please select a course."
      );
      return;
    }

    if (!selectedSection) {
      setError(
        "Please select a section."
      );
      return;
    }

    if (!students.length) {
      setError(
        "No students available."
      );
      return;
    }

    /* Validate marks before sending */

    for (const student of students) {
      const internal =
        student.internalMarks === "" ||
        student.internalMarks === null
          ? null
          : Number(
              student.internalMarks
            );

      const external =
        student.externalMarks === "" ||
        student.externalMarks === null
          ? null
          : Number(
              student.externalMarks
            );

      if (
        internal !== null &&
        (!Number.isFinite(internal) ||
          internal < 0 ||
          internal > 50)
      ) {
        setError(
          `Internal marks for ${
            student.name
          } must be between 0 and 50.`
        );
        return;
      }

      if (
        external !== null &&
        (!Number.isFinite(external) ||
          external < 0 ||
          external > 50)
      ) {
        setError(
          `External marks for ${
            student.name
          } must be between 0 and 50.`
        );
        return;
      }
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const records =
        students.map((student) => ({
          studentId: student._id,

          internalMarks:
            student.internalMarks ===
              "" ||
            student.internalMarks ===
              null
              ? ""
              : Number(
                  student.internalMarks
                ),

          externalMarks:
            student.externalMarks ===
              "" ||
            student.externalMarks ===
              null
              ? ""
              : Number(
                  student.externalMarks
                )
        }));

      const response =
        await apiPost(
          "/academic/faculty/marks",
          {
            courseId:
              selectedCourse,

            section:
              selectedSection,

            records
          }
        );

      setMessage(
        response?.message ||
          "Marks saved successfully."
      );

      await loadMarks();
    } catch (err) {
      console.error(
        "Save marks error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save marks."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ============================================================
     FILTER
  ============================================================ */

  const filteredStudents =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return students;
      }

      return students.filter(
        (student) =>
          String(
            student.name || ""
          )
            .toLowerCase()
            .includes(query) ||
          String(
            student.registerNumber ||
              ""
          )
            .toLowerCase()
            .includes(query) ||
          String(
            student.email || ""
          )
            .toLowerCase()
            .includes(query)
      );
    }, [students, search]);

  /* ============================================================
     STATISTICS
  ============================================================ */

  const statistics =
    useMemo(() => {
      const totals =
        students
          .map((student) =>
            Number(
              student.totalMarks
            )
          )
          .filter(
            (value) =>
              Number.isFinite(value)
          );

      const average =
        totals.length
          ? totals.reduce(
              (sum, value) =>
                sum + value,
              0
            ) / totals.length
          : 0;

      const highest =
        totals.length
          ? Math.max(...totals)
          : 0;

      const lowest =
        totals.length
          ? Math.min(...totals)
          : 0;

      const graded =
        students.filter(
          (student) =>
            student.grade
        ).length;

      return {
        average,
        highest,
        lowest,
        graded
      };
    }, [students]);

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <GenericPage
      title="Marks"
      description="Manage internal and external academic marks for your assigned courses."
    >
      <div className="space-y-5">

        {/* ======================================================
            CONTROLS
        ====================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">

            <div>
              <label className="mb-2 block text-xs font-bold text-slate-600">
                Course
              </label>

              <select
                value={selectedCourse}
                onChange={(event) =>
                  handleCourseChange(
                    event.target.value
                  )
                }
                disabled={
                  loadingCourses
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-emerald-500"
              >
                <option value="">
                  Select course
                </option>

                {courses.map(
                  (course) => (
                    <option
                      key={course._id}
                      value={
                        course._id
                      }
                    >
                      {course.code} -{" "}
                      {course.name}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold text-slate-600">
                Section
              </label>

              <select
                value={
                  selectedSection
                }
                onChange={(event) =>
                  setSelectedSection(
                    event.target.value
                  )
                }
                disabled={
                  !currentCourse
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-emerald-500"
              >
                <option value="">
                  Select section
                </option>

                {(
                  currentCourse
                    ?.sections || []
                ).map(
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

            <div>
              <label className="mb-2 block text-xs font-bold text-slate-600">
                Search Student
              </label>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                <Search
                  size={16}
                  className="text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Name or register number"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>

          </div>
        </div>

        {/* ======================================================
            MESSAGES
        ====================================================== */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            <CheckCircle2 size={17} />
            {message}
          </div>
        )}

        {/* ======================================================
            STATISTICS
        ====================================================== */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            icon={Users}
            label="Students"
            value={students.length}
          />

          <StatCard
            icon={FileText}
            label="Graded"
            value={statistics.graded}
          />

          <StatCard
            icon={BookOpen}
            label="Average"
            value={`${statistics.average.toFixed(
              1
            )}/100`}
          />

          <StatCard
            icon={CheckCircle2}
            label="Highest"
            value={`${statistics.highest}/100`}
          />

        </div>

        {/* ======================================================
            MARKS TABLE
        ====================================================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-base font-black text-slate-900">
                Student Marks
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Internal: 50 marks · External: 50 marks · Total: 100 marks
              </p>
            </div>

            <button
              type="button"
              onClick={saveMarks}
              disabled={
                saving ||
                loadingStudents ||
                !students.length
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Save size={16} />
              )}

              {saving
                ? "Saving..."
                : "Save Marks"}
            </button>

          </div>

          {loadingStudents ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500">
              <Loader2
                size={20}
                className="animate-spin"
              />
              Loading students...
            </div>
          ) : !selectedCourse ||
            !selectedSection ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <BookOpen
                size={32}
                className="text-slate-300"
              />

              <p className="mt-3 text-sm font-bold text-slate-600">
                Select a course and section
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Students and existing marks will appear here.
              </p>
            </div>
          ) : !filteredStudents.length ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <Users
                size={32}
                className="text-slate-300"
              />

              <p className="mt-3 text-sm font-bold text-slate-600">
                No students found
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Try another search or check the selected section.
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP */}

              <div className="hidden overflow-x-auto lg:block">

                <table className="w-full min-w-[950px] text-left">

                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wide text-slate-500">
                        Student
                      </th>

                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wide text-slate-500">
                        Register No.
                      </th>

                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wide text-slate-500">
                        Internal / 50
                      </th>

                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wide text-slate-500">
                        External / 50
                      </th>

                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wide text-slate-500">
                        Total
                      </th>

                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wide text-slate-500">
                        Grade
                      </th>

                      <th className="px-4 py-3 text-[11px] font-black uppercase tracking-wide text-slate-500">
                        GPA
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {filteredStudents.map(
                      (student) => (
                        <tr
                          key={
                            student._id
                          }
                          className="hover:bg-slate-50"
                        >

                          <td className="px-4 py-4">
                            <p className="text-sm font-bold text-slate-900">
                              {student.name}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              {student.email}
                            </p>
                          </td>

                          <td className="px-4 py-4 text-sm font-semibold text-slate-600">
                            {
                              student.registerNumber
                            }
                          </td>

                          <td className="px-4 py-4">
                            <input
                              type="number"
                              min="0"
                              max="50"
                              value={
                                student.internalMarks
                              }
                              onChange={(
                                event
                              ) =>
                                updateMark(
                                  student._id,
                                  "internalMarks",
                                  event.target
                                    .value
                                )
                              }
                              className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500"
                            />
                          </td>

                          <td className="px-4 py-4">
                            <input
                              type="number"
                              min="0"
                              max="50"
                              value={
                                student.externalMarks
                              }
                              onChange={(
                                event
                              ) =>
                                updateMark(
                                  student._id,
                                  "externalMarks",
                                  event.target
                                    .value
                                )
                              }
                              className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-500"
                            />
                          </td>

                          <td className="px-4 py-4 text-sm font-black text-slate-900">
                            {student.totalMarks ===
                            ""
                              ? "-"
                              : student.totalMarks}
                          </td>

                          <td className="px-4 py-4">
                            <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
                              {student.grade ||
                                "-"}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-sm font-black text-slate-900">
                            {student.gpa ===
                            ""
                              ? "-"
                              : student.gpa}
                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

              {/* MOBILE */}

              <div className="divide-y divide-slate-100 lg:hidden">

                {filteredStudents.map(
                  (student) => (
                    <div
                      key={
                        student._id
                      }
                      className="space-y-4 p-4"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div>
                          <p className="text-sm font-black text-slate-900">
                            {student.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {
                              student.registerNumber
                            }
                          </p>
                        </div>

                        <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
                          {student.grade ||
                            "-"}
                        </span>

                      </div>

                      <div className="grid grid-cols-2 gap-3">

                        <div>
                          <label className="mb-1 block text-[11px] font-bold text-slate-500">
                            Internal / 50
                          </label>

                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={
                              student.internalMarks
                            }
                            onChange={(
                              event
                            ) =>
                              updateMark(
                                student._id,
                                "internalMarks",
                                event.target
                                  .value
                              )
                            }
                            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-bold text-slate-500">
                            External / 50
                          </label>

                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={
                              student.externalMarks
                            }
                            onChange={(
                              event
                            ) =>
                              updateMark(
                                student._id,
                                "externalMarks",
                                event.target
                                  .value
                              )
                            }
                            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold outline-none focus:border-emerald-500"
                          />
                        </div>

                      </div>

                      <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            Total
                          </p>

                          <p className="mt-1 text-base font-black text-slate-900">
                            {student.totalMarks ===
                            ""
                              ? "-"
                              : student.totalMarks}
                            /100
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                            GPA
                          </p>

                          <p className="mt-1 text-base font-black text-slate-900">
                            {student.gpa ===
                            ""
                              ? "-"
                              : student.gpa}
                          </p>
                        </div>

                      </div>

                    </div>
                  )
                )}

              </div>
            </>
          )}

        </div>
      </div>
    </GenericPage>
  );
}


/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  icon: Icon,
  label,
  value
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

      <div className="flex items-center justify-between">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <Icon size={19} />
        </div>

        <Edit3
          size={15}
          className="text-slate-300"
        />

      </div>

      <p className="mt-4 text-xs font-bold text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black tracking-tight text-slate-900">
        {value}
      </p>

    </div>
  );
}