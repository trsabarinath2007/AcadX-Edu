import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

/* =========================================================
   GENERAL
========================================================= */

import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

/* =========================================================
   STUDENT
========================================================= */

import StudentDashboard from "./pages/StudentDashboard";
import StudentCourses from "./pages/StudentCourses";
import StudentAttendance from "./pages/StudentAttendance";
import StudentAssignments from "./pages/StudentAssignments";
import StudentQuizzes from "./pages/StudentQuizzes";
import StudentResults from "./pages/StudentResults";

/* =========================================================
   FACULTY
========================================================= */

import FacultyDashboard from "./pages/FacultyDashboard";
import FacultyStudents from "./pages/FacultyStudents";
import FacultyCourses from "./pages/FacultyCourses";
import FacultyAttendance from "./pages/FacultyAttendance";
import FacultyAssignments from "./pages/FacultyAssignments";
import FacultySubmissions from "./pages/FacultySubmissions";
import FacultyQuizzes from "./pages/FacultyQuizzes";
import FacultyLearningMaterials from "./pages/FacultyLearningMaterials";
import FacultyMarks from "./pages/FacultyMarks";
import FacultyAnalytics from "./pages/FacultyAnalytics";

/* =========================================================
   SHARED
========================================================= */

import Discussions from "./pages/Discussions";
import Announcements from "./pages/Announcements";
import Settings from "./pages/Settings";

/* =========================================================
   ADMIN
========================================================= */

import AdminDashboard from "./pages/AdminDashboard";
import { AdminDepartments } from "./pages/AdminModules";
import AdminUsers from "./pages/AdminUsers";
import AdminStudentsPage from "./pages/AdminStudentsPage";
import AdminAcademics from "./pages/AdminAcademics";
import AdminCourses from "./pages/AdminCourses";
import AdminAttendance from "./pages/AdminAttendance";
import AdminAssignments from "./pages/AdminAssignments";
import AdminQuizzes from "./pages/AdminQuizzes";
import AdminResults from "./pages/AdminResults";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminAI from "./pages/AdminAI";

/* =========================================================
   ROLE GUARD
========================================================= */

function Guard({ roles, children }) {
  return (
    <ProtectedRoute roles={roles}>
      {children}
    </ProtectedRoute>
  );
}

/* =========================================================
   APP
========================================================= */

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* =====================================================
              GENERAL
          ===================================================== */}

          <Route
            path="/"
            element={<Dashboard />}
          />

          <Route
            path="/home"
            element={<Home />}
          />

          <Route
            path="/login"
            element={<Login />}
          />


          {/* =====================================================
              STUDENT
          ===================================================== */}

          <Route
            path="/student-dashboard"
            element={
              <Guard roles={["student"]}>
                <StudentDashboard />
              </Guard>
            }
          />

          <Route
            path="/student-courses"
            element={
              <Guard roles={["student"]}>
                <StudentCourses />
              </Guard>
            }
          />

          <Route
            path="/attendance"
            element={
              <Guard roles={["student"]}>
                <StudentAttendance />
              </Guard>
            }
          />

          <Route
            path="/student-assignments"
            element={
              <Guard roles={["student"]}>
                <StudentAssignments />
              </Guard>
            }
          />

          <Route
            path="/student-quizzes"
            element={
              <Guard roles={["student"]}>
                <StudentQuizzes />
              </Guard>
            }
          />

          <Route
            path="/student-results"
            element={
              <Guard roles={["student"]}>
                <StudentResults />
              </Guard>
            }
          />


          {/* =====================================================
              OLD STUDENT ROUTES
              Redirect to the new student dashboard
          ===================================================== */}

          <Route
            path="/performance-insights"
            element={
              <Navigate
                to="/student-dashboard"
                replace
              />
            }
          />

          <Route
            path="/student-ai-analysis"
            element={
              <Navigate
                to="/student-dashboard"
                replace
              />
            }
          />

          <Route
            path="/student-study-assistant"
            element={
              <Navigate
                to="/student-dashboard"
                replace
              />
            }
          />


          {/* =====================================================
              FACULTY
          ===================================================== */}

          <Route
            path="/faculty-dashboard"
            element={
              <Guard roles={["faculty"]}>
                <FacultyDashboard />
              </Guard>
            }
          />

          <Route
            path="/faculty-students"
            element={
              <Guard roles={["faculty"]}>
                <FacultyStudents />
              </Guard>
            }
          />

          <Route
            path="/faculty-courses"
            element={
              <Guard roles={["faculty"]}>
                <FacultyCourses />
              </Guard>
            }
          />

          <Route
            path="/faculty-attendance"
            element={
              <Guard roles={["faculty"]}>
                <FacultyAttendance />
              </Guard>
            }
          />

          <Route
            path="/faculty-assignments"
            element={
              <Guard roles={["faculty"]}>
                <FacultyAssignments />
              </Guard>
            }
          />

          <Route
            path="/faculty-submissions"
            element={
              <Guard roles={["faculty"]}>
                <FacultySubmissions />
              </Guard>
            }
          />

          <Route
            path="/faculty-quizzes"
            element={
              <Guard roles={["faculty"]}>
                <FacultyQuizzes />
              </Guard>
            }
          />

          <Route
            path="/faculty-learning-materials"
            element={
              <Guard roles={["faculty"]}>
                <FacultyLearningMaterials />
              </Guard>
            }
          />

          <Route
            path="/faculty-marks"
            element={
              <Guard roles={["faculty"]}>
                <FacultyMarks />
              </Guard>
            }
          />

          <Route
            path="/faculty-analytics"
            element={
              <Guard roles={["faculty"]}>
                <FacultyAnalytics />
              </Guard>
            }
          />


          {/* =====================================================
              ADMIN
          ===================================================== */}

          <Route
            path="/admin-dashboard"
            element={
              <Guard roles={["admin"]}>
                <AdminDashboard />
              </Guard>
            }
          />

          <Route
            path="/admin-users"
            element={
              <Guard roles={["admin"]}>
                <AdminUsers />
              </Guard>
            }
          />

          <Route
            path="/admin-students"
            element={
              <Guard roles={["admin"]}>
                <AdminStudentsPage />
              </Guard>
            }
          />

          <Route
            path="/admin-departments"
            element={
              <Guard roles={["admin"]}>
                <AdminDepartments />
              </Guard>
            }
          />

          <Route
            path="/admin-courses"
            element={
              <Guard roles={["admin"]}>
                <AdminCourses />
              </Guard>
            }
          />

          <Route
            path="/admin-academics"
            element={
              <Guard roles={["admin"]}>
                <AdminAcademics />
              </Guard>
            }
          />

          <Route
            path="/admin-attendance"
            element={
              <Guard roles={["admin"]}>
                <AdminAttendance />
              </Guard>
            }
          />

          <Route
            path="/admin-assignments"
            element={
              <Guard roles={["admin"]}>
                <AdminAssignments />
              </Guard>
            }
          />

          <Route
            path="/admin-quizzes"
            element={
              <Guard roles={["admin"]}>
                <AdminQuizzes />
              </Guard>
            }
          />

          <Route
            path="/admin-results"
            element={
              <Guard roles={["admin"]}>
                <AdminResults />
              </Guard>
            }
          />

          <Route
            path="/admin-analytics"
            element={
              <Guard roles={["admin"]}>
                <AdminAnalytics />
              </Guard>
            }
          />

          <Route
            path="/admin-ai"
            element={
              <Guard roles={["admin"]}>
                <AdminAI />
              </Guard>
            }
          />


          {/* =====================================================
              SHARED DISCUSSIONS
          ===================================================== */}

          <Route
            path="/discussions"
            element={
              <Guard roles={["student", "faculty"]}>
                <Discussions />
              </Guard>
            }
          />


          {/* =====================================================
              SHARED ANNOUNCEMENTS
          ===================================================== */}

          <Route
            path="/announcements"
            element={
              <Guard
                roles={[
                  "admin",
                  "faculty",
                  "student",
                ]}
              >
                <Announcements />
              </Guard>
            }
          />


          {/* =====================================================
              SETTINGS
          ===================================================== */}

          <Route
            path="/settings"
            element={
              <Guard
                roles={[
                  "admin",
                  "faculty",
                  "student",
                ]}
              >
                <Settings />
              </Guard>
            }
          />


          {/* =====================================================
              OLD / EXTRA ROUTES
          ===================================================== */}

          <Route
            path="/notifications"
            element={
              <Navigate
                to="/announcements"
                replace
              />
            }
          />

          <Route
            path="/learning-materials/:id"
            element={
              <Navigate
                to="/student-courses"
                replace
              />
            }
          />


          {/* =====================================================
              FALLBACK
          ===================================================== */}

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}