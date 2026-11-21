import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";

import { supabase } from "@/lib/supabase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);

  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Supabase does not have Base44 app-level public settings.
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  // --------------------------------------------------
  // CHECK AUTHENTICATION
  // --------------------------------------------------

  const checkUserAuth = useCallback(async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      const {
        data: { user: currentUser },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        throw error;
      }

      setUser(currentUser);
      setIsAuthenticated(!!currentUser);

      return currentUser;
    } catch (error) {
      console.error("User auth check failed:", error);

      setUser(null);
      setIsAuthenticated(false);

      if (error.message) {
        setAuthError({
          type: "auth_required",
          message: error.message,
        });
      }

      return null;
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  // --------------------------------------------------
  // CHECK APP STATE
  // --------------------------------------------------

  const checkAppState = useCallback(async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsAuthenticated(!!currentSession?.user);
    } catch (error) {
      console.error("App initialization failed:", error);

      setAuthError({
        type: "unknown",
        message: error.message || "Failed to load application",
      });

      setSession(null);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  // --------------------------------------------------
  // AUTH STATE LISTENER
  // --------------------------------------------------

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!mounted) return;

      setSession(currentSession);

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setUser(currentSession?.user ?? null);
        setIsAuthenticated(!!currentSession?.user);
        setAuthError(null);
      }

      if (event === "SIGNED_OUT") {
        setUser(null);
        setSession(null);
        setIsAuthenticated(false);
      }
    });

    checkAppState();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkAppState]);

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  const logout = async (shouldRedirect = true) => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setUser(null);
      setSession(null);
      setIsAuthenticated(false);

      if (shouldRedirect) {
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Logout failed:", error);
      setAuthError({
        type: "logout_error",
        message: error.message || "Failed to logout",
      });
    }
  };

  // --------------------------------------------------
  // NAVIGATE TO LOGIN
  // --------------------------------------------------

  const navigateToLogin = () => {
    window.location.href = "/login";
  };

  // --------------------------------------------------
  // CONTEXT PROVIDER
  // --------------------------------------------------

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// --------------------------------------------------
// AUTH HOOK
// --------------------------------------------------

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
