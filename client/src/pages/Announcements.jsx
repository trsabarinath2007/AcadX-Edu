import React, { useState } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";

const initialAnnouncements = [
  {
    id: 1,
    title: "Internal Assessment Schedule",
    description:
      "The internal assessment schedule has been published. Students are requested to check their respective course schedules.",
    category: "Academic",
    priority: "High",
    date: "02 Oct 2026",
    author: "Admin"
  },
  {
    id: 2,
    title: "Placement Training Session",
    description:
      "A placement preparation session will be conducted for eligible students this week.",
    category: "Placement",
    priority: "Medium",
    date: "01 Oct 2026",
    author: "Placement Cell"
  },
  {
    id: 3,
    title: "Semester Attendance Review",
    description:
      "Students are advised to review their attendance percentage and contact their faculty for any discrepancies.",
    category: "Attendance",
    priority: "Medium",
    date: "30 Sep 2026",
    author: "Admin"
  }
];

export default function Announcements() {
  const { user } = useAuth();

  const [announcements, setAnnouncements] =
    useState(initialAnnouncements);

  const [filter, setFilter] =
    useState("All");

  const [showForm, setShowForm] =
    useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Academic",
    priority: "Medium"
  });

  /*
   * Only Admin and Faculty can create announcements.
   * Students can only view them.
   */
  const canPost =
    user?.role === "admin" ||
    user?.role === "faculty";

  const filteredAnnouncements =
    filter === "All"
      ? announcements
      : announcements.filter(
          (item) =>
            item.category === filter
        );

  const handleSubmit = (e) => {
    e.preventDefault();

    // Extra frontend protection.
    // Backend protection is still required and already exists.
    if (!canPost) {
      return;
    }

    if (
      !form.title.trim() ||
      !form.description.trim()
    ) {
      return;
    }

    const newAnnouncement = {
      id: Date.now(),
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      priority: form.priority,
      date: new Date().toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric"
        }
      ),
      author:
        user?.name ||
        (user?.role === "faculty"
          ? "Faculty"
          : "Admin")
    };

    setAnnouncements((prev) => [
      newAnnouncement,
      ...prev
    ]);

    setForm({
      title: "",
      description: "",
      category: "Academic",
      priority: "Medium"
    });

    setShowForm(false);
  };

  return (
    <Layout>
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
              AcadX
            </p>

            <h1 className="mt-1 text-3xl font-black text-slate-900">
              Announcements
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Important academic and institutional updates.
            </p>
          </div>

          {/* ONLY ADMIN + FACULTY SEE THIS BUTTON */}
          {canPost && (
            <button
              onClick={() =>
                setShowForm((prev) => !prev)
              }
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
            >
              {showForm
                ? "Close"
                : "+ New Announcement"}
            </button>
          )}

        </div>

        {/* CREATE FORM */}
        {canPost && showForm && (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >

            <div className="flex items-center justify-between gap-3">

              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Create Announcement
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Publish an announcement for students and faculty.
                </p>
              </div>

              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold capitalize text-emerald-700">
                {user?.role}
              </span>

            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">

              {/* TITLE */}
              <input
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title: e.target.value
                  })
                }
                placeholder="Announcement title"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              />

              {/* CATEGORY */}
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value
                  })
                }
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              >
                <option>Academic</option>
                <option>Placement</option>
                <option>Attendance</option>
                <option>General</option>
                <option>Event</option>
              </select>

              {/* PRIORITY */}
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm({
                    ...form,
                    priority: e.target.value
                  })
                }
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500"
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>

              <div />

              {/* DESCRIPTION */}
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description:
                      e.target.value
                  })
                }
                rows={4}
                placeholder="Announcement description"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 md:col-span-2"
              />

            </div>

            {/* PUBLISH */}
            <div className="mt-4 flex justify-end">

              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700"
              >
                Publish Announcement
              </button>

            </div>

          </form>
        )}

        {/* STUDENT INFORMATION */}
        {!canPost && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
            <p className="text-sm font-bold text-emerald-800">
              Announcement Board
            </p>

            <p className="mt-1 text-xs text-emerald-700">
              You can view announcements published by the Admin and Faculty.
            </p>
          </div>
        )}

        {/* FILTER */}
        <div className="flex flex-wrap gap-2">

          {[
            "All",
            "Academic",
            "Placement",
            "Attendance",
            "General",
            "Event"
          ].map((item) => (
            <button
              key={item}
              onClick={() =>
                setFilter(item)
              }
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                filter === item
                  ? "bg-emerald-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50"
              }`}
            >
              {item}
            </button>
          ))}

        </div>

        {/* ANNOUNCEMENTS */}
        <div className="space-y-4">

          {filteredAnnouncements.map(
            (announcement) => (
              <div
                key={announcement.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200"
              >

                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                  <div className="flex-1">

                    <div className="flex flex-wrap items-center gap-2">

                      <h2 className="text-lg font-black text-slate-900">
                        {announcement.title}
                      </h2>

                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-700">
                        {announcement.category}
                      </span>

                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {announcement.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">

                      <span>
                        Published by{" "}
                        <strong className="text-slate-700">
                          {announcement.author}
                        </strong>
                      </span>

                      <span>
                        {announcement.date}
                      </span>

                    </div>

                  </div>

                  {/* PRIORITY */}
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
                      announcement.priority ===
                      "High"
                        ? "bg-red-100 text-red-700"
                        : announcement.priority ===
                          "Medium"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {announcement.priority}
                    {" "}Priority
                  </span>

                </div>

              </div>
            )
          )}

        </div>

        {/* EMPTY STATE */}
        {filteredAnnouncements.length ===
          0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            No announcements found.
          </div>
        )}

      </div>
    </Layout>
  );
}