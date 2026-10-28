import React, { useEffect, useMemo, useState } from "react";
import {
  BrainCircuit,
  Clock3,
  CheckCircle2,
  Search,
  Loader2,
  ArrowUpRight
} from "lucide-react";

import GenericPage from "./GenericPage";
import { apiGet } from "../api";

export default function StudentQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuizzes();
  }, []);

  async function loadQuizzes() {
    try {
      setLoading(true);

      const [quizResponse, attemptResponse] =
        await Promise.all([
          apiGet("/quizzes"),
          apiGet("/quizzes/my-attempts")
        ]);

      setQuizzes(quizResponse?.quizzes || []);
      setAttempts(attemptResponse?.attempts || []);
    } catch (error) {
      console.error("Quiz loading error:", error);
    } finally {
      setLoading(false);
    }
  }

  const completedQuizIds = useMemo(() => {
    return new Set(
      attempts
        .map((attempt) =>
          String(
            attempt.quiz?._id ||
              attempt.quiz
          )
        )
        .filter(Boolean)
    );
  }, [attempts]);

  const filtered = quizzes.filter((quiz) => {
    const keyword = search.toLowerCase();

    return (
      !keyword ||
      quiz.title?.toLowerCase().includes(keyword) ||
      quiz.course?.code?.toLowerCase().includes(keyword)
    );
  });

  const average =
    attempts.length > 0
      ? attempts.reduce(
          (sum, attempt) =>
            sum + Number(attempt.percentage || 0),
          0
        ) / attempts.length
      : 0;

  return (
    <GenericPage
      title="Quizzes & Tests"
      description="Take published quizzes and review your completed attempts."
    >
      <div className="space-y-5">

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat
            label="Available"
            value={quizzes.length}
            icon={BrainCircuit}
          />

          <Stat
            label="Completed"
            value={attempts.length}
            icon={CheckCircle2}
          />

          <Stat
            label="Average Score"
            value={`${average.toFixed(1)}%`}
            icon={Clock3}
          />
        </div>

        <div className="relative rounded-2xl border border-slate-200 bg-white p-4">
          <Search
            size={16}
            className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quizzes..."
            className="w-full rounded-xl bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none"
          />
        </div>

        {loading ? (
          <div className="flex justify-center rounded-2xl border bg-white py-16">
            <Loader2
              size={18}
              className="animate-spin"
            />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((quiz) => {
              const completed = completedQuizIds.has(
                String(quiz._id)
              );

              return (
                <div
                  key={quiz._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex justify-between">
                    <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                      <BrainCircuit size={20} />
                    </div>

                    {completed && (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-700">
                        COMPLETED
                      </span>
                    )}
                  </div>

                  <p className="mt-4 text-xs font-black text-emerald-700">
                    {quiz.course?.code}
                  </p>

                  <h3 className="mt-1 text-lg font-black">
                    {quiz.title}
                  </h3>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Info
                      label="Duration"
                      value={`${quiz.duration || 0} min`}
                    />

                    <Info
                      label="Questions"
                      value={quiz.questions?.length || 0}
                    />
                  </div>

                  {!completed && (
                    <button
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 text-sm font-bold text-white hover:bg-emerald-800"
                    >
                      Start Quiz
                      <ArrowUpRight size={15} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </GenericPage>
  );
}

function Stat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
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

function Info({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold">
        {value}
      </p>
    </div>
  );
}