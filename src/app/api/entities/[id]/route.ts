import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { entities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const [row] = await db.update(entities)
    .set({ name: body.name, color: body.color })
    .where(eq(entities.id, parseInt(id)))
    .returning();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(entities).where(eq(entities.id, parseInt(id)));
  return NextResponse.json({ success: true });
}
