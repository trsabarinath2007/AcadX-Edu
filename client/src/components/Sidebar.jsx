import React from "react";
import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  BrainCircuit,
  GraduationCap,
  BarChart3,
  Bell,
  Users,
  Building2,
  Layers3,
  Settings,
  LogOut,
  X,
  FileText,
  MessageSquare,
  UserRound,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

/* =========================================================
   STUDENT SIDEBAR
========================================================= */

const studentSections = [
  {
    label: "Overview",
    items: [
      ["Dashboard", "/student-dashboard", LayoutDashboard],
      ["My Courses", "/student-courses", BookOpen],
      ["My Attendance", "/attendance", CalendarCheck],
    ],
  },

  {
    label: "Academic Work",
    items: [
      ["Assignments", "/student-assignments", ClipboardList],
      ["Quizzes & Tests", "/student-quizzes", BrainCircuit],
      ["Results & Records", "/student-results", GraduationCap],
      ["Discussions", "/discussions", MessageSquare],
    ],
  },

  {
    label: "Communication",
    items: [
      ["Announcements", "/announcements", Bell],
    ],
  },
];

/* =========================================================
   FACULTY SIDEBAR
========================================================= */

const facultySections = [
  {
    label: "Overview",
    items: [
      ["Dashboard", "/faculty-dashboard", LayoutDashboard],
      ["Students", "/faculty-students", Users],
      ["My Courses", "/faculty-courses", BookOpen],
    ],
  },

  {
    label: "Teaching",
    items: [
      ["Attendance", "/faculty-attendance", CalendarCheck],
      ["Assignments", "/faculty-assignments", ClipboardList],
      ["Submissions", "/faculty-submissions", FileText],
      ["Quizzes", "/faculty-quizzes", BrainCircuit],
      [
        "Learning Materials",
        "/faculty-learning-materials",
        BookOpen,
      ],
      ["Marks", "/faculty-marks", GraduationCap],
    ],
  },

  {
    label: "Analytics & Communication",
    items: [
      ["Analytics", "/faculty-analytics", BarChart3],
      ["Discussions", "/discussions", MessageSquare],
      ["Announcements", "/announcements", Bell],
    ],
  },
];

/* =========================================================
   ADMIN SIDEBAR
========================================================= */

const adminSections = [
  {
    label: "Overview",
    items: [
      ["Dashboard", "/admin-dashboard", LayoutDashboard],
      ["Users", "/admin-users", Users],
      ["Students", "/admin-students", UserRound],
    ],
  },

  {
    label: "Institution",
    items: [
      ["Departments", "/admin-departments", Building2],
      ["Academics", "/admin-academics", Layers3],
      ["Courses", "/admin-courses", BookOpen],
      ["Attendance", "/admin-attendance", CalendarCheck],
    ],
  },

  {
    label: "Academic Management",
    items: [
      ["Assignments", "/admin-assignments", ClipboardList],
      ["Quizzes", "/admin-quizzes", BrainCircuit],
      ["Results", "/admin-results", GraduationCap],
      ["Analytics", "/admin-analytics", BarChart3],
      ["Announcements", "/announcements", Bell],
    ],
  },
];

/* =========================================================
   SIDEBAR COMPONENT
========================================================= */

export default function Sidebar({
  collapsed,
  mobileOpen,
  onToggle,
  onClose,
}) {
  const { user, logout } = useAuth();

  /* =======================================================
     SELECT SIDEBAR BASED ON ROLE
  ======================================================= */

  const role = String(
    user?.role || "student"
  )
    .trim()
    .toLowerCase();

  const sections =
    role === "admin"
      ? adminSections
      : role === "faculty"
      ? facultySections
      : studentSections;

  /* =======================================================
     LOGOUT
  ======================================================= */

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    } finally {
      onClose?.();
      window.location.href = "/login";
    }
  }

  return (
    <>
      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={onClose}
          aria-label="Close navigation"
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col
          border-r border-slate-200
          bg-white
          transition-all duration-300

          lg:sticky
          lg:top-0
          lg:h-screen
          lg:z-30

          ${
            collapsed
              ? "lg:w-[76px]"
              : "lg:w-[248px]"
          }

          ${
            mobileOpen
              ? "translate-x-0 w-[280px]"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >

        {/* =================================================
            LOGO
        ================================================= */}

        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">

          <div
            className={`
              flex items-center gap-3
              ${
                collapsed
                  ? "lg:justify-center lg:w-full"
                  : ""
              }
            `}
          >

            {/* LOGO ICON */}

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm">
              <GraduationCap size={22} />
            </div>

            {/* LOGO TEXT */}

            <div
              className={
                collapsed
                  ? "lg:hidden"
                  : ""
              }
            >
              <div className="text-lg font-black tracking-tight text-slate-900">
                AcadX
              </div>

              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                Academic Intelligence
              </div>
            </div>
          </div>

          {/* MOBILE CLOSE */}

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>

        </div>

        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav className="flex-1 overflow-y-auto px-3 py-5">

          {sections.map(
            (section) => (
              <div
                key={section.label}
                className="mb-6"
              >

                {/* SECTION TITLE */}

                <p
                  className={`
                    mb-2 px-2
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.18em]
                    text-slate-400

                    ${
                      collapsed
                        ? "lg:hidden"
                        : ""
                    }
                  `}
                >
                  {section.label}
                </p>

                {/* MENU ITEMS */}

                <div className="space-y-1">

                  {section.items.map(
                    ([
                      label,
                      path,
                      Icon,
                    ]) => (
                      <NavLink
                        key={path}
                        to={path}
                        onClick={onClose}
                        title={
                          collapsed
                            ? label
                            : undefined
                        }
                        className={({
                          isActive,
                        }) =>
                          `
                          group
                          flex
                          items-center
                          gap-3
                          rounded-xl
                          px-3
                          py-2.5
                          text-sm
                          font-semibold
                          transition

                          ${
                            collapsed
                              ? "lg:justify-center lg:px-2"
                              : ""
                          }

                          ${
                            isActive
                              ? "bg-emerald-50 text-emerald-800"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }
                        `
                        }
                      >

                        {/* ICON */}

                        <Icon
                          size={18}
                          className="shrink-0"
                        />

                        {/* LABEL */}

                        <span
                          className={
                            collapsed
                              ? "lg:hidden"
                              : ""
                          }
                        >
                          {label}
                        </span>

                      </NavLink>
                    )
                  )}

                </div>

              </div>
            )
          )}

        </nav>

        {/* =================================================
            BOTTOM ACTIONS
        ================================================= */}

        <div className="border-t border-slate-100 p-3">

          {/* SETTINGS */}

          <NavLink
            to="/settings"
            onClick={onClose}
            title={
              collapsed
                ? "Settings"
                : undefined
            }
            className={`
              flex
              items-center
              gap-3
              rounded-xl
              px-3
              py-2.5
              text-sm
              font-semibold
              text-slate-600
              hover:bg-slate-50

              ${
                collapsed
                  ? "lg:justify-center lg:px-2"
                  : ""
              }
            `}
          >

            <Settings size={18} />

            <span
              className={
                collapsed
                  ? "lg:hidden"
                  : ""
              }
            >
              Settings
            </span>

          </NavLink>

          {/* SIGN OUT */}

          <button
            type="button"
            onClick={handleLogout}
            title={
              collapsed
                ? "Sign out"
                : undefined
            }
            className={`
              mt-1
              flex
              w-full
              items-center
              gap-3
              rounded-xl
              px-3
              py-2.5
              text-sm
              font-semibold
              text-slate-500
              hover:bg-red-50
              hover:text-red-600

              ${
                collapsed
                  ? "lg:justify-center lg:px-2"
                  : ""
              }
            `}
          >

            <LogOut size={18} />

            <span
              className={
                collapsed
                  ? "lg:hidden"
                  : ""
              }
            >
              Sign Out
            </span>

          </button>

        </div>

        {/* =================================================
            DESKTOP COLLAPSE BUTTON
        ================================================= */}

        <button
          type="button"
          onClick={onToggle}
          className="absolute -right-3 top-20 hidden h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:text-slate-900 lg:flex"
          title={
            collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
          aria-label={
            collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
          }
        >

          {collapsed ? (
            <ChevronRight size={15} />
          ) : (
            <ChevronLeft size={15} />
          )}

        </button>

      </aside>
    </>
  );
}