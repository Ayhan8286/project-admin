"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPayments, getFinanceStats, addPayment, updatePaymentStatus } from "@/lib/api/finance";
import { getStudents } from "@/lib/api/students";
import { Payment } from "@/types/finance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DollarSign, AlertCircle, CheckCircle, Plus, Wallet } from "lucide-react";
import { toast } from "sonner";

export default function FinancePage() {
    const queryClient = useQueryClient();
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    // Form State
    const [studentId, setStudentId] = useState("");
    const [amount, setAmount] = useState("");
    const [dueDate, setDueDate] = useState("");

    // Queries
    const { data: stats } = useQuery({
        queryKey: ["financeStats", selectedMonth],
        queryFn: () => getFinanceStats(selectedMonth),
    });

    const { data: payments = [], isLoading } = useQuery({
        queryKey: ["payments", selectedMonth],
        queryFn: () => getPayments(selectedMonth),
    });

    const { data: students = [] } = useQuery({
        queryKey: ["students"],
        queryFn: getStudents,
    });

    // Mutations
    const addPaymentMutation = useMutation({
        mutationFn: () => addPayment({
            student_id: studentId,
            amount: parseFloat(amount),
            currency: "USD",
            due_date: dueDate,
            payment_date: null,
            status: "Pending",
            payment_method: null,
            month_covered: selectedMonth,
            receipt_number: null
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["payments"] });
            queryClient.invalidateQueries({ queryKey: ["financeStats"] });
            toast.success("Payment record added");
            setIsAddDialogOpen(false);
            setAmount("");
            setStudentId("");
            setDueDate("");
        },
        onError: () => toast.error("Failed to add record")
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: Payment["status"] }) => updatePaymentStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["payments"] });
            queryClient.invalidateQueries({ queryKey: ["financeStats"] });
            toast.success("Status updated");
        }
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Paid": return "bg-green-100 text-green-800";
            case "Pending": return "bg-yellow-100 text-yellow-800";
            case "Overdue": return "bg-red-100 text-red-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Financial Dashboard</h1>
                    <p className="text-muted-foreground">
                        Track fees, payments, and revenue for {selectedMonth}.
                    </p>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Record Fee
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Record Student Fee</DialogTitle>
                            <DialogDescription>
                                Create a payment record for a student for {selectedMonth}.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Student</Label>
                                <Select value={studentId} onValueChange={setStudentId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Student" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {students.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.reg_no})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Amount (USD)</Label>
                                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50.00" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Due Date</Label>
                                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={() => addPaymentMutation.mutate()} disabled={!studentId || !amount}>
                                Save Record
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-100 flex justify-between">
                            Total Revenue
                            <DollarSign className="h-4 w-4 text-green-200" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">${stats?.total_revenue.toFixed(2) || "0.00"}</div>
                        <p className="text-xs text-green-100 mt-1">{stats?.paid_count || 0} payments collected</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white border-0">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-yellow-100 flex justify-between">
                            Pending Collection
                            <Wallet className="h-4 w-4 text-yellow-200" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">${(stats ? stats.pending_amount : 0).toFixed(2)}</div>
                        <p className="text-xs text-yellow-100 mt-1">{stats?.pending_count || 0} students pending</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-500 to-pink-600 text-white border-0">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-100 flex justify-between">
                            Overdue
                            <AlertCircle className="h-4 w-4 text-red-200" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{stats?.overdue_count || 0}</div>
                        <p className="text-xs text-red-100 mt-1">Students late on payments</p>
                    </CardContent>
                </Card>
            </div>

            {/* Payments Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Transactions</CardTitle>
                    <CardDescription>Payment history for current month</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                                </TableRow>
                            ) : payments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No records for this month.</TableCell>
                                </TableRow>
                            ) : (
                                payments.map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell className="font-medium">
                                            {payment.student?.full_name}
                                            <div className="text-xs text-muted-foreground">{payment.student?.reg_no}</div>
                                        </TableCell>
                                        <TableCell>${payment.amount.toFixed(2)}</TableCell>
                                        <TableCell>{new Date(payment.due_date).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(payment.status)} variant="secondary">
                                                {payment.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {payment.status === "Pending" && (
                                                <Button size="sm" variant="outline" className="text-green-600 h-8" onClick={() => updateStatusMutation.mutate({ id: payment.id, status: "Paid" })}>
                                                    <CheckCircle className="h-4 w-4 mr-1" />
                                                    Mark Paid
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
