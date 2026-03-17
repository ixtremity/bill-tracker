"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Subscription, Entity, CATEGORY_CONFIG, formatCurrency } from "@/lib/types";
import { toast } from "sonner";

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [entityFilter, setEntityFilter] = useState("all");

  const [form, setForm] = useState({
    name: "",
    entityId: "",
    url: "",
    category: "other",
    billingCycle: "monthly",
    expectedAmount: "",
    billingDay: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [subsRes, entRes] = await Promise.all([
      fetch("/api/subscriptions"),
      fetch("/api/entities"),
    ]);
    setSubscriptions(await subsRes.json());
    setEntities(await entRes.json());
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setForm({
      name: "",
      entityId: entities[0]?.id.toString() || "",
      url: "",
      category: "other",
      billingCycle: "monthly",
      expectedAmount: "",
      billingDay: "",
      notes: "",
    });
    setDialogOpen(true);
  }

  function openEdit(sub: Subscription) {
    setEditing(sub);
    setForm({
      name: sub.name,
      entityId: sub.entityId.toString(),
      url: sub.url || "",
      category: sub.category || "other",
      billingCycle: sub.billingCycle || "monthly",
      expectedAmount: sub.expectedAmount?.toString() || "",
      billingDay: sub.billingDay?.toString() || "",
      notes: sub.notes || "",
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = {
      ...form,
      entityId: parseInt(form.entityId),
      expectedAmount: form.expectedAmount ? parseFloat(form.expectedAmount) : null,
      billingDay: form.billingDay ? parseInt(form.billingDay) : null,
    };

    if (editing) {
      await fetch(`/api/subscriptions/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      toast.success("Subscription updated");
    } else {
      await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      toast.success("Subscription created");
    }
    setDialogOpen(false);
    fetchData();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this subscription and all its bills?")) return;
    await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
    toast.success("Subscription deleted");
    fetchData();
  }

  const filtered = entityFilter === "all"
    ? subscriptions
    : subscriptions.filter((s) => s.entityId.toString() === entityFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <div className="flex items-center gap-3">
          {entities.length > 1 && (
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Entities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {entities.map((e) => (
                  <SelectItem key={e.id} value={e.id.toString()}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add Subscription
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editing ? "Edit Subscription" : "Add Subscription"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Entity</Label>
                  <Select
                    value={form.entityId}
                    onValueChange={(v) => setForm({ ...form, entityId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {entities.map((e) => (
                        <SelectItem key={e.id} value={e.id.toString()}>
                          {e.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={form.category}
                      onValueChange={(v) => setForm({ ...form, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                          <SelectItem key={key} value={key}>
                            {cfg.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Billing Cycle</Label>
                    <Select
                      value={form.billingCycle}
                      onValueChange={(v) => setForm({ ...form, billingCycle: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Expected Amount ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.expectedAmount}
                      onChange={(e) =>
                        setForm({ ...form, expectedAmount: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Billing Day (1-31)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={form.billingDay}
                      onChange={(e) =>
                        setForm({ ...form, billingDay: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editing ? "Update" : "Create"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

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
                  <TableHead>Name</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Cycle</TableHead>
                  <TableHead>Expected</TableHead>
                  <TableHead>Billing Day</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((sub) => {
                  const catConfig = CATEGORY_CONFIG[sub.category || "other"] || CATEGORY_CONFIG.other;
                  return (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {sub.name}
                          {sub.url && (
                            <a
                              href={sub.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{sub.entityName}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={catConfig.color} variant="secondary">
                          {catConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">
                        {sub.billingCycle}
                      </TableCell>
                      <TableCell>
                        {sub.expectedAmount
                          ? formatCurrency(sub.expectedAmount)
                          : "-"}
                      </TableCell>
                      <TableCell>{sub.billingDay || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={sub.isActive ? "default" : "secondary"}
                        >
                          {sub.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(sub)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(sub.id)}
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
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No subscriptions found
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
