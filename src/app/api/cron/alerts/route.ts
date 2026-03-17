import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bills, subscriptions, entities, alertSettings, alertLog } from "@/lib/db/schema";
import { eq, and, lte } from "drizzle-orm";
import { sendBillAlertEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  // Vercel Cron calls GET with this header
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return runAlerts();
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return runAlerts();
}

async function runAlerts() {
  // Get enabled alert settings
  const settings = await db
    .select()
    .from(alertSettings)
    .where(eq(alertSettings.enabled, true));

  if (settings.length === 0) {
    return NextResponse.json({ message: "No alert settings configured" });
  }

  let totalSent = 0;
  const now = new Date();

  for (const setting of settings) {
    const daysAhead = setting.daysBeforeDue || 3;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    // Find unpaid bills due within the alert window (or already overdue)
    const upcomingBills = await db
      .select({
        billId: bills.id,
        subscriptionName: subscriptions.name,
        entityName: entities.name,
        amount: bills.amount,
        currency: bills.currency,
        dueDate: bills.dueDate,
      })
      .from(bills)
      .leftJoin(subscriptions, eq(bills.subscriptionId, subscriptions.id))
      .leftJoin(entities, eq(subscriptions.entityId, entities.id))
      .where(
        and(
          eq(bills.paymentStatus, "pending"),
          lte(bills.dueDate, futureDate)
        )
      );

    // Filter out bills that already had alerts sent to this email
    const billsToAlert = [];
    for (const bill of upcomingBills) {
      const existing = await db
        .select()
        .from(alertLog)
        .where(
          and(
            eq(alertLog.billId, bill.billId),
            eq(alertLog.emailTo, setting.emailTo)
          )
        );

      if (existing.length === 0) {
        const daysUntilDue = Math.ceil(
          (new Date(bill.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        billsToAlert.push({
          billId: bill.billId,
          subscriptionName: bill.subscriptionName || "Unknown",
          entityName: bill.entityName || "Unknown",
          amount: bill.amount,
          currency: bill.currency || "USD",
          dueDate: new Date(bill.dueDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
          daysUntilDue,
        });
      }
    }

    if (billsToAlert.length > 0) {
      await sendBillAlertEmail(setting.emailTo, billsToAlert);

      // Log sent alerts
      for (const bill of billsToAlert) {
        await db.insert(alertLog).values({
          billId: bill.billId,
          emailTo: setting.emailTo,
        }).onConflictDoNothing();
      }

      totalSent += billsToAlert.length;
    }
  }

  // Mark overdue bills
  const overdueBills = await db
    .select()
    .from(bills)
    .where(
      and(
        eq(bills.paymentStatus, "pending"),
        lte(bills.dueDate, now)
      )
    );

  for (const bill of overdueBills) {
    await db
      .update(bills)
      .set({ paymentStatus: "overdue", updatedAt: new Date() })
      .where(eq(bills.id, bill.id));
  }

  return NextResponse.json({ alertsSent: totalSent, overdueMarked: overdueBills.length });
}
