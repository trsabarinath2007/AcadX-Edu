import React, { useEffect, useState } from "react";
import GenericPage from "./GenericPage";
import { apiGet, apiPost } from "../api";

/* =========================================================
   DEPARTMENT MANAGEMENT
========================================================= */

export function AdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadDepartments() {
    try {
      const res = await apiGet("/admin/departments");
      setDepartments(res.departments || []);
    } catch (error) {
      setMessage("Failed to load departments");
    }
  }

  useEffect(() => {
    loadDepartments();
  }, []);

  async function createDepartment(e) {
    e.preventDefault();

    if (!name.trim() || !code.trim()) {
      setMessage("Enter both department name and code");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await apiPost("/admin/departments", {
        name: name.trim(),
        code: code.trim().toUpperCase()
      });

      setName("");
      setCode("");
      setMessage("Department created successfully");

      await loadDepartments();
    } catch (error) {
      setMessage(
        error?.message || "Failed to create department"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <GenericPage
      title="Department Management"
      description="Create and manage academic departments."
    >
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">

        {/* CREATE DEPARTMENT */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-extrabold">
            Add Department
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Create a department before adding students, faculty, and courses.
          </p>

          <form onSubmit={createDepartment} className="mt-5 space-y-4">

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">
                Department Name
              </label>

              <input
                type="text"
                placeholder="Computer Science and Engineering"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">
                Department Code
              </label>

              <input
                type="text"
                placeholder="CSE"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm uppercase outline-none focus:border-emerald-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Department"}
            </button>

            {message && (
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
                {message}
              </p>
            )}

          </form>
        </div>

        {/* DEPARTMENT LIST */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-lg font-extrabold">
                Departments
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Departments currently available in AcadX.
              </p>
            </div>

            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              {departments.length}
            </span>

          </div>

          <div className="mt-5 space-y-3">

            {departments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                No departments created yet.
              </div>
            ) : (
              departments.map((department) => (
                <div
                  key={department._id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-4"
                >
                  <div>
                    <p className="font-bold text-slate-800">
                      {department.name}
                    </p>

                    <p className="mt-1 text-xs font-bold text-emerald-700">
                      {department.code}
                    </p>
                  </div>

                  <span className="text-xs text-slate-400">
                    Department
                  </span>
                </div>
              ))
            )}

          </div>
        </div>

      </div>
    </GenericPage>
  );
}


/* =========================================================
   STUDENT MANAGEMENT
========================================================= */

export function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [file, setFile] = useState(null);

  const load = () =>
    apiGet("/admin/students").then((r) =>
      setStudents(r.students || [])
    );

  useEffect(load, []);

  async function importExcel() {
    if (!file) return;

    const form = new FormData();
    form.append("file", file);

    await fetch("/api/admin/students/import", {
      method: "POST",
      body: form,
      credentials: "include"
    });

    setFile(null);
    load();
  }

  return (
    <GenericPage
      title="Student Management"
      description="Create students manually or import large cohorts from Excel."
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-5">

        <h2 className="font-extrabold">
          Bulk Excel Import
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          Register Number, Student Name, Email, Initial Password,
          Semester, Department, Section
        </p>

        <div className="mt-4 flex flex-wrap gap-3">

          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) =>
              setFile(e.target.files?.[0])
            }
            className="text-sm"
          />

          <button
            onClick={importExcel}
            className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white"
          >
            Import Students
          </button>

        </div>
      </div>

      <div className="overflow-auto rounded-2xl border border-slate-200 bg-white">

        <table className="w-full text-left text-sm">

          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-5 py-3">Register No.</th>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Semester</th>
              <th>Section</th>
            </tr>
          </thead>

          <tbody>
            {students.map((s) => (
              <tr
                key={s._id}
                className="border-t border-slate-100"
              >
                <td className="px-5 py-3 font-bold">
                  {s.registerNumber}
                </td>

                <td>{s.name}</td>

                <td>{s.email}</td>

                <td>{s.department?.code || "—"}</td>

                <td>{s.semester || "—"}</td>

                <td>{s.section || "—"}</td>
              </tr>
            ))}
          </tbody>

        </table>

      </div>
    </GenericPage>
  );
}


/* =========================================================
   FACULTY MANAGEMENT
========================================================= */

export function AdminFaculty() {
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadFaculty() {
    try {
      const res = await apiGet("/admin/faculty");
      setFaculty(res.faculty || []);
    } catch (error) {
      setMessage("Failed to load faculty");
    }
  }

  async function loadDepartments() {
    try {
      const res = await apiGet("/admin/departments");
      setDepartments(res.departments || []);
    } catch (error) {
      setMessage("Failed to load departments");
    }
  }

  useEffect(() => {
    loadFaculty();
    loadDepartments();
  }, []);

  async function createFaculty(e) {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim() || !department) {
      setMessage("Please fill all faculty details");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await apiPost("/admin/faculty", {
        name: name.trim(),
        email: email.trim(),
        password,
        department
      });

      setName("");
      setEmail("");
      setPassword("");
      setDepartment("");

      setMessage("Faculty created successfully");

      await loadFaculty();
    } catch (error) {
      setMessage(
        error?.message || "Failed to create faculty"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <GenericPage
      title="Faculty Management"
      description="Create faculty accounts and assign them to departments."
    >

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">

        {/* CREATE FACULTY */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">

          <h2 className="text-lg font-extrabold">
            Add Faculty
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Only Admin can create faculty accounts.
          </p>

          <form
            onSubmit={createFaculty}
            className="mt-5 space-y-4"
          >

            {/* NAME */}
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">
                Faculty Name
              </label>

              <input
                type="text"
                placeholder="Dr. John Smith"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600"
              />
            </div>

            {/* EMAIL */}
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">
                Email
              </label>

              <input
                type="email"
                placeholder="faculty@acadx.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">
                Initial Password
              </label>

              <input
                type="password"
                placeholder="Faculty@123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600"
              />
            </div>

            {/* DEPARTMENT */}
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">
                Department
              </label>

              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-600"
              >

                <option value="">
                  Select Department
                </option>

                {departments.map((dept) => (
                  <option
                    key={dept._id}
                    value={dept._id}
                  >
                    {dept.code} — {dept.name}
                  </option>
                ))}

              </select>
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Faculty"}
            </button>

            {message && (
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
                {message}
              </p>
            )}

          </form>

        </div>


        {/* FACULTY LIST */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-lg font-extrabold">
                Faculty
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Faculty accounts created by the Admin.
              </p>
            </div>

            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              {faculty.length}
            </span>

          </div>


          <div className="mt-5 space-y-3">

            {faculty.length === 0 ? (

              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                No faculty accounts created yet.
              </div>

            ) : (

              faculty.map((member) => (

                <div
                  key={member._id}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                >

                  <div className="flex items-center justify-between">

                    <div>
                      <p className="font-bold text-slate-800">
                        {member.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {member.email}
                      </p>
                    </div>

                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                      Faculty
                    </span>

                  </div>

                  <div className="mt-3 text-xs text-slate-500">

                    <span className="font-semibold">
                      Department:
                    </span>{" "}

                    {member.department?.code ||
                      member.department?.name ||
                      "Not assigned"}

                  </div>

                </div>

              ))

            )}

          </div>

        </div>

      </div>

    </GenericPage>
  );
}


/* =========================================================
   SIMPLE ADMIN LIST
========================================================= */

export function AdminSimple({
  title,
  description,
  endpoint
}) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    apiGet(endpoint)
      .then((r) =>
        setItems(
          r.departments ||
          r.courses ||
          r.faculty ||
          []
        )
      )
      .catch(() => {});
  }, [endpoint]);

  return (
    <GenericPage
      title={title}
      description={description}
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">

        {items.map((x) => (
          <div
            key={x._id}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >

            <p className="text-xs font-bold text-emerald-700">
              {x.code || x.role || "Record"}
            </p>

            <h2 className="mt-1 font-extrabold">
              {x.name || x.title || "Academic item"}
            </h2>

            <p className="mt-2 text-xs text-slate-500">
              {x.email ||
                x.description ||
                x.department?.name ||
                ""}
            </p>

          </div>
        ))}

      </div>
    </GenericPage>
  );
}