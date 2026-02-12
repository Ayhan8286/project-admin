"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, GraduationCap, ClipboardCheck, BookOpen, Video, Settings, MessageSquareWarning, Library, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const navItems = [
    {
        label: "Dashboard",
        href: "/",
        icon: Home,
    },
    {
        label: "Students",
        href: "/students",
        icon: Users,
    },
    {
        label: "Teachers",
        href: "/teachers",
        icon: BookOpen,
    },
    {
        label: "Platforms",
        href: "/platforms",
        icon: Video,
    },
    {
        label: "Subjects",
        href: "/subjects",
        icon: Library,
    },
    {
        label: "Finance",
        href: "/finance",
        icon: DollarSign,
    },
    {
        label: "Attendance",
        href: "/attendance",
        icon: ClipboardCheck,
    },
    {
        label: "Complaints",
        href: "/complaints",
        icon: MessageSquareWarning,
    },
    {
        label: "Settings",
        href: "/settings",
        icon: Settings,
    },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-background md:flex">
            <div className="flex h-16 items-center gap-2 border-b px-6">
                <GraduationCap className="h-6 w-6 text-primary" />
                <span className="text-lg font-semibold">AL Huda Network</span>
            </div>
            <nav className="flex-1 space-y-1 p-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                isActive
                                    ? "bg-accent text-accent-foreground"
                                    : "text-muted-foreground"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
            <Separator />
            <div className="p-4">
                <p className="text-xs text-muted-foreground">
                    © 2026 School Management
                </p>
            </div>
        </aside>
    );
}
