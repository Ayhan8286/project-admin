"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/lib/api/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Users, BookOpen, Calendar, UserCheck, UserX, Clock, Loader2 } from "lucide-react";

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
      gradient: "from-blue-500 to-blue-600",
      textColor: "text-blue-100",
      iconColor: "text-blue-200",
    },
    {
      title: "Active Teachers",
      value: stats?.totalTeachers ?? 0,
      description: "Currently teaching",
      icon: BookOpen,
      gradient: "from-green-500 to-green-600",
      textColor: "text-green-100",
      iconColor: "text-green-200",
    },
    {
      title: "Total Classes",
      value: stats?.totalClasses ?? 0,
      description: "Student-teacher assignments",
      icon: Calendar,
      gradient: "from-purple-500 to-purple-600",
      textColor: "text-purple-100",
      iconColor: "text-purple-200",
    },
    {
      title: "Active Students",
      value: stats?.activeStudents ?? 0,
      description: "Currently enrolled",
      icon: UserCheck,
      gradient: "from-emerald-500 to-emerald-600",
      textColor: "text-emerald-100",
      iconColor: "text-emerald-200",
    },
    {
      title: "Attendance Today",
      value: (stats?.todayAttendancePercentage ?? 0) + "%",
      description: "Students present today",
      icon: UserCheck,
      gradient: "from-orange-500 to-orange-600",
      textColor: "text-orange-100",
      iconColor: "text-orange-200",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the School Management System.
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card) => (
          <Card
            key={card.title}
            className={`bg-gradient-to-br ${card.gradient} text-white border-0 shadow-lg`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className={`text-sm font-medium ${card.textColor}`}>
                {card.title}
              </CardTitle>
              <card.icon className={`h-5 w-5 ${card.iconColor}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <div className="text-4xl font-bold">{card.value}</div>
              )}
              <p className={`text-xs ${card.textColor} mt-1`}>{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Students by Shift & Inactive Students */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Students by Shift */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Students by Shift
            </CardTitle>
            <CardDescription>Distribution across different timings</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : stats?.studentsByShift ? (
              <div className="space-y-3">
                {Object.entries(stats.studentsByShift).map(([shift, count]) => {
                  const percentage = stats.totalStudents
                    ? Math.round((count / stats.totalStudents) * 100)
                    : 0;
                  return (
                    <div key={shift} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{shift}</span>
                        <span className="text-muted-foreground">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Today's Attendance Overview */}
        <Link href="/attendance/today" className="block transition-transform hover:scale-[1.02]">
          <Card className="h-full cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Today's Attendance
              </CardTitle>
              <CardDescription>Click for details</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Present */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        Present
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {stats?.attendanceStats?.present ?? 0}%
                      </p>
                    </div>

                    {/* Absent */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        Absent
                      </div>
                      <p className="text-2xl font-bold text-red-600">
                        {stats?.attendanceStats?.absent ?? 0}%
                      </p>
                    </div>

                    {/* Late */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                        Late
                      </div>
                      <p className="text-2xl font-bold text-yellow-600">
                        {stats?.attendanceStats?.late ?? 0}%
                      </p>
                    </div>

                    {/* Leave */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        Leave
                      </div>
                      <p className="text-2xl font-bold text-blue-600">
                        {stats?.attendanceStats?.leave ?? 0}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Daily Teaching Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Teaching Hours
          </CardTitle>
          <CardDescription>
            Classes per day (each class = 30 mins)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : stats?.hoursPerDay ? (
            <div className="grid grid-cols-7 gap-3">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => {
                const classes = stats.classesPerDay?.[day] || 0;
                const hours = stats.hoursPerDay?.[day] || 0;
                const isWeekend = day === "Sat" || day === "Sun";
                return (
                  <div
                    key={day}
                    className={`rounded-lg p-4 text-center ${isWeekend
                      ? "bg-gray-50 dark:bg-gray-900"
                      : "bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950 dark:to-blue-950"
                      }`}
                  >
                    <p className="text-sm font-medium text-muted-foreground">{day}</p>
                    <p className="text-2xl font-bold mt-1">{hours}</p>
                    <p className="text-xs text-muted-foreground">hours</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ({classes} classes)
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center">No data available</p>
          )}
          {stats?.hoursPerDay && (
            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Weekly</span>
              <div className="text-right">
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {Object.values(stats.hoursPerDay).reduce((a, b) => a + b, 0)}
                </span>
                <span className="text-sm text-muted-foreground ml-1">hours</span>
                <span className="text-sm text-muted-foreground ml-2">
                  ({Object.values(stats.classesPerDay || {}).reduce((a, b) => a + b, 0)} classes)
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

