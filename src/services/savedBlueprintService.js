import { supabase } from "@/lib/supabase";

/**
 * Fetch saved blueprints for the authenticated user.
 */
export async function getMySavedBlueprints(userId) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("saved_blueprints")
    .select("*")
    .eq("user_id", userId)
    .order("created_date", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching saved blueprints:", error);
    throw error;
  }

  return data ?? [];
}

/**
 * Remove a saved blueprint.
 */
export async function removeSavedBlueprint(id, userId) {
  if (!id || !userId) {
    throw new Error("Saved blueprint and user IDs are required.");
  }

  const { error } = await supabase
    .from("saved_blueprints")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("Error removing saved blueprint:", error);
    throw error;
  }

  return true;
}