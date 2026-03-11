"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getComplaints, updateComplaintStatus, deleteComplaint } from "@/lib/api/complaints";
import { AddComplaintDialog } from "@/components/dialogs/AddComplaintDialog";
import { ComplaintDetailDialog } from "@/components/dialogs/ComplaintDetailDialog";
import { LoadingShimmer } from "@/components/ui/LoadingShimmer";
import { format } from "date-fns";
import { Complaint } from "@/types/complaint";
import { cn } from "@/lib/utils";
import {
    Search,
    Bell,
    Plus,
    TrendingUp,
    MailWarning,
    Clock,
    CheckCircle2,
    ArrowUpDown,
    Filter,
    MoreHorizontal,
    CalendarClock,
    UserPlus,
    X,
    History,
    MessageCircle,
    Check,
    CheckCircle,
    Trash2
} from "lucide-react";

export default function ComplaintsPage() {
    const queryClient = useQueryClient();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

    const { data: complaints = [], isLoading } = useQuery({
        queryKey: ["complaints"],
        queryFn: getComplaints,
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => updateComplaintStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["complaints"] });
        },
    });

    const handleStatusChange = (id: string, currentStatus: string) => {
        let newStatus = currentStatus;
        if (currentStatus === "Pending") newStatus = "Reviewed";
        else if (currentStatus === "Reviewed") newStatus = "Resolved";
        else newStatus = "Pending";

        updateStatusMutation.mutate({ id, status: newStatus });
    };

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteComplaint(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["complaints"] });
        },
    });

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this ticket?")) {
            deleteMutation.mutate(id);
            if (selectedComplaint?.id === id) {
                setSelectedComplaint(null);
            }
        }
    };

    // Filter by search
    const filteredComplaints = complaints
        .filter((c: Complaint) =>
            c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.student?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a: Complaint, b: Complaint) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
        });

    // Grouping
    const openComplaints = filteredComplaints.filter((c: Complaint) => c.status === "Pending");
    const inProgressComplaints = filteredComplaints.filter((c: Complaint) => c.status === "Reviewed");
    const resolvedComplaints = filteredComplaints.filter((c: Complaint) => c.status === "Resolved");

    // Dynamic Stats
    const totalOpen = complaints.filter((c: Complaint) => c.status === "Pending").length;
    const totalPending = complaints.filter((c: Complaint) => c.status === "Reviewed").length;
    const totalResolved = complaints.filter((c: Complaint) => c.status === "Resolved").length;

    const getPriorityDetails = (complaint: Complaint) => {
        // Mock priority based on some logic or status since backend doesn't explicitly store priority
        if (complaint.status === "Pending") return { label: "High Priority", colorClass: "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400", indicatorClass: "bg-red-500" };
        if (complaint.status === "Reviewed") return { label: "Critical", colorClass: "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400", indicatorClass: "bg-red-500" };
        return { label: "Low Priority", colorClass: "bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:border-green-900/30 dark:text-green-400", indicatorClass: "bg-green-500" };
    };

    return (
        <div className="flex flex-col p-6 lg:p-8 gap-6">

            {/* Gen Z Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-muted-foreground mb-1">Support</p>
                    <h1 className="text-3xl font-black tracking-tight text-foreground leading-none">
                        Help Desk
                        <span className="text-primary ml-2 text-2xl">✦</span>
                    </h1>
                    <p className="text-muted-foreground mt-1.5 text-sm">Track and resolve student complaints and tickets.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        <input
                            className="pill-input pl-10 pr-5 py-2.5 bg-card border border-border text-sm text-foreground w-56 placeholder:text-muted-foreground/50"
                            placeholder="Search tickets..."
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-forest hover:bg-forest/90 text-white font-black rounded-full text-sm fab-glow transition-all shrink-0"
                    >
                        <Plus className="h-4 w-4" />
                        New Ticket
                    </button>
                </div>
            </div>

            {/* Gen Z Metric Cards */}
            <div className="flex items-center gap-3">
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">Ticket Status</span>
                <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                {[
                    { label: "Open Tickets", value: isLoading ? "-" : totalOpen, sub: "Active today", accent: "#f87171", Icon: MailWarning, tag: "High Priority" },
                    { label: "Pending Resolution", value: isLoading ? "-" : totalPending, sub: "Under review", accent: "#fb923c", Icon: Clock, tag: "In Review" },
                    { label: "Resolved", value: isLoading ? "-" : totalResolved, sub: "Completed", accent: "#13ec37", Icon: CheckCircle2, tag: "Closed" },
                ].map(({ label, value, sub, accent, Icon, tag }, i) => (
                    <div key={i} className="card-hover relative bg-card rounded-3xl p-5 border border-border overflow-hidden group flex flex-col gap-3">
                        <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-xl opacity-50 group-hover:opacity-80 transition-opacity" style={{ background: accent }} />
                        <div className="flex items-start justify-between">
                            <div className="relative w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${accent}18` }}>
                                <Icon className="h-5 w-5" style={{ color: accent }} />
                            </div>
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border" style={{ color: accent, background: `${accent}14`, borderColor: `${accent}30` }}>{tag}</span>
                        </div>
                        <div className="relative">
                            <p className="text-4xl font-black tracking-tight" style={{ color: accent }}>{value}</p>
                            <p className="text-[11px] font-bold text-foreground mt-1.5">{label}</p>
                            <p className="text-[10px] text-muted-foreground">{sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Kanban Controls Row */}
            <div className="flex flex-wrap justify-between items-center gap-4 shrink-0">
                <h3 className="text-lg font-black text-foreground flex items-center gap-3">
                    Ticket Queue
                    <span className="text-[11px] font-bold text-muted-foreground bg-accent px-3 py-1.5 rounded-full">{filteredComplaints.length} tickets</span>
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : "desc")}
                        className="bg-card border border-border px-4 py-2 rounded-full text-sm font-bold text-muted-foreground flex items-center gap-2 hover:bg-accent hover:text-foreground transition-colors transition-all active:scale-95"
                    >
                        <ArrowUpDown className="h-4 w-4" />
                        Sort by: {sortOrder === "desc" ? "Newest" : "Oldest"}
                    </button>
                </div>
            </div>

            {/* Kanban Board Area */}
            <div className="overflow-x-auto pb-4">
                {isLoading ? (
                    <div className="p-4"><LoadingShimmer rows={10} /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-w-[900px]">

                        {/* Column 1: Open Tickets */}
                        <div className="flex flex-col gap-4 pr-2">
                            <div className="flex items-center justify-between px-1 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-2.5 w-2.5 rounded-full bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]"></div>
                                    <h4 className="font-black text-red-400 uppercase tracking-widest text-xs">Open Tickets</h4>
                                    <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold">{openComplaints.length}</span>
                                </div>
                                <button className="text-muted-foreground hover:text-foreground transition-colors"><MoreHorizontal className="h-5 w-5" /></button>
                            </div>

                            {openComplaints.length === 0 && <p className="text-sm font-semibold text-muted-foreground p-3">No open tickets inline.</p>}

                            {openComplaints.map(complaint => {
                                const priority = getPriorityDetails(complaint);
                                return (
                                    <div
                                        key={complaint.id}
                                        onClick={() => setSelectedComplaint(complaint)}
                                        className="bg-card border border-border rounded-3xl p-5 shadow-sm hover:shadow-lg transition-all group relative shrink-0 text-left card-hover hover:border-red-500/30 cursor-pointer"
                                    >
                                        <div className={cn("absolute left-0 top-6 bottom-6 w-1.5 rounded-r-full shadow-[0_0_10px_rgba(248,113,113,0.5)] bg-red-400")}></div>
                                        <div className="pl-3">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex gap-2 items-center">
                                                    <span className={cn("text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border", priority.colorClass)}>
                                                        {priority.label}
                                                    </span>
                                                    <span className="text-muted-foreground text-[11px] font-bold">#{complaint.id.split('-')[0]}</span>
                                                </div>
                                                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                                                    <CalendarClock className="h-3.5 w-3.5" />
                                                    {format(new Date(complaint.created_at), "K:mm a")}
                                                </span>
                                            </div>
                                            <h5 className="font-black text-foreground text-sm mb-2 leading-snug group-hover:text-red-400 transition-colors">{complaint.title || `Issue regarding ${complaint.teacher?.name}`}</h5>
                                            <p className="text-muted-foreground text-xs mb-5 font-medium leading-relaxed line-clamp-2">{complaint.description}</p>

                                            <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-[11px] font-black text-primary border border-primary/20">
                                                        {complaint.student?.full_name?.charAt(0) || 'S'}
                                                    </div>
                                                    <span className="text-xs font-bold text-foreground">{complaint.student?.full_name}</span>
                                                </div>
                                                <div className="flex gap-2 opacity-0 group-[.hover]:opacity-100 lg:group-hover:opacity-100 transition-opacity">
                                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(complaint.id); }} disabled={deleteMutation.isPending} className="p-2 hover:bg-destructive/10 rounded-xl text-muted-foreground hover:text-destructive font-semibold disabled:opacity-50" title="Delete Ticket">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleStatusChange(complaint.id, complaint.status); }} className="p-2 hover:bg-accent rounded-xl text-muted-foreground hover:text-red-400 font-semibold" title="Review Ticket">
                                                        <UserPlus className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Column 2: In Progress / Reviewed */}
                        <div className="flex flex-col gap-4 pr-2">
                            <div className="flex items-center justify-between px-1 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-2.5 w-2.5 rounded-full bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.5)]"></div>
                                    <h4 className="font-black text-orange-400 uppercase tracking-widest text-xs">In Progress</h4>
                                    <span className="bg-orange-500/10 text-orange-500 border border-orange-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold">{inProgressComplaints.length}</span>
                                </div>
                                <button className="text-muted-foreground hover:text-foreground transition-colors"><MoreHorizontal className="h-5 w-5" /></button>
                            </div>

                            {inProgressComplaints.length === 0 && <p className="text-sm font-semibold text-muted-foreground p-3">No tickets under review.</p>}

                            {inProgressComplaints.map(complaint => {
                                const priority = getPriorityDetails(complaint);
                                return (
                                    <div
                                        key={complaint.id}
                                        onClick={() => setSelectedComplaint(complaint)}
                                        className="bg-card border border-border rounded-3xl p-5 shadow-sm hover:shadow-lg transition-all group relative shrink-0 text-left card-hover hover:border-orange-500/30 cursor-pointer"
                                    >
                                        <div className="absolute left-0 top-6 bottom-6 w-1.5 bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.5)] rounded-r-full"></div>
                                        <div className="pl-3">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex gap-2 items-center">
                                                    <span className="bg-orange-500/10 text-orange-500 border border-orange-500/20 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">Under Review</span>
                                                    <span className="text-muted-foreground text-[11px] font-bold">#{complaint.id.split('-')[0]}</span>
                                                </div>
                                                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                                                    <History className="h-3.5 w-3.5" />
                                                    {format(new Date(complaint.created_at), "MMM d")}
                                                </span>
                                            </div>
                                            <h5 className="font-black text-foreground text-sm mb-2 leading-snug group-hover:text-orange-400 transition-colors">{complaint.title || `Issue regarding ${complaint.teacher?.name}`}</h5>
                                            <p className="text-muted-foreground text-xs mb-5 font-medium leading-relaxed line-clamp-2">{complaint.description}</p>

                                            <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-7 w-7 rounded-full bg-accent flex items-center justify-center text-[11px] font-black text-foreground border border-border">
                                                        {complaint.student?.full_name?.charAt(0) || 'S'}
                                                    </div>
                                                    <span className="text-xs font-bold text-foreground">{complaint.student?.full_name}</span>
                                                </div>
                                                <div className="flex gap-2 opacity-0 group-[.hover]:opacity-100 lg:group-hover:opacity-100 transition-opacity">
                                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(complaint.id); }} disabled={deleteMutation.isPending} className="p-2 hover:bg-destructive/10 rounded-xl text-muted-foreground hover:text-destructive font-semibold disabled:opacity-50" title="Delete Ticket">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); updateStatusMutation.mutate({ id: complaint.id, status: "Pending" }); }} className="p-2 hover:bg-accent rounded-xl text-muted-foreground hover:text-red-400 font-semibold" title="Revert to Open">
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleStatusChange(complaint.id, complaint.status); }} className="p-2 bg-primary/10 hover:bg-primary/20 rounded-xl text-primary font-semibold" title="Mark Resolved">
                                                        <Check className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Column 3: Resolved */}
                        <div className="flex flex-col gap-4 pr-2">
                            <div className="flex items-center justify-between px-1 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-2.5 w-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                                    <h4 className="font-black text-green-400 uppercase tracking-widest text-xs">Resolved</h4>
                                    <span className="bg-green-500/10 text-green-500 border border-green-500/20 text-[10px] px-2.5 py-0.5 rounded-full font-bold">{resolvedComplaints.length}</span>
                                </div>
                                <button className="text-muted-foreground hover:text-foreground transition-colors"><MoreHorizontal className="h-5 w-5" /></button>
                            </div>

                            {resolvedComplaints.length === 0 && <p className="text-sm font-semibold text-muted-foreground p-3">No resolved tickets yet.</p>}

                            {resolvedComplaints.map(complaint => (
                                <div
                                    key={complaint.id}
                                    onClick={() => setSelectedComplaint(complaint)}
                                    className="bg-card/60 border border-border rounded-3xl p-5 opacity-75 hover:opacity-100 transition-opacity shrink-0 text-left card-hover cursor-pointer"
                                >
                                    <div className="pl-1">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex gap-2 items-center">
                                                <span className="bg-green-500/10 text-green-500 border border-green-500/20 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1.5">
                                                    <CheckCircle className="h-3 w-3" /> Resolved
                                                </span>
                                                <span className="text-muted-foreground text-[11px] font-bold">#{complaint.id.split('-')[0]}</span>
                                            </div>
                                        </div>
                                        <h5 className="font-black text-muted-foreground text-sm mb-2 leading-snug line-through decoration-muted-foreground">{complaint.title || `Issue regarding ${complaint.teacher?.name}`}</h5>
                                        <p className="text-muted-foreground/70 text-xs mb-4 font-medium line-clamp-2">{complaint.description}</p>

                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                                            <div className="flex items-center gap-3">
                                                <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center text-[9px] font-black text-muted-foreground border border-border">
                                                    {complaint.student?.full_name?.charAt(0) || 'S'}
                                                </div>
                                                <span className="text-xs font-bold text-muted-foreground">{complaint.student?.full_name}</span>
                                            </div>
                                            <span className="text-[11px] font-semibold text-muted-foreground">{format(new Date(complaint.created_at), "MMM d")}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                )}
            </div>

            <AddComplaintDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
            <ComplaintDetailDialog
                complaint={selectedComplaint}
                open={!!selectedComplaint}
                onOpenChange={(open) => !open && setSelectedComplaint(null)}
                onDelete={handleDelete}
            />
        </div>
    );
}
