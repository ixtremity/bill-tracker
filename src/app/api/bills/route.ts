import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bills, subscriptions, entities, paymentCards } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const status = params.get("status");
  const from = params.get("from");
  const to = params.get("to");
  const entityId = params.get("entityId");

  const rows = await db
    .select({
      id: bills.id,
      subscriptionId: bills.subscriptionId,
      subscriptionName: subscriptions.name,
      subscriptionSlug: subscriptions.slug,
      entityName: entities.name,
      entityColor: entities.color,
      amount: bills.amount,
      currency: bills.currency,
      dueDate: bills.dueDate,
      paidAt: bills.paidAt,
      paymentStatus: bills.paymentStatus,
      cardId: bills.cardId,
      cardLabel: paymentCards.label,
      notes: bills.notes,
      createdAt: bills.createdAt,
    })
    .from(bills)
    .leftJoin(subscriptions, eq(bills.subscriptionId, subscriptions.id))
    .leftJoin(entities, eq(subscriptions.entityId, entities.id))
    .leftJoin(paymentCards, eq(bills.cardId, paymentCards.id))
    .orderBy(bills.dueDate);

  let filtered = rows;
  if (status) filtered = filtered.filter((r) => r.paymentStatus === status);
  if (from) filtered = filtered.filter((r) => r.dueDate && new Date(r.dueDate) >= new Date(from));
  if (to) filtered = filtered.filter((r) => r.dueDate && new Date(r.dueDate) <= new Date(to));
  if (entityId) filtered = filtered.filter((r) => r.entityName !== null);

  return NextResponse.json(filtered);
}

export async function POST(request: Request) {
  const body = await request.json();

  const [row] = await db.insert(bills).values({
    subscriptionId: body.subscriptionId,
    amount: body.amount,
    currency: body.currency || "USD",
    dueDate: new Date(body.dueDate),
    paidAt: body.paidAt ? new Date(body.paidAt) : null,
    paymentStatus: body.paymentStatus || "pending",
    cardId: body.cardId || null,
    notes: body.notes || null,
  }).returning();

  return NextResponse.json(row, { status: 201 });
}
