import React, { useEffect, useState } from "react";
import {
  MessageCircle,
  Plus,
  Send,
  Loader2,
  X
} from "lucide-react";

import GenericPage from "./GenericPage";
import { apiGet, apiPost } from "../api";

export default function StudentDiscussions() {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDiscussions();
  }, []);

  async function loadDiscussions() {
    try {
      setLoading(true);

      const response = await apiGet(
        "/discussions"
      );

      setDiscussions(
        response?.discussions || []
      );
    } catch (error) {
      console.error(
        "Discussion loading error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  async function createDiscussion(e) {
    e.preventDefault();

    if (!title.trim() || !body.trim()) return;

    try {
      setSaving(true);

      const response = await apiPost(
        "/discussions",
        {
          title,
          body
        }
      );

      setDiscussions((previous) => [
        response.discussion,
        ...previous
      ]);

      setTitle("");
      setBody("");
      setShowCreate(false);
    } catch (error) {
      console.error(
        "Create discussion error:",
        error
      );
    } finally {
      setSaving(false);
    }
  }

  async function addReply(e) {
    e.preventDefault();

    if (!reply.trim() || !selected) return;

    try {
      setSaving(true);

      const response = await apiPost(
        `/discussions/${selected._id}/reply`,
        {
          body: reply
        }
      );

      setDiscussions((previous) =>
        previous.map((discussion) =>
          discussion._id === selected._id
            ? response.discussion
            : discussion
        )
      );

      setSelected(response.discussion);
      setReply("");
    } catch (error) {
      console.error(
        "Reply error:",
        error
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <GenericPage
      title="Discussions"
      description="Ask questions, discuss academic topics and learn with your peers and faculty."
    >
      <div className="space-y-5">

        <div className="flex justify-end">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-800"
          >
            <Plus size={17} />
            New Discussion
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center rounded-2xl border bg-white py-16">
            <Loader2
              size={18}
              className="animate-spin"
            />
          </div>
        ) : (
          <div className="space-y-3">

            {discussions.map((discussion) => (
              <button
                key={discussion._id}
                onClick={() =>
                  setSelected(discussion)
                }
                className="w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-200 hover:shadow-md"
              >
                <div className="flex gap-4">

                  <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                    <MessageCircle size={20} />
                  </div>

                  <div className="min-w-0 flex-1">

                    <h3 className="font-extrabold text-slate-900">
                      {discussion.title}
                    </h3>

                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                      {discussion.body}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                      <span>
                        {discussion.author?.name ||
                          "Student"}
                      </span>

                      {discussion.course?.code && (
                        <span>
                          {discussion.course.code}
                        </span>
                      )}

                      <span>
                        {discussion.replies?.length || 0} replies
                      </span>
                    </div>

                  </div>
                </div>
              </button>
            ))}

            {discussions.length === 0 && (
              <div className="rounded-2xl border bg-white py-16 text-center">
                <MessageCircle
                  size={32}
                  className="mx-auto text-slate-300"
                />
                <p className="mt-3 font-bold">
                  No discussions yet
                </p>
              </div>
            )}

          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={createDiscussion}
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="flex justify-between">
              <h2 className="text-xl font-black">
                New Discussion
              </h2>

              <button
                type="button"
                onClick={() => setShowCreate(false)}
              >
                <X />
              </button>
            </div>

            <input
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              placeholder="Discussion title"
              className="mt-5 w-full rounded-xl border border-slate-200 p-3 text-sm"
            />

            <textarea
              value={body}
              onChange={(e) =>
                setBody(e.target.value)
              }
              placeholder="What would you like to discuss?"
              rows={6}
              className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-sm"
            />

            <button
              disabled={saving}
              className="mt-4 flex w-full justify-center gap-2 rounded-xl bg-emerald-700 py-3 text-sm font-bold text-white"
            >
              {saving && (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              )}
              Post Discussion
            </button>
          </form>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">

            <div className="flex justify-between">
              <div>
                <h2 className="text-xl font-black">
                  {selected.title}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {selected.author?.name}
                </p>
              </div>

              <button
                onClick={() => setSelected(null)}
              >
                <X />
              </button>
            </div>

            <p className="mt-5 text-sm leading-6 text-slate-700">
              {selected.body}
            </p>

            <div className="mt-6 space-y-3">
              {selected.replies?.map(
                (item, index) => (
                  <div
                    key={index}
                    className="rounded-2xl bg-slate-50 p-4"
                  >
                    <p className="text-xs font-bold text-emerald-700">
                      {item.author?.name}
                    </p>

                    <p className="mt-1 text-sm text-slate-700">
                      {item.body}
                    </p>
                  </div>
                )
              )}
            </div>

            <form
              onSubmit={addReply}
              className="mt-5 flex gap-2"
            >
              <input
                value={reply}
                onChange={(e) =>
                  setReply(e.target.value)
                }
                placeholder="Write a reply..."
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm"
              />

              <button
                disabled={saving}
                className="rounded-xl bg-emerald-700 px-4 text-white"
              >
                <Send size={17} />
              </button>
            </form>

          </div>
        </div>
      )}
    </GenericPage>
  );
}