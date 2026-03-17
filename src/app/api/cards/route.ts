import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paymentCards } from "@/lib/db/schema";

export async function GET() {
  const rows = await db.select().from(paymentCards).orderBy(paymentCards.label);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const [row] = await db.insert(paymentCards).values({
    label: body.label,
    last4: body.last4 || null,
    brand: body.brand || null,
    isDefault: body.isDefault || false,
  }).returning();

  return NextResponse.json(row, { status: 201 });
}
