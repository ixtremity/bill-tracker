import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const [row] = await db.update(subscriptions)
    .set({
      entityId: body.entityId,
      name: body.name,
      url: body.url,
      category: body.category,
      billingCycle: body.billingCycle,
      expectedAmount: body.expectedAmount,
      currency: body.currency,
      billingDay: body.billingDay,
      isActive: body.isActive,
      notes: body.notes,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, parseInt(id)))
    .returning();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(subscriptions).where(eq(subscriptions.id, parseInt(id)));
  return NextResponse.json({ success: true });
}
