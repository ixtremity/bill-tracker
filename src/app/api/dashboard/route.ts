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
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  sevenDaysFromNow.setHours(23, 59, 59, 999);

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

  // This month's bills
  const monthBills = allBills.filter((b) => {
    if (!b.dueDate) return false;
    const d = new Date(b.dueDate).getTime();
    return d >= startOfMonth.getTime() && d <= endOfMonth.getTime();
  });

  const paidThisMonth = monthBills
    .filter((b) => b.paymentStatus === "paid")
    .reduce((sum, b) => sum + (b.amount || 0), 0);
  const pendingThisMonth = monthBills
    .filter((b) => b.paymentStatus === "pending")
    .reduce((sum, b) => sum + (b.amount || 0), 0);
  const overdueThisMonth = monthBills
    .filter((b) => b.paymentStatus === "overdue" || (b.paymentStatus === "pending" && new Date(b.dueDate).getTime() < today.getTime()))
    .reduce((sum, b) => sum + (b.amount || 0), 0);

  // Upcoming (next 7 days, unpaid)
  const upcomingBills = allBills.filter((b) => {
    if (!b.dueDate) return false;
    const d = new Date(b.dueDate).getTime();
    return d >= today.getTime() && d <= sevenDaysFromNow.getTime() && b.paymentStatus !== "paid";
  });

  // Overdue
  const overdueBills = allBills.filter((b) => {
    if (!b.dueDate) return false;
    return b.paymentStatus === "overdue" || (b.paymentStatus === "pending" && new Date(b.dueDate).getTime() < today.getTime());
  });

  // Monthly trend (last 6 months)
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
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

  const totalMonthly = monthBills.reduce((sum, b) => sum + (b.amount || 0), 0);

  return NextResponse.json({
    totalMonthly,
    upcomingCount: upcomingBills.length,
    overdueCount: overdueBills.length,
    paidThisMonth,
    pendingThisMonth,
    overdueThisMonth,
    upcomingBills: upcomingBills.slice(0, 10),
    recentBills: allBills.slice(0, 20),
    entities: allEntities,
    subscriptionCount: allSubscriptions.length,
    monthlyTrend,
  });
}
