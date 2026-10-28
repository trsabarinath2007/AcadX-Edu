
import React, { useEffect, useMemo, useState } from "react";
import GenericPage from "./GenericPage";
import { apiGet, apiPost } from "../api";

export default function AdminUsers() {
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [studentFile, setStudentFile] = useState(null);
  const [facultyFile, setFacultyFile] = useState(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showAddUser, setShowAddUser] = useState(false);

  const [newUser, setNewUser] = useState({
    role: "student",
    name: "",
    email: "",
    password: "",
    registerNumber: "",
    semester: "",
    section: "",
    department: ""
  });

  /* =========================================================
     LOAD DATA
  ========================================================= */

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const [studentRes, facultyRes, departmentRes] =
        await Promise.all([
          apiGet("/admin/students"),
          apiGet("/admin/faculty"),
          apiGet("/admin/departments")
        ]);

      setStudents(studentRes.students || []);
      setFaculty(facultyRes.faculty || []);
      setDepartments(departmentRes.departments || []);
    } catch (err) {
      setError(err?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  /* =========================================================
     COMBINE USERS
  ========================================================= */

  const allUsers = useMemo(() => {
    const studentUsers = students.map((student) => ({
      ...student,
      userType: "student",
      identifier: student.registerNumber || "—"
    }));

    const facultyUsers = faculty.map((member) => ({
      ...member,
      userType: "faculty",
      identifier:
        member.facultyId ||
        member.registerNumber ||
        "—"
    }));

    return [...studentUsers, ...facultyUsers];
  }, [students, faculty]);

  /* =========================================================
     FILTER USERS
  ========================================================= */

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return allUsers.filter((user) => {
      const matchesSearch =
        !query ||
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.identifier?.toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "all" ||
        user.userType === roleFilter;

      const departmentCode =
        user.department?.code ||
        user.department?.name ||
        "";

      const matchesDepartment =
        departmentFilter === "all" ||
        departmentCode === departmentFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.active !== false) ||
        (statusFilter === "inactive" && user.active === false);

      return (
        matchesSearch &&
        matchesRole &&
        matchesDepartment &&
        matchesStatus
      );
    });
  }, [
    allUsers,
    search,
    roleFilter,
    departmentFilter,
    statusFilter
  ]);

  /* =========================================================
     IMPORT STUDENTS
  ========================================================= */

  async function importStudents() {
    if (!studentFile) {
      setError("Please select the student Excel file first.");
      return;
    }

    try {
      setImporting("students");
      setMessage("");
      setError("");

      const formData = new FormData();
      formData.append("file", studentFile);

      const response = await fetch(
        "/api/admin/students/import",
        {
          method: "POST",
          body: formData,
          credentials: "include"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Student import failed"
        );
      }

      setMessage(
        data.message ||
          `Student import completed successfully.`
      );

      setStudentFile(null);

      const fileInput =
        document.getElementById("student-excel");

      if (fileInput) {
        fileInput.value = "";
      }

      await loadUsers();
    } catch (err) {
      setError(
        err?.message || "Failed to import students"
      );
    } finally {
      setImporting("");
    }
  }

  /* =========================================================
     IMPORT FACULTY
  ========================================================= */

  async function importFaculty() {
    if (!facultyFile) {
      setError("Please select the faculty Excel file first.");
      return;
    }

    try {
      setImporting("faculty");
      setMessage("");
      setError("");

      const formData = new FormData();
      formData.append("file", facultyFile);

      const response = await fetch(
        "/api/admin/faculty/import",
        {
          method: "POST",
          body: formData,
          credentials: "include"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Faculty import failed"
        );
      }

      setMessage(
        data.message ||
          `Faculty import completed successfully.`
      );

      setFacultyFile(null);

      const fileInput =
        document.getElementById("faculty-excel");

      if (fileInput) {
        fileInput.value = "";
      }

      await loadUsers();
    } catch (err) {
      setError(
        err?.message || "Failed to import faculty"
      );
    } finally {
      setImporting("");
    }
  }

  /* =========================================================
     MANUAL USER CREATION
  ========================================================= */

  function updateNewUser(field, value) {
    setNewUser((previous) => ({
      ...previous,
      [field]: value
    }));
  }

  async function createUser(e) {
    e.preventDefault();

    setMessage("");
    setError("");

    if (
      !newUser.name.trim() ||
      !newUser.email.trim() ||
      !newUser.department
    ) {
      setError(
        "Name, email, password and department are required."
      );
      return;
    }

    try {
      const endpoint =
        newUser.role === "student"
          ? "/admin/students"
          : "/admin/faculty";

      const payload = {
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        password: newUser.password,
        department: newUser.department
      };

      if (newUser.role === "student") {
        payload.registerNumber =
          newUser.registerNumber.trim();

        payload.semester =
          newUser.semester
            ? Number(newUser.semester)
            : undefined;

        payload.section =
          newUser.section.trim();
      }

      await apiPost(endpoint, payload);

      setMessage(
        `${newUser.role === "student" ? "Student" : "Faculty"} created successfully.`
      );

      setNewUser({
        role: "student",
        name: "",
        email: "",
        password: "",
        registerNumber: "",
        semester: "",
        section: "",
        department: ""
      });

      setShowAddUser(false);

      await loadUsers();
    } catch (err) {
      setError(
        err?.message || "Failed to create user"
      );
    }
  }

  /* =========================================================
     STATUS
  ========================================================= */

  async function toggleStatus(user) {
    try {
      setMessage("");
      setError("");

      const nextStatus = user.active === false;

      const response = await fetch(
        `/api/admin/users/${user._id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            active: nextStatus
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update status"
        );
      }

      setMessage(
        `${user.name} is now ${
          nextStatus ? "active" : "inactive"
        }.`
      );

      await loadUsers();
    } catch (err) {
      setError(
        err?.message || "Failed to update user status"
      );
    }
  }

  /* =========================================================
     RESET FILTERS
  ========================================================= */

  function resetFilters() {
    setSearch("");
    setRoleFilter("all");
    setDepartmentFilter("all");
    setStatusFilter("all");
  }

  return (
    <GenericPage
      title="User Management"
      description="Manage institutional accounts and access."
    >
      <div className="space-y-6">

        {/* =====================================================
            HEADER ACTIONS
        ===================================================== */}

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Institutional Users
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Import students and faculty in bulk or add
              individual users manually.
            </p>
          </div>

          <button
            onClick={() => setShowAddUser(true)}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            + Add User
          </button>

        </div>

        {/* =====================================================
            MESSAGE
        ===================================================== */}

        {message && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* =====================================================
            STATISTICS
        ===================================================== */}

        <div className="grid gap-4 sm:grid-cols-3">

          <StatCard
            label="Total Users"
            value={allUsers.length}
            description="Students + Faculty"
          />

          <StatCard
            label="Students"
            value={students.length}
            description="Student accounts"
          />

          <StatCard
            label="Faculty"
            value={faculty.length}
            description="Faculty accounts"
          />

        </div>

        {/* =====================================================
            BULK IMPORT
        ===================================================== */}

        <div className="grid gap-5 lg:grid-cols-2">

          {/* STUDENT IMPORT */}

          <ImportCard
            title="Import Students"
            description="Columns must be: Reg No, Email ID, Student Name, Dept, Semester. Optional Section may be the 6th column."
            file={studentFile}
            setFile={setStudentFile}
            inputId="student-excel"
            onImport={importStudents}
            loading={importing === "students"}
            type="student"
          />

          {/* FACULTY IMPORT */}

          <ImportCard
            title="Import Faculty"
            description="Use Department, Faculty Name, Email ID and Courses. Courses may be separated with semicolons; include Semester/Sections when needed."
            file={facultyFile}
            setFile={setFacultyFile}
            inputId="faculty-excel"
            onImport={importFaculty}
            loading={importing === "faculty"}
            type="faculty"
          />

        </div>

        {/* =====================================================
            IMPORT INFORMATION
        ===================================================== */}

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">

          <h3 className="font-extrabold text-emerald-900">
            Default Login Credentials
          </h3>

          <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">

            <div className="rounded-xl bg-white p-4">
              <p className="font-bold text-slate-800">
                Students
              </p>

              <p className="mt-1 text-slate-500">
                Email: student's imported email
              </p>

              <p className="text-slate-500">
                Initial password:{" "}
                <span className="font-bold text-slate-800">
                  student123
                </span>
              </p>
            </div>

            <div className="rounded-xl bg-white p-4">
              <p className="font-bold text-slate-800">
                Faculty
              </p>

              <p className="mt-1 text-slate-500">
                Email: faculty's imported email
              </p>

              <p className="text-slate-500">
                Initial password:{" "}
                <span className="font-bold text-slate-800">
                  faculty123
                </span>
              </p>
            </div>

          </div>

          <p className="mt-4 text-xs font-medium text-emerald-800">
            Imported users keep these credentials until the password is changed by the user. Admin can disable access at any time.
          </p>

        </div>

        {/* =====================================================
            SEARCH + FILTERS
        ===================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5">

          <div className="flex flex-col gap-4 xl:flex-row">

            {/* SEARCH */}

            <div className="flex-1">

              <label className="mb-2 block text-xs font-bold text-slate-500">
                Search Users
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search by name, email or ID..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              />

            </div>

            {/* ROLE */}

            <FilterSelect
              label="Role"
              value={roleFilter}
              onChange={setRoleFilter}
              options={[
                { value: "all", label: "All Roles" },
                { value: "student", label: "Students" },
                { value: "faculty", label: "Faculty" }
              ]}
            />

            {/* DEPARTMENT */}

            <FilterSelect
              label="Department"
              value={departmentFilter}
              onChange={setDepartmentFilter}
              options={[
                {
                  value: "all",
                  label: "All Departments"
                },
                ...departments.map((department) => ({
                  value: department.code,
                  label: department.code
                }))
              ]}
            />

            {/* STATUS */}

            <FilterSelect
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                {
                  value: "all",
                  label: "All Status"
                },
                {
                  value: "active",
                  label: "Active"
                },
                {
                  value: "inactive",
                  label: "Inactive"
                }
              ]}
            />

          </div>

          <div className="mt-4 flex items-center justify-between">

            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-bold text-slate-800">
                {filteredUsers.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-800">
                {allUsers.length}
              </span>{" "}
              users
            </p>

            <button
              onClick={resetFilters}
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              Clear Filters
            </button>

          </div>

        </div>

        {/* =====================================================
            USER TABLE
        ===================================================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

            <div>
              <h3 className="font-extrabold text-slate-900">
                User Accounts
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Manage imported and manually created accounts.
              </p>
            </div>

            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              {filteredUsers.length}
            </span>

          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-10 text-center">

              <div className="text-3xl">
                👥
              </div>

              <p className="mt-3 font-bold text-slate-700">
                No users found
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Try changing your search or filters.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[850px] text-left">

                <thead className="bg-slate-50 text-xs font-bold text-slate-500">

                  <tr>
                    <th className="px-5 py-4">
                      User
                    </th>

                    <th className="px-5 py-4">
                      ID
                    </th>

                    <th className="px-5 py-4">
                      Role
                    </th>

                    <th className="px-5 py-4">
                      Department
                    </th>

                    <th className="px-5 py-4">
                      Academic
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right">
                      Action
                    </th>
                  </tr>

                </thead>

                <tbody>

                  {filteredUsers.map((user) => (

                    <tr
                      key={user._id}
                      className="border-t border-slate-100 transition hover:bg-slate-50"
                    >

                      {/* USER */}

                      <td className="px-5 py-4">

                        <div>
                          <p className="font-bold text-slate-800">
                            {user.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {user.email}
                          </p>
                        </div>

                      </td>

                      {/* ID */}

                      <td className="px-5 py-4">

                        <span className="text-xs font-bold text-slate-700">
                          {user.identifier}
                        </span>

                      </td>

                      {/* ROLE */}

                      <td className="px-5 py-4">

                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                            user.userType === "student"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-purple-50 text-purple-700"
                          }`}
                        >
                          {user.userType === "student"
                            ? "Student"
                            : "Faculty"}
                        </span>

                      </td>

                      {/* DEPARTMENT */}

                      <td className="px-5 py-4">

                        <span className="text-xs font-semibold text-slate-700">
                          {user.department?.code ||
                            user.department?.name ||
                            "—"}
                        </span>

                      </td>

                      {/* ACADEMIC */}

                      <td className="px-5 py-4">

                        {user.userType === "student" ? (
                          <div className="text-xs text-slate-500">
                            <p>
                              Sem {user.semester || "—"}
                            </p>

                            <p>
                              Section {user.section || "—"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">
                            Faculty account
                          </span>
                        )}

                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">

                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                            user.active === false
                              ? "bg-red-50 text-red-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {user.active === false
                            ? "Inactive"
                            : "Active"}
                        </span>

                      </td>

                      {/* ACTION */}

                      <td className="px-5 py-4 text-right">

                        <button
                          onClick={() =>
                            toggleStatus(user)
                          }
                          className={`rounded-lg px-3 py-2 text-xs font-bold ${
                            user.active === false
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "bg-red-50 text-red-700 hover:bg-red-100"
                          }`}
                        >
                          {user.active === false
                            ? "Enable"
                            : "Disable"}
                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>

      {/* =======================================================
          ADD USER MODAL
      ======================================================= */}

      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">

          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">

            <div className="flex items-start justify-between">

              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Add User
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Manual creation is available for users
                  missing from the Excel import.
                </p>
              </div>

              <button
                onClick={() =>
                  setShowAddUser(false)
                }
                className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>

            </div>

            <form
              onSubmit={createUser}
              className="mt-6 space-y-4"
            >

              {/* ROLE */}

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">
                  User Role
                </label>

                <select
                  value={newUser.role}
                  onChange={(e) =>
                    updateNewUser(
                      "role",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="student">
                    Student
                  </option>

                  <option value="faculty">
                    Faculty
                  </option>
                </select>
              </div>

              {/* NAME */}

              <Input
                label="Name"
                value={newUser.name}
                onChange={(value) =>
                  updateNewUser("name", value)
                }
                placeholder={
                  newUser.role === "student"
                    ? "Student Name"
                    : "Faculty Name"
                }
              />

              {/* EMAIL */}

              <Input
                label="Email"
                type="email"
                value={newUser.email}
                onChange={(value) =>
                  updateNewUser("email", value)
                }
                placeholder="user@acadx.edu"
              />

              {/* PASSWORD */}

              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-bold text-emerald-800">
                  Fixed Initial Password
                </p>
                <p className="mt-1 text-sm font-black text-slate-800">
                  {newUser.role === "student" ? "student123" : "faculty123"}
                </p>
                <p className="mt-1 text-[11px] text-emerald-700">
                  This password is assigned automatically.
                </p>
              </div>

              {/* STUDENT ONLY */}

              {newUser.role === "student" && (
                <>
                  <Input
                    label="Register Number"
                    value={newUser.registerNumber}
                    onChange={(value) =>
                      updateNewUser(
                        "registerNumber",
                        value
                      )
                    }
                    placeholder="REG001"
                  />

                  <div className="grid gap-4 sm:grid-cols-2">

                    <Input
                      label="Semester"
                      type="number"
                      value={newUser.semester}
                      onChange={(value) =>
                        updateNewUser(
                          "semester",
                          value
                        )
                      }
                      placeholder="5"
                    />

                    <Input
                      label="Section"
                      value={newUser.section}
                      onChange={(value) =>
                        updateNewUser(
                          "section",
                          value
                        )
                      }
                      placeholder="A"
                    />

                  </div>
                </>
              )}

              {/* DEPARTMENT */}

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">
                  Department
                </label>

                <select
                  value={newUser.department}
                  onChange={(e) =>
                    updateNewUser(
                      "department",
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                >
                  <option value="">
                    Select Department
                  </option>

                  {departments.map((department) => (
                    <option
                      key={department._id}
                      value={department._id}
                    >
                      {department.code} —{" "}
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* BUTTONS */}

              <div className="flex gap-3 pt-3">

                <button
                  type="button"
                  onClick={() =>
                    setShowAddUser(false)
                  }
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800"
                >
                  Create User
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
  label,
  value,
  description
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">

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
  );
}

/* =========================================================
   IMPORT CARD
========================================================= */

function ImportCard({
  title,
  description,
  file,
  setFile,
  inputId,
  onImport,
  loading,
  type
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">

      <div className="flex items-start justify-between">

        <div>
          <h3 className="text-lg font-extrabold text-slate-900">
            {title}
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
          Excel
        </span>

      </div>

      <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">

        <input
          id={inputId}
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) =>
            setFile(e.target.files?.[0] || null)
          }
          className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-700 file:px-4 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-emerald-800"
        />

        {file && (
          <div className="mt-3 rounded-lg bg-white px-3 py-2">

            <p className="truncate text-xs font-bold text-slate-700">
              {file.name}
            </p>

            <p className="mt-1 text-[11px] text-slate-400">
              {(file.size / 1024).toFixed(1)} KB
            </p>

          </div>
        )}

      </div>

      <div className="mt-4 flex items-center justify-between">

        <p className="text-[11px] text-slate-400">
          .xlsx or .xls
        </p>

        <button
          onClick={onImport}
          disabled={!file || loading}
          className="rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Importing..."
            : `Import ${
                type === "student"
                  ? "Students"
                  : "Faculty"
              }`}
        </button>

      </div>

    </div>
  );
}

/* =========================================================
   FILTER SELECT
========================================================= */

function FilterSelect({
  label,
  value,
  onChange,
  options
}) {
  return (
    <div className="w-full xl:w-44">

      <label className="mb-2 block text-xs font-bold text-slate-500">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-500"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

    </div>
  );
}

/* =========================================================
   INPUT
========================================================= */

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text"
}) {
  return (
    <div>

      <label className="mb-1 block text-xs font-bold text-slate-600">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
      />

    </div>
  );
}