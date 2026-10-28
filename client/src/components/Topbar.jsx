import React from "react";
import { Bell, Menu, Search } from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Topbar({ onMenu }) {
  const { user } = useAuth();
  const location = useLocation();

  const title =
    location.pathname
      .split("/")
      .filter(Boolean)
      .pop()
      ?.replace(/-/g, " ") || "Dashboard";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      {/* LEFT SIDE */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenu}
          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={19} />
        </button>

        <div className="min-w-0">
          <p className="hidden text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700 sm:block">
            {user?.role || "student"} portal
          </p>

          <h1 className="truncate text-base font-extrabold capitalize text-slate-900">
            {title}
          </h1>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-2 sm:gap-3">

        {/* SEARCH */}
        <div className="hidden w-52 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 lg:flex">
          <Search size={15} className="text-slate-400" />

          <input
            className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400"
            placeholder="Search AcadX..."
          />
        </div>

        {/* NOTIFICATIONS → ANNOUNCEMENTS */}
        <Link
          to="/announcements"
          className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
          title="Announcements"
          aria-label="Announcements"
        >
          <Bell size={18} />

          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600" />
        </Link>

        {/* PROFILE / SETTINGS */}
        <Link
          to="/settings"
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pr-3 hover:bg-slate-50"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-sm font-black text-white">
            {(user?.name || "A").charAt(0).toUpperCase()}
          </div>

          <div className="hidden sm:block">
            <p className="max-w-28 truncate text-xs font-bold text-slate-800">
              {user?.name || "AcadX User"}
            </p>

            <p className="text-[10px] capitalize text-slate-400">
              {user?.role || "student"}
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}