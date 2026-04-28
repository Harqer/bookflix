import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { createClerkClient } from "@clerk/backend";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  orgId: string | null;
};

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;
  let orgId: string | null = null;

  try {
    // ── Modern Auth Verification ──
    // authenticateRequest handles token verification, clock skew, and expired tokens gracefully
    const authState = await clerk.authenticateRequest(opts.req);

    if (authState.isSignedIn) {
      const { userId, sessionClaims, orgId: currentOrgId } = authState;
      orgId = currentOrgId || null;

      // Check if user is already in our DB to avoid unnecessary API calls
      // Use session claims if possible, otherwise fallback to getUser
      const existingUser = await sdk.getUserById(userId);
      
      if (existingUser) {
        user = existingUser;
      } else {
        // First-time sync: fetch full details from Clerk
        const clerkUser = await clerk.users.getUser(userId);
        user = {
          id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          name: `${clerkUser.firstName} ${clerkUser.lastName}`.trim() || clerkUser.username || "Studio Member",
          imageUrl: clerkUser.imageUrl,
          role: "user",
          createdAt: new Date(clerkUser.createdAt),
          updatedAt: new Date(clerkUser.updatedAt),
          lastSignedIn: new Date()
        } as User;

        await sdk.upsertUser(user);
      }
    }
  } catch (error) {
    console.error("[Auth] Clerk authentication error:", error);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    orgId,
  };
}

