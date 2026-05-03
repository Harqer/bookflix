import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

/**
 * 🗄️ Neon Production Schema (Drizzle ORM)
 * This is the synchronous "Source of Truth" for user identity.
 */

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email"),
  name: text("name"),
  imageUrl: text("image_url"),
  tier: text("tier").default("free").notNull(),
  credits: integer("credits").default(10).notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
