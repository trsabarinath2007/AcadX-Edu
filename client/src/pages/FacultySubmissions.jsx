import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  FileText,
  Loader2,
  Search,
  Send,
  User,
  Users,
  X,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

import GenericPage from "./GenericPage";
import { apiGet } from "../api";

export default function FacultySubmissions() {
  const [searchParams] = useSearchParams();

  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] =
    useState("");

  const [submissions, setSubmissions] = useState([]);

  const [loadingAssignments, setLoadingAssignments] =
    useState(true);
  const [loadingSubmissions, setLoadingSubmissions] =
    useState(false);
  const [grading, setGrading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedSubmission, setSelectedSubmission] =
    useState(null);

  const [marks, setMarks] = useState("");
  const [feedback, setFeedback] = useState("");

  // ============================================================
  // LOAD FACULTY ASSIGNMENTS
  // ============================================================

  useEffect(() => {
    loadAssignments();
  }, []);

  async function loadAssignments() {
    try {
      setLoadingAssignments(true);
      setError("");

      const response = await apiGet("/assignments");

      const data = response?.assignments || [];

      setAssignments(data);

      // Check URL:
      // /faculty-submissions?assignment=ASSIGNMENT_ID

      const urlAssignment =
        searchParams.get("assignment");

      if (
        urlAssignment &&
        data.some(
          (item) =>
            String(item._id) ===
            String(urlAssignment)
        )
      ) {
        setSelectedAssignmentId(
          urlAssignment
        );
      } else if (data.length > 0) {
        setSelectedAssignmentId(
          data[0]._id
        );
      }
    } catch (err) {
      console.error(
        "Load faculty assignments error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load assignments."
      );
    } finally {
      setLoadingAssignments(false);
    }
  }

  // ============================================================
  // SELECTED ASSIGNMENT
  // ============================================================

  const selectedAssignment = useMemo(() => {
    return assignments.find(
      (assignment) =>
        String(assignment._id) ===
        String(selectedAssignmentId)
    );
  }, [
    assignments,
    selectedAssignmentId,
  ]);

  // ============================================================
  // LOAD SUBMISSIONS
  // ============================================================

  useEffect(() => {
    if (!selectedAssignmentId) {
      setSubmissions([]);
      return;
    }

    loadSubmissions(
      selectedAssignmentId
    );
  }, [selectedAssignmentId]);

  async function loadSubmissions(
    assignmentId
  ) {
    try {
      setLoadingSubmissions(true);
      setError("");
      setSuccess("");

      const response = await apiGet(
        `/assignments/${assignmentId}/submissions`
      );

      setSubmissions(
        response?.submissions || []
      );
    } catch (err) {
      console.error(
        "Load submissions error:",
        err
      );

      setSubmissions([]);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load submissions."
      );
    } finally {
      setLoadingSubmissions(false);
    }
  }

  // ============================================================
  // FILTER
  // ============================================================

  const filteredSubmissions = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return submissions.filter(
      (submission) => {
        const student =
          submission.student;

        const matchesSearch =
          !query ||
          student?.name
            ?.toLowerCase()
            .includes(query) ||
          student?.email
            ?.toLowerCase()
            .includes(query) ||
          student?.registerNumber
            ?.toLowerCase()
            .includes(query);

        const currentStatus =
          String(
            submission.status || "submitted"
          ).toLowerCase();

        const matchesStatus =
          statusFilter === "all" ||
          currentStatus === statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );
  }, [
    submissions,
    search,
    statusFilter,
  ]);

  // ============================================================
  // STATS
  // ============================================================

  const totalSubmissions =
    submissions.length;

  const gradedCount =
    submissions.filter(
      (submission) =>
        String(
          submission.status
        ).toLowerCase() === "graded"
    ).length;

  const pendingCount =
    totalSubmissions -
    gradedCount;

  // ============================================================
  // OPEN GRADING MODAL
  // ============================================================

  function openGradeModal(submission) {
    setSelectedSubmission(
      submission
    );

    setMarks(
      submission.marks !== null &&
        submission.marks !== undefined
        ? String(submission.marks)
        : ""
    );

    setFeedback(
      submission.feedback || ""
    );

    setError("");
    setSuccess("");
  }

  function closeGradeModal() {
    if (grading) return;

    setSelectedSubmission(null);
    setMarks("");
    setFeedback("");
  }

  // ============================================================
  // GRADE SUBMISSION
  // ============================================================

  async function gradeSubmission() {
    if (!selectedSubmission) {
      return;
    }

    const numericMarks =
      Number(marks);

    if (
      marks === "" ||
      Number.isNaN(numericMarks) ||
      numericMarks < 0
    ) {
      setError(
        "Enter valid non-negative marks."
      );
      return;
    }

    const maximumMarks =
      Number(
        selectedAssignment?.totalMarks ??
          selectedAssignment?.maxMarks ??
          0
      );

    if (
      maximumMarks > 0 &&
      numericMarks > maximumMarks
    ) {
      setError(
        `Marks cannot exceed ${maximumMarks}.`
      );
      return;
    }

    try {
      setGrading(true);
      setError("");
      setSuccess("");

      const token =
        localStorage.getItem(
          "acadx_token"
        );

      const response = await fetch(
        `/api/assignments/submissions/${selectedSubmission._id}/grade`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",

            ...(token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {}),
          },
          credentials: "include",

          body: JSON.stringify({
            marks: numericMarks,
            feedback:
              feedback.trim(),
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to grade submission."
        );
      }

      const updatedSubmission =
        data?.submission;

      // Update UI immediately
      setSubmissions((current) =>
        current.map(
          (submission) =>
            String(submission._id) ===
            String(
              selectedSubmission._id
            )
              ? {
                  ...submission,
                  ...(updatedSubmission ||
                    {}),
                  marks:
                    updatedSubmission?.marks ??
                    numericMarks,
                  feedback:
                    updatedSubmission?.feedback ??
                    feedback.trim(),
                  status: "graded",
                }
              : submission
        )
      );

      setSuccess(
        "Submission graded successfully."
      );

      closeGradeModal();
    } catch (err) {
      console.error(
        "Grade submission error:",
        err
      );

      setError(
        err?.message ||
          "Failed to grade submission."
      );
    } finally {
      setGrading(false);
    }
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <GenericPage
      title="Submissions"
      description="Review and grade student assignment submissions."
    >
      <div className="space-y-5">

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-bold text-red-800">
              {error}
            </p>
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
            ASSIGNMENT SELECTOR
        ================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5">

          <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
            Assignment
          </label>

          {loadingAssignments ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2
                size={17}
                className="animate-spin"
              />
              Loading assignments...
            </div>
          ) : (
            <select
              value={
                selectedAssignmentId
              }
              onChange={(e) => {
                setSelectedAssignmentId(
                  e.target.value
                );

                setSearch("");
                setStatusFilter("all");
                setError("");
                setSuccess("");
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-600"
            >
              {assignments.length ===
              0 ? (
                <option value="">
                  No assignments found
                </option>
              ) : (
                assignments.map(
                  (assignment) => (
                    <option
                      key={
                        assignment._id
                      }
                      value={
                        assignment._id
                      }
                    >
                      {assignment.title}
                      {assignment.course?.code
                        ? ` — ${assignment.course.code}`
                        : ""}
                    </option>
                  )
                )
              )}
            </select>
          )}

          {selectedAssignment && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">

              <InfoItem
                label="Course"
                value={
                  selectedAssignment
                    .course?.code ||
                  "—"
                }
              />

              <InfoItem
                label="Due Date"
                value={formatDate(
                  selectedAssignment.dueDate
                )}
              />

              <InfoItem
                label="Maximum Marks"
                value={
                  selectedAssignment.totalMarks ??
                  selectedAssignment.maxMarks ??
                  "—"
                }
              />

            </div>
          )}

        </div>

        {/* ==================================================
            STATS
        ================================================== */}

        <div className="grid gap-4 sm:grid-cols-3">

          <StatCard
            label="Total Submissions"
            value={totalSubmissions}
            icon={FileText}
          />

          <StatCard
            label="Pending"
            value={pendingCount}
            icon={ClockIcon}
          />

          <StatCard
            label="Graded"
            value={gradedCount}
            icon={CheckCircle2}
          />

        </div>

        {/* ==================================================
            FILTERS
        ================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4">

          <div className="grid gap-3 md:grid-cols-2">

            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">

              <Search
                size={16}
                className="text-slate-400"
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search student..."
                className="w-full bg-transparent py-3 text-sm outline-none"
              />

            </div>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-600"
            >
              <option value="all">
                All Status
              </option>

              <option value="submitted">
                Submitted
              </option>

              <option value="graded">
                Graded
              </option>
            </select>

          </div>

        </div>

        {/* ==================================================
            SUBMISSIONS
        ================================================== */}

        {loadingSubmissions ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-12">

            <Loader2
              size={28}
              className="animate-spin text-emerald-700"
            />

          </div>
        ) : filteredSubmissions.length ===
          0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <FileText size={25} />
            </div>

            <h3 className="mt-4 font-extrabold text-slate-900">
              No submissions found
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              Students who submit this assignment
              will appear here.
            </p>

          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

            {/* DESKTOP */}

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
                      Submitted
                    </th>

                    <th className="px-5 py-3 text-[11px] font-black uppercase tracking-wide text-slate-400">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right text-[11px] font-black uppercase tracking-wide text-slate-400">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filteredSubmissions.map(
                    (submission) => (
                      <SubmissionRow
                        key={
                          submission._id
                        }
                        submission={
                          submission
                        }
                        onGrade={
                          openGradeModal
                        }
                      />
                    )
                  )}

                </tbody>

              </table>

            </div>

            {/* MOBILE */}

            <div className="divide-y divide-slate-100 md:hidden">

              {filteredSubmissions.map(
                (submission) => (
                  <MobileSubmission
                    key={
                      submission._id
                    }
                    submission={
                      submission
                    }
                    onGrade={
                      openGradeModal
                    }
                  />
                )
              )}

            </div>

          </div>
        )}

      </div>

      {/* ======================================================
          GRADE MODAL
      ====================================================== */}

      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">

          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl">

            <div className="flex items-start justify-between border-b border-slate-200 p-5">

              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Grade Submission
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {selectedSubmission.student
                    ?.name ||
                    "Student"}
                </p>
              </div>

              <button
                onClick={
                  closeGradeModal
                }
                disabled={grading}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>

            </div>

            <div className="space-y-4 p-5">

              <div className="rounded-xl bg-slate-50 p-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <User size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {selectedSubmission
                        .student?.name ||
                        "Student"}
                    </p>

                    <p className="text-xs text-slate-500">
                      {selectedSubmission
                        .student
                        ?.registerNumber ||
                        selectedSubmission
                          .student
                          ?.email ||
                        "—"}
                    </p>
                  </div>

                </div>

              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                  Marks
                </label>

                <input
                  type="number"
                  min="0"
                  max={
                    selectedAssignment?.totalMarks ??
                    selectedAssignment?.maxMarks ??
                    undefined
                  }
                  value={marks}
                  onChange={(e) =>
                    setMarks(
                      e.target.value
                    )
                  }
                  placeholder={`Maximum ${
                    selectedAssignment?.totalMarks ??
                    selectedAssignment?.maxMarks ??
                    "marks"
                  }`}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600"
                />

              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                  Feedback
                </label>

                <textarea
                  value={feedback}
                  onChange={(e) =>
                    setFeedback(
                      e.target.value
                    )
                  }
                  rows={5}
                  placeholder="Enter feedback for the student..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600"
                />

              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">

                <button
                  onClick={
                    closeGradeModal
                  }
                  disabled={grading}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  onClick={
                    gradeSubmission
                  }
                  disabled={grading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800 disabled:opacity-50"
                >

                  {grading ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Send size={17} />
                  )}

                  {grading
                    ? "Saving..."
                    : "Save Grade"}

                </button>

              </div>

            </div>

          </div>

        </div>
      )}
    </GenericPage>
  );
}

// ============================================================
// SUBMISSION ROW
// ============================================================

function SubmissionRow({
  submission,
  onGrade,
}) {
  const student =
    submission.student;

  const isGraded =
    String(
      submission.status || ""
    ).toLowerCase() ===
    "graded";

  return (
    <tr className="hover:bg-slate-50">

      <td className="px-5 py-4">

        <div className="flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-xs font-black text-emerald-700">
            {(student?.name || "S")
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">
              {student?.name ||
                "Unknown Student"}
            </p>

            <p className="text-xs text-slate-400">
              {student?.email || "—"}
            </p>
          </div>

        </div>

      </td>

      <td className="px-5 py-4 text-sm font-semibold text-slate-700">
        {student?.registerNumber ||
          "—"}
      </td>

      <td className="px-5 py-4 text-sm text-slate-500">
        {formatDate(
          submission.submittedAt
        )}
      </td>

      <td className="px-5 py-4">

        <StatusBadge
          graded={isGraded}
        />

      </td>

      <td className="px-5 py-4 text-right">

        <button
          onClick={() =>
            onGrade(submission)
          }
          className="rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-black text-white hover:bg-emerald-800"
        >
          {isGraded
            ? "Edit Grade"
            : "Grade"}
        </button>

      </td>

    </tr>
  );
}

// ============================================================
// MOBILE SUBMISSION
// ============================================================

function MobileSubmission({
  submission,
  onGrade,
}) {
  const student =
    submission.student;

  const isGraded =
    String(
      submission.status || ""
    ).toLowerCase() ===
    "graded";

  return (
    <div className="p-4">

      <div className="flex items-start justify-between gap-3">

        <div className="flex min-w-0 items-center gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm font-black text-emerald-700">
            {(student?.name || "S")
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="min-w-0">

            <p className="truncate text-sm font-bold text-slate-900">
              {student?.name ||
                "Unknown Student"}
            </p>

            <p className="text-xs text-slate-400">
              {student?.registerNumber ||
                student?.email ||
                "—"}
            </p>

          </div>

        </div>

        <StatusBadge
          graded={isGraded}
        />

      </div>

      <div className="mt-3 flex items-center justify-between">

        <div>
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
            Submitted
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-600">
            {formatDate(
              submission.submittedAt
            )}
          </p>
        </div>

        <button
          onClick={() =>
            onGrade(submission)
          }
          className="rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-black text-white"
        >
          {isGraded
            ? "Edit Grade"
            : "Grade"}
        </button>

      </div>

    </div>
  );
}

// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({
  graded,
}) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
        graded
          ? "bg-emerald-50 text-emerald-700"
          : "bg-amber-50 text-amber-700"
      }`}
    >
      {graded
        ? "Graded"
        : "Submitted"}
    </span>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  label,
  value,
  icon: Icon,
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
// INFO ITEM
// ============================================================

function InfoItem({
  label,
  value,
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">

      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-800">
        {value}
      </p>

    </div>
  );
}

// ============================================================
// CLOCK ICON
// ============================================================

function ClockIcon(props) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />
      <polyline points="12 7 12 12 15 14" />
    </svg>
  );
}

// ============================================================
// DATE
// ============================================================

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}