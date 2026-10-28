import React from "react";
import Layout from "../components/Layout";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

const departmentData = [
  { department: "CSE", performance: 84 },
  { department: "IT", performance: 79 },
  { department: "ECE", performance: 76 },
  { department: "EEE", performance: 73 }
];

const attendanceData = [
  { month: "Jan", attendance: 86 },
  { month: "Feb", attendance: 88 },
  { month: "Mar", attendance: 84 },
  { month: "Apr", attendance: 90 },
  { month: "May", attendance: 92 },
  { month: "Jun", attendance: 89 }
];

const performanceData = [
  { name: "Excellent", value: 28 },
  { name: "Good", value: 42 },
  { name: "Average", value: 21 },
  { name: "Needs Improvement", value: 9 }
];

const COLORS = [
  "#10b981",
  "#34d399",
  "#fbbf24",
  "#f87171"
];

function StatCard({ title, value, subtitle }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <h2 className="mt-2 text-3xl font-black text-slate-900">
        {value}
      </h2>

      <p className="mt-1 text-xs text-emerald-600">
        {subtitle}
      </p>
    </div>
  );
}

export default function AdminAnalytics() {
  return (
    <Layout>
      <div className="space-y-6">

        {/* HEADER */}
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
            AcadX
          </p>

          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
            Institution Analytics
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Monitor academic performance, attendance and institutional
            trends from one place.
          </p>
        </div>

        {/* STATS */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Students"
            value="1,250"
            subtitle="+8.4% this semester"
          />

          <StatCard
            title="Total Faculty"
            value="86"
            subtitle="Across all departments"
          />

          <StatCard
            title="Average Attendance"
            value="89.2%"
            subtitle="+2.1% from last month"
          />

          <StatCard
            title="Average Performance"
            value="81.4%"
            subtitle="+4.3% this semester"
          />
        </div>

        {/* CHARTS */}
        <div className="grid gap-6 xl:grid-cols-2">

          {/* Department Performance */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-black text-slate-900">
                Department Performance
              </h2>

              <p className="text-sm text-slate-500">
                Average academic performance by department
              </p>
            </div>

            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData}>
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="department" />

                  <YAxis domain={[0, 100]} />

                  <Tooltip />

                  <Bar
                    dataKey="performance"
                    fill="#10b981"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Attendance */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-black text-slate-900">
                Attendance Trend
              </h2>

              <p className="text-sm text-slate-500">
                Institution-wide attendance trend
              </p>
            </div>

            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="month" />

                  <YAxis domain={[70, 100]} />

                  <Tooltip />

                  <Line
                    type="monotone"
                    dataKey="attendance"
                    stroke="#059669"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* PERFORMANCE DISTRIBUTION */}
        <div className="grid gap-6 lg:grid-cols-2">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">
              Student Performance Distribution
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Overall classification of students
            </p>

            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={performanceData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    label
                  >
                    {performanceData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip />

                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* INSIGHTS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">
              Key Institutional Insights
            </h2>

            <div className="mt-5 space-y-4">

              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="font-bold text-emerald-800">
                  Strong Attendance
                </p>

                <p className="mt-1 text-sm text-emerald-700">
                  Overall attendance is above the institutional target
                  of 85%.
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-4">
                <p className="font-bold text-blue-800">
                  CSE Leads Performance
                </p>

                <p className="mt-1 text-sm text-blue-700">
                  CSE currently has the highest average academic
                  performance.
                </p>
              </div>

              <div className="rounded-xl bg-amber-50 p-4">
                <p className="font-bold text-amber-800">
                  Improvement Opportunity
                </p>

                <p className="mt-1 text-sm text-amber-700">
                  Students in the needs-improvement category should
                  receive additional academic support.
                </p>
              </div>

            </div>
          </div>

        </div>

      </div>
    </Layout>
  );
}