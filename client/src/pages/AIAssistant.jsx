import React, { useEffect, useMemo, useState } from "react";
import GenericPage from "./GenericPage";
import { apiGet, apiPost } from "../api";
import { useAuth } from "../context/AuthContext";

/* =========================================================
   AI STUDY ASSISTANT
========================================================= */

export function StudyAssistant() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask(e) {
    e.preventDefault();

    if (!message.trim()) return;

    setLoading(true);

    try {
      const data = await apiPost("/ai/study", {
        message
      });

      setResponse(data.response);
    } catch (error) {
      console.error("AI Study Assistant error:", error);

      setResponse(
        "AI service is currently unavailable. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <GenericPage
      title="AI Study Assistant"
      description="Ask AcadX for explanations, examples and practice questions."
    >
      <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">

        <form
          onSubmit={ask}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <input
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            placeholder="Explain recursion in Java..."
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Thinking..."
              : "Ask AcadX"}
          </button>
        </form>

        {response && (
          <div className="mt-5 whitespace-pre-wrap rounded-xl bg-slate-50 p-5 text-sm leading-6 text-slate-700">
            {response}
          </div>
        )}

      </div>
    </GenericPage>
  );
}

/* =========================================================
   AI ANALYSIS
========================================================= */

export function AIAnalysis() {
  return (
    <GenericPage
      title="AI Academic Analysis"
      description="AI interpretation of your academic condition, strengths, concerns and priority actions."
    />
  );
}

/* =========================================================
   DISCUSSION FORUM
   Faculty + Student only
========================================================= */

export function Discussions() {
  const { user } = useAuth();

  const [discussions, setDiscussions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [showCreate, setShowCreate] =
    useState(false);

  const [expandedId, setExpandedId] =
    useState(null);

  const [replyText, setReplyText] =
    useState({});

  const [form, setForm] = useState({
    title: "",
    body: ""
  });

  const [submitting, setSubmitting] =
    useState(false);

  const [replyingId, setReplyingId] =
    useState(null);

  /*
   * Only faculty and students should be here.
   * App.jsx and backend also enforce this.
   */
  const canParticipate =
    user?.role === "faculty" ||
    user?.role === "student";

  /* =====================================================
     LOAD DISCUSSIONS
  ===================================================== */

  async function loadDiscussions() {
    try {
      setLoading(true);
      setError("");

      const data =
        await apiGet("/discussions");

      setDiscussions(
        data.discussions || []
      );
    } catch (err) {
      console.error(
        "Load discussions error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to load discussions."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (canParticipate) {
      loadDiscussions();
    } else {
      setLoading(false);
    }
  }, [canParticipate]);

  /* =====================================================
     SEARCH
  ===================================================== */

  const filteredDiscussions =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return discussions;
      }

      return discussions.filter(
        (discussion) =>
          discussion.title
            ?.toLowerCase()
            .includes(query) ||
          discussion.body
            ?.toLowerCase()
            .includes(query) ||
          discussion.author?.name
            ?.toLowerCase()
            .includes(query) ||
          discussion.course?.name
            ?.toLowerCase()
            .includes(query)
      );
    }, [discussions, search]);

  /* =====================================================
     CREATE DISCUSSION
  ===================================================== */

  async function handleCreateDiscussion(e) {
    e.preventDefault();

    if (!form.title.trim()) {
      return;
    }

    if (!form.body.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const data =
        await apiPost("/discussions", {
          title: form.title.trim(),
          body: form.body.trim()
        });

      if (data.discussion) {
        setDiscussions((prev) => [
          data.discussion,
          ...prev
        ]);
      }

      setForm({
        title: "",
        body: ""
      });

      setShowCreate(false);
    } catch (err) {
      console.error(
        "Create discussion error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to create discussion."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* =====================================================
     REPLY
  ===================================================== */

  async function handleReply(discussionId) {
    const body =
      replyText[discussionId]?.trim();

    if (!body) return;

    try {
      setReplyingId(discussionId);
      setError("");

      const data = await apiPost(
        `/discussions/${discussionId}/reply`,
        { body }
      );

      if (data.discussion) {
        setDiscussions((prev) =>
          prev.map((discussion) =>
            String(discussion._id) ===
            String(discussionId)
              ? data.discussion
              : discussion
          )
        );
      }

      setReplyText((prev) => ({
        ...prev,
        [discussionId]: ""
      }));
    } catch (err) {
      console.error(
        "Reply error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to add reply."
      );
    } finally {
      setReplyingId(null);
    }
  }

  /* =====================================================
     LIKE
  ===================================================== */

  async function handleLike(discussionId) {
    try {
      const data = await apiPost(
        `/discussions/${discussionId}/like`,
        {}
      );

      setDiscussions((prev) =>
        prev.map((discussion) => {
          if (
            String(discussion._id) !==
            String(discussionId)
          ) {
            return discussion;
          }

          const currentLikes =
            discussion.likes || [];

          const alreadyLiked =
            currentLikes.some(
              (id) =>
                String(
                  id?._id || id
                ) ===
                String(user?._id)
            );

          return {
            ...discussion,
            likes: data.liked
              ? [
                  ...currentLikes,
                  user?._id
                ]
              : currentLikes.filter(
                  (id) =>
                    String(
                      id?._id || id
                    ) !==
                    String(user?._id)
                )
          };
        })
      );
    } catch (err) {
      console.error(
        "Like error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to update like."
      );
    }
  }

  /* =====================================================
     DATE FORMAT
  ===================================================== */

  function formatDate(date) {
    if (!date) return "";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );
  }

  /* =====================================================
     ACCESS BLOCK
  ===================================================== */

  if (!canParticipate) {
    return (
      <GenericPage
        title="Discussion Forum"
        description="Academic discussions between students and faculty."
      >
        <div className="rounded-2xl border border-red-100 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl">
            🔒
          </div>

          <h2 className="mt-4 text-lg font-black text-slate-900">
            Access Restricted
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            The Discussion Forum is available only
            to students and faculty.
          </p>
        </div>
      </GenericPage>
    );
  }

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <GenericPage
      title="Discussion Forum"
      description="Ask questions, share knowledge and participate in academic discussions with faculty and students."
    >

      {/* HEADER ACTIONS */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <p className="text-sm font-semibold text-slate-700">
            Academic Community
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {discussions.length} discussion
            {discussions.length !== 1
              ? "s"
              : ""}
          </p>
        </div>

        <button
          onClick={() =>
            setShowCreate((prev) => !prev)
          }
          className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
        >
          {showCreate
            ? "Close"
            : "+ Start Discussion"}
        </button>

      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* CREATE FORM */}
      {showCreate && (
        <form
          onSubmit={handleCreateDiscussion}
          className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm"
        >

          <div>
            <h2 className="text-lg font-black text-slate-900">
              Start a Discussion
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Ask a question or start an academic conversation.
            </p>
          </div>

          <div className="mt-5 space-y-4">

            <input
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value
                })
              }
              placeholder="Discussion title"
              maxLength={150}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
            />

            <textarea
              value={form.body}
              onChange={(e) =>
                setForm({
                  ...form,
                  body: e.target.value
                })
              }
              placeholder="Write your question or discussion..."
              rows={5}
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
            />

          </div>

          <div className="mt-4 flex justify-end">

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Posting..."
                : "Post Discussion"}
            </button>

          </div>

        </form>
      )}

      {/* SEARCH */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search discussions..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
        />

      </div>

      {/* LOADING */}
      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">

          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />

          <p className="mt-4 text-sm font-semibold text-slate-500">
            Loading discussions...
          </p>

        </div>
      )}

      {/* DISCUSSIONS */}
      {!loading && (
        <div className="space-y-5">

          {filteredDiscussions.map(
            (discussion) => {

              const expanded =
                String(expandedId) ===
                String(discussion._id);

              const likes =
                discussion.likes || [];

              const replies =
                discussion.replies || [];

              const liked =
                likes.some(
                  (id) =>
                    String(
                      id?._id || id
                    ) ===
                    String(user?._id)
                );

              return (
                <div
                  key={discussion._id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >

                  {/* DISCUSSION HEADER */}
                  <div className="p-5">

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2">

                          <h2 className="text-lg font-black text-slate-900">
                            {discussion.title}
                          </h2>

                          {discussion.author?.role && (
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700">
                              {discussion.author.role}
                            </span>
                          )}

                        </div>

                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">

                          <span>
                            {discussion.author?.name ||
                              "User"}
                          </span>

                          <span>
                            {formatDate(
                              discussion.createdAt
                            )}
                          </span>

                          {discussion.course && (
                            <span className="font-semibold text-emerald-700">
                              {discussion.course.code ||
                                discussion.course.name}
                            </span>
                          )}

                        </div>

                      </div>

                    </div>

                    {/* BODY */}
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                      {discussion.body}
                    </p>

                    {/* ACTIONS */}
                    <div className="mt-5 flex flex-wrap items-center gap-2">

                      <button
                        onClick={() =>
                          handleLike(
                            discussion._id
                          )
                        }
                        className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                          liked
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                        }`}
                      >
                        {liked
                          ? "♥"
                          : "♡"}{" "}
                        {likes.length}
                      </button>

                      <button
                        onClick={() =>
                          setExpandedId(
                            expanded
                              ? null
                              : discussion._id
                          )
                        }
                        className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        💬 {replies.length}{" "}
                        {replies.length === 1
                          ? "Reply"
                          : "Replies"}
                      </button>

                    </div>

                  </div>

                  {/* REPLIES */}
                  {expanded && (
                    <div className="border-t border-slate-100 bg-slate-50 p-5">

                      <h3 className="text-sm font-black text-slate-800">
                        Replies
                      </h3>

                      {replies.length === 0 && (
                        <p className="mt-3 text-xs text-slate-500">
                          No replies yet. Be the first to reply.
                        </p>
                      )}

                      <div className="mt-4 space-y-3">

                        {replies.map(
                          (reply) => (
                            <div
                              key={reply._id}
                              className="rounded-xl border border-slate-200 bg-white p-4"
                            >

                              <div className="flex flex-wrap items-center gap-2">

                                <span className="text-sm font-black text-slate-800">
                                  {reply.author?.name ||
                                    "User"}
                                </span>

                                {reply.author?.role && (
                                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-black uppercase text-emerald-700">
                                    {reply.author.role}
                                  </span>
                                )}

                                <span className="text-[11px] text-slate-400">
                                  {formatDate(
                                    reply.createdAt
                                  )}
                                </span>

                              </div>

                              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                {reply.body}
                              </p>

                            </div>
                          )
                        )}

                      </div>

                      {/* REPLY BOX */}
                      <div className="mt-5">

                        <textarea
                          value={
                            replyText[
                              discussion._id
                            ] || ""
                          }
                          onChange={(e) =>
                            setReplyText(
                              (prev) => ({
                                ...prev,
                                [discussion._id]:
                                  e.target.value
                              })
                            )
                          }
                          placeholder="Write a reply..."
                          rows={3}
                          className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                        />

                        <div className="mt-3 flex justify-end">

                          <button
                            onClick={() =>
                              handleReply(
                                discussion._id
                              )
                            }
                            disabled={
                              replyingId ===
                              discussion._id
                            }
                            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {replyingId ===
                            discussion._id
                              ? "Replying..."
                              : "Post Reply"}
                          </button>

                        </div>

                      </div>

                    </div>
                  )}

                </div>
              );
            }
          )}

          {/* EMPTY */}
          {filteredDiscussions.length ===
            0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">

              <div className="text-4xl">
                💬
              </div>

              <h3 className="mt-3 text-lg font-black text-slate-900">
                No discussions found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Start a discussion and get the conversation going.
              </p>

              <button
                onClick={() =>
                  setShowCreate(true)
                }
                className="mt-5 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
              >
                + Start Discussion
              </button>

            </div>
          )}

        </div>
      )}

    </GenericPage>
  );
}