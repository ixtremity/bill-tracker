import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { alertSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const rows = await db.select().from(alertSettings);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const [row] = await db.insert(alertSettings).values({
    emailTo: body.emailTo,
    daysBeforeDue: body.daysBeforeDue || 3,
    enabled: body.enabled !== false,
  }).returning();

  return NextResponse.json(row, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const [row] = await db.update(alertSettings)
    .set({
      emailTo: body.emailTo,
      daysBeforeDue: body.daysBeforeDue,
      enabled: body.enabled,
      updatedAt: new Date(),
    })
    .where(eq(alertSettings.id, body.id))
    .returning();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}
