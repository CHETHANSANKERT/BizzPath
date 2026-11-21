import { supabase } from "@/lib/supabase";

/**
 * Check whether a username is available.
 */
export async function isUsernameAvailable(username) {
  const handle = username.trim().toLowerCase();

  if (!/^[a-z0-9_]{3,24}$/.test(handle)) {
    return {
      available: false,
      error: "Usernames use 3-24 letters, numbers or underscores",
    };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", handle)
    .maybeSingle();

  if (error) {
    console.error("Username availability error:", error);

    return {
      available: false,
      error: "Unable to check username availability.",
    };
  }

  return {
    available: !data,
    error: data ? "That username is already taken" : null,
  };
}

/**
 * Save the authenticated user's profile.
 */
export async function saveProfile({
  userId,
  username,
  role,
  fullName,
}) {
  if (!userId) {
    return {
      error: "User session not found. Please log in again.",
    };
  }

  const handle = username.trim().toLowerCase();

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        username: handle,
        role,
        full_name: fullName.trim(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      }
    )
    .select()
    .single();

  if (error) {
    console.error("Profile save error:", error);

    return {
      error:
        error.code === "23505"
          ? "That username is already taken."
          : error.message || "Unable to save your profile.",
    };
  }

  return {
    profile: data,
  };
}