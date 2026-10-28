import React, { useEffect, useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Search
} from "lucide-react";

import GenericPage from "./GenericPage";
import { apiGet } from "../api";

export default function StudentAttendance() {
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAttendance();
  }, []);

  async function loadAttendance() {
    try {
      setLoading(true);

      const [summaryResponse, recordsResponse] =
        await Promise.all([
          apiGet("/attendance/student/summary"),
          apiGet("/attendance/student")
        ]);

      setSummary(summaryResponse);
      setRecords(recordsResponse?.attendance || []);
    } catch (err) {
      console.error("Attendance error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load attendance."
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredRecords = records.filter((record) => {
    const keyword = search.toLowerCase();

    return (
      String(record.course?.code || "")
        .toLowerCase()
        .includes(keyword) ||
      String(record.course?.name || "")
        .toLowerCase()
        .includes(keyword)
    );
  });

  const percentage = Number(
    summary?.overall?.percentage || 0
  );

  return (
    <GenericPage
      title="My Attendance"
      description="Track your course-wise attendance and attendance status."
    >
      <div className="space-y-5">

        {loading ? (
          <div className="flex justify-center rounded-2xl border bg-white py-16 text-sm text-slate-500">
            <Loader2 size={18} className="mr-2 animate-spin" />
            Loading attendance...
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

              <Stat
                label="Overall Attendance"
                value={`${percentage.toFixed(1)}%`}
                icon={CalendarCheck}
                tone={
                  percentage >= 75
                    ? "emerald"
                    : "red"
                }
              />

              <Stat
                label="Present"
                value={summary?.overall?.present || 0}
                icon={CheckCircle2}
                tone="emerald"
              />

              <Stat
                label="Absent"
                value={summary?.overall?.absent || 0}
                icon={XCircle}
                tone="red"
              />

              <Stat
                label="Status"
                value={percentage >= 75 ? "Good" : "Low"}
                icon={AlertTriangle}
                tone={
                  percentage >= 75
                    ? "emerald"
                    : "amber"
                }
              />

            </div>

            {percentage < 75 && (
              <div className="flex gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
                <AlertTriangle size={18} />
                <div>
                  <p className="font-bold">
                    Attendance Warning
                  </p>
                  <p className="mt-1">
                    Your attendance is below 75%.
                    Try to attend upcoming classes regularly.
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-100 p-5">
                <h2 className="font-extrabold text-slate-900">
                  Course-wise Attendance
                </h2>
                <p className="text-xs text-slate-500">
                  Attendance percentage for each course
                </p>
              </div>

              <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
                {(summary?.courses || []).map((item) => (
                  <div
                    key={item.course?._id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex justify-between">
                      <div>
                        <p className="text-xs font-black text-emerald-700">
                          {item.course?.code}
                        </p>

                        <p className="mt-1 font-bold text-slate-900">
                          {item.course?.name}
                        </p>
                      </div>

                      <p
                        className={`text-xl font-black ${
                          item.percentage >= 75
                            ? "text-emerald-700"
                            : "text-red-600"
                        }`}
                      >
                        {item.percentage}%
                      </p>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-600"
                        style={{
                          width: `${Math.min(
                            item.percentage,
                            100
                          )}%`
                        }}
                      />
                    </div>

                    <div className="mt-3 flex justify-between text-xs text-slate-500">
                      <span>
                        Present: {item.present}
                      </span>

                      <span>
                        Absent: {item.absent}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-extrabold">
                    Attendance History
                  </h2>
                  <p className="text-xs text-slate-500">
                    Recent attendance records
                  </p>
                </div>

                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Search course..."
                    className="rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredRecords.map((record) => (
                  <div
                    key={record._id}
                    className="flex items-center justify-between gap-3 p-4"
                  >
                    <div>
                      <p className="font-bold text-slate-800">
                        {record.course?.code}
                      </p>
                      <p className="text-xs text-slate-500">
                        {record.course?.name}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-slate-400">
                        {record.date
                          ? new Date(
                              record.date
                            ).toLocaleDateString(
                              "en-IN"
                            )
                          : "—"}
                      </p>

                      <span
                        className={`text-xs font-black ${
                          record.status === "present"
                            ? "text-emerald-700"
                            : "text-red-600"
                        }`}
                      >
                        {record.status?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </>
        )}

        {error && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

      </div>
    </GenericPage>
  );
}

function Stat({ label, value, icon: Icon, tone }) {
  const styles = {
    emerald: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700"
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-slate-400">
            {label}
          </p>
          <p className="mt-3 text-3xl font-black">
            {value}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${styles[tone]}`}>
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}