import React, { useEffect, useMemo, useState } from "react";
import {
  Brain,
  Check,
  ChevronDown,
  Clock,
  FileQuestion,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import GenericPage from "./GenericPage";
import { apiGet, apiPost } from "../api";

export default function FacultyQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [showAI, setShowAI] = useState(false);

  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] =
    useState("All");

  // ============================================================
  // CREATE QUIZ FORM
  // ============================================================

  const [form, setForm] = useState({
    title: "",
    course: "",
    topic: "",
    difficulty: "Medium",
    durationMinutes: 20,
    published: true,
  });

  const [questions, setQuestions] = useState([
    {
      question: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      marks: 1,
    },
  ]);

  // ============================================================
  // AI FORM
  // ============================================================

  const [aiForm, setAIForm] = useState({
    subject: "",
    topic: "",
    difficulty: "Medium",
    count: 5,
  });

  const [aiQuestions, setAIQuestions] = useState([]);

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [quizResponse, courseResponse] =
        await Promise.all([
          apiGet("/quizzes"),
          apiGet("/courses"),
        ]);

      setQuizzes(
        quizResponse?.quizzes || []
      );

      setCourses(
        courseResponse?.courses || []
      );
    } catch (err) {
      console.error(
        "Faculty quizzes load error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load quizzes."
      );
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // FILTERED QUIZZES
  // ============================================================

  const filteredQuizzes = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return quizzes.filter((quiz) => {
      const matchesSearch =
        !query ||
        quiz.title
          ?.toLowerCase()
          .includes(query) ||
        quiz.topic
          ?.toLowerCase()
          .includes(query) ||
        quiz.course?.code
          ?.toLowerCase()
          .includes(query) ||
        quiz.course?.name
          ?.toLowerCase()
          .includes(query);

      const matchesDifficulty =
        difficultyFilter === "All" ||
        quiz.difficulty === difficultyFilter;

      return (
        matchesSearch &&
        matchesDifficulty
      );
    });
  }, [
    quizzes,
    search,
    difficultyFilter,
  ]);

  // ============================================================
  // STATISTICS
  // ============================================================

  const totalQuizzes = quizzes.length;

  const publishedQuizzes =
    quizzes.filter(
      (quiz) => quiz.published !== false
    ).length;

  const draftQuizzes =
    quizzes.filter(
      (quiz) => quiz.published === false
    ).length;

  const totalQuestions = quizzes.reduce(
    (sum, quiz) =>
      sum +
      (Array.isArray(quiz.questions)
        ? quiz.questions.length
        : Number(
            quiz.questionCount || 0
          )),
    0
  );

  // ============================================================
  // FORM HELPERS
  // ============================================================

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateQuestion(
    questionIndex,
    field,
    value
  ) {
    setQuestions((current) =>
      current.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              [field]: value,
            }
          : question
      )
    );
  }

  function updateOption(
    questionIndex,
    optionIndex,
    value
  ) {
    setQuestions((current) =>
      current.map((question, index) => {
        if (index !== questionIndex) {
          return question;
        }

        const nextOptions = [
          ...question.options,
        ];

        nextOptions[optionIndex] = value;

        return {
          ...question,
          options: nextOptions,
        };
      })
    );
  }

  function addQuestion() {
    setQuestions((current) => [
      ...current,
      {
        question: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        marks: 1,
      },
    ]);
  }

  function removeQuestion(index) {
    if (questions.length === 1) {
      return;
    }

    setQuestions((current) =>
      current.filter(
        (_, questionIndex) =>
          questionIndex !== index
      )
    );
  }

  // ============================================================
  // CREATE QUIZ
  // ============================================================

  async function createQuiz() {
    if (!form.title.trim()) {
      setError("Quiz title is required.");
      return;
    }

    if (!form.course) {
      setError("Please select a course.");
      return;
    }

    if (!form.topic.trim()) {
      setError("Quiz topic is required.");
      return;
    }

    if (!questions.length) {
      setError(
        "Add at least one question."
      );
      return;
    }

    for (
      let i = 0;
      i < questions.length;
      i++
    ) {
      const question = questions[i];

      if (!question.question.trim()) {
        setError(
          `Question ${i + 1} is empty.`
        );
        return;
      }

      if (
        question.options.some(
          (option) =>
            !option.trim()
        )
      ) {
        setError(
          `Please fill all options for Question ${
            i + 1
          }.`
        );
        return;
      }

      if (!question.correctAnswer) {
        setError(
          `Select the correct answer for Question ${
            i + 1
          }.`
        );
        return;
      }
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await apiPost(
        "/quizzes",
        {
          title: form.title.trim(),
          course: form.course,
          topic: form.topic.trim(),
          difficulty: form.difficulty,
          durationMinutes:
            Number(form.durationMinutes) ||
            20,
          questions,
          published: form.published,
        }
      );

      const createdQuiz =
        response?.quiz;

      if (createdQuiz) {
        setQuizzes((current) => [
          createdQuiz,
          ...current,
        ]);
      } else {
        await loadData();
      }

      setSuccess(
        "Quiz created successfully."
      );

      resetCreateForm();

      setShowCreate(false);
    } catch (err) {
      console.error(
        "Create quiz error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create quiz."
      );
    } finally {
      setSaving(false);
    }
  }

  function resetCreateForm() {
    setForm({
      title: "",
      course: "",
      topic: "",
      difficulty: "Medium",
      durationMinutes: 20,
      published: true,
    });

    setQuestions([
      {
        question: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        marks: 1,
      },
    ]);
  }

  // ============================================================
  // AI QUIZ GENERATOR
  // ============================================================

  async function generateAIQuestions() {
    if (!aiForm.subject.trim()) {
      setError("AI subject is required.");
      return;
    }

    if (!aiForm.topic.trim()) {
      setError("AI topic is required.");
      return;
    }

    try {
      setGenerating(true);
      setError("");
      setSuccess("");

      const response = await apiPost(
        "/quizzes/generate",
        {
          subject:
            aiForm.subject.trim(),
          topic:
            aiForm.topic.trim(),
          difficulty:
            aiForm.difficulty,
          count: Number(aiForm.count),
        }
      );

      const generated =
        response?.questions || [];

      setAIQuestions(generated);

      if (!generated.length) {
        setError(
          "AI did not generate any questions."
        );
        return;
      }

      setSuccess(
        `${generated.length} questions generated successfully.`
      );
    } catch (err) {
      console.error(
        "AI quiz generation error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to generate AI questions."
      );
    } finally {
      setGenerating(false);
    }
  }

  // ============================================================
  // USE AI QUESTIONS
  // ============================================================

  function useAIQuestions() {
    if (!aiQuestions.length) {
      return;
    }

    setQuestions(
      aiQuestions.map((question) => ({
        question:
          question.question || "",
        options:
          question.options?.length === 4
            ? question.options
            : [
                "",
                "",
                "",
                "",
              ],
        correctAnswer:
          question.correctAnswer || "",
        marks:
          Number(question.marks) || 1,
      }))
    );

    setShowAI(false);
    setShowCreate(true);

    setSuccess(
      "AI questions added to the quiz editor. Review them before creating the quiz."
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <GenericPage
      title="Quizzes"
      description="Create, manage and generate AI-assisted quizzes for your assigned courses."
    >
      <div className="space-y-5">

        {/* ==================================================
            HEADER ACTIONS
        ================================================== */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-sm text-slate-500">
              Manage quizzes for your assigned courses.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">

            <button
              onClick={() => {
                setError("");
                setSuccess("");
                setShowAI(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
            >
              <Sparkles size={17} />
              AI Generate
            </button>

            <button
              onClick={() => {
                setError("");
                setSuccess("");
                setShowCreate(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800"
            >
              <Plus size={17} />
              Create Quiz
            </button>

          </div>

        </div>

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
            STATS
        ================================================== */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            icon={FileQuestion}
            label="Total Quizzes"
            value={totalQuizzes}
          />

          <StatCard
            icon={Check}
            label="Published"
            value={publishedQuizzes}
          />

          <StatCard
            icon={Clock}
            label="Drafts"
            value={draftQuizzes}
          />

          <StatCard
            icon={Brain}
            label="Total Questions"
            value={totalQuestions}
          />

        </div>

        {/* ==================================================
            FILTERS
        ================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4">

          <div className="grid gap-3 md:grid-cols-2">

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search quizzes..."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-600"
            />

            <select
              value={difficultyFilter}
              onChange={(e) =>
                setDifficultyFilter(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-600"
            >
              <option value="All">
                All Difficulties
              </option>
              <option value="Easy">
                Easy
              </option>
              <option value="Medium">
                Medium
              </option>
              <option value="Hard">
                Hard
              </option>
            </select>

          </div>

        </div>

        {/* ==================================================
            QUIZ LIST
        ================================================== */}

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-12">
            <Loader2
              size={28}
              className="animate-spin text-emerald-700"
            />
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <FileQuestion size={25} />
            </div>

            <h3 className="mt-4 font-extrabold text-slate-900">
              No quizzes found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Create your first quiz for an assigned course.
            </p>

          </div>
        ) : (
          <div className="grid gap-4">

            {filteredQuizzes.map(
              (quiz) => (
                <QuizCard
                  key={quiz._id}
                  quiz={quiz}
                />
              )
            )}

          </div>
        )}

      </div>

      {/* ======================================================
          CREATE QUIZ MODAL
      ====================================================== */}

      {showCreate && (
        <Modal
          title="Create Quiz"
          subtitle="Create a quiz for one of your assigned courses."
          onClose={() => {
            if (!saving) {
              setShowCreate(false);
            }
          }}
          wide
        >

          <div className="space-y-5">

            {/* BASIC DETAILS */}

            <div className="grid gap-4 md:grid-cols-2">

              <Field label="Quiz Title">
                <input
                  value={form.title}
                  onChange={(e) =>
                    updateForm(
                      "title",
                      e.target.value
                    )
                  }
                  placeholder="e.g. Data Structures Quiz 2"
                  className={inputClass}
                />
              </Field>

              <Field label="Course">
                <select
                  value={form.course}
                  onChange={(e) =>
                    updateForm(
                      "course",
                      e.target.value
                    )
                  }
                  className={inputClass}
                >
                  <option value="">
                    Select Course
                  </option>

                  {courses.map(
                    (course) => (
                      <option
                        key={course._id}
                        value={course._id}
                      >
                        {course.code} —{" "}
                        {course.name}
                      </option>
                    )
                  )}
                </select>
              </Field>

              <Field label="Topic">
                <input
                  value={form.topic}
                  onChange={(e) =>
                    updateForm(
                      "topic",
                      e.target.value
                    )
                  }
                  placeholder="e.g. Binary Trees"
                  className={inputClass}
                />
              </Field>

              <Field label="Difficulty">
                <select
                  value={form.difficulty}
                  onChange={(e) =>
                    updateForm(
                      "difficulty",
                      e.target.value
                    )
                  }
                  className={inputClass}
                >
                  <option value="Easy">
                    Easy
                  </option>
                  <option value="Medium">
                    Medium
                  </option>
                  <option value="Hard">
                    Hard
                  </option>
                </select>
              </Field>

              <Field label="Duration (minutes)">
                <input
                  type="number"
                  min="1"
                  value={
                    form.durationMinutes
                  }
                  onChange={(e) =>
                    updateForm(
                      "durationMinutes",
                      e.target.value
                    )
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Publish">
                <select
                  value={
                    form.published
                      ? "true"
                      : "false"
                  }
                  onChange={(e) =>
                    updateForm(
                      "published",
                      e.target.value ===
                        "true"
                    )
                  }
                  className={inputClass}
                >
                  <option value="true">
                    Published
                  </option>
                  <option value="false">
                    Draft
                  </option>
                </select>
              </Field>

            </div>

            {/* QUESTIONS */}

            <div className="space-y-4">

              <div className="flex items-center justify-between">

                <div>
                  <h3 className="font-extrabold text-slate-900">
                    Questions
                  </h3>

                  <p className="text-xs text-slate-500">
                    Add MCQ questions with four options.
                  </p>
                </div>

                <button
                  onClick={addQuestion}
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"
                >
                  <Plus size={15} />
                  Add Question
                </button>

              </div>

              {questions.map(
                (
                  question,
                  questionIndex
                ) => (
                  <div
                    key={questionIndex}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >

                    <div className="flex items-start justify-between gap-3">

                      <div>
                        <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                          Question{" "}
                          {questionIndex + 1}
                        </p>
                      </div>

                      {questions.length >
                        1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeQuestion(
                              questionIndex
                            )
                          }
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                        >
                          <Trash2
                            size={16}
                          />
                        </button>
                      )}

                    </div>

                    <div className="mt-3 space-y-3">

                      <textarea
                        value={
                          question.question
                        }
                        onChange={(e) =>
                          updateQuestion(
                            questionIndex,
                            "question",
                            e.target.value
                          )
                        }
                        rows={3}
                        placeholder="Enter question..."
                        className={inputClass}
                      />

                      <div className="grid gap-3 sm:grid-cols-2">

                        {question.options.map(
                          (
                            option,
                            optionIndex
                          ) => {
                            const letter =
                              String.fromCharCode(
                                65 +
                                  optionIndex
                              );

                            return (
                              <input
                                key={
                                  optionIndex
                                }
                                value={
                                  option
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateOption(
                                    questionIndex,
                                    optionIndex,
                                    e.target
                                      .value
                                  )
                                }
                                placeholder={`Option ${letter}`}
                                className={
                                  inputClass
                                }
                              />
                            );
                          }
                        )}

                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">

                        <select
                          value={
                            question.correctAnswer
                          }
                          onChange={(e) =>
                            updateQuestion(
                              questionIndex,
                              "correctAnswer",
                              e.target.value
                            )
                          }
                          className={
                            inputClass
                          }
                        >
                          <option value="">
                            Select Correct Answer
                          </option>

                          {question.options.map(
                            (
                              option,
                              optionIndex
                            ) => (
                              <option
                                key={
                                  optionIndex
                                }
                                value={
                                  option
                                }
                              >
                                {
                                  String.fromCharCode(
                                    65 +
                                      optionIndex
                                  )
                                }{" "}
                                —{" "}
                                {option ||
                                  `Option ${
                                    optionIndex +
                                    1
                                  }`}
                              </option>
                            )
                          )}
                        </select>

                        <input
                          type="number"
                          min="1"
                          value={
                            question.marks
                          }
                          onChange={(e) =>
                            updateQuestion(
                              questionIndex,
                              "marks",
                              Number(
                                e.target
                                  .value
                              ) || 1
                            )
                          }
                          placeholder="Marks"
                          className={
                            inputClass
                          }
                        />

                      </div>

                    </div>

                  </div>
                )
              )}

            </div>

            {/* ACTIONS */}

            <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  setShowCreate(false)
                }
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={createQuiz}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                {saving && (
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                )}

                {saving
                  ? "Creating..."
                  : "Create Quiz"}
              </button>

            </div>

          </div>

        </Modal>
      )}

      {/* ======================================================
          AI MODAL
      ====================================================== */}

      {showAI && (
        <Modal
          title="AI Quiz Generator"
          subtitle="Generate MCQ questions using AcadX AI."
          onClose={() => {
            if (!generating) {
              setShowAI(false);
            }
          }}
          wide
        >

          <div className="space-y-5">

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">

              <div className="flex items-start gap-3">

                <div className="rounded-xl bg-white p-2 text-emerald-700">
                  <Sparkles
                    size={18}
                  />
                </div>

                <div>
                  <p className="text-sm font-black text-emerald-900">
                    AI-assisted quiz creation
                  </p>

                  <p className="mt-1 text-xs text-emerald-700">
                    Generated questions will be shown
                    for review before you create the quiz.
                  </p>
                </div>

              </div>

            </div>

            <div className="grid gap-4 md:grid-cols-2">

              <Field label="Subject">
                <input
                  value={aiForm.subject}
                  onChange={(e) =>
                    setAIForm(
                      (current) => ({
                        ...current,
                        subject:
                          e.target.value,
                      })
                    )
                  }
                  placeholder="e.g. Data Structures"
                  className={inputClass}
                />
              </Field>

              <Field label="Topic">
                <input
                  value={aiForm.topic}
                  onChange={(e) =>
                    setAIForm(
                      (current) => ({
                        ...current,
                        topic:
                          e.target.value,
                      })
                    )
                  }
                  placeholder="e.g. Binary Trees"
                  className={inputClass}
                />
              </Field>

              <Field label="Difficulty">
                <select
                  value={
                    aiForm.difficulty
                  }
                  onChange={(e) =>
                    setAIForm(
                      (current) => ({
                        ...current,
                        difficulty:
                          e.target.value,
                      })
                    )
                  }
                  className={inputClass}
                >
                  <option value="Easy">
                    Easy
                  </option>
                  <option value="Medium">
                    Medium
                  </option>
                  <option value="Hard">
                    Hard
                  </option>
                </select>
              </Field>

              <Field label="Number of Questions">
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={aiForm.count}
                  onChange={(e) =>
                    setAIForm(
                      (current) => ({
                        ...current,
                        count:
                          e.target.value,
                      })
                    )
                  }
                  className={inputClass}
                />
              </Field>

            </div>

            <button
              onClick={generateAIQuestions}
              disabled={generating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800 disabled:opacity-50"
            >

              {generating ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Sparkles size={18} />
              )}

              {generating
                ? "Generating..."
                : "Generate Questions"}

            </button>

            {/* GENERATED QUESTIONS */}

            {aiQuestions.length > 0 && (
              <div className="space-y-3">

                <div className="flex items-center justify-between">

                  <div>
                    <h3 className="font-extrabold text-slate-900">
                      Generated Questions
                    </h3>

                    <p className="text-xs text-slate-500">
                      Review them before adding them to your quiz.
                    </p>
                  </div>

                  <button
                    onClick={useAIQuestions}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-black text-white hover:bg-emerald-800"
                  >
                    <Check size={15} />
                    Use Questions
                  </button>

                </div>

                {aiQuestions.map(
                  (
                    question,
                    index
                  ) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >

                      <p className="text-sm font-bold text-slate-900">
                        {index + 1}.{" "}
                        {question.question}
                      </p>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">

                        {(
                          question.options ||
                          []
                        ).map(
                          (
                            option,
                            optionIndex
                          ) => (
                            <div
                              key={
                                optionIndex
                              }
                              className={`rounded-xl border px-3 py-2 text-xs ${
                                option ===
                                question.correctAnswer
                                  ? "border-emerald-300 bg-emerald-50 font-bold text-emerald-800"
                                  : "border-slate-200 bg-slate-50 text-slate-600"
                              }`}
                            >
                              {
                                String.fromCharCode(
                                  65 +
                                    optionIndex
                                )
                              }
                              .{" "}
                              {option}
                            </div>
                          )
                        )}

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </div>

        </Modal>
      )}
    </GenericPage>
  );
}

// ============================================================
// QUIZ CARD
// ============================================================

function QuizCard({ quiz }) {
  const questionCount =
    Array.isArray(quiz.questions)
      ? quiz.questions.length
      : quiz.questionCount || 0;

  const duration =
    quiz.durationMinutes ??
    quiz.duration ??
    20;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-200">

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div className="min-w-0">

          <div className="flex flex-wrap items-center gap-2">

            <h3 className="text-base font-extrabold text-slate-900">
              {quiz.title}
            </h3>

            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                quiz.published === false
                  ? "bg-slate-100 text-slate-600"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {quiz.published === false
                ? "Draft"
                : "Published"}
            </span>

          </div>

          <p className="mt-1 text-sm text-slate-500">
            {quiz.course?.code || "Course"}{" "}
            {quiz.course?.name
              ? `— ${quiz.course.name}`
              : ""}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">

            {quiz.topic && (
              <Badge>
                {quiz.topic}
              </Badge>
            )}

            {quiz.difficulty && (
              <Badge>
                {quiz.difficulty}
              </Badge>
            )}

            <Badge>
              {questionCount} Questions
            </Badge>

            <Badge>
              {duration} Minutes
            </Badge>

          </div>

        </div>

        <div className="flex items-center gap-2">

          <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
            <FileQuestion
              size={20}
            />
          </div>

        </div>

      </div>

    </div>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  icon: Icon,
  label,
  value,
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
// MODAL
// ============================================================

function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">

      <div
        className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ${
          wide
            ? "max-w-5xl"
            : "max-w-2xl"
        }`}
      >

        <div className="flex items-start justify-between border-b border-slate-200 p-5">

          <div>
            <h2 className="text-lg font-black text-slate-900">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-1 text-xs text-slate-500">
                {subtitle}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>

        </div>

        <div className="overflow-y-auto p-5">
          {children}
        </div>

      </div>

    </div>
  );
}

// ============================================================
// FIELD
// ============================================================

function Field({
  label,
  children,
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </label>

      {children}
    </div>
  );
}

// ============================================================
// BADGE
// ============================================================

function Badge({ children }) {
  return (
    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
      {children}
    </span>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";