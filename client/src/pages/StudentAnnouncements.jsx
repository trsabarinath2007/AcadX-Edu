import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  Search,
  Loader2,
  Megaphone
} from "lucide-react";

import GenericPage from "./GenericPage";
import { apiGet } from "../api";

export default function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function loadAnnouncements() {
    try {
      setLoading(true);

      const response = await apiGet(
        "/announcements"
      );

      setAnnouncements(
        response?.announcements || []
      );
    } catch (error) {
      console.error(
        "Announcements error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  const categories = useMemo(() => {
    return [
      ...new Set(
        announcements
          .map((item) => item.category)
          .filter(Boolean)
      )
    ];
  }, [announcements]);

  const filtered = announcements.filter(
    (item) => {
      const keyword = search.toLowerCase();

      const matchesSearch =
        !keyword ||
        item.title
          ?.toLowerCase()
          .includes(keyword) ||
        item.description
          ?.toLowerCase()
          .includes(keyword);

      const matchesCategory =
        category === "all" ||
        item.category === category;

      return (
        matchesSearch &&
        matchesCategory
      );
    }
  );

  return (
    <GenericPage
      title="Announcements"
      description="Stay updated with academic, examination and campus announcements."
    >
      <div className="space-y-5">

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row">

            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search announcements..."
                className="w-full rounded-xl bg-slate-50 py-3 pl-9 pr-4 text-sm outline-none"
              />
            </div>

            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            >
              <option value="all">
                All Categories
              </option>

              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

          </div>
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

            {filtered.map((announcement) => (
              <article
                key={announcement._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Megaphone size={19} />
                  </div>

                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-extrabold text-slate-900">
                        {announcement.title}
                      </h2>

                      {announcement.category && (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">
                          {announcement.category}
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {announcement.description ||
                        announcement.body ||
                        "No additional details."}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">

                      <span className="flex items-center gap-1">
                        <CalendarDays size={13} />

                        {announcement.createdAt
                          ? new Date(
                              announcement.createdAt
                            ).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric"
                              }
                            )
                          : "Recent"}
                      </span>

                      {announcement.createdBy?.name && (
                        <span>
                          By {announcement.createdBy.name}
                        </span>
                      )}

                    </div>

                  </div>

                </div>
              </article>
            ))}

            {filtered.length === 0 && (
              <div className="rounded-2xl border bg-white py-16 text-center">
                <Bell
                  size={32}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 font-bold">
                  No announcements found
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  There are no announcements matching your search.
                </p>
              </div>
            )}

          </div>
        )}

      </div>
    </GenericPage>
  );
}