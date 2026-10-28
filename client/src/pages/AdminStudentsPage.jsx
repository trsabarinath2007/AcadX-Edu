import React, { useEffect, useMemo, useState } from "react";
import GenericPage from "./GenericPage";
import { apiGet } from "../api";

export default function AdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [section, setSection] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadStudents() {
    try {
      setLoading(true);
      setError("");

      const response = await apiGet("/admin/students");

      setStudents(response?.students || []);
    } catch (err) {
      console.error("Failed to load students:", err);

      setError(
        err?.message ||
        "Unable to load students."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  const departments = useMemo(() => {
    return [
      ...new Set(
        students
          .map(
            (student) =>
              student.department?.code ||
              student.department?.name
          )
          .filter(Boolean)
      )
    ];
  }, [students]);

  const sections = useMemo(() => {
    return [
      ...new Set(
        students
          .map((student) => student.section)
          .filter(Boolean)
      )
    ];
  }, [students]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      const studentDepartment =
        student.department?.code ||
        student.department?.name ||
        "";

      const matchesSearch =
        !query ||
        student.name
          ?.toLowerCase()
          .includes(query) ||
        student.email
          ?.toLowerCase()
          .includes(query) ||
        student.registerNumber
          ?.toLowerCase()
          .includes(query);

      const matchesDepartment =
        department === "all" ||
        studentDepartment === department;

      const matchesSection =
        section === "all" ||
        student.section === section;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesSection
      );
    });
  }, [
    students,
    search,
    department,
    section
  ]);

  return (
    <GenericPage
      title="Student Management"
      description="View and manage students registered in AcadX."
    >
      <div className="space-y-6">

        {/* HEADER */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Students
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Students imported through the AcadX
              administration system.
            </p>
          </div>

          <button
            onClick={loadStudents}
            className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800"
          >
            Refresh
          </button>

        </div>

        {/* ERROR */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">

            <p className="text-sm font-bold text-red-700">
              Unable to load students
            </p>

            <p className="mt-1 text-xs text-red-600">
              {error}
            </p>

          </div>
        )}

        {/* STATISTICS */}

        <div className="grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Total Students
            </p>

            <p className="mt-2 text-3xl font-black text-slate-900">
              {students.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Departments
            </p>

            <p className="mt-2 text-3xl font-black text-slate-900">
              {departments.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Filtered
            </p>

            <p className="mt-2 text-3xl font-black text-slate-900">
              {filteredStudents.length}
            </p>
          </div>

        </div>

        {/* FILTERS */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5">

          <div className="grid gap-4 lg:grid-cols-[1fr_200px_200px]">

            {/* SEARCH */}

            <div>
              <label className="mb-2 block text-xs font-bold text-slate-500">
                Search
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search name, register number or email..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              />
            </div>

            {/* DEPARTMENT */}

            <div>
              <label className="mb-2 block text-xs font-bold text-slate-500">
                Department
              </label>

              <select
                value={department}
                onChange={(e) =>
                  setDepartment(e.target.value)
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              >
                <option value="all">
                  All Departments
                </option>

                {departments.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {/* SECTION */}

            <div>
              <label className="mb-2 block text-xs font-bold text-slate-500">
                Section
              </label>

              <select
                value={section}
                onChange={(e) =>
                  setSection(e.target.value)
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              >
                <option value="all">
                  All Sections
                </option>

                {sections.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    Section {item}
                  </option>
                ))}
              </select>
            </div>

          </div>

        </div>

        {/* STUDENT TABLE */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

          <div className="border-b border-slate-100 px-5 py-4">

            <h3 className="font-extrabold text-slate-900">
              Student Accounts
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              {filteredStudents.length} students displayed
            </p>

          </div>

          {loading ? (
            <div className="p-10 text-center">

              <p className="text-sm font-semibold text-slate-500">
                Loading students...
              </p>

            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-10 text-center">

              <div className="text-4xl">
                👨‍🎓
              </div>

              <p className="mt-3 font-bold text-slate-700">
                No students found
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Import students from Excel or change your filters.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[850px] text-left">

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

                    <th className="px-5 py-4">
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredStudents.map((student) => (

                    <tr
                      key={student._id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >

                      <td className="px-5 py-4">

                        <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                          {student.registerNumber || "—"}
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
                          {student.department?.code ||
                            student.department?.name ||
                            "—"}
                        </span>

                      </td>

                      <td className="px-5 py-4">

                        <span className="text-xs font-semibold text-slate-700">
                          {student.semester || "—"}
                        </span>

                      </td>

                      <td className="px-5 py-4">

                        <span className="text-xs font-semibold text-slate-700">
                          {student.section || "—"}
                        </span>

                      </td>

                      <td className="px-5 py-4">

                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                            student.active === false
                              ? "bg-red-50 text-red-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {student.active === false
                            ? "Inactive"
                            : "Active"}
                        </span>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>
    </GenericPage>
  );
}