"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Bell, Building2, CreditCard } from "lucide-react";
import { Entity, PaymentCard, AlertSetting } from "@/lib/types";
import { toast } from "sonner";

export default function SettingsPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [alertSettings, setAlertSettings] = useState<AlertSetting[]>([]);
  const [entityDialog, setEntityDialog] = useState(false);
  const [cardDialog, setCardDialog] = useState(false);
  const [alertDialog, setAlertDialog] = useState(false);

  const [entityForm, setEntityForm] = useState({ name: "", color: "#6366f1" });
  const [cardForm, setCardForm] = useState({ label: "", last4: "", brand: "" });
  const [alertForm, setAlertForm] = useState({ emailTo: "", daysBeforeDue: "3" });

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    const [entRes, cardRes, alertRes] = await Promise.all([
      fetch("/api/entities"),
      fetch("/api/cards"),
      fetch("/api/alerts/settings"),
    ]);
    setEntities(await entRes.json());
    setCards(await cardRes.json());
    setAlertSettings(await alertRes.json());
  }

  // Entity handlers
  async function createEntity(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/entities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entityForm),
    });
    toast.success("Entity created");
    setEntityDialog(false);
    setEntityForm({ name: "", color: "#6366f1" });
    fetchAll();
  }

  async function deleteEntity(id: number) {
    if (!confirm("Delete this entity and all its subscriptions?")) return;
    await fetch(`/api/entities/${id}`, { method: "DELETE" });
    toast.success("Entity deleted");
    fetchAll();
  }

  // Card handlers
  async function createCard(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cardForm),
    });
    toast.success("Card added");
    setCardDialog(false);
    setCardForm({ label: "", last4: "", brand: "" });
    fetchAll();
  }

  async function deleteCard(id: number) {
    if (!confirm("Delete this card?")) return;
    await fetch(`/api/cards/${id}`, { method: "DELETE" });
    toast.success("Card deleted");
    fetchAll();
  }

  // Alert handlers
  async function createAlert(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/alerts/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        emailTo: alertForm.emailTo,
        daysBeforeDue: parseInt(alertForm.daysBeforeDue),
      }),
    });
    toast.success("Alert setting added");
    setAlertDialog(false);
    setAlertForm({ emailTo: "", daysBeforeDue: "3" });
    fetchAll();
  }

  async function toggleAlert(setting: AlertSetting) {
    await fetch("/api/alerts/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: setting.id, enabled: !setting.enabled }),
    });
    toast.success(`Alerts ${setting.enabled ? "disabled" : "enabled"}`);
    fetchAll();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Entities */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Entities
          </CardTitle>
          <Dialog open={entityDialog} onOpenChange={setEntityDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Entity
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Entity</DialogTitle>
              </DialogHeader>
              <form onSubmit={createEntity} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={entityForm.name}
                    onChange={(e) =>
                      setEntityForm({ ...entityForm, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input
                    type="color"
                    value={entityForm.color}
                    onChange={(e) =>
                      setEntityForm({ ...entityForm, color: e.target.value })
                    }
                  />
                </div>
                <Button type="submit" className="w-full">
                  Create
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Color</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entities.map((entity) => (
                <TableRow key={entity.id}>
                  <TableCell className="font-medium">{entity.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: entity.color || "#6366f1" }}
                      />
                      {entity.color}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteEntity(entity.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Cards */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Cards
          </CardTitle>
          <Dialog open={cardDialog} onOpenChange={setCardDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Card
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Payment Card</DialogTitle>
              </DialogHeader>
              <form onSubmit={createCard} className="space-y-4">
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input
                    value={cardForm.label}
                    onChange={(e) =>
                      setCardForm({ ...cardForm, label: e.target.value })
                    }
                    placeholder="e.g. Company Visa"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Last 4 Digits</Label>
                    <Input
                      value={cardForm.last4}
                      onChange={(e) =>
                        setCardForm({ ...cardForm, last4: e.target.value })
                      }
                      maxLength={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Brand</Label>
                    <Input
                      value={cardForm.brand}
                      onChange={(e) =>
                        setCardForm({ ...cardForm, brand: e.target.value })
                      }
                      placeholder="Visa, Mastercard..."
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  Add Card
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {cards.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payment cards added</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Card</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cards.map((card) => (
                  <TableRow key={card.id}>
                    <TableCell className="font-medium">{card.label}</TableCell>
                    <TableCell>
                      {card.brand} {card.last4 ? `****${card.last4}` : ""}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteCard(card.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Email Alerts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Email Alerts
          </CardTitle>
          <Dialog open={alertDialog} onOpenChange={setAlertDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Alert
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Email Alert</DialogTitle>
              </DialogHeader>
              <form onSubmit={createAlert} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={alertForm.emailTo}
                    onChange={(e) =>
                      setAlertForm({ ...alertForm, emailTo: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Days Before Due Date</Label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={alertForm.daysBeforeDue}
                    onChange={(e) =>
                      setAlertForm({
                        ...alertForm,
                        daysBeforeDue: e.target.value,
                      })
                    }
                  />
                </div>
                <Button type="submit" className="w-full">
                  Add Alert
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {alertSettings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No email alerts configured</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Days Before Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]">Toggle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alertSettings.map((setting) => (
                  <TableRow key={setting.id}>
                    <TableCell className="font-medium">
                      {setting.emailTo}
                    </TableCell>
                    <TableCell>{setting.daysBeforeDue} days</TableCell>
                    <TableCell>
                      <Badge variant={setting.enabled ? "default" : "secondary"}>
                        {setting.enabled ? "Active" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAlert(setting)}
                      >
                        {setting.enabled ? "Disable" : "Enable"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="mt-4 rounded-md bg-muted p-3">
            <p className="text-sm text-muted-foreground">
              <strong>Cron Setup:</strong> To send alerts automatically, set up a daily cron job
              that calls <code className="rounded bg-background px-1">POST /api/cron/alerts</code> with
              header <code className="rounded bg-background px-1">Authorization: Bearer YOUR_CRON_SECRET</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
