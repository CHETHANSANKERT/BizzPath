import { supabase } from "@/api/supabaseClient";

/**
 * Common Supabase Edge Function caller
 */
async function call(payload) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "accessApi",
      {
        body: payload,
      }
    );

    if (error) {
      console.error("Edge Function Error:", error);

      return {
        error: error.message || "Something went wrong.",
      };
    }

    return data || {};

  } catch (error) {
    console.error("API Call Failed:", error);

    return {
      error: error?.message || "Something went wrong.",
    };
  }
}

/**
 * Get blueprint access information
 */
export async function getBlueprintAccess(slug) {
  const { access, error } = await call({
    action: "access",
    slug,
  });

  if (error) {
    return {
      access: "unknown",
      can_view_full: false,
      error,
    };
  }

  return access || {
    access: "unknown",
    can_view_full: false,
  };
}

/**
 * Start blueprint preview
 */
export async function startBlueprintPreview(slug) {
  return call({
    action: "startPreview",
    slug,
  });
}

/**
 * Get available subscription plans
 */
export async function getPlans() {
  const { plans, error } = await call({
    action: "plans",
  });

  if (error) {
    console.error("Failed to fetch plans:", error);
    return [];
  }

  return plans || [];
}

/**
 * Get current user's subscription
 */
export async function getMySubscription() {
  const { subscription, error } = await call({
    action: "subscription",
  });

  if (error) {
    console.error("Failed to fetch subscription:", error);
    return null;
  }

  return subscription || null;
}

/**
 * Start subscription checkout
 */
export async function startCheckout(planCode) {
  return call({
    action: "checkout",
    planCode,
  });
}

/**
 * Cancel current subscription
 */
export async function cancelSubscription() {
  return call({
    action: "cancel",
  });
}

/**
 * Get current user's profile
 */
export async function getMyProfile() {
  const { profile, error } = await call({
    action: "profile",
  });

  if (error) {
    console.error("Failed to fetch profile:", error);
    return null;
  }

  return profile || null;
}

/**
 * Register or update user profile
 */
export async function saveProfile({
  username,
  role,
  fullName,
}) {
  return call({
    action: "registerProfile",
    username,
    role,
    fullName,
  });
}

/**
 * Check username availability
 */
export async function isUsernameAvailable(username) {
  return call({
    action: "usernameAvailable",
    username,
  });
}

/**
 * Resolve login email using username or identifier
 */
export async function resolveLoginEmail(identifier) {
  return call({
    action: "resolveLogin",
    identifier,
  });
}