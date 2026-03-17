import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions, entities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const entityId = request.nextUrl.searchParams.get("entityId");

  const rows = await db
    .select({
      id: subscriptions.id,
      entityId: subscriptions.entityId,
      entityName: entities.name,
      entityColor: entities.color,
      name: subscriptions.name,
      slug: subscriptions.slug,
      url: subscriptions.url,
      category: subscriptions.category,
      billingCycle: subscriptions.billingCycle,
      expectedAmount: subscriptions.expectedAmount,
      currency: subscriptions.currency,
      billingDay: subscriptions.billingDay,
      isActive: subscriptions.isActive,
      notes: subscriptions.notes,
      createdAt: subscriptions.createdAt,
    })
    .from(subscriptions)
    .leftJoin(entities, eq(subscriptions.entityId, entities.id))
    .orderBy(subscriptions.name);

  const filtered = entityId
    ? rows.filter((r) => r.entityId === parseInt(entityId))
    : rows;

  return NextResponse.json(filtered);
}

export async function POST(request: Request) {
  const body = await request.json();
  const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const [row] = await db.insert(subscriptions).values({
    entityId: body.entityId,
    name: body.name,
    slug,
    url: body.url || null,
    category: body.category || "other",
    billingCycle: body.billingCycle || "monthly",
    expectedAmount: body.expectedAmount || null,
    currency: body.currency || "USD",
    billingDay: body.billingDay || null,
    isActive: body.isActive !== false,
    notes: body.notes || null,
  }).returning();

  return NextResponse.json(row, { status: 201 });
}
