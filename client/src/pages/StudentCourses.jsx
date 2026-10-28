import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Search,
  Users,
  CalendarDays,
  GraduationCap,
  ArrowUpRight,
  FileText,
  Link as LinkIcon,
  Loader2,
  AlertCircle,
  X
} from "lucide-react";

import GenericPage from "./GenericPage";
import { apiGet } from "../api";

export default function StudentCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("all");

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [materialsError, setMaterialsError] = useState("");

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    try {
      setLoading(true);
      setError("");

      const response = await apiGet("/courses");

      setCourses(response?.courses || []);
    } catch (err) {
      console.error("Student courses error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load your courses."
      );
    } finally {
      setLoading(false);
    }
  }

  const semesters = useMemo(() => {
    return [...new Set(
      courses
        .map((course) => course.semester)
        .filter(Boolean)
    )].sort((a, b) => Number(a) - Number(b));
  }, [courses]);

  const filteredCourses = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesSearch =
        !keyword ||
        String(course.code || "").toLowerCase().includes(keyword) ||
        String(course.name || "").toLowerCase().includes(keyword) ||
        String(course.faculty?.name || "").toLowerCase().includes(keyword);

      const matchesSemester =
        semesterFilter === "all" ||
        String(course.semester) === String(semesterFilter);

      return matchesSearch && matchesSemester;
    });
  }, [courses, search, semesterFilter]);

  async function openMaterials(course) {
    setSelectedCourse(course);
    setMaterials([]);
    setMaterialsError("");

    try {
      setLoadingMaterials(true);

      const response = await apiGet(
        `/courses/${course._id}/materials`
      );

      setMaterials(response?.materials || []);
    } catch (err) {
      setMaterialsError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load materials."
      );
    } finally {
      setLoadingMaterials(false);
    }
  }

  return (
    <GenericPage
      title="My Courses"
      description="View your enrolled courses, faculty and learning materials."
    >
      <div className="space-y-5">

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label="Total Courses"
            value={loading ? "—" : courses.length}
            icon={BookOpen}
            tone="emerald"
          />

          <Stat
            label="Faculty"
            value={
              loading
                ? "—"
                : new Set(
                    courses
                      .map((c) => c.faculty?._id || c.faculty?.name)
                      .filter(Boolean)
                  ).size
            }
            icon={Users}
            tone="blue"
          />

          <Stat
            label="Semesters"
            value={loading ? "—" : semesters.length}
            icon={CalendarDays}
            tone="violet"
          />

          <Stat
            label="Materials"
            value="Available"
            icon={FileText}
            tone="amber"
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search course, code or faculty..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-emerald-400 focus:bg-white"
              />
            </div>

            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none"
            >
              <option value="all">All Semesters</option>

              {semesters.map((semester) => (
                <option key={semester} value={semester}>
                  Semester {semester}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="flex gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={18} />
            <div>
              <p className="font-bold">Unable to load courses</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-sm text-slate-500">
            <Loader2 size={18} className="mr-2 animate-spin" />
            Loading your courses...
          </div>
        )}

        {!loading && filteredCourses.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
            <BookOpen size={34} className="mx-auto text-slate-300" />
            <h3 className="mt-4 font-extrabold text-slate-800">
              No courses found
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or semester filter.
            </p>
          </div>
        )}

        {!loading && filteredCourses.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredCourses.map((course) => (
              <article
                key={course._id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-200 hover:shadow-md"
              >
                <div className="bg-gradient-to-br from-emerald-50 to-white p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-700 text-white">
                      <BookOpen size={20} />
                    </div>

                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-emerald-700">
                      {course.code}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-black text-slate-900">
                    {course.name}
                  </h3>
                </div>

                <div className="space-y-3 p-5">
                  <Info
                    icon={GraduationCap}
                    label="Faculty"
                    value={course.faculty?.name || "Not assigned"}
                  />

                  <Info
                    icon={CalendarDays}
                    label="Semester"
                    value={
                      course.semester
                        ? `Semester ${course.semester}`
                        : "Not specified"
                    }
                  />

                  <Info
                    icon={Users}
                    label="Sections"
                    value={
                      course.sections?.length
                        ? course.sections.join(", ")
                        : "All sections"
                    }
                  />

                  <button
                    onClick={() => openMaterials(course)}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800"
                  >
                    <FileText size={16} />
                    View Learning Materials
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">

            <div className="flex items-start justify-between border-b border-slate-100 p-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                  {selectedCourse.code}
                </p>

                <h2 className="text-xl font-black text-slate-900">
                  {selectedCourse.name}
                </h2>
              </div>

              <button
                onClick={() => setSelectedCourse(null)}
                className="rounded-xl border border-slate-200 p-2"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-5">
              {loadingMaterials && (
                <div className="flex justify-center py-12 text-sm text-slate-500">
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Loading materials...
                </div>
              )}

              {materialsError && (
                <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                  {materialsError}
                </div>
              )}

              {!loadingMaterials &&
                !materialsError &&
                materials.length === 0 && (
                  <div className="py-12 text-center">
                    <FileText
                      size={34}
                      className="mx-auto text-slate-300"
                    />
                    <p className="mt-3 font-bold text-slate-800">
                      No materials available
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Your faculty has not added materials yet.
                    </p>
                  </div>
                )}

              {selectedCourse.content?.description && (
                <section className="mb-6 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                  <h3 className="font-black text-slate-900">Course Overview</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 whitespace-pre-wrap">
                    {selectedCourse.content.description}
                  </p>

                  {selectedCourse.content.objectives?.length > 0 && (
                    <>
                      <h4 className="mt-4 text-sm font-black text-slate-800">Learning Objectives</h4>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                        {selectedCourse.content.objectives.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </>
                  )}

                  {selectedCourse.content.units?.length > 0 && (
                    <div className="mt-5 space-y-3">
                      <h4 className="text-sm font-black text-slate-800">Units & Syllabus</h4>
                      {selectedCourse.content.units.map((unit) => (
                        <div key={unit.unitNumber} className="rounded-xl bg-white p-3">
                          <p className="font-bold text-slate-800">
                            Unit {unit.unitNumber}: {unit.title}
                          </p>
                          {unit.topics?.length > 0 && (
                            <p className="mt-1 text-xs text-emerald-700">
                              {unit.topics.join(" • ")}
                            </p>
                          )}
                          {unit.content && (
                            <p className="mt-2 text-xs leading-5 text-slate-500">
                              {unit.content}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              <div className="space-y-3">
                {materials.map((material) => (
                  <div
                    key={material._id}
                    className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                      <FileText size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-slate-900">
                        {material.title}
                      </p>

                      {material.description && (
                        <p className="mt-1 text-xs text-slate-500">
                          {material.description}
                        </p>
                      )}
                    </div>

                    {material.fileUrl && (
                      <a
                        href={material.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700"
                      >
                        <LinkIcon size={14} />
                        Open
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </GenericPage>
  );
}

function Stat({ label, value, icon: Icon, tone }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700"
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className="mt-3 text-3xl font-black text-slate-900">
            {value}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${tones[tone]}`}>
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-slate-50 p-2 text-slate-500">
        <Icon size={16} />
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="text-sm font-bold text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}