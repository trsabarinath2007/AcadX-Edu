import React, { useMemo, useState } from "react";
import Layout from "../components/Layout";

const demoResults = [
  {
    registerNumber: "23CS001",
    student: "Arun Kumar",
    department: "CSE",
    semester: "5",
    section: "A",
    course: "Data Structures",
    marks: 88,
    maxMarks: 100,
    grade: "A"
  },
  {
    registerNumber: "23CS002",
    student: "Priya S",
    department: "CSE",
    semester: "5",
    section: "A",
    course: "Data Structures",
    marks: 94,
    maxMarks: 100,
    grade: "A+"
  },
  {
    registerNumber: "23IT001",
    student: "Karthik R",
    department: "IT",
    semester: "5",
    section: "B",
    course: "Database Management",
    marks: 76,
    maxMarks: 100,
    grade: "B+"
  },
  {
    registerNumber: "23ECE001",
    student: "Divya M",
    department: "ECE",
    semester: "5",
    section: "A",
    course: "Computer Networks",
    marks: 82,
    maxMarks: 100,
    grade: "A"
  }
];

export default function AdminResults() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");

  const filteredResults = useMemo(() => {
    return demoResults.filter((item) => {
      const matchesSearch =
        item.student
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        item.registerNumber
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        item.course
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesDepartment =
        department === "All" ||
        item.department === department;

      return matchesSearch && matchesDepartment;
    });
  }, [search, department]);

  return (
    <Layout>
      <div className="space-y-6">

        {/* HEADER */}
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
            AcadX
          </p>

          <h1 className="mt-1 text-3xl font-black text-slate-900">
            Academic Results
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Monitor student marks and academic results across the
            institution.
          </p>
        </div>

        {/* SUMMARY */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Students Evaluated
            </p>

            <p className="mt-2 text-3xl font-black">
              1,180
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Average Marks
            </p>

            <p className="mt-2 text-3xl font-black text-emerald-600">
              81.4%
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Pass Rate
            </p>

            <p className="mt-2 text-3xl font-black text-emerald-600">
              94.6%
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Top Grade
            </p>

            <p className="mt-2 text-3xl font-black">
              A+
            </p>
          </div>

        </div>

        {/* FILTERS */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row">

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student, register number or course..."
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 md:flex-1"
            />

            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
            >
              <option value="All">
                All Departments
              </option>

              <option value="CSE">
                CSE
              </option>

              <option value="IT">
                IT
              </option>

              <option value="ECE">
                ECE
              </option>
            </select>

          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="overflow-x-auto">

            <table className="min-w-[900px] w-full text-left">

              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-xs font-black uppercase text-slate-500">
                    Register No
                  </th>

                  <th className="px-5 py-4 text-xs font-black uppercase text-slate-500">
                    Student
                  </th>

                  <th className="px-5 py-4 text-xs font-black uppercase text-slate-500">
                    Department
                  </th>

                  <th className="px-5 py-4 text-xs font-black uppercase text-slate-500">
                    Course
                  </th>

                  <th className="px-5 py-4 text-xs font-black uppercase text-slate-500">
                    Marks
                  </th>

                  <th className="px-5 py-4 text-xs font-black uppercase text-slate-500">
                    Grade
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredResults.map((item) => (
                  <tr
                    key={`${item.registerNumber}-${item.course}`}
                    className="hover:bg-emerald-50/40"
                  >

                    <td className="px-5 py-4 text-sm font-bold text-slate-700">
                      {item.registerNumber}
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                      {item.student}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {item.department}
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {item.course}
                    </td>

                    <td className="px-5 py-4 text-sm font-bold">
                      {item.marks}/{item.maxMarks}
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                        {item.grade}
                      </span>
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

          {filteredResults.length === 0 && (
            <div className="p-10 text-center text-sm text-slate-500">
              No results found.
            </div>
          )}

        </div>

      </div>
    </Layout>
  );
}