import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { entities } from "@/lib/db/schema";

export async function GET() {
  const rows = await db.select().from(entities).orderBy(entities.name);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const [row] = await db.insert(entities).values({
    name: body.name,
    slug,
    color: body.color || "#6366f1",
  }).returning();

  return NextResponse.json(row, { status: 201 });
}
