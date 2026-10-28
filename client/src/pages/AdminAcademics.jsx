import React, { useEffect, useMemo, useState } from "react";
import GenericPage from "./GenericPage";
import { apiGet } from "../api";

export default function AdminAcademics() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [selectedDepartment, setSelectedDepartment] =
    useState("all");

  const [selectedSemester, setSelectedSemester] =
    useState("all");

  const [selectedSection, setSelectedSection] =
    useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================================================
     LOAD DATA
  ========================================================= */

  async function loadAcademicData() {
    try {
      setLoading(true);
      setError("");

      const [studentResponse, departmentResponse] =
        await Promise.all([
          apiGet("/admin/students"),
          apiGet("/admin/departments")
        ]);

      setStudents(studentResponse?.students || []);
      setDepartments(
        departmentResponse?.departments || []
      );
    } catch (err) {
      console.error(
        "Failed to load academic data:",
        err
      );

      setError(
        err?.message ||
          "Failed to load academic information."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAcademicData();
  }, []);

  /* =========================================================
     DEPARTMENT DATA
  ========================================================= */

  const departmentCodes = useMemo(() => {
    const values = students
      .map(
        (student) =>
          student.department?.code ||
          student.department?.name
      )
      .filter(Boolean);

    return [...new Set(values)].sort();
  }, [students]);

  /* =========================================================
     SEMESTER DATA
  ========================================================= */

  const semesters = useMemo(() => {
    const values = students
      .map((student) => student.semester)
      .filter(
        (semester) =>
          semester !== undefined &&
          semester !== null &&
          semester !== ""
      )
      .map(Number);

    return [...new Set(values)].sort(
      (a, b) => a - b
    );
  }, [students]);

  /* =========================================================
     SECTION DATA
  ========================================================= */

  const sections = useMemo(() => {
    let source = students;

    if (selectedDepartment !== "all") {
      source = source.filter((student) => {
        const department =
          student.department?.code ||
          student.department?.name;

        return department === selectedDepartment;
      });
    }

    if (selectedSemester !== "all") {
      source = source.filter(
        (student) =>
          Number(student.semester) ===
          Number(selectedSemester)
      );
    }

    const values = source
      .map((student) => student.section)
      .filter(Boolean);

    return [...new Set(values)].sort();
  }, [
    students,
    selectedDepartment,
    selectedSemester
  ]);

  /* =========================================================
     FILTERED STUDENTS
  ========================================================= */

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const department =
        student.department?.code ||
        student.department?.name ||
        "";

      const departmentMatch =
        selectedDepartment === "all" ||
        department === selectedDepartment;

      const semesterMatch =
        selectedSemester === "all" ||
        Number(student.semester) ===
          Number(selectedSemester);

      const sectionMatch =
        selectedSection === "all" ||
        student.section === selectedSection;

      return (
        departmentMatch &&
        semesterMatch &&
        sectionMatch
      );
    });
  }, [
    students,
    selectedDepartment,
    selectedSemester,
    selectedSection
  ]);

  /* =========================================================
     STRUCTURE
  ========================================================= */

  const academicStructure = useMemo(() => {
    const structure = {};

    students.forEach((student) => {
      const department =
        student.department?.code ||
        student.department?.name;

      const semester = student.semester;
      const section = student.section;

      if (!department || !semester || !section) {
        return;
      }

      if (!structure[department]) {
        structure[department] = {};
      }

      if (!structure[department][semester]) {
        structure[department][semester] = {};
      }

      if (!structure[department][semester][section]) {
        structure[department][semester][section] = 0;
      }

      structure[department][semester][section]++;
    });

    return structure;
  }, [students]);

  /* =========================================================
     STATISTICS
  ========================================================= */

  const totalDepartments =
    departmentCodes.length;

  const totalSemesters =
    semesters.length;

  const totalSections = useMemo(() => {
    const sectionsSet = new Set();

    students.forEach((student) => {
      const department =
        student.department?.code ||
        student.department?.name;

      if (!department || !student.semester) {
        return;
      }

      if (student.section) {
        sectionsSet.add(
          `${department}-${student.semester}-${student.section}`
        );
      }
    });

    return sectionsSet.size;
  }, [students]);

  /* =========================================================
     RESET FILTERS
  ========================================================= */

  function resetFilters() {
    setSelectedDepartment("all");
    setSelectedSemester("all");
    setSelectedSection("all");
  }

  return (
    <GenericPage
      title="Academic Structure"
      description="Manage semesters, sections and institution-wide academic organization."
    >
      <div className="space-y-6">

        {/* =====================================================
            ACTIONS
        ===================================================== */}

        <div className="flex justify-end">
          <button
            onClick={loadAcademicData}
            disabled={loading}
            className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>


        {/* =====================================================
            ERROR
        ===================================================== */}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">

            <p className="text-sm font-bold text-red-700">
              Unable to load academic data
            </p>

            <p className="mt-1 text-xs text-red-600">
              {error}
            </p>

          </div>
        )}


        {/* =====================================================
            OVERVIEW
        ===================================================== */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <OverviewCard
            label="Total Students"
            value={students.length}
            description="Registered student accounts"
            icon="👨‍🎓"
          />

          <OverviewCard
            label="Departments"
            value={totalDepartments}
            description="Departments with students"
            icon="🏢"
          />

          <OverviewCard
            label="Semesters"
            value={totalSemesters}
            description="Semesters currently represented"
            icon="📚"
          />

          <OverviewCard
            label="Sections"
            value={totalSections}
            description="Department + semester sections"
            icon="👥"
          />

        </div>


        {/* =====================================================
            FILTERS
        ===================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">

            {/* DEPARTMENT */}

            <div className="flex-1">

              <label className="mb-2 block text-xs font-bold text-slate-500">
                Department
              </label>

              <select
                value={selectedDepartment}
                onChange={(e) => {
                  setSelectedDepartment(
                    e.target.value
                  );
                  setSelectedSection("all");
                }}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              >
                <option value="all">
                  All Departments
                </option>

                {departmentCodes.map((code) => (
                  <option
                    key={code}
                    value={code}
                  >
                    {code}
                  </option>
                ))}

              </select>

            </div>


            {/* SEMESTER */}

            <div className="flex-1">

              <label className="mb-2 block text-xs font-bold text-slate-500">
                Semester
              </label>

              <select
                value={selectedSemester}
                onChange={(e) => {
                  setSelectedSemester(
                    e.target.value
                  );
                  setSelectedSection("all");
                }}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              >
                <option value="all">
                  All Semesters
                </option>

                {semesters.map((semester) => (
                  <option
                    key={semester}
                    value={semester}
                  >
                    Semester {semester}
                  </option>
                ))}

              </select>

            </div>


            {/* SECTION */}

            <div className="flex-1">

              <label className="mb-2 block text-xs font-bold text-slate-500">
                Section
              </label>

              <select
                value={selectedSection}
                onChange={(e) =>
                  setSelectedSection(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              >
                <option value="all">
                  All Sections
                </option>

                {sections.map((section) => (
                  <option
                    key={section}
                    value={section}
                  >
                    Section {section}
                  </option>
                ))}

              </select>

            </div>


            {/* RESET */}

            <button
              onClick={resetFilters}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Clear
            </button>

          </div>


          {/* FILTER RESULT */}

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">

            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-bold text-slate-800">
                {filteredStudents.length}
              </span>{" "}
              students
            </p>

            <p className="text-xs font-semibold text-emerald-700">
              {selectedDepartment !== "all"
                ? selectedDepartment
                : "All Departments"}

              {" • "}

              {selectedSemester !== "all"
                ? `Semester ${selectedSemester}`
                : "All Semesters"}

              {" • "}

              {selectedSection !== "all"
                ? `Section ${selectedSection}`
                : "All Sections"}
            </p>

          </div>

        </div>


        {/* =====================================================
            ACADEMIC STRUCTURE
        ===================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white">

          <div className="border-b border-slate-100 px-5 py-5">

            <h3 className="text-lg font-extrabold text-slate-900">
              Institution Structure
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Department → Semester → Section
            </p>

          </div>


          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Loading academic structure...
            </div>
          ) : departmentCodes.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4 p-5">

              {departmentCodes.map(
                (department) => {

                  const departmentData =
                    academicStructure[
                      department
                    ] || {};

                  const semesterKeys =
                    Object.keys(
                      departmentData
                    ).sort(
                      (a, b) =>
                        Number(a) -
                        Number(b)
                    );

                  return (
                    <div
                      key={department}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                    >

                      {/* DEPARTMENT */}

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <div>

                          <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-xl">
                              🏢
                            </div>

                            <div>

                              <h4 className="font-black text-slate-900">
                                {department}
                              </h4>

                              <p className="text-xs text-slate-500">
                                {
                                  students.filter(
                                    (student) =>
                                      (
                                        student.department
                                          ?.code ||
                                        student.department
                                          ?.name
                                      ) ===
                                      department
                                  ).length
                                }{" "}
                                students
                              </p>

                            </div>

                          </div>

                        </div>

                        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700">
                          {semesterKeys.length}{" "}
                          {semesterKeys.length === 1
                            ? "Semester"
                            : "Semesters"}
                        </span>

                      </div>


                      {/* SEMESTERS */}

                      <div className="mt-5 space-y-3">

                        {semesterKeys.map(
                          (semester) => {

                            const sectionData =
                              departmentData[
                                semester
                              ];

                            const sectionKeys =
                              Object.keys(
                                sectionData
                              ).sort();

                            return (
                              <div
                                key={`${department}-${semester}`}
                                className="rounded-xl border border-slate-200 bg-white p-4"
                              >

                                <div className="flex items-center justify-between">

                                  <div>

                                    <p className="font-extrabold text-slate-800">
                                      Semester{" "}
                                      {semester}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                      {
                                        Object.values(
                                          sectionData
                                        ).reduce(
                                          (
                                            total,
                                            count
                                          ) =>
                                            total +
                                            count,
                                          0
                                        )
                                      }{" "}
                                      students
                                    </p>

                                  </div>

                                  <span className="text-xs font-bold text-slate-400">
                                    {
                                      sectionKeys.length
                                    }{" "}
                                    sections
                                  </span>

                                </div>


                                {/* SECTIONS */}

                                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                                  {sectionKeys.map(
                                    (section) => (

                                      <button
                                        key={`${department}-${semester}-${section}`}
                                        onClick={() => {
                                          setSelectedDepartment(
                                            department
                                          );
                                          setSelectedSemester(
                                            semester
                                          );
                                          setSelectedSection(
                                            section
                                          );
                                        }}
                                        className="group rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
                                      >

                                        <div className="flex items-center justify-between">

                                          <div>

                                            <p className="text-xs font-bold text-slate-400">
                                              SECTION
                                            </p>

                                            <p className="mt-1 text-lg font-black text-slate-800 group-hover:text-emerald-700">
                                              {section}
                                            </p>

                                          </div>

                                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-sm shadow-sm">
                                            👥
                                          </div>

                                        </div>

                                        <p className="mt-3 text-xs text-slate-500">

                                          <span className="font-bold text-slate-800">
                                            {
                                              sectionData[
                                                section
                                              ]
                                            }
                                          </span>{" "}
                                          students

                                        </p>

                                        <p className="mt-2 text-[11px] font-bold text-emerald-600 opacity-0 transition group-hover:opacity-100">
                                          View students →
                                        </p>

                                      </button>

                                    )
                                  )}

                                </div>

                              </div>
                            );
                          }
                        )}

                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </div>


        {/* =====================================================
            FILTERED STUDENT LIST
        ===================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white">

          <div className="border-b border-slate-100 px-5 py-5">

            <h3 className="text-lg font-extrabold text-slate-900">
              Students in Selected Structure
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              Students matching the selected department,
              semester and section.
            </p>

          </div>


          {filteredStudents.length === 0 ? (
            <div className="p-10 text-center">

              <div className="text-3xl">
                👨‍🎓
              </div>

              <p className="mt-3 font-bold text-slate-700">
                No students found
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Select a different academic structure.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[750px] text-left">

                <thead className="bg-slate-50">

                  <tr className="text-xs font-bold text-slate-500">

                    <th className="px-5 py-4">
                      Register No.
                    </th>

                    <th className="px-5 py-4">
                      Student
                    </th>

                    <th className="px-5 py-4">
                      Email
                    </th>

                    <th className="px-5 py-4">
                      Department
                    </th>

                    <th className="px-5 py-4">
                      Semester
                    </th>

                    <th className="px-5 py-4">
                      Section
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredStudents.map(
                    (student) => (

                      <tr
                        key={student._id}
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >

                        <td className="px-5 py-4">

                          <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                            {student.registerNumber ||
                              "—"}
                          </span>

                        </td>

                        <td className="px-5 py-4">

                          <p className="font-bold text-slate-800">
                            {student.name}
                          </p>

                        </td>

                        <td className="px-5 py-4">

                          <p className="text-xs text-slate-500">
                            {student.email}
                          </p>

                        </td>

                        <td className="px-5 py-4">

                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                            {student.department
                              ?.code ||
                              student.department
                                ?.name ||
                              "—"}
                          </span>

                        </td>

                        <td className="px-5 py-4">

                          <span className="text-xs font-semibold text-slate-700">
                            {student.semester ||
                              "—"}
                          </span>

                        </td>

                        <td className="px-5 py-4">

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-700">
                            {student.section ||
                              "—"}
                          </span>

                        </td>

                      </tr>

                    )
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


/* =========================================================
   OVERVIEW CARD
========================================================= */

function OverviewCard({
  label,
  value,
  description,
  icon
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-3xl font-black text-slate-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>

        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl">
          {icon}
        </div>

      </div>

    </div>
  );
}


/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState() {
  return (
    <div className="p-12 text-center">

      <div className="text-4xl">
        🏫
      </div>

      <h3 className="mt-4 font-extrabold text-slate-800">
        No academic structure yet
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        Import students with department, semester and
        section information. AcadX will automatically
        build the academic structure from those records.
      </p>

    </div>
  );
}