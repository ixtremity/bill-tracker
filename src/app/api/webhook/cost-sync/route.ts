import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions, entities, bills } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  // Verify webhook secret
  const authHeader = request.headers.get("authorization");
  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { serviceName, entityName, year, month, amount, currency, paymentStatus, notes, action } = body;

  if (!serviceName || !year || !month || amount === undefined) {
    return NextResponse.json(
      { error: "serviceName, year, month, and amount are required" },
      { status: 400 }
    );
  }

  // Handle delete action
  if (action === "delete") {
    // Find matching subscription
    const sub = await findSubscription(serviceName, entityName);
    if (!sub) {
      return NextResponse.json({ message: "No matching subscription found, skipped" });
    }

    const dueDate = new Date(year, month - 1, sub.billingDay || 1);
    const matchingBills = await db
      .select()
      .from(bills)
      .where(
        and(
          eq(bills.subscriptionId, sub.id),
          eq(bills.dueDate, dueDate)
        )
      );

    if (matchingBills.length > 0) {
      await db.delete(bills).where(eq(bills.id, matchingBills[0].id));
      return NextResponse.json({ synced: true, action: "deleted", billId: matchingBills[0].id });
    }

    return NextResponse.json({ message: "No matching bill found to delete" });
  }

  // Find matching subscription by service name and entity name
  const sub = await findSubscription(serviceName, entityName);
  if (!sub) {
    return NextResponse.json({ message: "No matching subscription found, skipped" });
  }

  // Build due date from year/month + subscription's billing day
  const dueDate = new Date(year, month - 1, sub.billingDay || 1);

  // Upsert bill
  try {
    const existing = await db
      .select()
      .from(bills)
      .where(
        and(
          eq(bills.subscriptionId, sub.id),
          eq(bills.dueDate, dueDate)
        )
      );

    if (existing.length > 0) {
      // Update existing bill
      const [updated] = await db
        .update(bills)
        .set({
          amount: Math.round(Number(amount) * 100) / 100,
          currency: currency || "USD",
          paymentStatus: paymentStatus || existing[0].paymentStatus,
          notes: notes || existing[0].notes,
          updatedAt: new Date(),
        })
        .where(eq(bills.id, existing[0].id))
        .returning();

      return NextResponse.json({ synced: true, action: "updated", bill: updated });
    } else {
      // Create new bill
      const [created] = await db
        .insert(bills)
        .values({
          subscriptionId: sub.id,
          amount: Math.round(Number(amount) * 100) / 100,
          currency: currency || "USD",
          dueDate,
          paymentStatus: paymentStatus || "pending",
          notes: notes || null,
        })
        .returning();

      return NextResponse.json({ synced: true, action: "created", bill: created }, { status: 201 });
    }
  } catch (err) {
    return NextResponse.json({ error: "Failed to sync bill", details: String(err) }, { status: 500 });
  }
}

async function findSubscription(serviceName: string, entityName?: string) {
  // Try to match by service name + entity name
  const allSubs = await db
    .select({
      id: subscriptions.id,
      name: subscriptions.name,
      slug: subscriptions.slug,
      entityId: subscriptions.entityId,
      entityName: entities.name,
      billingDay: subscriptions.billingDay,
    })
    .from(subscriptions)
    .leftJoin(entities, eq(subscriptions.entityId, entities.id));

  // First try exact match on name + entity
  if (entityName) {
    const exactMatch = allSubs.find(
      (s) =>
        s.name.toLowerCase() === serviceName.toLowerCase() &&
        s.entityName?.toLowerCase() === entityName.toLowerCase()
    );
    if (exactMatch) return exactMatch;
  }

  // Fallback: match by name only
  const nameMatch = allSubs.find(
    (s) => s.name.toLowerCase() === serviceName.toLowerCase()
  );
  if (nameMatch) return nameMatch;

  // Fallback: match by slug
  const slug = serviceName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const slugMatch = allSubs.find(
    (s) => s.slug === slug
  );
  return slugMatch || null;
}
