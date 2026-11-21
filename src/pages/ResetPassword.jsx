import React, { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Lock,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import AuthLayout from "@/components/AuthLayout";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Supabase may provide a recovery code or establish a recovery session
  // through the URL hash, depending on the configured email flow.
  const resetToken = searchParams.get("token");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const [sessionReady, setSessionReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  /**
   * Check whether Supabase has established a password recovery session.
   */
  React.useEffect(() => {
    let active = true;

    async function initializeRecovery() {
      try {
        // Support token_hash links when using a custom Supabase email template.
        if (tokenHash && type === "recovery") {
          const { error: verifyError } =
            await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: "recovery",
            });

          if (verifyError) throw verifyError;
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (active) {
          setSessionReady(Boolean(session));
        }
      } catch (err) {
        console.error("Recovery session error:", err);

        if (active) {
          setError(
            err.message || "Your password reset link is invalid or expired."
          );
        }
      } finally {
        if (active) {
          setCheckingSession(false);
        }
      }
    }

    initializeRecovery();

    return () => {
      active = false;
    };
  }, [tokenHash, type]);

  /**
   * Update password.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session) {
        throw new Error(
          "Your password reset session has expired. Please request a new reset link."
        );
      }

      const { error: updateError } =
        await supabase.auth.updateUser({
          password: newPassword,
        });

      if (updateError) throw updateError;

      setSuccess(true);
    } catch (err) {
      console.error("Password reset error:", err);

      setError(
        err.message || "Failed to reset password."
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Checking recovery session.
   */
  if (checkingSession) {
    return (
      <AuthLayout
        icon={Lock}
        title="Verifying reset link"
        subtitle="Please wait while we validate your password reset link."
      >
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AuthLayout>
    );
  }

  /**
   * Invalid recovery link.
   */
  if (!sessionReady) {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title="Invalid reset link"
        subtitle="This password reset link is missing, invalid or expired."
        footer={
          <Link
            to="/forgot-password"
            className="font-medium text-primary hover:underline"
          >
            Request a new link
          </Link>
        }
      >
        <p className="text-center text-sm text-foreground">
          {error ||
            "The link you used appears to be incomplete. Please request a new password reset email."}
        </p>
      </AuthLayout>
    );
  }

  /**
   * Password successfully updated.
   */
  if (success) {
    return (
      <AuthLayout
        icon={CheckCircle2}
        title="Password updated"
        subtitle="Your password has been changed successfully."
        footer={
          <Link
            to="/login"
            className="font-medium text-primary hover:underline"
          >
            Continue to login
          </Link>
        }
      >
        <p className="text-center text-sm text-muted-foreground">
          You can now sign in using your new password.
        </p>
      </AuthLayout>
    );
  }

  /**
   * New password form.
   */
  return (
    <AuthLayout
      icon={Lock}
      title="New password"
      subtitle="Enter your new password below"
    >
      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {/* New Password */}
        <div className="space-y-2">
          <Label htmlFor="password">
            New Password
          </Label>

          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />

            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              autoFocus
              placeholder="••••••••"
              value={newPassword}
              onChange={(event) =>
                setNewPassword(event.target.value)
              }
              className="h-12 pl-10"
              required
            />
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirm">
            Confirm Password
          </Label>

          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />

            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              className="h-12 pl-10"
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          className="h-12 w-full font-medium"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resetting...
            </>
          ) : (
            "Reset password"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}