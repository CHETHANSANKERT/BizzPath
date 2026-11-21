import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

import {
  UserPlus,
  Mail,
  Lock,
  Loader2,
  AtSign,
  User,
} from "lucide-react";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";

import { toast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/authReturnTo";

import {
  isUsernameAvailable,
  saveProfile,
} from "@/services/registrationService";

export default function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [accountType, setAccountType] = useState("user");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);

  const [otpCode, setOtpCode] = useState("");

  const loginPath =
    "/login" +
    (safeReturnTo() !== "/"
      ? "?returnTo=" + encodeURIComponent(safeReturnTo())
      : "");

  /**
   * Email and password registration.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const handle = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (!/^[a-z0-9_]{3,24}$/.test(handle)) {
      setError(
        "Usernames use 3-24 letters, numbers or underscores"
      );
      return;
    }

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    setLoading(true);

    try {
      // Check username availability.
      const availability = await isUsernameAvailable(handle);

      if (!availability.available) {
        setError(
          availability.error || "That username is already taken"
        );
        return;
      }

      // Register user using Supabase Auth.
      const { data, error: signUpError } =
        await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              username: handle,
              role: accountType,
            },
          },
        });

      if (signUpError) throw signUpError;

      if (!data.user) {
        throw new Error("Unable to create your account.");
      }

      // Supabase sends the email verification code
      // when email confirmation is enabled.
      setEmail(normalizedEmail);
      setShowOtp(true);

      toast({
        title: "Verification code sent",
        description: "Check your email for the verification code.",
      });
    } catch (err) {
      console.error("Registration error:", err);

      setError(
        err.message || "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verify email OTP.
   */
  const handleVerify = async () => {
    if (otpCode.length !== 6) {
      setError("Enter the complete six-digit verification code.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const { data, error: verifyError } =
        await supabase.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token: otpCode,
          type: "signup",
        });

      if (verifyError) throw verifyError;

      const user = data.user;

      if (!user) {
        throw new Error(
          "Email verified, but the user session was not returned. Please log in."
        );
      }

      // Save profile after successful email verification.
      const saved = await saveProfile({
        userId: user.id,
        username: username.trim().toLowerCase(),
        role: accountType,
        fullName: fullName.trim(),
      });

      if (saved?.error) {
        setError(saved.error);
        return;
      }

      toast({
        title: "Account created",
        description: "Your email has been verified successfully.",
      });

      // Navigate to the portal.
      navigate("/portal", {
        replace: true,
      });
    } catch (err) {
      console.error("OTP verification error:", err);

      setError(
        err.message || "Invalid verification code"
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resend email verification OTP.
   */
  const handleResend = async () => {
    setError("");

    try {
      const { error: resendError } =
        await supabase.auth.resend({
          type: "signup",
          email: email.trim().toLowerCase(),
        });

      if (resendError) throw resendError;

      toast({
        title: "Code sent",
        description: "Check your email for the new code.",
      });
    } catch (err) {
      console.error("OTP resend error:", err);

      setError(
        err.message || "Failed to resend code"
      );
    }
  };

  /**
   * Google OAuth registration.
   */
  const handleGoogle = async () => {
    setError("");
    setLoading(true);

    try {
      const returnTo = safeReturnTo();

      const redirectTo = new URL(
        "/auth/callback",
        window.location.origin
      );

      redirectTo.searchParams.set(
        "returnTo",
        returnTo
      );

      const { error: oauthError } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: redirectTo.toString(),
            queryParams: {
              access_type: "offline",
              prompt: "select_account",
            },
          },
        });

      if (oauthError) throw oauthError;
    } catch (err) {
      console.error("Google OAuth error:", err);

      setError(
        err.message || "Unable to sign in with Google"
      );

      setLoading(false);
    }
  };

  /**
   * OTP verification screen.
   */
  if (showOtp) {
    return (
      <AuthLayout
        icon={Mail}
        title="Verify your email"
        subtitle={`We sent a code to ${email}`}
      >
        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="mb-6 flex justify-center">
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={setOtpCode}
            autoFocus
            autoComplete="one-time-code"
          >
            <InputOTPGroup>
              {Array.from({ length: 6 }).map((_, index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          className="h-12 w-full font-medium"
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify"
          )}
        </Button>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Didn't receive the code?{" "}

          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            className="font-medium text-primary hover:underline disabled:opacity-50"
          >
            Resend
          </button>
        </p>
      </AuthLayout>
    );
  }

  /**
   * Registration screen.
   */
  return (
    <AuthLayout
      icon={UserPlus}
      title="Create your account"
      subtitle="Sign up to get started"
      footer={
        <>
          Already have an account?{" "}

          <Link
            to={loginPath}
            className="font-medium text-primary hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      {/* Google Registration */}
      <Button
        variant="outline"
        className="mb-6 h-12 w-full text-sm font-medium"
        onClick={handleGoogle}
        disabled={loading}
      >
        <GoogleIcon className="mr-2 h-5 w-5" />
        Continue with Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>

        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">
            or
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>

          <div className="relative">
            <User
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />

            <Input
              id="name"
              autoComplete="name"
              placeholder="Your name"
              value={fullName}
              onChange={(event) =>
                setFullName(event.target.value)
              }
              className="h-12 pl-10"
              required
            />
          </div>
        </div>

        {/* Username */}
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>

          <div className="relative">
            <AtSign
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />

            <Input
              id="username"
              autoComplete="username"
              placeholder="yourhandle"
              value={username}
              onChange={(event) =>
                setUsername(
                  event.target.value.toLowerCase()
                )
              }
              className="h-12 pl-10"
              required
            />
          </div>

          <p className="text-[11px] text-muted-foreground">
            You can sign in with this instead of your email.
          </p>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>

          <div className="relative">
            <Mail
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />

            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              className="h-12 pl-10"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>

          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />

            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
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

        {/* Account Type */}
        <div className="space-y-2">
          <Label>I want to</Label>

          <div className="grid grid-cols-2 gap-2">
            {[
              {
                key: "user",
                title: "Explore & buy",
                note: "Discover proven businesses",
              },
              {
                key: "creator",
                title: "Publish blueprints",
                note: "Share what I have built",
              },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() =>
                  setAccountType(option.key)
                }
                className={
                  "rounded-xl border px-3 py-3 text-left transition-colors " +
                  (accountType === option.key
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-secondary")
                }
              >
                <span className="block text-sm font-medium">
                  {option.title}
                </span>

                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                  {option.note}
                </span>
              </button>
            ))}
          </div>

          <p className="text-[11px] text-muted-foreground">
            Admin access is granted internally, not at sign-up.
          </p>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="h-12 w-full font-medium"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}