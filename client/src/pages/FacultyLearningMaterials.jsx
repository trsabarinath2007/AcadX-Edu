import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import GenericPage from "./GenericPage";
import { apiGet, apiPost } from "../api";

export default function FacultyLearningMaterials() {
  const [courses, setCourses] = useState([]);
  const [materials, setMaterials] = useState([]);

  const [selectedCourse, setSelectedCourse] = useState("");
  const [search, setSearch] = useState("");

  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    fileUrl: "",
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  /* =========================================================
     LOAD FACULTY COURSES
  ========================================================= */

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoadingCourses(true);
      setError("");

      const response = await apiGet("/courses");

      const courseList = response?.courses || [];

      setCourses(courseList);

      if (courseList.length > 0) {
        setSelectedCourse(courseList[0]._id);
      }
    } catch (err) {
      console.error("Load courses error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load courses."
      );
    } finally {
      setLoadingCourses(false);
    }
  };

  /* =========================================================
     LOAD MATERIALS
  ========================================================= */

  useEffect(() => {
    if (!selectedCourse) {
      setMaterials([]);
      return;
    }

    loadMaterials(selectedCourse);
  }, [selectedCourse]);

  const loadMaterials = async (courseId) => {
    try {
      setLoadingMaterials(true);
      setError("");

      const response = await apiGet(
        `/courses/${courseId}/materials`
      );

      setMaterials(response?.materials || []);
    } catch (err) {
      console.error("Load materials error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load learning materials."
      );

      setMaterials([]);
    } finally {
      setLoadingMaterials(false);
    }
  };

  /* =========================================================
     SELECTED COURSE
  ========================================================= */

  const currentCourse = useMemo(() => {
    return courses.find(
      (course) => String(course._id) === String(selectedCourse)
    );
  }, [courses, selectedCourse]);

  /* =========================================================
     FILTER MATERIALS
  ========================================================= */

  const filteredMaterials = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return materials;
    }

    return materials.filter((material) => {
      return (
        material.title?.toLowerCase().includes(query) ||
        material.description?.toLowerCase().includes(query)
      );
    });
  }, [materials, search]);

  /* =========================================================
     FORM CHANGE
  ========================================================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =========================================================
     ADD MATERIAL
  ========================================================= */

  const handleAddMaterial = async (event) => {
    event.preventDefault();

    if (!selectedCourse) {
      setError("Please select a course.");
      return;
    }

    if (!form.title.trim()) {
      setError("Material title is required.");
      return;
    }

    if (!form.fileUrl.trim()) {
      setError("Material URL is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await apiPost(
        `/courses/${selectedCourse}/materials`,
        {
          title: form.title.trim(),
          description: form.description.trim(),
          fileUrl: form.fileUrl.trim(),
        }
      );

      const newMaterial = response?.material;

      if (newMaterial) {
        setMaterials((previous) => [
          newMaterial,
          ...previous,
        ]);
      } else {
        await loadMaterials(selectedCourse);
      }

      setForm({
        title: "",
        description: "",
        fileUrl: "",
      });

      setShowModal(false);

      setMessage("Learning material added successfully.");
    } catch (err) {
      console.error("Add material error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to add learning material."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     COURSE CHANGE
  ========================================================= */

  const handleCourseChange = (event) => {
    setSelectedCourse(event.target.value);
    setSearch("");
    setError("");
    setMessage("");
  };

  /* =========================================================
     OPEN MATERIAL
  ========================================================= */

  const openMaterial = (url) => {
    if (!url) return;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <GenericPage
      title="Learning Materials"
      description="Upload and manage study resources for your assigned courses."
    >
      <div className="space-y-5">

        {/* =====================================================
            ALERTS
        ===================================================== */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {message}
          </div>
        )}

        {/* =====================================================
            SUMMARY
        ===================================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  My Courses
                </p>

                <p className="mt-2 text-3xl font-black text-slate-900">
                  {courses.length}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                <BookOpen size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Course Materials
                </p>

                <p className="mt-2 text-3xl font-black text-slate-900">
                  {materials.length}
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                <FileText size={22} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Showing
                </p>

                <p className="mt-2 text-3xl font-black text-slate-900">
                  {filteredMaterials.length}
                </p>
              </div>

              <div className="rounded-xl bg-violet-50 p-3 text-violet-700">
                <Search size={22} />
              </div>
            </div>
          </div>

        </div>

        {/* =====================================================
            TOOLBAR
        ===================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

            <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2">

              {/* Course */}
              <select
                value={selectedCourse}
                onChange={handleCourseChange}
                disabled={loadingCourses || courses.length === 0}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                {loadingCourses ? (
                  <option>Loading courses...</option>
                ) : courses.length === 0 ? (
                  <option>No courses assigned</option>
                ) : (
                  <>
                    <option value="">
                      Select Course
                    </option>

                    {courses.map((course) => (
                      <option
                        key={course._id}
                        value={course._id}
                      >
                        {course.code} — {course.name}
                      </option>
                    ))}
                  </>
                )}
              </select>

              {/* Search */}
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Search
                  size={17}
                  className="shrink-0 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search materials..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </div>

            </div>

            <button
              onClick={() => {
                setError("");
                setMessage("");
                setShowModal(true);
              }}
              disabled={!selectedCourse}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={18} />
              Add Material
            </button>

          </div>
        </div>

        {/* =====================================================
            CURRENT COURSE
        ===================================================== */}

        {currentCourse && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="text-xs font-black uppercase tracking-wider text-emerald-700">
                  Selected Course
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-900">
                  {currentCourse.code} — {currentCourse.name}
                </h2>
              </div>

              <div className="text-sm font-semibold text-slate-600">
                Semester {currentCourse.semester}
              </div>

            </div>
          </div>
        )}

        {/* =====================================================
            MATERIALS
        ===================================================== */}

        {loadingMaterials ? (
          <div className="flex min-h-[250px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
              <Loader2
                size={20}
                className="animate-spin"
              />
              Loading learning materials...
            </div>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <FileText size={25} />
            </div>

            <h3 className="mt-4 text-lg font-black text-slate-900">
              No learning materials
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Add notes, reference links, PDFs, videos or other
              study resources for this course.
            </p>

            {selectedCourse && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800"
              >
                <Plus size={17} />
                Add First Material
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">

            {filteredMaterials.map((material) => (
              <div
                key={material._id}
                className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg"
              >

                <div className="flex items-start justify-between gap-3">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <FileText size={21} />
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Resource
                  </span>

                </div>

                <h3 className="mt-4 line-clamp-2 text-lg font-black text-slate-900">
                  {material.title}
                </h3>

                <p className="mt-2 line-clamp-3 min-h-[60px] text-sm leading-6 text-slate-500">
                  {material.description ||
                    "No description provided."}
                </p>

                <div className="mt-5 border-t border-slate-100 pt-4">

                  <button
                    onClick={() =>
                      openMaterial(material.fileUrl)
                    }
                    disabled={!material.fileUrl}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ExternalLink size={16} />
                    Open Material
                  </button>

                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    {material.createdBy?.name
                      ? `Added by ${material.createdBy.name}`
                      : "Added by you"}
                  </span>

                  {material.createdAt && (
                    <span>
                      {new Date(
                        material.createdAt
                      ).toLocaleDateString()}
                    </span>
                  )}
                </div>

              </div>
            ))}

          </div>
        )}

        {/* =====================================================
            ADD MATERIAL MODAL
        ===================================================== */}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">

            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">

              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Add Learning Material
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Add a study resource for your selected course.
                  </p>
                </div>

                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X size={19} />
                </button>

              </div>

              {/* Form */}
              <form
                onSubmit={handleAddMaterial}
                className="space-y-4 p-5"
              >

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Course
                  </label>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                    {currentCourse
                      ? `${currentCourse.code} — ${currentCourse.name}`
                      : "No course selected"}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Material Title
                  </label>

                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Example: Unit 1 Lecture Notes"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Briefly describe this material..."
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Material URL
                  </label>

                  <div className="relative">
                    <LinkIcon
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      name="fileUrl"
                      value={form.fileUrl}
                      onChange={handleChange}
                      placeholder="https://drive.google.com/..."
                      className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    You can paste a Google Drive, OneDrive,
                    YouTube, PDF or other resource link.
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">

                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus size={17} />
                        Add Material
                      </>
                    )}
                  </button>

                </div>

              </form>

            </div>

          </div>
        )}

      </div>
    </GenericPage>
  );
}