"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    UsersRound,
    User,
    Users,
    Layers,
    CalendarCheck,
    MessageSquare,
    Settings,
    LogOut,
    Menu,
    X,
    GraduationCap
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Supervisors", href: "/supervisors", icon: UsersRound },
    { label: "Teachers", href: "/teachers", icon: User },
    { label: "Students", href: "/students", icon: Users },
    { label: "Platforms", href: "/platforms", icon: Layers },
    { label: "Attendance", href: "/attendance", icon: CalendarCheck },
    { label: "Complaints", href: "/complaints", icon: MessageSquare },
    { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    const SidebarContent = () => (
        <>
            {/* Logo area with glow */}
            <div className="px-6 pt-7 pb-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 flex items-center justify-center">
                        {/* Glow behind icon */}
                        <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-md" />
                        <div className="relative w-10 h-10 bg-gradient-to-br from-primary/30 to-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                            <GraduationCap className="h-5 w-5 text-primary" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-base font-black tracking-tight heading-gradient">AL Huda LMS</h1>
                        <p className="text-[10px] text-white/40 font-medium tracking-wider uppercase">Management</p>
                    </div>
                </div>
                <button
                    className="lg:hidden p-2 text-white/40 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                    onClick={() => setMobileOpen(false)}
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 px-3 pb-2">Navigation</p>
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3.5 py-2.5 rounded-2xl transition-all duration-200 relative group",
                                isActive
                                    ? "bg-primary/20 text-white shadow-sm"
                                    : "text-white/55 hover:text-white hover:bg-white/6"
                            )}
                        >
                            {/* Active indicator dot */}
                            {isActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                            )}
                            <item.icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-primary" : "text-white/50 group-hover:text-white/80")} />
                            <span className={cn("font-semibold text-[13px]", isActive ? "text-white" : "")}>{item.label}</span>
                            {isActive && (
                                <span className="ml-auto w-2 h-2 rounded-full bg-primary active-dot" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User + Logout */}
            <div className="px-4 pb-5 pt-3 shrink-0">
                <div className="rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/10 to-emerald-900/20 p-3 flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-primary/25 flex items-center justify-center text-sm font-black text-primary border border-primary/20 shrink-0">
                        AR
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-white truncate">A. Rahman</p>
                        <p className="text-[10px] text-white/40 truncate">Super Admin</p>
                    </div>
                </div>
                <button className="flex items-center gap-3 px-3.5 py-2.5 text-white/40 hover:text-white/80 hover:bg-white/5 rounded-2xl transition-colors w-full text-left">
                    <LogOut className="h-4 w-4" />
                    <span className="font-medium text-[13px]">Logout</span>
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-4 z-30 bg-[#f6f8f6]/80 dark:bg-[#102212]/80 backdrop-blur-md border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/15 rounded-xl flex items-center justify-center border border-primary/20">
                        <GraduationCap className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-black tracking-tight text-foreground">AL Huda LMS</span>
                </div>
                <button
                    onClick={() => setMobileOpen(true)}
                    className="p-2 -mr-2 text-slate-500 hover:text-primary rounded-xl transition-colors"
                >
                    <Menu className="h-5 w-5" />
                </button>
            </header>

            {/* Mobile Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden",
                    mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setMobileOpen(false)}
                aria-hidden="true"
            />

            {/* Desktop Sidebar */}
            <aside className="w-64 bg-gradient-to-b from-[#1e3d22] to-[#0f2011] text-white flex-shrink-0 flex-col hidden lg:flex h-full overflow-hidden border-r border-white/5 noise-overlay">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar */}
            <aside
                className={cn(
                    "fixed top-0 bottom-0 left-0 w-[280px] bg-gradient-to-b from-[#1e3d22] to-[#0f2011] text-white z-50 flex flex-col transition-transform duration-300 ease-in-out lg:hidden h-full overflow-hidden border-r border-white/5 noise-overlay",
                    mobileOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <SidebarContent />
            </aside>
        </>
    );
}
