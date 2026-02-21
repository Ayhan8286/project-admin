"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home, Users, GraduationCap, ClipboardCheck, BookOpen,
    Video, Settings, MessageSquareWarning, Library, DollarSign,
    ChevronLeft, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { label: "Dashboard", href: "/", icon: Home },
    { label: "Students", href: "/students", icon: Users },
    { label: "Teachers", href: "/teachers", icon: BookOpen },
    { label: "Platforms", href: "/platforms", icon: Video },
    { label: "Subjects", href: "/subjects", icon: Library },
    { label: "Finance", href: "/finance", icon: DollarSign },
    { label: "Attendance", href: "/attendance", icon: ClipboardCheck },
    { label: "Complaints", href: "/complaints", icon: MessageSquareWarning },
    { label: "Supervisors", href: "/supervisors", icon: Users },
    { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside
            className={cn(
                "glass-sidebar fixed inset-y-0 left-0 z-30 hidden flex-col transition-all duration-300 ease-in-out md:flex",
                collapsed ? "w-16" : "w-64"
            )}
        >
            {/* Logo */}
            <div className={cn(
                "flex h-16 items-center border-b border-white/7 px-4 gap-3 shrink-0",
                collapsed && "justify-center px-2"
            )}>
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/30 shrink-0">
                    <GraduationCap className="h-4 w-4 text-white" />
                </div>
                {!collapsed && (
                    <span className="text-gradient text-base font-bold tracking-tight whitespace-nowrap">
                        AL Huda Network
                    </span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto scrollbar-hide">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={collapsed ? item.label : undefined}
                            className={cn(
                                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                collapsed && "justify-center px-2",
                                isActive
                                    ? "nav-active-glow text-violet-300"
                                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                            )}
                        >
                            <item.icon className={cn(
                                "shrink-0 transition-all duration-200",
                                collapsed ? "h-5 w-5" : "h-4 w-4",
                                isActive
                                    ? "text-violet-400 drop-shadow-[0_0_6px_rgba(139,92,246,0.8)]"
                                    : "group-hover:text-violet-400 group-hover:scale-110"
                            )} />
                            {!collapsed && (
                                <span className="truncate">{item.label}</span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer + Collapse Toggle */}
            <div className={cn(
                "shrink-0 border-t border-white/7 p-3 flex items-center",
                collapsed ? "justify-center" : "justify-between"
            )}>
                {!collapsed && (
                    <p className="text-xs text-slate-500 truncate">© 2026 AL Huda</p>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="flex items-center justify-center w-7 h-7 rounded-md text-slate-500 hover:text-violet-400 hover:bg-white/5 transition-all duration-200"
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {collapsed
                        ? <ChevronRight className="h-4 w-4" />
                        : <ChevronLeft className="h-4 w-4" />
                    }
                </button>
            </div>
        </aside>
    );
}
