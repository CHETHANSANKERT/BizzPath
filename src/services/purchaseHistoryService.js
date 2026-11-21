import { supabase } from "@/lib/supabase";

/**
 * Fetch purchase history for the authenticated user.
 */
export async function getPurchaseHistory(userId) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("purchases")
    .select("*")
    .eq("user_id", userId)
    .order("created_date", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching purchase history:", error);
    throw error;
  }

  return data ?? [];
}