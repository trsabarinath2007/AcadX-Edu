import React, { useState } from "react";
import {
  MessageSquare,
  Search,
  Plus,
  Send,
  Users,
  Clock,
} from "lucide-react";
import GenericPage from "./GenericPage";

export default function Discussions() {
  const [search, setSearch] = useState("");
  const [newDiscussion, setNewDiscussion] = useState("");
  const [discussions, setDiscussions] = useState([
    {
      id: 1,
      title: "Data Structures Doubts",
      description:
        "Discuss arrays, linked lists, trees, graphs and other data structure concepts.",
      author: "AcadX Community",
      replies: 12,
      time: "Today",
    },
    {
      id: 2,
      title: "Placement Preparation",
      description:
        "Share interview preparation tips, coding problems and placement resources.",
      author: "Students",
      replies: 8,
      time: "Yesterday",
    },
    {
      id: 3,
      title: "Project Discussion",
      description:
        "Discuss project ideas, technologies, implementation problems and suggestions.",
      author: "AcadX Community",
      replies: 6,
      time: "2 days ago",
    },
  ]);

  const filteredDiscussions = discussions.filter((discussion) =>
    `${discussion.title} ${discussion.description}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function handleCreateDiscussion(e) {
    e.preventDefault();

    const title = newDiscussion.trim();

    if (!title) return;

    const discussion = {
      id: Date.now(),
      title,
      description: "New discussion created by the AcadX user.",
      author: "You",
      replies: 0,
      time: "Just now",
    };

    setDiscussions((prev) => [discussion, ...prev]);
    setNewDiscussion("");
  }

  return (
    <GenericPage
      title="Discussions"
      description="Ask questions, share knowledge and discuss academic topics with the AcadX community."
    >
      <div className="space-y-5">

        {/* =====================================================
            TOP ACTION BAR
        ===================================================== */}

        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">

          {/* Search */}

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <Search
              size={18}
              className="text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search discussions..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Create */}

          <form
            onSubmit={handleCreateDiscussion}
            className="flex gap-2"
          >
            <input
              type="text"
              value={newDiscussion}
              onChange={(e) => setNewDiscussion(e.target.value)}
              placeholder="Start a discussion..."
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500"
            />

            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
            >
              <Plus size={17} />
              <span className="hidden sm:inline">
                Create
              </span>
            </button>
          </form>
        </div>


        {/* =====================================================
            DISCUSSION LIST
        ===================================================== */}

        <div className="space-y-4">

          {filteredDiscussions.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">

              <MessageSquare
                size={35}
                className="mx-auto text-slate-300"
              />

              <h3 className="mt-4 text-base font-bold text-slate-800">
                No discussions found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Try another search or create a new discussion.
              </p>

            </div>
          ) : (
            filteredDiscussions.map((discussion) => (
              <div
                key={discussion.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-200 hover:shadow-sm"
              >

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                  <div className="min-w-0">

                    <div className="flex items-start gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                        <MessageSquare size={19} />
                      </div>

                      <div className="min-w-0">

                        <h3 className="text-base font-extrabold text-slate-900">
                          {discussion.title}
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {discussion.description}
                        </p>

                      </div>

                    </div>

                  </div>

                  <button
                    type="button"
                    className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Open
                    <Send size={14} />
                  </button>

                </div>


                {/* Metadata */}

                <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500">

                  <span className="flex items-center gap-1.5">
                    <Users size={14} />
                    {discussion.author}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <MessageSquare size={14} />
                    {discussion.replies} replies
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Clock size={14} />
                    {discussion.time}
                  </span>

                </div>

              </div>
            ))
          )}

        </div>

      </div>
    </GenericPage>
  );
}