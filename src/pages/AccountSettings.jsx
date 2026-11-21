import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, LogOut, ShieldCheck } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { useProfile } from "@/lib/ProfileContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import StatusBadge from "@/components/account/StatusBadge";

const DEFAULT_PREFERENCES = {
  product_updates: true,
  blueprint_activity: true,
  mentor_replies: true,
};

const PREFERENCES = [
  {
    key: "product_updates",
    label: "Product updates",
    hint: "New blueprints and platform changes.",
  },
  {
    key: "blueprint_activity",
    label: "Blueprint activity",
    hint: "Purchases, access and creator replies.",
  },
  {
    key: "mentor_replies",
    label: "Mentorship replies",
    hint: "Session confirmations and messages.",
  },
];

export default function AccountSettings() {
  const { user, logout } = useAuth();
  const { profile, role, refresh } = useProfile();

  const [form, setForm] = useState({
    fullName: "",
    username: "",
  });

  const [saving, setSaving] = useState(false);
  const [savingPref, setSavingPref] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [prefs, setPrefs] = useState(DEFAULT_PREFERENCES);

  // Initialize profile form
  useEffect(() => {
    setForm({
      fullName: profile?.full_name || user?.user_metadata?.full_name || "",
      username: profile?.username || "",
    });
  }, [profile, user]);

  // Initialize notification preferences
  useEffect(() => {
    setPrefs({
      ...DEFAULT_PREFERENCES,
      ...(profile?.notification_prefs || {}),
    });
  }, [profile]);

  // -----------------------------------------
  // UPDATE PROFILE
  // -----------------------------------------

  const save = async (event) => {
    event.preventDefault();

    if (!user?.id) {
      setError("User session not found. Please sign in again.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const fullName = form.fullName.trim();
      const username = form.username.trim();

      if (!username) {
        throw new Error("Username is required.");
      }

      if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
        throw new Error(
          "Username must contain 3-24 letters, numbers or underscores."
        );
      }

      // Update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          username,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) {
        if (profileError.code === "23505") {
          throw new Error("This username is already taken.");
        }

        throw profileError;
      }

      // Update Supabase Auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
        },
      });

      if (authError) {
        throw authError;
      }

      // Refresh profile context
      await refresh();

      setMessage("Profile updated successfully.");
    } catch (err) {
      console.error("Profile update error:", err);

      setError(err.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------------------
  // UPDATE NOTIFICATION PREFERENCES
  // -----------------------------------------

  const togglePref = async (key) => {
    if (!user?.id || savingPref) return;

    const previous = { ...prefs };

    const next = {
      ...prefs,
      [key]: !prefs[key],
    };

    // Optimistic UI update
    setPrefs(next);
    setSavingPref(key);
    setError("");
    setMessage("");

    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          notification_prefs: next,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      setMessage("Notification preferences saved.");
    } catch (err) {
      console.error("Notification preference update error:", err);

      // Rollback optimistic update
      setPrefs(previous);

      setError(
        err.message || "Unable to update notification preferences."
      );
    } finally {
      setSavingPref(null);
    }
  };

  // -----------------------------------------
  // SIGN OUT
  // -----------------------------------------

  const signOut = async () => {
    try {
      await logout(false);
      window.location.href = "/login";
    } catch (err) {
      console.error("Sign out error:", err);
      setError("Unable to sign out. Please try again.");
    }
  };

  // -----------------------------------------
  // UI
  // -----------------------------------------

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Account</p>

        <h1 className="mt-2 text-2xl leading-tight sm:text-3xl">
          Settings
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Update your profile, password and notification preferences.
        </p>
      </div>

      {(message || error) && (
        <p
          className={`rounded-xl px-4 py-3 text-sm ${
            error
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary"
          }`}
        >
          {error || message}
        </p>
      )}

      {/* PROFILE */}

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">Profile</p>

          <StatusBadge
            status={
              role === "creator"
                ? "verified"
                : role === "admin"
                ? "published"
                : "new"
            }
            label={role || "user"}
          />
        </div>

        <form onSubmit={save} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>

            <Input
              id="fullName"
              value={form.fullName}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  fullName: event.target.value,
                }))
              }
              className="h-11"
              placeholder="How your name appears on requests"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>

            <Input
              id="username"
              value={form.username}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  username: event.target.value,
                }))
              }
              className="h-11"
              placeholder="3-24 letters, numbers or underscores"
            />

            <p className="text-xs text-muted-foreground">
              You can sign in with this instead of your email.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Email</Label>

            <Input
              value={user?.email || ""}
              readOnly
              className="h-11 bg-secondary/60"
            />

            <p className="text-xs text-muted-foreground">
              Your sign-in email is managed by the platform.
            </p>
          </div>

          <Button
            type="submit"
            className="h-11 w-full rounded-full sm:w-auto"
            disabled={saving}
          >
            {saving && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}

            Save profile
          </Button>
        </form>
      </section>

      {/* PASSWORD */}

      <section className="rounded-2xl border border-border bg-card p-5">
        <p className="text-sm font-medium">Password</p>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          We email you a secure link to set a new password — the same
          flow as "Forgot password".
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Link
            to="/forgot-password"
            className="rounded-full bg-primary px-5 py-2.5 text-center text-sm font-medium text-primary-foreground"
          >
            Send password reset link
          </Link>

          <Link
            to="/mfa"
            className="rounded-full border border-border px-5 py-2.5 text-center text-sm font-medium"
          >
            <ShieldCheck className="mr-1.5 inline h-4 w-4" />
            Two-factor authentication
          </Link>
        </div>
      </section>

      {/* NOTIFICATION PREFERENCES */}

      <section className="rounded-2xl border border-border bg-card p-5">
        <p className="text-sm font-medium">
          Notification preferences
        </p>

        <ul className="mt-4 divide-y divide-border">
          {PREFERENCES.map((item) => (
            <li
              key={item.key}
              className="flex items-center justify-between gap-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm">{item.label}</p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.hint}
                </p>
              </div>

              <Switch
                checked={Boolean(prefs[item.key])}
                disabled={savingPref !== null}
                onCheckedChange={() => togglePref(item.key)}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* SESSION */}

      <section className="rounded-2xl border border-border bg-card p-5">
        <p className="text-sm font-medium">Session</p>

        <p className="mt-2 text-sm text-muted-foreground">
          Signed in as {user?.email || "your account"}.
        </p>

        <button
          type="button"
          onClick={signOut}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </section>
    </div>
  );
}