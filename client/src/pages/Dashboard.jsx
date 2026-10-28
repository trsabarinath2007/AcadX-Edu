import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center">Loading AcadX...</div>;
  if (!user) return <Navigate to="/home" replace />;
  return <Navigate to={`/${user.role}-dashboard`} replace />;
}
