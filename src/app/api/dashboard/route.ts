import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bills, subscriptions, entities, paymentCards } from "@/lib/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export async function GET() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

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
    const d = new Date(b.dueDate);
    return d >= startOfMonth && d <= endOfMonth;
  });

  const paidThisMonth = monthBills
    .filter((b) => b.paymentStatus === "paid")
    .reduce((sum, b) => sum + b.amount, 0);
  const pendingThisMonth = monthBills
    .filter((b) => b.paymentStatus === "pending")
    .reduce((sum, b) => sum + b.amount, 0);
  const overdueThisMonth = monthBills
    .filter((b) => b.paymentStatus === "overdue")
    .reduce((sum, b) => sum + b.amount, 0);

  // Upcoming (next 7 days, unpaid)
  const upcomingBills = allBills.filter((b) => {
    const d = new Date(b.dueDate);
    return d >= now && d <= sevenDaysFromNow && b.paymentStatus !== "paid";
  });

  // Overdue
  const overdueBills = allBills.filter(
    (b) => b.paymentStatus === "overdue" || (b.paymentStatus === "pending" && new Date(b.dueDate) < now)
  );

  // Monthly trend (last 6 months)
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    const monthName = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    const total = allBills
      .filter((b) => {
        const bd = new Date(b.dueDate);
        return bd >= d && bd <= monthEnd;
      })
      .reduce((sum, b) => sum + b.amount, 0);
    monthlyTrend.push({ month: monthName, amount: total });
  }

  // Entities
  const allEntities = await db.select().from(entities).orderBy(entities.name);

  // Subscription count
  const allSubscriptions = await db.select().from(subscriptions).where(eq(subscriptions.isActive, true));

  const totalMonthly = monthBills.reduce((sum, b) => sum + b.amount, 0);

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
