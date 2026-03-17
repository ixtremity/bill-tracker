export interface Entity {
  id: number;
  name: string;
  slug: string;
  color: string | null;
  createdAt: Date | null;
}

export interface Subscription {
  id: number;
  entityId: number;
  entityName: string;
  entityColor: string | null;
  name: string;
  slug: string;
  url: string | null;
  category: string | null;
  billingCycle: string | null;
  expectedAmount: number | null;
  currency: string | null;
  billingDay: number | null;
  isActive: boolean | null;
  notes: string | null;
  createdAt: Date | null;
}

export interface Bill {
  id: number;
  subscriptionId: number;
  subscriptionName: string;
  subscriptionSlug: string;
  entityName: string;
  entityColor: string | null;
  amount: number;
  currency: string | null;
  dueDate: string;
  paidAt: string | null;
  paymentStatus: string | null;
  cardId: number | null;
  cardLabel: string | null;
  notes: string | null;
  createdAt: Date | null;
}

export interface PaymentCard {
  id: number;
  label: string;
  last4: string | null;
  brand: string | null;
  isDefault: boolean | null;
  createdAt: Date | null;
}

export interface AlertSetting {
  id: number;
  emailTo: string;
  daysBeforeDue: number | null;
  enabled: boolean | null;
  createdAt: Date | null;
}

export type PaymentStatus = "paid" | "pending" | "overdue";

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string }> = {
  paid: { label: "Paid", color: "bg-green-100 text-green-800" },
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  overdue: { label: "Overdue", color: "bg-red-100 text-red-800" },
};

export const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  ai: { label: "AI", color: "bg-purple-100 text-purple-800" },
  cloud: { label: "Cloud", color: "bg-blue-100 text-blue-800" },
  "dev-tools": { label: "Dev Tools", color: "bg-orange-100 text-orange-800" },
  productivity: { label: "Productivity", color: "bg-green-100 text-green-800" },
  business: { label: "Business", color: "bg-cyan-100 text-cyan-800" },
  hosting: { label: "Hosting", color: "bg-pink-100 text-pink-800" },
  other: { label: "Other", color: "bg-gray-100 text-gray-800" },
};

export interface DashboardData {
  totalAll: number;
  totalPending: number;
  totalPaid: number;
  totalOverdue: number;
  upcomingCount: number;
  overdueCount: number;
  upcomingBills: Bill[];
  recentBills: Bill[];
  entities: Entity[];
  subscriptionCount: number;
  monthlyTrend: { month: string; amount: number }[];
}

export const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function daysUntil(date: string | Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
