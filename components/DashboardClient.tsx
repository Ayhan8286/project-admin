"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, DashboardStats } from "@/lib/api/dashboard";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export default function DashboardClient({ initialStats }: { initialStats: DashboardStats }) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const { data: stats } = useQuery({
        queryKey: ["dashboardStats"],
        queryFn: getDashboardStats,
        initialData: initialStats,
        refetchInterval: 60000, // Refetch every minute for live dashboard feel
    });

    const activeStudents = stats?.activeStudents || 0;
    const totalStudents = stats?.totalStudents || 0;
    const totalTeachers = stats?.totalTeachers || 0;
    const activeTeachers = stats?.activeTeachers || 0;
    const attendancePercentage = stats?.todayAttendancePercentage || 0;
    const att = stats?.attendanceStats || { present: 0, absent: 0, late: 0, leave: 0 };
    const totalClasses = stats?.totalClasses || 0;

    // SVG Circle Dashmap calculations for a circle with r="88" => circum = 2 * PI * 88 = 552.92
    const dashArray = 552.92;
    const dashOffset = dashArray - (dashArray * attendancePercentage) / 100;

    return (
        <div className="flex-1 flex flex-col min-h-screen relative">
            {/* Organic Background Elements (From new theme) */}
            <div className="organic-blob bg-primary-container/30 w-[500px] h-[500px] -top-48 -left-24"></div>
            <div className="organic-blob bg-tertiary-container/20 w-[400px] h-[400px] bottom-0 right-0"></div>

            {/* TopAppBar */}
            <header className="flex justify-between items-center px-6 md:px-10 py-6 w-full sticky top-0 z-20 glass-panel border-b border-white/20 dark:border-white/5">
                <div className="flex items-center">
                    {/* Handled by sidebar mobile toggle normally, but we can leave a placeholder */}
                    <span className="md:hidden mr-4 material-symbols-outlined text-emerald-900 dark:text-emerald-50" data-icon="menu">menu</span>
                    <h2 className="text-2xl font-black tracking-tight text-emerald-900 dark:text-emerald-50 brand-font">Dashboard Overview</h2>
                </div>
                <div className="flex items-center space-x-6">
                    <div className="hidden lg:flex items-center bg-surface-container-highest px-4 py-2 rounded-full w-64 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                        <span className="material-symbols-outlined text-outline" data-icon="search">search</span>
                        <input className="bg-transparent border-none focus:ring-0 text-sm w-full font-body outline-none placeholder:text-outline/60 ml-2" placeholder="Search analytics..." type="text" />
                    </div>
                    <div className="flex space-x-2">
                        {mounted && (
                            <button
                                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-800/40 transition-colors text-emerald-800 dark:text-emerald-200"
                            >
                                <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
                            </button>
                        )}
                        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-800/40 transition-colors text-emerald-800 dark:text-emerald-200">
                            <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Content Area */}
            <div className="p-6 md:p-10 space-y-16 relative z-10 w-full max-w-7xl mx-auto">
                {/* Bento Grid Section: Primary Stats */}
                <section className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {/* Total Students (Large Bento Piece) */}
                    <div className="md:col-span-2 lg:col-span-2 p-8 rounded-xl glass-panel shadow-[0px_0px_48px_rgba(45,52,50,0.06)] flex flex-col justify-between border border-white/20 dark:border-white/5">
                        <div className="flex justify-between items-start">
                            <span className="p-3 bg-primary-container text-on-primary-container rounded-2xl material-symbols-outlined" data-icon="school">school</span>
                            <span className="text-xs font-bold text-primary px-3 py-1 bg-primary/10 rounded-full">Total Core</span>
                        </div>
                        <div className="mt-8">
                            <p className="text-on-surface-variant dark:text-white/60 font-medium text-sm">Total Students</p>
                            <h3 className="text-5xl font-black text-on-surface dark:text-white mt-1">{totalStudents.toLocaleString()}</h3>
                        </div>
                    </div>

                    {/* Active Students (Large Bento Piece) */}
                    <div className="md:col-span-2 lg:col-span-2 p-8 rounded-xl glass-panel shadow-[0px_0px_48px_rgba(45,52,50,0.06)] flex flex-col justify-between border border-white/20 dark:border-white/5">
                        <div className="flex justify-between items-start">
                            <span className="p-3 bg-secondary-container text-on-secondary-container rounded-2xl material-symbols-outlined" data-icon="person_play">person_play</span>
                            <span className="text-xs font-bold text-secondary px-3 py-1 bg-secondary/10 rounded-full">Live Now</span>
                        </div>
                        <div className="mt-8">
                            <p className="text-on-surface-variant dark:text-white/60 font-medium text-sm">Active Students</p>
                            <h3 className="text-5xl font-black text-on-surface dark:text-white mt-1">{activeStudents.toLocaleString()}</h3>
                        </div>
                    </div>

                    {/* Summary Column */}
                    <div className="md:col-span-2 lg:col-span-2 grid grid-rows-2 gap-6">
                        <div className="p-6 rounded-xl glass-panel shadow-[0px_0px_48px_rgba(45,52,50,0.06)] flex items-center space-x-6 border border-white/20 dark:border-white/5">
                            <div className="w-14 h-14 shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-800 dark:text-emerald-200">
                                <span className="material-symbols-outlined" data-icon="supervisor_account">supervisor_account</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-emerald-800/60 dark:text-emerald-200/60 uppercase tracking-widest">Teachers</p>
                                <div className="flex items-baseline space-x-2">
                                    <h4 className="text-2xl font-black text-emerald-900 dark:text-emerald-50">{activeTeachers.toLocaleString()}</h4>
                                    <span className="text-sm font-semibold text-emerald-800/50 dark:text-emerald-200/50">/ {totalTeachers.toLocaleString()}</span>
                                </div>
                                <p className="text-[10px] text-emerald-800/50 dark:text-emerald-200/50 font-medium">Currently Active</p>
                            </div>
                        </div>
                        <div className="p-6 rounded-xl glass-panel shadow-[0px_0px_48px_rgba(45,52,50,0.06)] flex items-center space-x-6 border border-white/20 dark:border-white/5">
                            <div className="w-14 h-14 shrink-0 rounded-full bg-emerald-800 dark:bg-emerald-700 flex items-center justify-center text-white">
                                <span className="material-symbols-outlined" data-icon="how_to_reg">how_to_reg</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-emerald-800/60 dark:text-emerald-200/60 uppercase tracking-widest">Classes Total</p>
                                <h4 className="text-2xl font-black text-emerald-900 dark:text-emerald-50">{totalClasses.toLocaleString()}</h4>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Creative Layout: Attendance & Class Insights */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Present Students Breakdown (Large Visual) */}
                    <div className="lg:col-span-7 p-10 rounded-2xl glass-panel shadow-[0px_0px_48px_rgba(45,52,50,0.06)] relative overflow-hidden group border border-white/20 dark:border-white/5">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 transition-transform duration-700 group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <h3 className="text-3xl font-black text-emerald-900 dark:text-white mb-8 brand-font">Daily Attendance Growth</h3>
                            <div className="flex flex-col md:flex-row items-end space-y-8 md:space-y-0 md:space-x-12">
                                <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
                                    {/* Organic SVG Progress (CSS Indicator) */}
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle className="text-surface-container-highest dark:text-white/10" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeWidth="16"></circle>
                                        <circle
                                            className="text-primary transition-all duration-1000 ease-in-out"
                                            cx="96" cy="96" fill="transparent" r="88" stroke="currentColor"
                                            strokeDasharray={dashArray}
                                            strokeDashoffset={dashOffset}
                                            strokeLinecap="round" strokeWidth="16"
                                        ></circle>
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-4xl font-black text-emerald-900 dark:text-white brand-font">{attendancePercentage}%</span>
                                        <span className="text-[10px] font-bold text-emerald-800/40 dark:text-white/40 uppercase tracking-tighter">Present Today</span>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-6">
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-emerald-800/60 dark:text-white/60">Present Students Today (Active)</p>
                                        <div className="flex items-baseline space-x-2">
                                            <h4 className="text-4xl font-black text-emerald-900 dark:text-white brand-font">
                                                {/* Rough estimate back-calculation for display if not fully tracked individually for today */}
                                                {Math.round(activeStudents * (attendancePercentage / 100)).toLocaleString()}
                                            </h4>
                                            <span className="text-lg font-medium text-emerald-800/40 dark:text-white/40">/ {activeStudents.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-primary-container/30 dark:bg-primary-container/10 rounded-2xl flex items-center space-x-4">
                                        <div className="w-10 h-10 shrink-0 rounded-full bg-primary flex items-center justify-center text-white">
                                            <span className="material-symbols-outlined text-sm" data-icon="trending_up">trending_up</span>
                                        </div>
                                        <p className="text-sm font-medium leading-tight text-emerald-900/80 dark:text-emerald-50">
                                            Tracking <span className="font-black text-emerald-900 dark:text-primary">{attendancePercentage}% total coverage</span> of daily attendance out of all active enrolled students.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Stats & Total Classes */}
                    <div className="lg:col-span-5 space-y-8">
                        {/* Total Classes Card */}
                        <div className="p-8 rounded-2xl bg-tertiary-container/30 dark:bg-tertiary-container/10 border border-tertiary/10 dark:border-white/5 flex justify-between items-center overflow-hidden relative">
                            <div className="relative z-10">
                                <p className="text-sm font-bold text-tertiary-dim dark:text-tertiary-container uppercase tracking-widest mb-1">Live Environment</p>
                                <h3 className="text-4xl font-black text-on-tertiary-container dark:text-white brand-font">{totalClasses} Classes</h3>
                                <p className="text-on-tertiary-container/70 dark:text-white/60 text-sm mt-2">Actively scheduled & grouped</p>
                            </div>
                            <span className="material-symbols-outlined text-8xl text-tertiary/20 absolute -right-4 -bottom-4" data-icon="meeting_room">meeting_room</span>
                        </div>

                        {/* Fine-Grained Attendance Status */}
                        <div className="p-8 rounded-2xl glass-panel shadow-[0px_0px_48px_rgba(45,52,50,0.06)] border border-white/20 dark:border-white/5 space-y-6">
                            <h4 className="text-xl font-bold text-emerald-900 dark:text-white brand-font">Attendance Anomalies</h4>
                            <div className="space-y-4">
                                {/* Late */}
                                <div className="flex items-center justify-between group">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-2 h-10 bg-amber-400 rounded-full"></div>
                                        <div>
                                            <p className="text-sm font-bold dark:text-white">Late</p>
                                            <p className="text-xs text-on-surface-variant dark:text-white/60">Arrived late to class</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black dark:text-white brand-font">{att.late}%</p>
                                    </div>
                                </div>

                                {/* Leave */}
                                <div className="flex items-center justify-between group">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-2 h-10 bg-blue-400 rounded-full"></div>
                                        <div>
                                            <p className="text-sm font-bold dark:text-white">Leave</p>
                                            <p className="text-xs text-on-surface-variant dark:text-white/60">Approved medical/family</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black dark:text-white brand-font">{att.leave}%</p>
                                    </div>
                                </div>

                                {/* Absent */}
                                <div className="flex items-center justify-between group">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-2 h-10 bg-red-400 rounded-full"></div>
                                        <div>
                                            <p className="text-sm font-bold dark:text-white">Absent</p>
                                            <p className="text-xs text-on-surface-variant dark:text-white/60">Unexcused absence</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black dark:text-white brand-font">{att.absent}%</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
            
            {/* Bottom Navigation spacer for mobile */}
            <div className="h-20 md:hidden"></div>
        </div>
    );
}
