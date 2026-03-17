import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paymentCards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const [row] = await db.update(paymentCards)
    .set({ label: body.label, last4: body.last4, brand: body.brand, isDefault: body.isDefault })
    .where(eq(paymentCards.id, parseInt(id)))
    .returning();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(paymentCards).where(eq(paymentCards.id, parseInt(id)));
  return NextResponse.json({ success: true });
}
