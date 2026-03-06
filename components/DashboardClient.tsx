"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, DashboardStats } from "@/lib/api/dashboard";
import { LoadingShimmer } from "@/components/ui/LoadingShimmer";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import {
  Users, UserCheck, Search, Bell,
  Clock, ChevronDown, Moon, Sun, BookOpen, Calendar,
  UserPlus, GraduationCap, ClipboardList, BarChart3,
  ArrowUpRight, CheckCircle, AlertCircle, Activity, Zap
} from "lucide-react";

export default function DashboardClient({ initialStats }: { initialStats: DashboardStats }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { data: stats } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: getDashboardStats,
    initialData: initialStats,
  });

  const kpiCards = [
    {
      label: "Students",
      value: stats?.totalStudents ?? 0,
      sub: "Enrolled",
      icon: Users,
      accent: "#13ec37",
      accentMuted: "rgba(19,236,55,0.12)",
    },
    {
      label: "Active",
      value: stats?.activeStudents ?? 0,
      sub: "Currently enrolled",
      icon: UserCheck,
      accent: "#34d399",
      accentMuted: "rgba(52,211,153,0.12)",
    },
    {
      label: "Teachers",
      value: stats?.totalTeachers ?? 0,
      sub: "In network",
      icon: BookOpen,
      accent: "#2dd4bf",
      accentMuted: "rgba(45,212,191,0.12)",
    },
    {
      label: "Classes",
      value: stats?.totalClasses ?? 0,
      sub: "Active pairs",
      icon: Calendar,
      accent: "#a78bfa",
      accentMuted: "rgba(167,139,250,0.12)",
    },
    {
      label: "Attendance",
      value: `${stats?.todayAttendancePercentage ?? 0}%`,
      sub: "Today",
      icon: Clock,
      accent: "#fb923c",
      accentMuted: "rgba(251,146,60,0.12)",
    },
  ];

  const quickActions = [
    { label: "Add Student", desc: "Register", icon: UserPlus, href: "/students", accent: "#13ec37" },
    { label: "Teachers", desc: "Faculty roster", icon: GraduationCap, href: "/teachers", accent: "#34d399" },
    { label: "Attendance", desc: "Mark today", icon: ClipboardList, href: "/attendance", accent: "#2dd4bf" },
    { label: "Platforms", desc: "Analytics", icon: BarChart3, href: "/platforms", accent: "#a78bfa" },
  ];

  return (
    <div className="relative flex-1 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-[#f4f6f4]/80 dark:bg-[#0c1a0d]/80 border-b border-border/50 px-6 lg:px-8 py-4 flex justify-between items-center gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-muted-foreground mb-0.5">AL Huda Network</p>
          <h1 className="text-2xl font-black tracking-tight text-foreground leading-none">
            Dashboard
            <span className="text-primary ml-2 text-lg">✦</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* User chip */}
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl border border-border bg-card hover:border-primary/20 transition-colors cursor-pointer">
            <div className="w-7 h-7 rounded-xl bg-primary/20 border border-primary/25 text-[11px] font-black text-primary flex items-center justify-center">AR</div>
            <span className="hidden md:block text-sm font-bold text-foreground">A. Rahman</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>
      </header>

      {/* Page body */}
      <div className="flex-1 p-6 lg:p-8 flex flex-col gap-10">

        {/* Hero KPI row */}
        <section className="fade-slide-up">
          {/* Section eyebrow */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">Live Metrics</span>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {kpiCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={i}
                  className="card-hover relative bg-card rounded-3xl p-5 border border-border overflow-hidden group flex flex-col gap-3"
                >
                  {/* Accent glow blob */}
                  <div
                    className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: card.accent }}
                  />
                  {/* Icon */}
                  <div
                    className="relative w-10 h-10 rounded-2xl flex items-center justify-center"
                    style={{ background: card.accentMuted }}
                  >
                    <Icon className="h-5 w-5" style={{ color: card.accent }} />
                  </div>
                  {/* Number */}
                  <div className="relative">
                    <p
                      className="text-3xl font-black tracking-tight leading-none"
                      style={{ color: card.accent }}
                    >
                      {card.value}
                    </p>
                    <p className="text-[11px] font-bold text-foreground mt-1.5">{card.label}</p>
                    <p className="text-[10px] text-muted-foreground">{card.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="fade-slide-up" style={{ animationDelay: '0.06s' }}>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">Quick Actions</span>
            <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, i) => {
              const Icon = action.icon;
              return (
                <Link
                  key={i}
                  href={action.href}
                  className="card-hover bg-card rounded-2xl p-5 border border-border group flex items-center gap-4"
                >
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-200"
                    style={{ background: `${action.accent}18` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: action.accent }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-foreground group-hover:text-primary transition-colors">{action.label}</p>
                    <p className="text-[11px] text-muted-foreground">{action.desc}</p>
                  </div>
                  <ArrowUpRight
                    className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-200"
                    style={{ color: action.accent }}
                  />
                </Link>
              );
            })}
          </div>
        </section>

        {/* Status */}
        <section className="fade-slide-up" style={{ animationDelay: '0.12s' }}>
          <div className="flex items-center gap-3 mb-5">
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">System Status</span>
            <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
            <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">● All systems go</span>
          </div>
          <div className="bg-card rounded-3xl border border-border overflow-hidden divide-y divide-border">
            {[
              { label: "Total Students", value: stats?.totalStudents ?? 0, icon: CheckCircle, good: true },
              { label: "Active Teachers", value: stats?.totalTeachers ?? 0, icon: CheckCircle, good: true },
              { label: "Total Classes", value: stats?.totalClasses ?? 0, icon: Activity, good: true },
              { label: "Attendance Today", value: `${stats?.todayAttendancePercentage ?? 0}%`, icon: (stats?.todayAttendancePercentage ?? 0) > 50 ? CheckCircle : AlertCircle, good: (stats?.todayAttendancePercentage ?? 0) > 50 },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-center justify-between px-6 py-4 hover:bg-primary/[0.03] transition-colors">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${item.good ? "text-emerald-500" : "text-amber-500"}`} />
                    <span className="text-sm font-semibold text-foreground">{item.label}</span>
                  </div>
                  <span className={`text-sm font-black ${item.good ? "text-emerald-500" : "text-amber-500"}`}>{item.value}</span>
                </div>
              );
            })}
          </div>
        </section>

      </div>

      {/* Floating Theme Toggle */}
      {mounted && (
        <div className="fixed bottom-6 right-6 z-50 bg-card border border-border rounded-2xl p-1.5 shadow-xl flex flex-col gap-1 backdrop-blur-md">
          <button
            onClick={() => setTheme('light')}
            className={`p-2.5 rounded-xl transition-all ${theme === 'light' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-primary/10'}`}
          >
            <Sun className="h-4 w-4" />
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`p-2.5 rounded-xl transition-all ${theme === 'dark' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-primary/10'}`}
          >
            <Moon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
