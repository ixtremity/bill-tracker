"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import { DashboardData, formatCurrency, formatDate, daysUntil, PAYMENT_STATUS_CONFIG, PaymentStatus } from "@/lib/types";
import { SpendChart } from "@/components/spend-chart";
import { toast } from "sonner";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  function fetchData() {
    setLoading(true);
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function generateBills() {
    const res = await fetch("/api/bills/generate", { method: "POST" });
    const result = await res.json();
    toast.success(`Generated ${result.created} bills`);
    fetchData();
  }

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-16 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button variant="outline" size="sm" onClick={generateBills}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Generate Bills
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.totalMonthly)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.subscriptionCount} active subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.paidThisMonth)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(data.pendingThisMonth)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(data.overdueThisMonth)}
            </div>
            {data.overdueCount > 0 && (
              <p className="text-xs text-red-500">
                {data.overdueCount} bill{data.overdueCount > 1 ? "s" : ""} overdue
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bills (Next 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {data.upcomingBills.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming bills</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.upcomingBills.map((bill) => {
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
                          <span
                            className={
                              days <= 1
                                ? "font-semibold text-red-600"
                                : days <= 3
                                ? "text-yellow-600"
                                : ""
                            }
                          >
                            {days === 0
                              ? "Today"
                              : days === 1
                              ? "Tomorrow"
                              : `${days} days`}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <SpendChart data={data.monthlyTrend} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
