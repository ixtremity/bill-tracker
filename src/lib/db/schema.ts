import { pgTable, text, serial, integer, real, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

// Entities (companies/organizations) that own subscriptions
export const entities = pgTable("entities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  color: text("color").default("#6366f1"),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
});

// Subscription catalog (the services you subscribe to)
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  entityId: integer("entity_id")
    .notNull()
    .references(() => entities.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  url: text("url"),
  category: text("category").default("other"),
  billingCycle: text("billing_cycle").default("monthly"),
  expectedAmount: real("expected_amount"),
  currency: text("currency").default("USD"),
  billingDay: integer("billing_day"),
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

// Individual bill records per billing period
export const bills = pgTable(
  "bills",
  {
    id: serial("id").primaryKey(),
    subscriptionId: integer("subscription_id")
      .notNull()
      .references(() => subscriptions.id, { onDelete: "cascade" }),
    amount: real("amount").notNull(),
    currency: text("currency").default("USD"),
    dueDate: timestamp("due_date").notNull(),
    paidAt: timestamp("paid_at"),
    paymentStatus: text("payment_status").default("pending"),
    cardId: integer("card_id").references(() => paymentCards.id, { onDelete: "set null" }),
    notes: text("notes"),
    createdAt: timestamp("created_at").$defaultFn(() => new Date()),
    updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("bill_subscription_due_unique").on(table.subscriptionId, table.dueDate),
  ]
);

// Payment methods
export const paymentCards = pgTable("payment_cards", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  last4: text("last4"),
  brand: text("brand"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
});

// Alert settings
export const alertSettings = pgTable("alert_settings", {
  id: serial("id").primaryKey(),
  emailTo: text("email_to").notNull(),
  daysBeforeDue: integer("days_before_due").default(3),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

// Alert log (to avoid duplicate emails)
export const alertLog = pgTable(
  "alert_log",
  {
    id: serial("id").primaryKey(),
    billId: integer("bill_id")
      .notNull()
      .references(() => bills.id, { onDelete: "cascade" }),
    sentAt: timestamp("sent_at").$defaultFn(() => new Date()),
    emailTo: text("email_to").notNull(),
  },
  (table) => [
    uniqueIndex("alert_log_bill_email_unique").on(table.billId, table.emailTo),
  ]
);
