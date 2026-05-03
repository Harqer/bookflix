"use node";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

/**
 * 🔄 Synchronous User Synchronization
 * Purpose: Mirror Clerk identity to Neon Postgres via Drizzle ORM.
 */
export const syncUserToNeon = internalAction({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql);

    console.log(`[*] Syncing user ${args.clerkId} to Neon...`);

    try {
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, args.clerkId))
        .limit(1);

      const payload = {
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
        updatedAt: new Date(),
      };

      if (existing.length > 0) {
        await db
          .update(users)
          .set(payload)
          .where(eq(users.clerkId, args.clerkId));
        console.log(`[+] User updated in Neon.`);
      } else {
        await db.insert(users).values({
          clerkId: args.clerkId,
          ...payload,
          tier: "free",
          credits: 10,
          createdAt: new Date(),
        });
        console.log(`[+] New user inserted in Neon.`);
      }
    } catch (error) {
      console.error("[!] Neon Sync Failed:", error);
      throw new Error("Failed to synchronize user data to the sovereign database.");
    }
  },
});
