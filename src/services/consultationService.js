import { supabase } from "@/lib/supabase";

const TABLE = "enquiries";

/**
 * Fetch logged-in user's consultations.
 */
export const getMyConsultations = async () => {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("type", "consultation")
    .order("created_date", {
      ascending: false,
    })
    .limit(100);

  if (error) {
    console.error("Failed to fetch consultations:", error);
    throw error;
  }

  return data || [];
};

/**
 * Fetch consultation by ID.
 */
export const getConsultationById = async (id) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Failed to fetch consultation:", error);
    throw error;
  }

  return data;
};