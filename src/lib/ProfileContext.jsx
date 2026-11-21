import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getMyProfile } from "@/lib/access";

const ProfileContext = createContext({ profile: null, role: null, loading: true, refresh: async () => null });

export function ProfileProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setProfile(null);
      setLoading(false);
      return null;
    }
    setLoading(true);
    const next = await getMyProfile();
    setProfile(next);
    setLoading(false);
    return next;
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // The app owner keeps admin access even before their profile row exists.
  const role = profile?.role || (user?.role === "admin" ? "admin" : user ? "user" : null);

  return (
    <ProfileContext.Provider value={{ profile, role, loading, refresh }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);