"use client";

import { useQuery } from "@tanstack/react-query";
import { getTasks } from "@/lib/api/tasks";
import { ListTodo, Clock, CheckCircle2, MessageSquare, ArrowRight, Star } from "lucide-react";
import Link from "next/link";
import { STALE_SHORT } from "@/lib/query-config";

interface EmployeeDashboardProps {
    employeeId: string;
    department: string;
    employeeName: string;
}

export function EmployeeDashboard({ employeeId, department, employeeName }: EmployeeDashboardProps) {
    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ["my-tasks", employeeId],
        queryFn: () => getTasks({ supervisor_id: employeeId }),
        ...STALE_SHORT
    });

    const stats = {
        total: tasks.length,
        todo: tasks.filter(t => t.status === 'todo').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
        done: tasks.filter(t => t.status === 'done').length
    };

    const recentTasks = tasks.slice(0, 3);

    return (
        <div className="flex flex-col gap-8 w-full animate-entrance">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider rounded-full border border-primary/20">
                        {department}
                    </span>
                </div>
                <h2 className="text-4xl font-black tracking-tight text-foreground">
                    Welcome back, {employeeName.split(' ')[0]}!
                    <span className="text-primary ml-2">✦</span>
                </h2>
                <p className="text-muted-foreground text-sm font-medium">Here's an overview of your active projects and tasks.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Tasks", value: stats.total, icon: ListTodo, color: "text-primary", bg: "bg-primary/5" },
                    { label: "To Do", value: stats.todo, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/5" },
                    { label: "In Progress", value: stats.inProgress, icon: Star, color: "text-emerald-500", bg: "bg-emerald-500/5" },
                    { label: "Completed", value: stats.done, icon: CheckCircle2, color: "text-blue-500", bg: "bg-blue-500/5" },
                ].map((stat, i) => (
                    <div key={i} className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col gap-3">
                        <div className={`size-10 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                            <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-3xl font-black text-foreground">{isLoading ? "..." : stat.value}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xl font-bold text-foreground">Active Tasks</h3>
                        <Link href="/tasks" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                            View All <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>

                    <div className="flex flex-col gap-3">
                        {isLoading ? (
                            [1, 2].map(i => <div key={i} className="h-24 glass-panel rounded-3xl animate-pulse" />)
                        ) : recentTasks.length === 0 ? (
                            <div className="glass-panel rounded-[2rem] p-12 text-center border border-white/5 opacity-60">
                                <p className="font-bold">No tasks assigned yet.</p>
                                <p className="text-xs mt-1">Check back later or contact your admin.</p>
                            </div>
                        ) : (
                            recentTasks.map(task => (
                                <div key={task.id} className="glass-panel p-5 rounded-3xl border border-white/10 hover:border-primary/20 transition-all group">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`size-2 rounded-full ${
                                                task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                                            }`} />
                                            <span className="text-[10px] font-black uppercase opacity-60 tracking-wider">
                                                {task.priority} Priority
                                            </span>
                                        </div>
                                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${
                                            task.status === 'done' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'
                                        }`}>
                                            {task.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{task.title}</h4>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.description}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <h3 className="text-xl font-bold text-foreground px-2">Communications</h3>
                    <div className="glass-panel rounded-[2rem] p-6 border border-white/10 bg-forest/5 flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-2xl bg-forest/20 flex items-center justify-center text-forest">
                                <MessageSquare className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-foreground leading-tight">Admin Support</h4>
                                <p className="text-[10px] text-muted-foreground uppercase font-black">Direct Channel</p>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Need help or have questions about your tasks? Use the floating chat button to start a real-time conversation with the administration.
                        </p>
                        <div className="pt-2 border-t border-white/5">
                            <p className="text-[10px] font-bold text-muted-foreground mb-4">MEMBER SINCE</p>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-foreground">April 2026</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
