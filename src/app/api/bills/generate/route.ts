import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions, bills } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const activeSubscriptions = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.isActive, true));

  let created = 0;
  for (const sub of activeSubscriptions) {
    const billingDay = sub.billingDay || 1;
    const dueDate = new Date(year, month, billingDay);

    // If billing day already passed this month, generate for next month
    if (dueDate < now) {
      dueDate.setMonth(dueDate.getMonth() + 1);
    }

    try {
      await db.insert(bills).values({
        subscriptionId: sub.id,
        amount: sub.expectedAmount || 0,
        currency: sub.currency || "USD",
        dueDate,
        paymentStatus: "pending",
      });
      created++;
    } catch {
      // Unique constraint violation = bill already exists for this period
    }
  }

  return NextResponse.json({ created, total: activeSubscriptions.length });
}
