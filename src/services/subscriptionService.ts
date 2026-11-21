import { supabase } from "@/lib/supabase";

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

export interface SubscriptionPlan {
  code: string;
  name: string;
  description: string | null;
  price_month: number;
  price_year: number;
  currency: string;
  features: Record<string, unknown> | string[] | null;
}

export interface BlueprintAccess {
  [key: string]: unknown;
}

export interface Subscription {
  plan_code: string;
  status: string;
  current_period_end: string | null;
  trial_ends_at?: string | null;
}

export interface Profile {
  id?: string;
  email?: string;
  full_name?: string;
  username?: string;
  role?: string;
}

export interface ServiceResponse<T = unknown> {
  data?: T;
  error?: string;
}

// -----------------------------------------------------------------------------
// CONSTANTS
// -----------------------------------------------------------------------------

const SLUG = /^[a-z0-9][a-z0-9-]{0,120}$/i;

const PLAN_CODE = /^[a-z0-9-]{2,40}$/i;

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

function normalizeUsername(value: string): string {
  const name = String(value ?? "").trim().toLowerCase();

  return /^[a-z0-9_]{3,24}$/.test(name) ? name : "";
}

function validateSlug(slug: string): boolean {
  return SLUG.test(slug || "");
}

function validatePlanCode(code: string): boolean {
  return PLAN_CODE.test(code || "");
}

async function getAuthenticatedUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("Sign in required");
  }

  return user;
}

function handleError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}

// -----------------------------------------------------------------------------
// 1. GET SUBSCRIPTION PLANS
// -----------------------------------------------------------------------------

export async function getPlans(): Promise<SubscriptionPlan[]> {
  const { data, error } = await supabase
    .from("subscription_plans")
    .select(`
      code,
      name,
      description,
      price_month,
      price_year,
      currency,
      features
    `)
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

// -----------------------------------------------------------------------------
// 2. CHECK USERNAME AVAILABILITY
// -----------------------------------------------------------------------------

export async function usernameAvailable(
  username: string
): Promise<boolean> {
  const name = normalizeUsername(username);

  if (!name) {
    throw new Error(
      "Use 3-24 letters, numbers or underscores"
    );
  }

  // Use a database RPC so username availability works
  // without exposing the profiles table.

  const { data, error } = await supabase.rpc(
    "username_available",
    {
      p_username: name,
    }
  );

  if (error) {
    throw error;
  }

  return Boolean(data);
}

// -----------------------------------------------------------------------------
// 3. RESOLVE LOGIN
// -----------------------------------------------------------------------------

export async function resolveLogin(
  identifier: string
): Promise<string> {
  const value = String(identifier || "").trim();

  if (!value) {
    throw new Error("Enter your email or username");
  }

  // Email login requires no username lookup.

  if (value.includes("@")) {
    return value.toLowerCase();
  }

  const name = normalizeUsername(value);

  if (!name) {
    throw new Error("No account uses that username");
  }

  // Resolve username to email through a controlled RPC.
  // Do not expose profile email addresses through public queries.

  const { data, error } = await supabase.rpc(
    "resolve_login_email",
    {
      p_username: name,
    }
  );

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("No account uses that username");
  }

  return data;
}

// -----------------------------------------------------------------------------
// 4. GET BLUEPRINT ACCESS
// -----------------------------------------------------------------------------

export async function getBlueprintAccess(
  slug: string
): Promise<BlueprintAccess | null> {
  if (!validateSlug(slug)) {
    throw new Error("slug is required");
  }

  const { data: blueprint, error: blueprintError } =
    await supabase
      .from("blueprints")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

  if (blueprintError) {
    throw blueprintError;
  }

  if (!blueprint) {
    return null;
  }

  // This PostgreSQL function must enforce access using auth.uid().

  const { data, error } = await supabase.rpc(
    "blueprint_access",
    {
      p_blueprint_id: blueprint.id,
    }
  );

  if (error) {
    throw error;
  }

  return data;
}

// -----------------------------------------------------------------------------
// 5. START BLUEPRINT PREVIEW
// -----------------------------------------------------------------------------

export async function startPreview(
  slug: string
): Promise<BlueprintAccess | null> {
  if (!validateSlug(slug)) {
    throw new Error("slug is required");
  }

  await getAuthenticatedUser();

  const { data: blueprint, error: blueprintError } =
    await supabase
      .from("blueprints")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

  if (blueprintError) {
    throw blueprintError;
  }

  if (!blueprint) {
    throw new Error("Blueprint not found");
  }

  // Start preview through PostgreSQL.

  const { error: previewError } = await supabase.rpc(
    "start_blueprint_preview",
    {
      p_blueprint_id: blueprint.id,
    }
  );

  if (previewError) {
    throw previewError;
  }

  // Fetch updated access information.

  const { data, error } = await supabase.rpc(
    "blueprint_access",
    {
      p_blueprint_id: blueprint.id,
    }
  );

  if (error) {
    throw error;
  }

  return data;
}

// -----------------------------------------------------------------------------
// 6. GET USER SUBSCRIPTION
// -----------------------------------------------------------------------------

export async function getSubscription(): Promise<Subscription | null> {
  const user = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from("subscriptions")
    .select(`
      plan_code,
      status,
      current_period_end,
      trial_ends_at
    `)
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

// -----------------------------------------------------------------------------
// 7. CHECKOUT
// -----------------------------------------------------------------------------

export async function checkout(
  planCode: string
): Promise<Subscription> {
  await getAuthenticatedUser();

  if (!validatePlanCode(planCode)) {
    throw new Error("planCode is required");
  }

  /*
   * IMPORTANT:
   *
   * This calls a database RPC that creates a sandbox subscription.
   *
   * This is suitable only for development/testing.
   * It must NOT be used as production payment verification.
   *
   * Production checkout should use a Supabase Edge Function
   * integrated with Razorpay/Stripe and verified webhooks.
   */

  const { data, error } = await supabase.rpc(
    "create_sandbox_subscription",
    {
      p_plan_code: planCode,
    }
  );

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Unknown or inactive plan");
  }

  return data as Subscription;
}

// -----------------------------------------------------------------------------
// 8. CANCEL SUBSCRIPTION
// -----------------------------------------------------------------------------

export async function cancelSubscription(): Promise<boolean> {
  await getAuthenticatedUser();

  const { data, error } = await supabase.rpc(
    "cancel_subscription"
  );

  if (error) {
    throw error;
  }

  return Boolean(data);
}

// -----------------------------------------------------------------------------
// 9. GET PROFILE
// -----------------------------------------------------------------------------

export async function getProfile(): Promise<Profile | null> {
  const user = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id,
      email,
      full_name,
      username,
      role
    `)
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

// -----------------------------------------------------------------------------
// 10. REGISTER PROFILE
// -----------------------------------------------------------------------------

export async function registerProfile(
  username: string,
  role: "creator" | "user",
  fullName?: string
): Promise<Profile> {
  const user = await getAuthenticatedUser();

  const name = normalizeUsername(username);

  if (!name) {
    throw new Error(
      "Use 3-24 letters, numbers or underscores"
    );
  }

  const normalizedRole =
    role === "creator" ? "creator" : "user";

  const cleanFullName = String(fullName || "")
    .trim()
    .slice(0, 80);

  /*
   * Use a PostgreSQL RPC to:
   * 1. Check username uniqueness.
   * 2. Update the authenticated user's profile.
   * 3. Preserve an existing admin role.
   *
   * This operation should be atomic.
   */

  const { data, error } = await supabase.rpc(
    "register_profile",
    {
      p_username: name,
      p_role: normalizedRole,
      p_full_name: cleanFullName,
    }
  );

  if (error) {
    if (error.code === "23505") {
      throw new Error("That username is already taken");
    }

    throw error;
  }

  if (!data) {
    throw new Error("Could not save your profile");
  }

  return data as Profile;
}

// -----------------------------------------------------------------------------
// 11. CENTRAL ACTION HANDLER
// -----------------------------------------------------------------------------

export async function handleSubscriptionAction(
  action: string,
  body: Record<string, any> = {}
): Promise<any> {
  try {
    switch (action) {

      case "plans": {
        const plans = await getPlans();

        return { plans };
      }

      case "usernameAvailable": {
        const available = await usernameAvailable(
          body.username
        );

        return { available };
      }

      case "resolveLogin": {
        const email = await resolveLogin(
          body.identifier
        );

        return { email };
      }

      case "access": {
        const access = await getBlueprintAccess(
          body.slug
        );

        return { access };
      }

      case "startPreview": {
        const access = await startPreview(
          body.slug
        );

        return { access };
      }

      case "subscription": {
        const subscription = await getSubscription();

        return { subscription };
      }

      case "checkout": {
        const subscription = await checkout(
          body.planCode
        );

        return { subscription };
      }

      case "cancel": {
        const canceled = await cancelSubscription();

        return { canceled };
      }

      case "profile": {
        const profile = await getProfile();

        return { profile };
      }

      case "registerProfile": {
        const profile = await registerProfile(
          body.username,
          body.role,
          body.fullName
        );

        return { profile };
      }

      default:
        throw new Error("Unknown action");
    }

  } catch (error) {
    return {
      error: handleError(error),
    };
  }
}