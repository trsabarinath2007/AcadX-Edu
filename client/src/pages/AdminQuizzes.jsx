import React, {
  useEffect,
  useMemo,
  useState
} from "react";

import GenericPage from "./GenericPage";
import { apiGet } from "../api";

function StatCard({
  label,
  value,
  description
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-slate-900">
        {value}
      </p>

      {description && (
        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}

export default function AdminQuizzes() {
  const [quizzes, setQuizzes] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  async function loadQuizzes() {
    try {
      setLoading(true);
      setError("");

      const response =
        await apiGet("/quizzes");

      setQuizzes(
        response?.quizzes || []
      );
    } catch (err) {
      console.error(
        "Admin quizzes error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load quizzes"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuizzes();
  }, []);

  const filteredQuizzes =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return quizzes;
      }

      return quizzes.filter(
        (quiz) => {
          const title =
            quiz.title || "";

          const courseCode =
            quiz.course?.code || "";

          const courseName =
            quiz.course?.name || "";

          const creator =
            quiz.createdBy?.name || "";

          return (
            title
              .toLowerCase()
              .includes(query) ||
            courseCode
              .toLowerCase()
              .includes(query) ||
            courseName
              .toLowerCase()
              .includes(query) ||
            creator
              .toLowerCase()
              .includes(query)
          );
        }
      );
    }, [quizzes, search]);

  const totalQuizzes =
    quizzes.length;

  const publishedQuizzes =
    quizzes.filter(
      (quiz) => quiz.published
    ).length;

  const totalCourses =
    new Set(
      quizzes
        .map(
          (quiz) =>
            quiz.course?._id
        )
        .filter(Boolean)
    ).size;

  const totalQuestions =
    quizzes.reduce(
      (sum, quiz) =>
        sum +
        Number(
          quiz.questionCount || 0
        ),
      0
    );

  return (
    <GenericPage
      title="Quiz Management"
      description="Monitor faculty-created quizzes across the institution. Admin access is read-only."
    >
      <div className="space-y-5">
        {/* SECURITY NOTICE */}

        <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-emerald-900">
              Admin Monitoring Mode
            </p>

            <p className="mt-1 text-xs text-emerald-700">
              Admin can see quiz marks, course,
              publication status and the faculty
              who created each quiz. Questions and
              correct answers are hidden.
            </p>
          </div>

          <div className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-emerald-700 shadow-sm">
            VIEW ONLY
          </div>
        </div>

        {/* STATS */}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Quizzes"
            value={totalQuizzes}
            description="Faculty-created quizzes"
          />

          <StatCard
            label="Published"
            value={publishedQuizzes}
            description="Available to students"
          />

          <StatCard
            label="Courses"
            value={totalCourses}
            description="Courses with quizzes"
          />

          <StatCard
            label="Questions"
            value={totalQuestions}
            description="Across all quizzes"
          />
        </div>

        {/* MAIN CARD */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Faculty Quizzes
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Admin monitors quizzes without
                accessing their questions or
                modifying them.
              </p>
            </div>

            <div className="flex gap-2">
              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search quiz, course or faculty..."
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-500 md:w-80"
              />

              <button
                type="button"
                onClick={loadQuizzes}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <p className="text-sm font-semibold text-slate-500">
                Loading quizzes...
              </p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="font-bold text-red-600">
                {error}
              </p>

              <button
                type="button"
                onClick={loadQuizzes}
                className="mt-4 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white"
              >
                Try Again
              </button>
            </div>
          ) : filteredQuizzes.length ===
            0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl">
                🧠
              </div>

              <p className="mt-4 font-bold text-slate-700">
                No quizzes found
              </p>

              <p className="mt-1 text-xs text-slate-500">
                No faculty-created quizzes match
                your search.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1000px] w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Quiz
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Course
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Questions
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Marks
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Status
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Created By
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredQuizzes.map(
                    (quiz) => {
                      return (
                        <tr
                          key={quiz._id}
                          className="transition hover:bg-slate-50/70"
                        >
                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-900">
                              {quiz.title ||
                                "Untitled Quiz"}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {quiz.duration
                                ? `${quiz.duration} minutes`
                                : "Duration not specified"}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-slate-800">
                              {quiz.course
                                ?.code ||
                                "—"}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              {quiz.course
                                ?.name ||
                                ""}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                              {quiz.questionCount ??
                                0}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                              {quiz.totalMarks ??
                                quiz.marks ??
                                "—"}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            {quiz.published ? (
                              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                                Published
                              </span>
                            ) : (
                              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                                Draft
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-slate-800">
                              {quiz.createdBy
                                ?.name ||
                                "Unknown Faculty"}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              {quiz.createdBy
                                ?.email ||
                                ""}
                            </p>
                          </td>
                        </tr>
                      );
                    }
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