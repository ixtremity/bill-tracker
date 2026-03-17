import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bills } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.amount !== undefined) updates.amount = body.amount;
  if (body.currency !== undefined) updates.currency = body.currency;
  if (body.dueDate !== undefined) updates.dueDate = new Date(body.dueDate);
  if (body.paymentStatus !== undefined) updates.paymentStatus = body.paymentStatus;
  if (body.cardId !== undefined) updates.cardId = body.cardId;
  if (body.notes !== undefined) updates.notes = body.notes;

  if (body.paymentStatus === "paid" && !body.paidAt) {
    updates.paidAt = new Date();
  } else if (body.paidAt !== undefined) {
    updates.paidAt = body.paidAt ? new Date(body.paidAt) : null;
  }

  const [row] = await db.update(bills)
    .set(updates)
    .where(eq(bills.id, parseInt(id)))
    .returning();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(bills).where(eq(bills.id, parseInt(id)));
  return NextResponse.json({ success: true });
}
