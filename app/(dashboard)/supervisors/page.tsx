"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupervisors, addSupervisor, updateSupervisor, deleteSupervisor } from "@/lib/api/supervisors";
import { getSupervisorStats } from "@/lib/api/classes";
import { Supervisor } from "@/types/supervisor";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Plus, Search, Loader2, ShieldCheck,
    Download, Mail, Phone, Save, Edit2, Trash2,
    ChevronLeft, ChevronRight, Clock
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { FormInput } from "@/components/ui/form-input";
import { exportToCSV } from "@/lib/utils/csv";
import { STALE_LONG } from "@/lib/query-config";

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



export default function SupervisorsPage() {
    const [search, setSearch] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null);
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

    const handleEditClick = (supervisor: Supervisor) => {
        setSelectedSupervisor(supervisor);
        setIsEditDialogOpen(true);
    };

    const { data: supervisors = [], isLoading } = useQuery({
        queryKey: ["supervisors"],
        queryFn: getSupervisors,
        ...STALE_LONG,
    });

    const { data: supervisorStats = {} } = useQuery({
        queryKey: ["supervisorStats"],
        queryFn: getSupervisorStats,
        ...STALE_LONG,
    });

    const filteredSupervisors = supervisors.filter((supervisor) =>
        supervisor.name.toLowerCase().includes(search.toLowerCase()) ||
        (supervisor.email && supervisor.email.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="flex-1 overflow-y-auto flex flex-col relative">
            {/* Organic Background Elements */}
            <div className="organic-blob bg-primary-container/20 w-[600px] h-[600px] -top-48 -left-24 fixed"></div>
            <div className="organic-blob bg-tertiary-container/20 w-[500px] h-[500px] bottom-0 right-0 fixed"></div>

            <div className="p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full relative z-10">

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
                        <button
                            onClick={() => setIsAddDialogOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-forest hover:bg-forest/90 text-white font-black rounded-full text-sm fab-glow transition-all shrink-0"
                        >
                            <Plus className="h-4 w-4" />
                            Add Supervisor
                        </button>
                    </div>
                </div>

                {/* KPI Card */}
                <div className="flex items-center gap-3">
                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">Overview</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="card-hover relative glass-panel rounded-3xl p-5 border border-white/20 dark:border-white/5 overflow-hidden group flex flex-col gap-3 shadow-[0px_0px_48px_rgba(45,52,50,0.06)]">
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

                {/* Search */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
                        <input
                            className="pill-input w-full pl-10 pr-5 py-2.5 glass-panel border border-white/20 dark:border-white/5 text-sm text-foreground placeholder:text-muted-foreground/50"
                            placeholder="Search supervisors by name or email..."
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {filteredSupervisors.length === 0 ? (
                    <div className="text-center p-12 bg-card rounded-3xl border border-border">
                        <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground opacity-40 mb-3" />
                        <p className="font-bold text-foreground">No supervisors found</p>
                        <p className="text-sm text-muted-foreground mt-1">Try adjusting your search.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSupervisors.map((supervisor, index) => {
                            const role = placeholderRoles[index % placeholderRoles.length];
                            const avatar = placeholderAvatars[index % placeholderAvatars.length];
                            const stats = supervisorStats[supervisor.id] ?? { teachers: 0, students: 0 };
                            const statusColor = stats.teachers > 0 ? "bg-green-500" : "bg-gray-400";

                            return (
                                <div key={supervisor.id} className="card-hover glass-panel rounded-3xl border border-white/20 dark:border-white/5 overflow-hidden flex flex-col shadow-[0px_0px_48px_rgba(45,52,50,0.06)]">
                                    <div className="p-6 pb-4 flex-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="relative">
                                                <img
                                                    className="size-20 rounded-2xl object-cover ring-4 ring-primary/10"
                                                    alt={supervisor.name}
                                                    src={avatar}
                                                />
                                                <div className={`absolute -bottom-2 -right-2 ${statusColor} size-4 rounded-full border-2 border-card`} />
                                            </div>
                                            <button
                                                onClick={() => handleDelete(supervisor.id, supervisor.name)}
                                                className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors rounded-xl hover:bg-red-500/10"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black text-foreground mb-1">{supervisor.name}</h4>
                                            <p className="text-primary text-sm font-bold mb-3">{role}</p>
                                            {supervisor.timing && (
                                                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                                                    <Clock className="h-4 w-4" />
                                                    <span className="font-bold text-foreground">{supervisor.timing}</span>
                                                </div>
                                            )}
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
                                        <button
                                            onClick={() => handleEditClick(supervisor)}
                                            className="py-2.5 rounded-full text-sm font-bold border border-border text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Edit2 className="h-3.5 w-3.5" />
                                            Edit
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
                        <button className="size-9 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-card">
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <AddSupervisorDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
                <EditSupervisorDialog
                    supervisor={selectedSupervisor}
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                />
            </div>
        </div>
    );
}



function AddSupervisorDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({ name: "", email: "", phone: "", timing: "", password: "" });

    const addMutation = useMutation({
        mutationFn: addSupervisor,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["supervisors"] });
            onOpenChange(false);
            setFormData({ name: "", email: "", phone: "", timing: "", password: "" });
            toast.success("Supervisor added successfully");
        },
        onError: (error) => {
            toast.error("Failed to add supervisor");
            console.error("Supervisors Page Error:", JSON.stringify(error, null, 2));
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addMutation.mutate({ 
            name: formData.name, 
            email: formData.email || null, 
            phone: formData.phone || null, 
            timing: formData.timing || null,
            password: formData.password || null 
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] rounded-3xl border-border bg-card">
                <DialogHeader className="pb-2">
                    <DialogTitle className="text-xl font-black">Add Supervisor</DialogTitle>
                    <p className="text-xs text-muted-foreground font-medium">Add a new supervisor to the system.</p>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Identity</p>
                        <FormInput
                            label="Name *"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="e.g. Dr. Ahmad"
                        />
                    </div>
                    <div className="space-y-3 border-t border-border pt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contact</p>
                        <div className="grid grid-cols-2 gap-3">
                            <FormInput
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="e.g. ahmad@school.com"
                            />
                            <FormInput
                                label="Phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="e.g. +92 300 1234567"
                            />
                        </div>
                    </div>
                    <div className="space-y-3 border-t border-border pt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Scheduling</p>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">Timing</label>
                            <Select value={formData.timing || "none"} onValueChange={(val) => setFormData(prev => ({ ...prev, timing: val === "none" ? "" : val }))}>
                                <SelectTrigger className="h-11 rounded-2xl border-border bg-accent/30 text-sm font-medium focus:ring-2 focus:ring-primary">
                                    <SelectValue placeholder="Select Timing" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectItem value="Morning">Morning</SelectItem>
                                    <SelectItem value="Evening">Evening</SelectItem>
                                    <SelectItem value="Night">Night</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-3 border-t border-border pt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Security</p>
                        <FormInput
                            label="Password"
                            name="password"
                            type="text"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Set a password for login..."
                        />
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" disabled={addMutation.isPending} className="flex items-center gap-2 px-7 py-3 bg-primary text-primary-foreground font-black rounded-full text-sm hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20">
                            {addMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save Supervisor</>}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditSupervisorDialog({ supervisor, open, onOpenChange }: { supervisor: Supervisor | null; open: boolean; onOpenChange: (open: boolean) => void }) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({ name: "", email: "", phone: "", timing: "", password: "" });

    useEffect(() => {
        if (supervisor && open) {
            setFormData({
                name: supervisor.name || "",
                email: supervisor.email || "",
                phone: supervisor.phone || "",
                timing: supervisor.timing || "",
                password: supervisor.password || "",
            });
        }
    }, [supervisor, open]);

    const updateMutation = useMutation({
        mutationFn: async () => {
            if (!supervisor) throw new Error("No supervisor selected");
            return await updateSupervisor(supervisor.id, {
                name: formData.name,
                email: formData.email || null,
                phone: formData.phone || null,
                timing: formData.timing || null,
                password: formData.password || null,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["supervisors"] });
            onOpenChange(false);
            toast.success("Supervisor updated successfully");
        },
        onError: () => {
            toast.error("Failed to update supervisor");
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateMutation.mutate();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] rounded-3xl border-border bg-card">
                <DialogHeader className="pb-2">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary text-sm">
                            {supervisor?.name?.slice(0, 2).toUpperCase() || "??"}
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black">Edit Supervisor</DialogTitle>
                            <p className="text-xs text-muted-foreground font-medium mt-0.5">Update supervisor details.</p>
                        </div>
                    </div>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Identity</p>
                        <FormInput
                            label="Name *"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="e.g. Dr. Ahmad"
                        />
                    </div>
                    <div className="space-y-3 border-t border-border pt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contact</p>
                        <div className="grid grid-cols-2 gap-3">
                            <FormInput
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="e.g. ahmad@school.com"
                            />
                            <FormInput
                                label="Phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="e.g. +92 300 1234567"
                            />
                        </div>
                    </div>
                    <div className="space-y-3 border-t border-border pt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Scheduling</p>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-foreground">Timing</label>
                            <Select value={formData.timing || "none"} onValueChange={(val) => setFormData(prev => ({ ...prev, timing: val === "none" ? "" : val }))}>
                                <SelectTrigger className="h-11 rounded-2xl border-border bg-accent/30 text-sm font-medium focus:ring-2 focus:ring-primary">
                                    <SelectValue placeholder="Select Timing" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl">
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectItem value="Morning">Morning</SelectItem>
                                    <SelectItem value="Evening">Evening</SelectItem>
                                    <SelectItem value="Night">Night</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-3 border-t border-border pt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Security</p>
                        <FormInput
                            label="Password"
                            name="password"
                            type="text"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Update password for login..."
                        />
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" disabled={updateMutation.isPending} className="flex items-center gap-2 px-7 py-3 bg-primary text-primary-foreground font-black rounded-full text-sm hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary/20">
                            {updateMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save Changes</>}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
