import React, { useEffect, useMemo, useState } from "react";
import {
  ClipboardCheck,
  Search,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  X
} from "lucide-react";

import GenericPage from "./GenericPage";
import { apiGet, apiPost } from "../api";

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selected, setSelected] = useState(null);
  const [submissionText, setSubmissionText] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadAssignments();
  }, []);

  async function loadAssignments() {
    try {
      setLoading(true);

      const response = await apiGet(
        "/assignments/student"
      );

      setAssignments(response?.assignments || []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load assignments."
      );
    } finally {
      setLoading(false);
    }
  }

  function getStatus(assignment) {
    const status = String(
      assignment.submission?.status || ""
    ).toLowerCase();

    if (status === "graded") return "graded";
    if (status === "submitted") return "submitted";

    if (
      assignment.dueDate &&
      new Date(assignment.dueDate) < new Date()
    ) {
      return "overdue";
    }

    return "pending";
  }

  const filtered = useMemo(() => {
    return assignments.filter((assignment) => {
      const keyword = search.toLowerCase();

      const matchesSearch =
        !keyword ||
        assignment.title
          ?.toLowerCase()
          .includes(keyword) ||
        assignment.course?.code
          ?.toLowerCase()
          .includes(keyword);

      const matchesStatus =
        statusFilter === "all" ||
        getStatus(assignment) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [assignments, search, statusFilter]);

  async function submitAssignment(e) {
    e.preventDefault();

    if (!selected) return;

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const response = await apiPost(
        `/assignments/${selected._id}/submit`,
        {
          text: submissionText,
          fileUrl
        }
      );

      setAssignments((previous) =>
        previous.map((assignment) =>
          assignment._id === selected._id
            ? {
                ...assignment,
                submission: response.submission
              }
            : assignment
        )
      );

      setSelected(null);
      setSubmissionText("");
      setFileUrl("");

      setSuccess("Assignment submitted successfully.");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to submit assignment."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const pending = assignments.filter(
    (a) => getStatus(a) === "pending"
  ).length;

  const submitted = assignments.filter(
    (a) => getStatus(a) === "submitted"
  ).length;

  const graded = assignments.filter(
    (a) => getStatus(a) === "graded"
  ).length;

  return (
    <GenericPage
      title="Assignments"
      description="View, submit and track your academic assignments."
    >
      <div className="space-y-5">

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label="Total"
            value={assignments.length}
            icon={ClipboardCheck}
          />

          <Stat
            label="Pending"
            value={pending}
            icon={Clock}
          />

          <Stat
            label="Submitted"
            value={submitted}
            icon={Send}
          />

          <Stat
            label="Graded"
            value={graded}
            icon={CheckCircle2}
          />
        </div>

        {success && (
          <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            {success}
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assignments..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="graded">Graded</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center rounded-2xl border bg-white py-16">
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((assignment) => {
              const status = getStatus(assignment);

              return (
                <div
                  key={assignment._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-emerald-700">
                        {assignment.course?.code}
                      </p>

                      <h3 className="mt-1 font-black text-slate-900">
                        {assignment.title}
                      </h3>
                    </div>

                    <Status status={status} />
                  </div>

                  <p className="mt-3 text-sm text-slate-500">
                    {assignment.description ||
                      "No description provided."}
                  </p>

                  <div className="mt-4 flex justify-between text-xs text-slate-500">
                    <span>
                      Due:{" "}
                      {assignment.dueDate
                        ? new Date(
                            assignment.dueDate
                          ).toLocaleDateString("en-IN")
                        : "—"}
                    </span>

                    <span>
                      Marks:{" "}
                      {assignment.totalMarks ||
                        assignment.maxMarks ||
                        "—"}
                    </span>
                  </div>

                  {assignment.submission?.marks !==
                    undefined && (
                    <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">
                      Marks: {assignment.submission.marks}
                    </div>
                  )}

                  {status === "pending" && (
                    <button
                      onClick={() => setSelected(assignment)}
                      className="mt-4 w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-bold text-white hover:bg-emerald-800"
                    >
                      Submit Assignment
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={submitAssignment}
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-xs font-black text-emerald-700">
                  {selected.course?.code}
                </p>
                <h2 className="text-xl font-black">
                  {selected.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
              >
                <X />
              </button>
            </div>

            <label className="mt-5 block text-sm font-bold">
              Submission
            </label>

            <textarea
              value={submissionText}
              onChange={(e) =>
                setSubmissionText(e.target.value)
              }
              placeholder="Enter your submission..."
              rows={6}
              className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-emerald-400"
            />

            <label className="mt-4 block text-sm font-bold">
              File URL
            </label>

            <input
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="Optional file URL"
              className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm"
            />

            <button
              disabled={submitting}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {submitting && (
                <Loader2 size={16} className="animate-spin" />
              )}
              Submit
            </button>
          </form>
        </div>
      )}
    </GenericPage>
  );
}

function Stat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <Icon size={20} className="text-emerald-700" />
      <p className="mt-3 text-xs font-bold uppercase text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-3xl font-black">
        {value}
      </p>
    </div>
  );
}

function Status({ status }) {
  const styles = {
    pending: "bg-amber-50 text-amber-700",
    submitted: "bg-blue-50 text-blue-700",
    graded: "bg-emerald-50 text-emerald-700",
    overdue: "bg-red-50 text-red-700"
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${styles[status]}`}
    >
      {status}
    </span>
  );
}