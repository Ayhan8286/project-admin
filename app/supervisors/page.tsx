"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupervisors, addSupervisor, deleteSupervisor } from "@/lib/api/supervisors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Plus, Search, Loader2, Users, Trash2, ShieldCheck,
    Bell, HelpCircle, Download, MoreVertical, Mail, Phone,
    ChevronLeft, ChevronRight
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";

// Placeholder data arrays to enrich the API data for the UI
const placeholderRoles = [
    "Science Department Head",
    "Mathematics Senior Lead",
    "Arts & Humanities Lead",
    "Physical Education Supervisor",
    "Research Coordinator",
    "Ethics & Policy Lead"
];
const placeholderAvatars = [
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBrIoAtvN3GQ85WgwsNfmcAvVWfZeJ-0Cxl-cvMOMN-az-Y2gka_3fEN7urgkJJoikssLjc5X8KiCOvmHU3mJPO1OF8Ngz65fydDrfIPVJxdlIhNC5zNBezXg8zks3XwSj_rha0aapFzEGOpy407AvLuK4Z5cQc1XIrlePf5DnNv4_h3MiyxEqJFM1yrlwqJGIbBirs8iK6vPzYIwZOCQAUpX8f1K0Z3SVu2_6t_ZDBpQ4Sxw8RMJK2OFGw4-QeFxBt7puFN_adCZU",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuD00CNm0XRMT0c4CACeo15HD-cw-uuGEvZbq4lEvodzpLvgLTIPvv-eHO9zif0W46MUXXGqlPuHwVEmInOZVInYiXSXRQkiJJKviAMET1k_7Fcbw8su1g9r5KR5YwulcVg0gLsrCVu3UvCVQzAcqIm-BVGznnx0mC5l_OrijlJjhEhSgA_kSytc37KQ2YNlRiH0qnnbj534VTtOjeqd3pe7xLfpY7aygDIPSnfHyURCOzWbsG1j5pBj2F1GJOV97TBqq3McTQgYwLM",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBBJEyg9pTzhSqwwcG5zYK9KVJlcA7BvTgw0RRIDvw23JSnkFbImpiE8WzlAUoUnw-q0TnJgxYhsTPDEY_N7SM7P9GrrjeLWrB4PLiEV_KHcRbjHaBpnvkPtxntFdAKG23dcXQLEkTtc368SZ3AQBs_7uwK1xmDogz30quj7H2PZsJ3i6_t9Ix3C4tsFZNovhqiEYtPYfrMlsZiLy36zNGyeSi3gDRYfcfJKRG_Cuz5WWIqkKCvea2spbaXVmPnVOV1O1ulSqU8dUc",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAsSg2mUp2pu6c24pAavh5IMTHx17Qe5Nm2bUtpp4G44OWWjXJGZO1RSHcnsyo1nEidswX7Q8XFrMYBYKnKqv3TTZIAqwewb3SWfhmyw__NxRTZ3XxQQMAd78aPmkbhDjnQzgKFNopYCP_LTvIpAcIo7CDBjR5Y0OkLiZraIlK60cz_SwGZRgzi1YLC_vXlB_3Gr-oRSo8sHDlHFtJMtYbn-sizWEQalQ6rlUOuqwJWkMnco7zXVOguFcmBiKNtymkH98qW3ruOnAM",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAr3sVQGyBmtXQWu9LgpamkFCN3WmUNBgG_36ZGla_F0NktW_DwIk1xgoqDf1gOm8ok7T5_w5f__aoYRM5Pm-er0g_o1_hrF3BEpym8aNps8bkagFkcEOBG9rlZVextwTTToedLL_mVn5G8we3S0BPrRpYOuIm9ZWJXSSjYb6nlqbwGWGnFCMlsZRSc41ZUmOU0CXigxR2KRuXuvcywlAZCd433I6FDqrpTZZU2sstLc_KA9uXm5qIACUPWdSoArDjB134u3HiKVn0",
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBWSDAba86vGuxkf3y5Z-l3uU1rJLxWpf397WPYilLyuVyLSexFhxDQzkqcIBuYqITpE3vNoCsa_T4n2iYCh-BVdUN9nDAjKCrhBfQTPMz2lTyQavNSsI9VUW-CRraaEW1nHgBEXQf7P1JT0-gq0vk6xCgMBwS_RQrz9J5ikZIVBMVO7i1wBV18jsRTl4wAo0AmF1vvSL97ua4Pp4jS07wljkyBPWO5WjvUmqxYNti_UTy8wESI4h4q0Vd4-Ug5rI4M-6W_OBVAjdg"
];
const placeholderStats = [
    { teachers: 12, students: 142, statusColor: "bg-green-500" },
    { teachers: 8, students: 96, statusColor: "bg-green-500" },
    { teachers: 15, students: 184, statusColor: "bg-amber-500" },
    { teachers: 6, students: 210, statusColor: "bg-green-500" },
    { teachers: 4, students: 32, statusColor: "bg-gray-400" },
    { teachers: 10, students: 128, statusColor: "bg-green-500" }
];

export default function SupervisorsPage() {
    const [search, setSearch] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: deleteSupervisor,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["supervisors"] });
            toast.success("Supervisor deleted successfully");
        },
        onError: () => {
            toast.error("Failed to delete supervisor");
        },
    });

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to delete ${name}?`)) {
            deleteMutation.mutate(id);
        }
    };

    const { data: supervisors = [], isLoading } = useQuery({
        queryKey: ["supervisors"],
        queryFn: getSupervisors,
    });

    const filteredSupervisors = supervisors.filter((supervisor) =>
        supervisor.name.toLowerCase().includes(search.toLowerCase()) ||
        (supervisor.email && supervisor.email.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="flex-1 overflow-y-auto flex flex-col">

            {/* Gen Z Page Body */}
            <div className="p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">

                {/* Gen Z Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-muted-foreground mb-1">Leadership</p>
                        <h1 className="text-3xl font-black tracking-tight text-foreground leading-none">
                            Supervisors
                            <span className="text-primary ml-2 text-2xl">✦</span>
                        </h1>
                        <p className="text-muted-foreground mt-1.5 text-sm">Manage department heads and view faculty oversight.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-full text-sm font-bold hover:border-primary/30 transition-all text-foreground">
                            <Download className="h-4 w-4" />
                            Export CSV
                        </button>
                        <button
                            onClick={() => setIsAddDialogOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-forest hover:bg-forest/90 text-white font-black rounded-full text-sm fab-glow transition-all shrink-0"
                        >
                            <Plus className="h-4 w-4" />
                            Add Supervisor
                        </button>
                    </div>
                </div>

                {/* Gen Z KPI Cards */}
                <div className="flex items-center gap-3">
                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">Overview</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="card-hover relative bg-card rounded-3xl p-5 border border-border overflow-hidden group flex flex-col gap-3">
                        <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-xl opacity-50 group-hover:opacity-80 transition-opacity" style={{ background: "#13ec37" }} />
                        <div className="relative w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(19, 236, 55, 0.09)" }}>
                            <ShieldCheck className="h-5 w-5 text-primary" />
                        </div>
                        <div className="relative">
                            <p className="text-3xl font-black tracking-tight text-primary">{isLoading ? "-" : supervisors.length}</p>
                            <p className="text-[11px] font-bold text-foreground mt-1.5">Total Supervisors</p>
                            <p className="text-[10px] text-muted-foreground">In directory</p>
                        </div>
                    </div>
                </div>

                {/* Search + Filter Section */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
                        <input
                            className="pill-input w-full pl-10 pr-5 py-2.5 bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground/50"
                            placeholder="Search supervisors by name or email..."
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                </div>

                {filteredSupervisors.length === 0 ? (
                    <div className="text-center p-12 bg-card rounded-2xl border border-border">
                        <p className="text-muted-foreground">No supervisors found matching your search.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSupervisors.map((supervisor, index) => {
                            const role = placeholderRoles[index % placeholderRoles.length];
                            const avatar = placeholderAvatars[index % placeholderAvatars.length];
                            const stats = placeholderStats[index % placeholderStats.length];

                            return (
                                <div key={supervisor.id} className="card-hover bg-card rounded-2xl border border-border overflow-hidden flex flex-col">
                                    <div className="p-6 pb-4 flex-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="relative">
                                                <img
                                                    className="size-20 rounded-2xl object-cover ring-4 ring-primary/10"
                                                    alt={supervisor.name}
                                                    src={avatar}
                                                />
                                                <div className={`absolute -bottom-2 -right-2 ${stats.statusColor} size-4 rounded-full border-2 border-card`}></div>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleDelete(supervisor.id, supervisor.name)}
                                                    className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors rounded-xl hover:bg-red-500/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                                <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-card">
                                                    <MoreVertical className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black text-foreground mb-1">{supervisor.name}</h4>
                                            <p className="text-primary text-sm font-bold mb-3">{role}</p>
                                            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                                <Mail className="h-4 w-4" />
                                                <span className="truncate">{supervisor.email || "No email"}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                                <Phone className="h-4 w-4" />
                                                <span>{supervisor.phone || "No phone"}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-6 py-4 bg-primary/[0.03] border-t border-border grid grid-cols-2 gap-4">
                                        <div className="text-center">
                                            <p className="text-2xl font-black text-primary">{stats.teachers}</p>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Teachers</p>
                                        </div>
                                        <div className="text-center border-l border-border pl-4">
                                            <p className="text-2xl font-black text-primary">{stats.students}</p>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Students</p>
                                        </div>
                                    </div>
                                    <div className="p-4 grid grid-cols-2 gap-3">
                                        <button className="py-2.5 rounded-full text-sm font-bold border border-border text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all">
                                            Contact
                                        </button>
                                        <Link href={`/supervisors/${supervisor.id}`} className="py-2.5 flex items-center justify-center rounded-full text-sm font-black bg-forest text-white fab-glow hover:bg-forest/90 transition-all">
                                            View Teachers
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-border pt-6">
                    <p className="text-sm text-muted-foreground">Showing {filteredSupervisors.length} supervisors</p>
                    <div className="flex gap-2">
                        <button className="size-9 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-card disabled:opacity-50" disabled>
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button className="size-9 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-black text-sm">1</button>
                        <button className="size-9 flex items-center justify-center rounded-full border border-border text-foreground hover:bg-card font-bold text-sm">2</button>
                        <button className="size-9 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-card">
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <AddSupervisorDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
            </div>
        </div>
    );
}

function AddSupervisorDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
    });

    const addMutation = useMutation({
        mutationFn: addSupervisor,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["supervisors"] });
            onOpenChange(false);
            setFormData({ name: "", email: "", phone: "" });
            toast.success("Supervisor added successfully");
        },
        onError: (error) => {
            toast.error("Failed to add supervisor");
            console.error("Supervisors Page Error:", JSON.stringify(error, null, 2));
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addMutation.mutate(formData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Supervisor</DialogTitle>
                    <DialogDescription>
                        Add a new supervisor to the system.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <button type="submit" disabled={addMutation.isPending} className="flex items-center justify-center gap-2 px-6 py-3 bg-forest hover:bg-forest/90 text-white font-black rounded-full text-sm fab-glow transition-all disabled:opacity-50">
                            {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Supervisor
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
