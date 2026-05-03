import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/expo";

/**
 * 🔄 Global User Sync Hook
 * Synchronously checks and syncs user information to Neon DB
 * every time the user comes to the app.
 */
export function useSyncUser() {
  const { user } = useUser();
  const storeUser = useMutation(api.users.storeUser);

  useEffect(() => {
    const sync = async () => {
      if (user) {
        console.log(`[*] Synchronously syncing user: ${user.id}`);
        try {
          await storeUser({
            clerkId: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            name: user.fullName || undefined,
          });
          console.log(`[+] User synced successfully to Convex & Neon`);
        } catch (error) {
          console.error(`[!] User sync failed:`, error);
        }
      }
    };

    sync();
  }, [user, storeUser]);
}
