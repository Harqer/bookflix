import { useAuth as useClerkAuth, useUser, useOrganization } from "@clerk/clerk-expo";
import { useMemo } from "react";

export function useAuth() {
  const { isLoaded: authLoaded, userId, signOut, getToken } = useClerkAuth();
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const { organization, isLoaded: orgLoaded } = useOrganization();

  const user = useMemo(() => {
    if (!clerkUser) return null;
    return {
      id: clerkUser.id,
      name: clerkUser.fullName || clerkUser.username || "Studio Member",
      email: clerkUser.primaryEmailAddress?.emailAddress || "",
      imageUrl: clerkUser.imageUrl,
      createdAt: new Date(clerkUser.createdAt),
      // In a real app, you might sync 'role' from your DB
      role: (clerkUser.publicMetadata.role as string) || "user",
    };
  }, [clerkUser]);

  const isAuthenticated = Boolean(userId);
  const loading = !authLoaded || !userLoaded || !orgLoaded;

  return {
    user,
    organization,
    loading,
    isAuthenticated,
    isStudioMember: Boolean(organization),
    logout: signOut,
    getToken,
  };
}

