import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface BillAlert {
  subscriptionName: string;
  entityName: string;
  amount: number;
  currency: string;
  dueDate: string;
  daysUntilDue: number;
}

export async function sendBillAlertEmail(to: string, bills: BillAlert[]) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set, skipping email");
    return;
  }

  const billRows = bills
    .map(
      (b) =>
        `<tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${b.subscriptionName}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${b.entityName}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">$${b.amount.toFixed(2)} ${b.currency}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${b.dueDate}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-weight: bold; color: ${b.daysUntilDue <= 0 ? '#dc2626' : b.daysUntilDue <= 3 ? '#d97706' : '#16a34a'};">
            ${b.daysUntilDue <= 0 ? 'OVERDUE' : `${b.daysUntilDue} day${b.daysUntilDue === 1 ? '' : 's'}`}
          </td>
        </tr>`
    )
    .join("");

  const overdueCount = bills.filter((b) => b.daysUntilDue <= 0).length;
  const subject = overdueCount > 0
    ? `[OVERDUE] ${overdueCount} overdue bill${overdueCount > 1 ? 's' : ''} + ${bills.length - overdueCount} upcoming`
    : `${bills.length} upcoming bill${bills.length > 1 ? 's' : ''} due soon`;

  await resend.emails.send({
    from: process.env.ALERT_EMAIL_FROM || "Bill Tracker <bills@yourdomain.com>",
    to: [to],
    subject,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Bill Tracker Alert</h2>
        <p style="color: #6b7280;">The following bills need your attention:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <thead>
            <tr style="background: #f9fafb;">
              <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Service</th>
              <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Entity</th>
              <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Amount</th>
              <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Due Date</th>
              <th style="padding: 8px 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${billRows}
          </tbody>
        </table>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">Sent by Bill Tracker</p>
      </div>
    `,
  });
}
