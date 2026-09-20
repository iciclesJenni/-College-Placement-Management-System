import { useState, useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import {
  getMockUser,
  clearMockUser,
  type MockUser,
} from "@/lib/mock-auth";

export function useAuth() {
  // ─── Convex auth state ───
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.currentUser);
  const { signIn, signOut } = useAuthActions();

  // ─── Mock auth state ───
  // Mirrors the current sessionStorage value; updated on mount + on
  // the "mock-auth-change" custom event fired by setMockUser / clearMockUser.
  const [mockUser, setMockUserState] = useState<MockUser | null>(() =>
    getMockUser(),
  );

  useEffect(() => {
    const update = () => setMockUserState(getMockUser());
    // Sync on mount (handles route transitions)
    update();
    window.addEventListener("mock-auth-change", update);
    return () => window.removeEventListener("mock-auth-change", update);
  }, []);

  // ─── Derived state ───
  const hasMockUser = mockUser !== null;
  const isLoading = !hasMockUser && (isAuthLoading || user === undefined);

  // Mock user takes precedence; fall back to Convex user
  const resolvedUser = hasMockUser
    ? mockUser
    : user;

  return {
    isLoading,
    isAuthenticated: hasMockUser || isAuthenticated,
    user: resolvedUser,
    signIn,
    signOut,
    /**
     * Sign out from both mock and Convex sessions.
     */
    signOutAll: async () => {
      clearMockUser();
      try {
        await signOut();
      } catch {
        // Convex signOut may throw if no session — that's fine
      }
    },
  };
}
