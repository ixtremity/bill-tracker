import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { entities, subscriptions, alertSettings } from "./schema";
import { eq } from "drizzle-orm";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function seed() {
  await migrate(db, { migrationsFolder: "./drizzle" });

  // Default entities
  const defaultEntities = [
    { name: "Default", slug: "default", color: "#6366f1" },
  ];

  for (const entity of defaultEntities) {
    await db.insert(entities)
      .values(entity)
      .onConflictDoNothing({ target: entities.slug });
  }

  const defaultEntity = await db.select().from(entities).where(eq(entities.slug, "default")).then(rows => rows[0]);

  // Default subscriptions
  const defaultSubscriptions = [
    { name: "OpenAI", slug: "openai", category: "ai", url: "https://platform.openai.com/billing", expectedAmount: 0, billingDay: 1, billingCycle: "monthly" },
    { name: "Anthropic (Claude)", slug: "anthropic", category: "ai", url: "https://console.anthropic.com/settings/billing", expectedAmount: 0, billingDay: 1, billingCycle: "monthly" },
    { name: "Exa", slug: "exa", category: "ai", url: "https://dashboard.exa.ai", expectedAmount: 0, billingDay: 1, billingCycle: "monthly" },
    { name: "Tavily", slug: "tavily", category: "ai", url: "https://app.tavily.com", expectedAmount: 0, billingDay: 1, billingCycle: "monthly" },
    { name: "Apollo", slug: "apollo", category: "business", url: "https://app.apollo.io", expectedAmount: 0, billingDay: 1, billingCycle: "monthly" },
    { name: "Hostinger", slug: "hostinger", category: "hosting", url: "https://www.hostinger.com", expectedAmount: 0, billingDay: 1, billingCycle: "monthly" },
    { name: "AWS", slug: "aws", category: "cloud", url: "https://console.aws.amazon.com/billing", expectedAmount: 0, billingDay: 1, billingCycle: "monthly" },
    { name: "Google Cloud", slug: "gcp", category: "cloud", url: "https://console.cloud.google.com/billing", expectedAmount: 0, billingDay: 1, billingCycle: "monthly" },
    { name: "Google Workspace", slug: "google-workspace", category: "productivity", url: "https://admin.google.com/ac/billing", expectedAmount: 0, billingDay: 1, billingCycle: "monthly" },
    { name: "Auth0", slug: "auth0", category: "dev-tools", url: "https://manage.auth0.com", expectedAmount: 0, billingDay: 1, billingCycle: "monthly" },
  ];

  for (const sub of defaultSubscriptions) {
    const existing = await db.select().from(subscriptions)
      .where(eq(subscriptions.slug, sub.slug));

    if (existing.length === 0) {
      await db.insert(subscriptions).values({
        ...sub,
        entityId: defaultEntity?.id || 1,
      });
    }
  }

  // Default alert settings
  const existingAlerts = await db.select().from(alertSettings);
  if (existingAlerts.length === 0) {
    await db.insert(alertSettings).values({
      emailTo: process.env.ALERT_EMAIL_TO || "your@email.com",
      daysBeforeDue: 3,
      enabled: true,
    });
  }

  console.log("Seed complete: inserted entities, subscriptions, and alert settings");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
