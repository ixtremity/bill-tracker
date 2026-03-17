import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bills, subscriptions, entities, paymentCards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET() {
  const now = new Date();
  const today = startOfDay(now);

  // All bills with joins
  const allBills = await db
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

  // All unpaid bills (pending or overdue)
  const unpaidBills = allBills.filter((b) => b.paymentStatus !== "paid");

  // Total pending amount (all unpaid bills regardless of month)
  const totalPending = unpaidBills.reduce((sum, b) => sum + (b.amount || 0), 0);

  // Paid total (all time)
  const totalPaid = allBills
    .filter((b) => b.paymentStatus === "paid")
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  // Overdue (past due and not paid)
  const overdueBills = allBills.filter((b) => {
    if (!b.dueDate) return false;
    return b.paymentStatus === "overdue" || (b.paymentStatus === "pending" && new Date(b.dueDate).getTime() < today.getTime());
  });
  const totalOverdue = overdueBills.reduce((sum, b) => sum + (b.amount || 0), 0);

  // Upcoming: all unpaid bills due today or later, sorted by due date
  const upcomingBills = allBills.filter((b) => {
    if (!b.dueDate) return false;
    return new Date(b.dueDate).getTime() >= today.getTime() && b.paymentStatus !== "paid";
  });

  // Monthly trend (last 6 months + current month)
  const monthlyTrend = [];
  for (let i = 5; i >= -1; i--) {
    const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mEnd = new Date(mStart.getFullYear(), mStart.getMonth() + 1, 0, 23, 59, 59, 999);
    const monthName = mStart.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    const total = allBills
      .filter((b) => {
        if (!b.dueDate) return false;
        const bd = new Date(b.dueDate).getTime();
        return bd >= mStart.getTime() && bd <= mEnd.getTime();
      })
      .reduce((sum, b) => sum + (b.amount || 0), 0);
    monthlyTrend.push({ month: monthName, amount: total });
  }

  // Entities
  const allEntities = await db.select().from(entities).orderBy(entities.name);

  // Subscription count
  const allSubscriptions = await db.select().from(subscriptions).where(eq(subscriptions.isActive, true));

  // Total of all bills
  const totalAll = allBills.reduce((sum, b) => sum + (b.amount || 0), 0);

  return NextResponse.json({
    totalAll,
    totalPending,
    totalPaid,
    totalOverdue,
    upcomingCount: upcomingBills.length,
    overdueCount: overdueBills.length,
    upcomingBills: upcomingBills.slice(0, 10),
    recentBills: allBills.slice(0, 20),
    entities: allEntities,
    subscriptionCount: allSubscriptions.length,
    monthlyTrend,
  });
}
