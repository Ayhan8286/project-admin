"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/lib/api/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShimmerBlock, LoadingShimmer } from "@/components/ui/LoadingShimmer";
import { GlassAreaChart, GlassBarChart } from "@/components/ui/GlassChart";
import Link from "next/link";
import { Users, BookOpen, Calendar, UserCheck, Clock } from "lucide-react";

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: getDashboardStats,
  });

  const statCards = [
    {
      title: "Total Students",
      value: stats?.totalStudents ?? 0,
      description: "Enrolled in the system",
      icon: Users,
      gradient: "from-violet-600 to-indigo-600",
      glow: "shadow-violet-500/30",
      iconBg: "bg-violet-500/20",
      iconColor: "text-violet-300",
    },
    {
      title: "Active Teachers",
      value: stats?.totalTeachers ?? 0,
      description: "Currently teaching",
      icon: BookOpen,
      gradient: "from-emerald-600 to-teal-600",
      glow: "shadow-emerald-500/30",
      iconBg: "bg-emerald-500/20",
      iconColor: "text-emerald-300",
    },
    {
      title: "Total Classes",
      value: stats?.totalClasses ?? 0,
      description: "Student-teacher assignments",
      icon: Calendar,
      gradient: "from-blue-600 to-cyan-600",
      glow: "shadow-blue-500/30",
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-300",
    },
    {
      title: "Active Students",
      value: stats?.activeStudents ?? 0,
      description: "Currently enrolled",
      icon: UserCheck,
      gradient: "from-pink-600 to-rose-600",
      glow: "shadow-pink-500/30",
      iconBg: "bg-pink-500/20",
      iconColor: "text-pink-300",
    },
    {
      title: "Attendance Today",
      value: (stats?.todayAttendancePercentage ?? 0) + "%",
      description: "Students present today",
      icon: UserCheck,
      gradient: "from-orange-600 to-amber-600",
      glow: "shadow-orange-500/30",
      iconBg: "bg-orange-500/20",
      iconColor: "text-orange-300",
    },
  ];

  // Build bar chart data from hoursPerDay stats
  const hoursChartData = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => ({
    day,
    hours: stats?.hoursPerDay?.[day] ?? 0,
    classes: stats?.classesPerDay?.[day] ?? 0,
  }));

  // Build a weekly attendance breakdown from attendanceStats
  // Show the present/absent/late/leave as a small multi-point area proxy
  const attendanceChartData = [
    { label: "Present", attendance: stats?.attendanceStats?.present ?? 0 },
    { label: "Active", attendance: stats?.activeStudents ? Math.round((stats.activeStudents / Math.max(stats.totalStudents, 1)) * 100) : 0 },
    { label: "Teachers", attendance: stats?.totalTeachers ?? 0 },
    { label: "Classes", attendance: stats?.totalClasses ? Math.round(stats.totalClasses / 10) : 0 },
    { label: "Revenue", attendance: stats?.attendanceStats?.leave ?? 0 },
  ];

  return (
    <div className="space-y-8 animate-entrance">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gradient">Dashboard</h1>
        <p className="text-slate-400 mt-1">
          Welcome to the School Management System.
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 animate-stagger">
        {statCards.map((card) => (
          <div
            key={card.title}
            className={`rounded-xl bg-gradient-to-br ${card.gradient} p-5 shadow-lg ${card.glow} relative overflow-hidden group transition-all duration-300 hover:scale-[1.03] hover:shadow-xl`}
            style={{ transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.35s ease" }}
          >
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.3)_0%,_transparent_60%)]" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/70">{card.title}</p>
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${card.iconBg}`}>
                  <card.icon className={`h-4 w-4 ${card.iconColor}`} />
                </div>
              </div>
              {isLoading ? (
                <ShimmerBlock className="h-10 w-20 bg-white/20 shimmer-skeleton" />
              ) : (
                <p className="text-4xl font-bold text-white tracking-tight">{card.value}</p>
              )}
              <p className="text-xs text-white/60 mt-1">{card.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── CHART ROW 1: Attendance Breakdown + Shift Distribution ── */}
      <div className="grid gap-4 md:grid-cols-2 animate-stagger">
        {/* Weekly Attendance Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-violet-400" />
              Attendance Overview
            </CardTitle>
            <CardDescription>Current attendance breakdown across key metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingShimmer rows={4} rowHeight="h-6" />
            ) : (
              <GlassAreaChart
                data={attendanceChartData}
                xKey="label"
                dataKey="attendance"
                color="#8b5cf6"
                unit="%"
                height={200}
              />
            )}
          </CardContent>
        </Card>

        {/* Students by Shift */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-cyan-400" />
              Students by Shift
            </CardTitle>
            <CardDescription>Distribution across different timings</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[70, 50, 35].map((_, i) => (
                  <ShimmerBlock key={i} className="h-6 shimmer-skeleton" />
                ))}
              </div>
            ) : stats?.studentsByShift ? (
              <div className="space-y-4">
                {Object.entries(stats.studentsByShift).map(([shift, count]) => {
                  const percentage = stats.totalStudents
                    ? Math.round((count / stats.totalStudents) * 100)
                    : 0;
                  return (
                    <div key={shift} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-200">{shift}</span>
                        <span className="text-slate-400">{count} ({percentage}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                        <div
                          className="h-full rounded-full progress-glow glow-pulse transition-all duration-700"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-4">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── CHART ROW 2: Daily Teaching Hours Bar Chart ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-400" />
            Daily Teaching Hours
          </CardTitle>
          <CardDescription>
            Hours per day of the week — each class = 30 mins
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingShimmer rows={1} rowHeight="h-48" />
          ) : (
            <>
              <GlassBarChart
                data={hoursChartData}
                xKey="day"
                dataKey="hours"
                color="#8b5cf6"
                colorEnd="#4f46e5"
                unit="h"
                height={220}
              />
              {stats?.hoursPerDay && (
                <div className="mt-4 pt-4 border-t border-white/8 flex justify-between items-center">
                  <span className="text-sm text-slate-400">Total Weekly</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-gradient">
                      {Object.values(stats.hoursPerDay).reduce((a, b) => a + b, 0)}
                    </span>
                    <span className="text-sm text-slate-400 ml-1">hours</span>
                    <span className="text-sm text-slate-500 ml-2">
                      ({Object.values(stats.classesPerDay || {}).reduce((a, b) => a + b, 0)} classes)
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Today's Attendance ── */}
      <Link href="/attendance/today" className="block transition-transform hover:scale-[1.01]">
        <Card className="cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-emerald-400" />
              Today's Attendance
            </CardTitle>
            <CardDescription>Click for details</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => <ShimmerBlock key={i} className="h-12 shimmer-skeleton" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Present", value: stats?.attendanceStats?.present ?? 0, color: "text-emerald-400", dot: "bg-emerald-400" },
                  { label: "Absent", value: stats?.attendanceStats?.absent ?? 0, color: "text-red-400", dot: "bg-red-400" },
                  { label: "Late", value: stats?.attendanceStats?.late ?? 0, color: "text-amber-400", dot: "bg-amber-400" },
                  { label: "Leave", value: stats?.attendanceStats?.leave ?? 0, color: "text-blue-400", dot: "bg-blue-400" },
                ].map(({ label, value, color, dot }) => (
                  <div key={label} className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <div className={`h-2 w-2 rounded-full ${dot} shadow-lg`} />
                      {label}
                    </div>
                    <p className={`text-2xl font-bold ${color}`}>{value}%</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
