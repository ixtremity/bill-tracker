"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import {
  Bill,
  Subscription,
  PaymentStatus,
  PAYMENT_STATUS_CONFIG,
  formatCurrency,
  formatDate,
  daysUntil,
} from "@/lib/types";
import { toast } from "sonner";

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const [form, setForm] = useState({
    subscriptionId: "",
    amount: "",
    dueDate: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [billsRes, subsRes] = await Promise.all([
      fetch("/api/bills"),
      fetch("/api/subscriptions"),
    ]);
    setBills(await billsRes.json());
    setSubscriptions(await subsRes.json());
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscriptionId: parseInt(form.subscriptionId),
        amount: parseFloat(form.amount),
        dueDate: form.dueDate,
        notes: form.notes || null,
      }),
    });
    toast.success("Bill created");
    setDialogOpen(false);
    fetchData();
  }

  async function toggleStatus(bill: Bill, newStatus: PaymentStatus) {
    await fetch(`/api/bills/${bill.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: newStatus }),
    });
    toast.success(`Bill marked as ${newStatus}`);
    fetchData();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this bill?")) return;
    await fetch(`/api/bills/${id}`, { method: "DELETE" });
    toast.success("Bill deleted");
    fetchData();
  }

  const filtered =
    statusFilter === "all"
      ? bills
      : bills.filter((b) => b.paymentStatus === statusFilter);

  const statusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "overdue":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bills</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              onClick={() => {
                setForm({
                  subscriptionId: subscriptions[0]?.id.toString() || "",
                  amount: "",
                  dueDate: new Date().toISOString().split("T")[0],
                  notes: "",
                });
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Bill
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Bill</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Subscription</Label>
                <Select
                  value={form.subscriptionId}
                  onValueChange={(v) =>
                    setForm({ ...form, subscriptionId: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {subscriptions.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name} ({s.entityName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) =>
                      setForm({ ...form, amount: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) =>
                      setForm({ ...form, dueDate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">
                Create Bill
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <div className="h-32 animate-pulse rounded bg-muted" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((bill) => {
                  const status = bill.paymentStatus as PaymentStatus;
                  const statusConfig =
                    PAYMENT_STATUS_CONFIG[status] || PAYMENT_STATUS_CONFIG.pending;
                  const days = daysUntil(bill.dueDate);

                  return (
                    <TableRow key={bill.id}>
                      <TableCell className="font-medium">
                        {bill.subscriptionName}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{bill.entityName}</Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(bill.amount)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{formatDate(bill.dueDate)}</span>
                          {status !== "paid" && (
                            <span
                              className={`text-xs ${
                                days < 0
                                  ? "text-red-500"
                                  : days <= 3
                                  ? "text-yellow-600"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {days < 0
                                ? `${Math.abs(days)} days overdue`
                                : days === 0
                                ? "Due today"
                                : `${days} days left`}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig.color} variant="secondary">
                          <span className="mr-1">{statusIcon(status)}</span>
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {status !== "paid" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600"
                              onClick={() => toggleStatus(bill, "paid")}
                            >
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Pay
                            </Button>
                          )}
                          {status === "paid" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-yellow-600"
                              onClick={() => toggleStatus(bill, "pending")}
                            >
                              <Clock className="mr-1 h-4 w-4" />
                              Unpay
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(bill.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground"
                    >
                      No bills found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
