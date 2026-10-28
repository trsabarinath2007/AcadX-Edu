import React, { useEffect, useMemo, useState } from "react";
import GenericPage from "./GenericPage";
import { apiGet, apiPost } from "../api";

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [faculty, setFaculty] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assigning, setAssigning] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showAddCourse, setShowAddCourse] =
    useState(false);

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] =
    useState("all");
  const [semesterFilter, setSemesterFilter] =
    useState("all");
  const [facultyFilter, setFacultyFilter] =
    useState("all");

  const [courseForm, setCourseForm] = useState({
    code: "",
    name: "",
    department: "",
    semester: "",
    sections: "A, B, C",
    credits: "3",
    description: "",
    objectives: "",
    prerequisites: "",
    units: "",
    referenceBooks: "",
    outcomes: ""
  });

  /* =========================================================
     LOAD DATA
  ========================================================= */

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        coursesResponse,
        departmentsResponse,
        facultyResponse
      ] = await Promise.all([
        apiGet("/admin/courses"),
        apiGet("/admin/departments"),
        apiGet("/admin/faculty")
      ]);

      setCourses(
        coursesResponse?.courses || []
      );

      setDepartments(
        departmentsResponse?.departments || []
      );

      setFaculty(
        facultyResponse?.faculty || []
      );
    } catch (err) {
      console.error(
        "Failed to load course data:",
        err
      );

      setError(
        err?.message ||
          "Failed to load course information."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /* =========================================================
     FORM
  ========================================================= */

  function updateForm(field, value) {
    setCourseForm((previous) => ({
      ...previous,
      [field]: value
    }));
  }

  function resetForm() {
    setCourseForm({
      code: "",
      name: "",
      department: "",
      semester: "",
      sections: "A, B, C",
      credits: "3"
    });
  }

  /* =========================================================
     CREATE COURSE
  ========================================================= */

  async function createCourse(e) {
    e.preventDefault();

    setMessage("");
    setError("");

    if (
      !courseForm.code.trim() ||
      !courseForm.name.trim() ||
      !courseForm.department ||
      !courseForm.semester
    ) {
      setError(
        "Course code, course name, department and semester are required."
      );
      return;
    }

    const sectionList = courseForm.sections
      .split(",")
      .map((section) =>
        section.trim().toUpperCase()
      )
      .filter(Boolean);

    if (sectionList.length === 0) {
      setError(
        "At least one section is required."
      );
      return;
    }

    try {
      setSaving(true);

      await apiPost("/admin/courses", {
        code: courseForm.code
          .trim()
          .toUpperCase(),

        name: courseForm.name.trim(),

        department:
          courseForm.department,

        semester:
          Number(courseForm.semester),

        sections: sectionList,

        credits:
          Number(courseForm.credits) || 3,

        content: {
          description: courseForm.description.trim(),
          objectives: courseForm.objectives.split("\n").map((x) => x.trim()).filter(Boolean),
          prerequisites: courseForm.prerequisites.split("\n").map((x) => x.trim()).filter(Boolean),
          referenceBooks: courseForm.referenceBooks.split("\n").map((x) => x.trim()).filter(Boolean),
          outcomes: courseForm.outcomes.split("\n").map((x) => x.trim()).filter(Boolean),
          units: courseForm.units
            .split("\n")
            .map((line, index) => {
              const parts = line.split("|").map((x) => x.trim());
              if (!parts[0]) return null;
              return {
                unitNumber: index + 1,
                title: parts[0],
                topics: (parts[1] || "").split(",").map((x) => x.trim()).filter(Boolean),
                content: parts.slice(2).join(" | ")
              };
            })
            .filter(Boolean)
        }
      });

      setMessage(
        "Course created successfully."
      );

      resetForm();
      setShowAddCourse(false);

      await loadData();
    } catch (err) {
      console.error(
        "Create course error:",
        err
      );

      setError(
        err?.message ||
          "Failed to create course."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     ASSIGN FACULTY
  ========================================================= */

  async function assignFaculty(
    courseId,
    facultyId
  ) {
    if (!facultyId) {
      return;
    }

    try {
      setAssigning(courseId);
      setMessage("");
      setError("");

      const response = await fetch(
        `/api/admin/courses/${courseId}/assign-faculty`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json"
          },

          credentials: "include",

          body: JSON.stringify({
            facultyId
          })
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to assign faculty."
        );
      }

      setMessage(
        "Faculty assigned successfully."
      );

      await loadData();
    } catch (err) {
      console.error(
        "Assign faculty error:",
        err
      );

      setError(
        err?.message ||
          "Failed to assign faculty."
      );
    } finally {
      setAssigning("");
    }
  }

  /* =========================================================
     FILTER OPTIONS
  ========================================================= */

  const semesters = useMemo(() => {
    return [
      ...new Set(
        courses
          .map((course) => course.semester)
          .filter(
            (semester) =>
              semester !== undefined &&
              semester !== null
          )
      )
    ].sort((a, b) => a - b);
  }, [courses]);

  /* =========================================================
     FILTERED COURSES
  ========================================================= */

  const filteredCourses = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return courses.filter((course) => {
      const department =
        course.department?.code ||
        course.department?.name ||
        "";

      const facultyName =
        course.faculty?.name || "";

      const matchesSearch =
        !query ||
        course.code
          ?.toLowerCase()
          .includes(query) ||
        course.name
          ?.toLowerCase()
          .includes(query) ||
        facultyName
          .toLowerCase()
          .includes(query);

      const matchesDepartment =
        departmentFilter === "all" ||
        department === departmentFilter;

      const matchesSemester =
        semesterFilter === "all" ||
        String(course.semester) ===
          String(semesterFilter);

      const matchesFaculty =
        facultyFilter === "all" ||
        (facultyFilter === "assigned" &&
          course.faculty) ||
        (facultyFilter === "unassigned" &&
          !course.faculty);

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesSemester &&
        matchesFaculty
      );
    });
  }, [
    courses,
    search,
    departmentFilter,
    semesterFilter,
    facultyFilter
  ]);

  /* =========================================================
     STATISTICS
  ========================================================= */

  const assignedCourses =
    courses.filter(
      (course) => course.faculty
    ).length;

  const unassignedCourses =
    courses.length -
    assignedCourses;

  const departmentCount =
    new Set(
      courses
        .map(
          (course) =>
            course.department?.code ||
            course.department?.name
        )
        .filter(Boolean)
    ).size;

  /* =========================================================
     RESET FILTERS
  ========================================================= */

  function resetFilters() {
    setSearch("");
    setDepartmentFilter("all");
    setSemesterFilter("all");
    setFacultyFilter("all");
  }

  return (
    <GenericPage
      title="Course Management"
      description="Create courses, organize academic sections and assign faculty."
    >
      <div className="space-y-6">

        {/* =====================================================
            ACTIONS
        ===================================================== */}

        <div className="flex justify-end gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            onClick={() => setShowAddCourse(true)}
            className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
          >
            + Add Course
          </button>
        </div>


        {/* =====================================================
            MESSAGES
        ===================================================== */}

        {message && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">

            <p className="text-sm font-semibold text-emerald-700">
              {message}
            </p>

          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">

            <p className="text-sm font-semibold text-red-700">
              {error}
            </p>

          </div>
        )}


        {/* =====================================================
            STATISTICS
        ===================================================== */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            label="Total Courses"
            value={courses.length}
            description="Courses in AcadX"
            icon="📚"
          />

          <StatCard
            label="Departments"
            value={departmentCount}
            description="Departments with courses"
            icon="🏢"
          />

          <StatCard
            label="Assigned Faculty"
            value={assignedCourses}
            description="Courses with faculty"
            icon="👨‍🏫"
          />

          <StatCard
            label="Unassigned"
            value={unassignedCourses}
            description="Courses awaiting faculty"
            icon="⚠️"
          />

        </div>


        {/* =====================================================
            SEARCH & FILTERS
        ===================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5">

          <div className="grid gap-4 xl:grid-cols-[1fr_190px_170px_190px]">

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
                placeholder="Search course code, name or faculty..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
              />

            </div>


            {/* DEPARTMENT */}

            <Select
              label="Department"
              value={departmentFilter}
              onChange={setDepartmentFilter}
              options={[
                {
                  value: "all",
                  label: "All Departments"
                },

                ...departments.map(
                  (department) => ({
                    value: department.code,
                    label: department.code
                  })
                )
              ]}
            />


            {/* SEMESTER */}

            <Select
              label="Semester"
              value={semesterFilter}
              onChange={setSemesterFilter}
              options={[
                {
                  value: "all",
                  label: "All Semesters"
                },

                ...semesters.map(
                  (semester) => ({
                    value: String(semester),
                    label: `Semester ${semester}`
                  })
                )
              ]}
            />


            {/* FACULTY */}

            <Select
              label="Faculty"
              value={facultyFilter}
              onChange={setFacultyFilter}
              options={[
                {
                  value: "all",
                  label: "All Courses"
                },

                {
                  value: "assigned",
                  label: "Faculty Assigned"
                },

                {
                  value: "unassigned",
                  label: "Not Assigned"
                }
              ]}
            />

          </div>


          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">

            <p className="text-xs text-slate-500">

              Showing{" "}

              <span className="font-bold text-slate-800">
                {filteredCourses.length}
              </span>{" "}

              of{" "}

              <span className="font-bold text-slate-800">
                {courses.length}
              </span>{" "}

              courses

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
            COURSE LIST
        ===================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white">

          <div className="border-b border-slate-100 px-5 py-5">

            <div className="flex items-center justify-between">

              <div>

                <h3 className="text-lg font-extrabold text-slate-900">
                  Courses
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Assign each course to its respective faculty.
                </p>

              </div>

              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                {filteredCourses.length}
              </span>

            </div>

          </div>


          {loading ? (
            <div className="p-12 text-center">

              <p className="text-sm font-semibold text-slate-500">
                Loading courses...
              </p>

            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="p-12 text-center">

              <div className="text-4xl">
                📚
              </div>

              <p className="mt-4 font-bold text-slate-700">
                No courses found
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Try changing your filters or create a new course.
              </p>

            </div>
          ) : (
            <div className="grid gap-4 p-5 lg:grid-cols-2 xl:grid-cols-3">

              {filteredCourses.map(
                (course) => (

                  <CourseCard
                    key={course._id}
                    course={course}
                    faculty={faculty}
                    assigning={
                      assigning === course._id
                    }
                    onAssign={assignFaculty}
                  />

                )
              )}

            </div>
          )}

        </div>

      </div>


      {/* =======================================================
          ADD COURSE MODAL
      ======================================================= */}

      {showAddCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">

            {/* HEADER */}

            <div className="flex items-start justify-between">

              <div>

                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                  AcadX
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-900">
                  Add Course
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Create a new academic course.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowAddCourse(false)
                }
                className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>

            </div>


            {/* FORM */}

            <form
              onSubmit={createCourse}
              className="mt-6 space-y-5"
            >

              <div className="grid gap-4 md:grid-cols-2">

                {/* COURSE CODE */}

                <Input
                  label="Course Code"
                  value={courseForm.code}
                  onChange={(value) =>
                    updateForm(
                      "code",
                      value
                    )
                  }
                  placeholder="CS501"
                />


                {/* COURSE NAME */}

                <Input
                  label="Course Name"
                  value={courseForm.name}
                  onChange={(value) =>
                    updateForm(
                      "name",
                      value
                    )
                  }
                  placeholder="Data Structures and Algorithms"
                />


                {/* DEPARTMENT */}

                <div>

                  <label className="mb-2 block text-xs font-bold text-slate-600">
                    Department
                  </label>

                  <select
                    value={
                      courseForm.department
                    }
                    onChange={(e) =>
                      updateForm(
                        "department",
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                  >

                    <option value="">
                      Select Department
                    </option>

                    {departments.map(
                      (department) => (

                        <option
                          key={
                            department._id
                          }
                          value={
                            department._id
                          }
                        >
                          {department.code} —{" "}
                          {department.name}
                        </option>

                      )
                    )}

                  </select>

                </div>


                {/* SEMESTER */}

                <div>

                  <label className="mb-2 block text-xs font-bold text-slate-600">
                    Semester
                  </label>

                  <select
                    value={
                      courseForm.semester
                    }
                    onChange={(e) =>
                      updateForm(
                        "semester",
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
                  >

                    <option value="">
                      Select Semester
                    </option>

                    {Array.from(
                      { length: 8 },
                      (_, index) =>
                        index + 1
                    ).map((semester) => (

                      <option
                        key={semester}
                        value={semester}
                      >
                        Semester {semester}
                      </option>

                    ))}

                  </select>

                </div>


                {/* CREDITS */}

                <Input
                  label="Credits"
                  type="number"
                  min="1"
                  max="10"
                  value={courseForm.credits}
                  onChange={(value) =>
                    updateForm(
                      "credits",
                      value
                    )
                  }
                  placeholder="3"
                />


                {/* SECTIONS */}

                <Input
                  label="Sections"
                  value={courseForm.sections}
                  onChange={(value) =>
                    updateForm(
                      "sections",
                      value
                    )
                  }
                  placeholder="A, B, C"
                />

              </div>


              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">

                <p className="text-xs font-bold text-emerald-800">
                  Sections
                </p>

                <p className="mt-1 text-xs text-emerald-700">
                  Enter sections separated by commas.
                  Example: A, B, C
                </p>

              </div>


              {/* FULL COURSE CONTENT */}

              <div className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
                <div>
                  <p className="text-sm font-black text-slate-900">Complete Course Content</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Store the full syllabus in MongoDB so students and AcadX AI can use it.
                  </p>
                </div>

                <textarea
                  value={courseForm.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  placeholder="Course description / syllabus overview"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500"
                />

                <textarea
                  value={courseForm.objectives}
                  onChange={(e) => updateForm("objectives", e.target.value)}
                  placeholder="Learning objectives — one per line"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500"
                />

                <textarea
                  value={courseForm.units}
                  onChange={(e) => updateForm("units", e.target.value)}
                  placeholder={"Units — one per line: Unit title | topic1, topic2 | detailed unit content\nExample: Arrays | traversal, insertion, deletion | Complete array fundamentals"}
                  rows={6}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500"
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <textarea
                    value={courseForm.prerequisites}
                    onChange={(e) => updateForm("prerequisites", e.target.value)}
                    placeholder="Prerequisites — one per line"
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500"
                  />

                  <textarea
                    value={courseForm.outcomes}
                    onChange={(e) => updateForm("outcomes", e.target.value)}
                    placeholder="Course outcomes — one per line"
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500"
                  />
                </div>

                <textarea
                  value={courseForm.referenceBooks}
                  onChange={(e) => updateForm("referenceBooks", e.target.value)}
                  placeholder="Reference books / resources — one per line"
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              {/* BUTTONS */}

              <div className="flex gap-3 pt-2">

                <button
                  type="button"
                  onClick={() =>
                    setShowAddCourse(false)
                  }
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  {saving
                    ? "Creating..."
                    : "Create Course"}
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
   COURSE CARD
========================================================= */

function CourseCard({
  course,
  faculty,
  assigning,
  onAssign
}) {
  const department =
    course.department?.code ||
    course.department?.name ||
    "—";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-200 hover:shadow-sm">

      {/* COURSE HEADER */}

      <div className="flex items-start justify-between gap-3">

        <div>

          <span className="text-xs font-black text-emerald-700">
            {course.code}
          </span>

          <h4 className="mt-1 text-lg font-black text-slate-900">
            {course.name}
          </h4>

        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
          {course.credits || 3} Credits
        </span>

      </div>


      {/* ACADEMIC DETAILS */}

      <div className="mt-5 grid grid-cols-2 gap-3">

        <InfoBox
          label="Department"
          value={department}
        />

        <InfoBox
          label="Semester"
          value={
            course.semester
              ? `Semester ${course.semester}`
              : "—"
          }
        />

      </div>


      {/* SECTIONS */}

      <div className="mt-4">

        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
          Sections
        </p>

        <div className="mt-2 flex flex-wrap gap-2">

          {(course.sections || []).length === 0 ? (
            <span className="text-xs text-slate-400">
              No sections
            </span>
          ) : (
            course.sections.map(
              (section) => (

                <span
                  key={section}
                  className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"
                >
                  {section}
                </span>

              )
            )
          )}

        </div>

      </div>


      {/* FACULTY */}

      <div className="mt-5 border-t border-slate-100 pt-4">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              Assigned Faculty
            </p>

            {course.faculty ? (
              <div className="mt-2">

                <p className="text-sm font-bold text-slate-800">
                  {course.faculty.name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {course.faculty.email}
                </p>

              </div>
            ) : (
              <p className="mt-2 text-xs font-semibold text-amber-600">
                No faculty assigned
              </p>
            )}

          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
            👨‍🏫
          </div>

        </div>


        {/* ASSIGN FACULTY */}

        <div className="mt-4">

          <select
            defaultValue=""
            disabled={assigning}
            onChange={(e) => {
              if (e.target.value) {
                onAssign(
                  course._id,
                  e.target.value
                );
              }
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-semibold text-slate-600 outline-none focus:border-emerald-500 disabled:opacity-50"
          >

            <option value="">
              {assigning
                ? "Assigning faculty..."
                : course.faculty
                  ? "Change Faculty"
                  : "Assign Faculty"}
            </option>

            {faculty
              .filter((member) => {
                const facultyDepartment =
                  member.department?.code ||
                  member.department?.name;

                const courseDepartment =
                  course.department?.code ||
                  course.department?.name;

                return (
                  !facultyDepartment ||
                  !courseDepartment ||
                  facultyDepartment ===
                    courseDepartment
                );
              })
              .map((member) => (

                <option
                  key={member._id}
                  value={member._id}
                >
                  {member.name}
                </option>

              ))}

          </select>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
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
   INFO BOX
========================================================= */

function InfoBox({
  label,
  value
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">

      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xs font-bold text-slate-700">
        {value}
      </p>

    </div>
  );
}


/* =========================================================
   SELECT
========================================================= */

function Select({
  label,
  value,
  onChange,
  options
}) {
  return (
    <div>

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
  type = "text",
  min,
  max
}) {
  return (
    <div>

      <label className="mb-2 block text-xs font-bold text-slate-600">
        {label}
      </label>

      <input
        type={type}
        value={value}
        min={min}
        max={max}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
      />

    </div>
  );
}