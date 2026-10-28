import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  CalendarCheck,
  GraduationCap,
  BookOpen,
  Clock3,
  ArrowUpRight,
  Sparkles,
  ClipboardCheck,
  Bell,
  BrainCircuit,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Bot,
  Send,
  User,
  Lightbulb,
  Code2,
  BookMarked,
  X,
} from "lucide-react";

import Layout from "../components/Layout";
import { apiGet, apiPost } from "../api";
import { useAuth } from "../context/AuthContext";

export default function StudentDashboard() {
  const { user } = useAuth();

  /* =========================================================
     DASHBOARD STATE
  ========================================================= */

  const [stats, setStats] = useState({
    attendance: 0,
    cgpa: 0,
    courses: 0,
    pending: 0,
    quiz: 0,
    risk: "Low",
  });

  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =========================================================
     AI STATE
  ========================================================= */

  const [aiMessage, setAiMessage] = useState("");
  const [aiMessages, setAiMessages] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  /* =========================================================
     LOAD DASHBOARD
  ========================================================= */

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);

        const [
          analyticsResponse,
          assignmentResponse,
          quizResponse,
        ] = await Promise.all([
          apiGet("/analytics/student"),
          apiGet("/assignments/student"),
          apiGet("/quizzes"),
        ]);

        const analytics =
          analyticsResponse?.analytics || {};

        const assignmentList =
          Array.isArray(assignmentResponse?.assignments)
            ? assignmentResponse.assignments
            : [];

        const quizList =
          Array.isArray(quizResponse?.quizzes)
            ? quizResponse.quizzes
            : [];

        setAssignments(assignmentList);
        setQuizzes(quizList);

        const pendingAssignments =
          assignmentList.filter((assignment) => {
            const submission = assignment.submission;

            return (
              !submission ||
              !["submitted", "graded"].includes(
                String(
                  submission.status || ""
                ).toLowerCase()
              )
            );
          });

        setStats({
          attendance: Number(
            analytics?.attendance
              ?.attendancePercentage || 0
          ),

          cgpa: Number(
            analytics?.academics?.gpa || 0
          ),

          courses: Array.isArray(
            analytics?.courses
          )
            ? analytics.courses.length
            : 0,

          pending: pendingAssignments.length,

          quiz: Number(
            analytics?.academics
              ?.quizAverage || 0
          ),

          risk:
            analytics?.riskLevel || "Low",
        });
      } catch (error) {
        console.error(
          "Student dashboard loading error:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  /* =========================================================
     AI ASSISTANT
  ========================================================= */

  async function askAI(question = aiMessage) {
    const trimmedQuestion =
      String(question || "").trim();

    if (!trimmedQuestion || aiLoading) {
      return;
    }

    const studentMessage = {
      role: "user",
      content: trimmedQuestion,
    };

    const updatedMessages = [
      ...aiMessages,
      studentMessage,
    ];

    try {
      setAiLoading(true);
      setAiError("");

      setAiMessages(updatedMessages);
      setAiMessage("");

      const response = await apiPost(
        "/ai/study",
        {
          message: trimmedQuestion,
          conversation: updatedMessages,
        }
      );

      const aiText =
        response?.response ||
        response?.answer ||
        response?.message ||
        "No response was returned by the AI assistant.";

      setAiMessages((previousMessages) => [
        ...previousMessages,
        {
          role: "assistant",
          content: aiText,
        },
      ]);
    } catch (error) {
      console.error(
        "Student AI assistant error:",
        error
      );

      setAiError(
        error?.response?.data?.message ||
          "AI assistant is currently unavailable. Please make sure Ollama is running."
      );
    } finally {
      setAiLoading(false);
    }
  }

  function handleAISubmit(event) {
    event.preventDefault();
    askAI();
  }

  function usePrompt(prompt) {
    askAI(prompt);
  }

  function clearAI() {
    setAiMessage("");
    setAiMessages([]);
    setAiError("");
  }

  /* =========================================================
     STUDENT INFORMATION
  ========================================================= */

  const studentName =
    user?.name ||
    user?.fullName ||
    "Student";

  const firstName =
    studentName.split(" ")[0];

  const department =
    user?.department?.name ||
    user?.department?.code ||
    user?.department ||
    "Computer Science & Engineering";

  const semester = user?.semester
    ? `Semester ${user.semester}`
    : "Student Portal";

  const registerNumber =
    user?.registerNumber ||
    user?.registerNo ||
    "Academic Account";

  /* =========================================================
     UPCOMING ASSIGNMENTS
  ========================================================= */

  const upcomingAssignments = useMemo(() => {
    return [...assignments]
      .filter((assignment) => {
        const submission =
          assignment.submission;

        return (
          !submission ||
          !["submitted", "graded"].includes(
            String(
              submission.status || ""
            ).toLowerCase()
          )
        );
      })
      .sort(
        (a, b) =>
          new Date(a.dueDate || 0) -
          new Date(b.dueDate || 0)
      )
      .slice(0, 3);
  }, [assignments]);

  /* =========================================================
     UPCOMING QUIZZES
  ========================================================= */

  const upcomingQuizzes = useMemo(() => {
    return quizzes
      .filter(
        (quiz) =>
          quiz.published !== false
      )
      .slice(0, 3);
  }, [quizzes]);

  /* =========================================================
     DATE HELPERS
  ========================================================= */

  function formatDate(date) {
    if (!date) return "No due date";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "No due date";
    }

    return parsed.toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  function getAssignmentMeta(assignment) {
    const dueDate = assignment?.dueDate
      ? new Date(assignment.dueDate)
      : null;

    if (
      !dueDate ||
      Number.isNaN(dueDate.getTime())
    ) {
      return "No due date";
    }

    const now = new Date();

    const diff =
      dueDate.getTime() -
      now.getTime();

    const days = Math.ceil(
      diff /
        (1000 * 60 * 60 * 24)
    );

    if (days < 0) {
      return `Overdue • ${formatDate(
        assignment.dueDate
      )}`;
    }

    if (days === 0) {
      return "Due today";
    }

    if (days === 1) {
      return "Due tomorrow";
    }

    return `Due ${formatDate(
      assignment.dueDate
    )}`;
  }

  /* =========================================================
     RISK STYLE
  ========================================================= */

  function getRiskStyle(risk) {
    const value = String(
      risk || ""
    ).toLowerCase();

    if (value === "high") {
      return "bg-red-50 text-red-700 border-red-100";
    }

    if (value === "moderate") {
      return "bg-amber-50 text-amber-700 border-amber-100";
    }

    return "bg-emerald-50 text-emerald-700 border-emerald-100";
  }

  /* =========================================================
     QUICK AI PROMPTS
  ========================================================= */

  const quickPrompts = [
    {
      label: "Explain a concept",
      icon: Lightbulb,
      prompt:
        "Explain a difficult computer science concept to me in simple terms with an example.",
    },
    {
      label: "Solve my doubt",
      icon: BookMarked,
      prompt:
        "Help me understand my academic doubt step by step. Do not directly give me the answer unless necessary.",
    },
    {
      label: "Explain my code",
      icon: Code2,
      prompt:
        "I have a programming doubt. Help me understand the logic and explain the code step by step.",
    },
    {
      label: "Exam preparation",
      icon: GraduationCap,
      prompt:
        "Help me prepare for an upcoming technical exam. Give me important concepts and a short revision plan.",
    },
  ];

  return (
    <Layout>
      <div className="space-y-6 pb-8">

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-green-50 p-6 sm:p-8">
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">

            <div>
              <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800">
                Student Portal
              </span>

              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Good morning{" "}
                <span className="text-emerald-700">
                  {firstName}
                </span>{" "}
                👋
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Your academic snapshot,
                upcoming work and important
                updates — all in one place.
              </p>

              <p className="mt-3 text-xs font-semibold text-slate-500">
                {semester} • {department} •{" "}
                {registerNumber}
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white/80 px-4 py-3 shadow-sm">
              <Sparkles
                size={18}
                className="text-emerald-700"
              />

              <div>
                <p className="text-xs font-black text-slate-800">
                  AcadX AI
                </p>

                <p className="text-[11px] text-slate-500">
                  Ask your academic doubts below
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* =====================================================
            ACADEMIC OVERVIEW
        ===================================================== */}

        <section>
          <div className="mb-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
              Your snapshot
            </p>

            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-extrabold text-slate-900">
                Academic overview
              </h2>

              <span
                className={`rounded-full border px-3 py-1 text-[11px] font-bold ${getRiskStyle(
                  stats.risk
                )}`}
              >
                Academic Risk:{" "}
                {stats.risk}
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              [
                "Attendance",
                `${Number(
                  stats.attendance
                ).toFixed(1)}%`,
                "Current attendance",
                CalendarCheck,
                "text-emerald-700 bg-emerald-50",
              ],
              [
                "CGPA",
                `${Number(
                  stats.cgpa
                ).toFixed(2)} / 10`,
                "Cumulative GPA",
                GraduationCap,
                "text-blue-700 bg-blue-50",
              ],
              [
                "Courses",
                stats.courses,
                "Currently enrolled",
                BookOpen,
                "text-violet-700 bg-violet-50",
              ],
              [
                "Pending",
                stats.pending,
                "Tasks requiring attention",
                Clock3,
                "text-amber-700 bg-amber-50",
              ],
            ].map(
              ([
                label,
                value,
                sub,
                Icon,
                tone,
              ]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        {label}
                      </p>

                      <p className="mt-3 text-3xl font-black text-slate-900">
                        {loading
                          ? "—"
                          : value}
                      </p>
                    </div>

                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}
                    >
                      <Icon size={19} />
                    </div>
                  </div>

                  <p className="mt-4 text-xs font-semibold text-slate-500">
                    {sub}
                  </p>
                </div>
              )
            )}
          </div>
        </section>

        {/* =====================================================
            AI STUDY ASSISTANT
        ===================================================== */}

        <section className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-sm">

          {/* AI HEADER */}

          <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-green-50 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm">
                  <Bot size={22} />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900">
                      AI Study Assistant
                    </h2>

                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">
                      Ollama AI
                    </span>
                  </div>

                  <p className="mt-1 text-xs leading-5 text-slate-600 sm:text-sm">
                    Clear your academic doubts,
                    understand concepts and get
                    guided help with programming.
                  </p>
                </div>
              </div>

              {(aiMessages.length > 0 ||
                aiError) && (
                <button
                  type="button"
                  onClick={clearAI}
                  className="inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  <X size={14} />
                  Clear
                </button>
              )}

            </div>
          </div>

          <div className="p-5 sm:p-6">

            {/* =================================================
                QUICK PROMPTS
            ================================================= */}

            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                What do you need help with?
              </p>

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {quickPrompts.map(
                  ({
                    label,
                    icon: Icon,
                    prompt,
                  }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() =>
                        usePrompt(prompt)
                      }
                      disabled={aiLoading}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm">
                        <Icon size={16} />
                      </div>

                      <span className="text-xs font-bold text-slate-700">
                        {label}
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* =================================================
                CHAT
            ================================================= */}

            <div className="mt-5 space-y-3">

              {aiMessages.length === 0 &&
                !aiLoading &&
                !aiError && (
                  <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/30 p-6 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <Bot size={22} />
                    </div>

                    <h3 className="mt-3 text-sm font-bold text-slate-800">
                      How can I help you?
                    </h3>

                    <p className="mx-auto mt-1 max-w-lg text-xs leading-5 text-slate-500">
                      Ask me about programming,
                      DSA, academics, exams,
                      assignments or any concept
                      you want to understand.
                    </p>
                  </div>
                )}

              {aiMessages.map(
                (message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex ${
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[92%] rounded-2xl px-4 py-3 sm:max-w-[80%] ${
                        message.role === "user"
                          ? "rounded-br-md bg-emerald-700 text-white"
                          : "rounded-bl-md border border-emerald-100 bg-emerald-50/60 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {message.role ===
                        "assistant" ? (
                          <>
                            <Bot
                              size={15}
                              className="shrink-0 text-emerald-700"
                            />

                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                              AcadX AI
                            </span>
                          </>
                        ) : (
                          <>
                            <User
                              size={15}
                              className="shrink-0 text-white/80"
                            />

                            <span className="text-[10px] font-black uppercase tracking-wider text-white/80">
                              You
                            </span>
                          </>
                        )}
                      </div>

                      <div className="mt-2 whitespace-pre-wrap text-sm leading-7">
                        {message.content}
                      </div>
                    </div>
                  </div>
                )
              )}

              {aiLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-3 rounded-2xl rounded-bl-md border border-emerald-100 bg-emerald-50/60 px-4 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-white">
                      <Bot size={15} />
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        AcadX AI is thinking...
                      </p>

                      <p className="text-[11px] text-slate-500">
                        Preparing your explanation
                      </p>
                    </div>

                    <Loader2
                      size={16}
                      className="animate-spin text-emerald-700"
                    />
                  </div>
                </div>
              )}

              {aiError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-bold text-red-800">
                    AI Assistant Error
                  </p>

                  <p className="mt-1 text-xs leading-5 text-red-700">
                    {aiError}
                  </p>
                </div>
              )}

            </div>

            {/* =================================================
                INPUT
            ================================================= */}

            <form
              onSubmit={handleAISubmit}
              className="mt-5"
            >
              <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 sm:flex-row">

                <div className="flex flex-1 items-center gap-2 px-2">
                  <User
                    size={17}
                    className="shrink-0 text-slate-400"
                  />

                  <input
                    type="text"
                    value={aiMessage}
                    onChange={(event) =>
                      setAiMessage(
                        event.target.value
                      )
                    }
                    placeholder="Ask your academic doubt..."
                    disabled={aiLoading}
                    className="w-full bg-transparent px-1 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={
                    !aiMessage.trim() ||
                    aiLoading
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {aiLoading ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      Thinking
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Ask AI
                    </>
                  )}
                </button>

              </div>

              <p className="mt-2 text-[11px] text-slate-400">
                Tip: Ask specific questions for
                better explanations. For example:
                "Explain binary search with a Java
                example."
              </p>
            </form>

          </div>
        </section>

        {/* =====================================================
            ATTENTION + ANNOUNCEMENTS
        ===================================================== */}

        <section className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">

          {/* =================================================
              UPCOMING ACADEMIC WORK
          ================================================= */}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-3">

                <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
                  <ClipboardCheck size={18} />
                </div>

                <div>
                  <h2 className="text-sm font-extrabold">
                    Your attention
                  </h2>

                  <p className="text-xs text-slate-500">
                    Upcoming academic activities
                  </p>
                </div>

              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-slate-500">
                <Loader2
                  size={17}
                  className="animate-spin"
                />

                Loading academic activities...
              </div>
            ) : (
              <>
                {/* ASSIGNMENTS */}

                {upcomingAssignments.map(
                  (assignment) => (
                    <Link
                      key={`assignment-${assignment._id}`}
                      to="/student-assignments"
                      className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 transition hover:bg-slate-50"
                    >
                      <div className="rounded-xl bg-slate-50 p-2.5 text-slate-600">
                        <ClipboardCheck size={18} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                          Assignment
                        </p>

                        <p className="truncate text-sm font-bold text-slate-900">
                          {assignment.title}
                        </p>

                        <p className="text-xs text-slate-500">
                          {assignment.course?.code ||
                            "Course"}
                          {" • "}
                          {getAssignmentMeta(
                            assignment
                          )}
                        </p>
                      </div>

                      <ArrowUpRight
                        size={15}
                        className="text-slate-300"
                      />
                    </Link>
                  )
                )}

                {/* QUIZZES */}

                {upcomingQuizzes
                  .slice(
                    0,
                    Math.max(
                      0,
                      3 -
                        upcomingAssignments.length
                    )
                  )
                  .map((quiz) => (
                    <Link
                      key={`quiz-${quiz._id}`}
                      to="/student-quizzes"
                      className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 transition hover:bg-slate-50"
                    >
                      <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                        <BrainCircuit size={18} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-wider text-blue-700">
                          Quiz & Test
                        </p>

                        <p className="truncate text-sm font-bold text-slate-900">
                          {quiz.title}
                        </p>

                        <p className="text-xs text-slate-500">
                          {quiz.course?.code ||
                            "Course"}
                          {" • Published"}
                        </p>
                      </div>

                      <ArrowUpRight
                        size={15}
                        className="text-slate-300"
                      />
                    </Link>
                  ))}

                {/* EMPTY STATE */}

                {upcomingAssignments.length ===
                  0 &&
                  upcomingQuizzes.length ===
                    0 && (
                    <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
                      <CheckCircle2
                        size={28}
                        className="text-emerald-600"
                      />

                      <p className="mt-3 text-sm font-bold text-slate-800">
                        You're all caught up!
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        No pending assignments
                        or upcoming quizzes.
                      </p>
                    </div>
                  )}
              </>
            )}

          </div>

          {/* =================================================
              ANNOUNCEMENTS
          ================================================= */}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-sm font-extrabold">
                  Announcements
                </h2>

                <p className="text-xs text-slate-500">
                  Latest campus updates
                </p>
              </div>

              <Bell
                size={18}
                className="text-blue-600"
              />
            </div>

            <Link
              to="/announcements"
              className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 transition hover:bg-slate-50"
            >
              <Bell
                size={16}
                className="text-slate-400"
              />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800">
                  View latest announcements
                </p>

                <p className="text-[11px] text-slate-400">
                  Academic and campus updates
                </p>
              </div>

              <ArrowUpRight
                size={15}
                className="text-slate-300"
              />
            </Link>

            <Link
              to="/announcements"
              className="flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50"
            >
              <AlertCircle
                size={16}
                className="text-amber-500"
              />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800">
                  Check important notices
                </p>

                <p className="text-[11px] text-slate-400">
                  Deadlines, examinations and events
                </p>
              </div>

              <ArrowUpRight
                size={15}
                className="text-slate-300"
              />
            </Link>

          </div>

        </section>

        {/* =====================================================
            QUICK ACCESS
        ===================================================== */}

        <section>
          <div className="mb-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
              Quick access
            </p>

            <h2 className="mt-1 text-lg font-extrabold text-slate-900">
              Student services
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

            {[
              [
                "My Courses",
                "/student-courses",
                "Courses and materials",
                BookOpen,
              ],
              [
                "My Attendance",
                "/attendance",
                "Course-wise attendance",
                CalendarCheck,
              ],
              [
                "Assignments",
                "/student-assignments",
                "View and submit work",
                ClipboardCheck,
              ],
              [
                "Results & Records",
                "/student-results",
                "View your academic results",
                GraduationCap,
              ],
            ].map(
              ([
                title,
                path,
                sub,
                Icon,
              ]) => (
                <Link
                  to={path}
                  key={title}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                >
                  <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                    <Icon size={18} />
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">
                      {title}
                    </p>

                    <p className="text-xs text-slate-500">
                      {sub}
                    </p>
                  </div>

                  <ArrowUpRight
                    size={16}
                    className="text-slate-300"
                  />
                </Link>
              )
            )}

          </div>
        </section>

      </div>
    </Layout>
  );
}