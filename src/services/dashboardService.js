import { supabase } from "@/lib/supabase";

const PROJECTS_TABLE = "projects";
const SAVED_TABLE = "saved_blueprints";
const PURCHASES_TABLE = "purchases";
const ENQUIRIES_TABLE = "enquiries";

/**
 * Fetch dashboard data for the logged-in user.
 */
export const getDashboardData = async (userId) => {
  if (!userId) {
    throw new Error("User authentication required.");
  }

  const [
    projectResult,
    savedResult,
    purchaseResult,
    consultationResult,
  ] = await Promise.all([
    // Projects
    supabase
      .from(PROJECTS_TABLE)
      .select("*")
      .eq("user_id", userId)
      .order("updated_date", { ascending: false })
      .limit(20),

    // Saved blueprints
    supabase
      .from(SAVED_TABLE)
      .select("*")
      .eq("user_id", userId)
      .order("created_date", { ascending: false })
      .limit(5),

    // Purchases
    supabase
      .from(PURCHASES_TABLE)
      .select("*")
      .eq("user_id", userId)
      .order("created_date", { ascending: false })
      .limit(50),

    // Consultations
    supabase
      .from(ENQUIRIES_TABLE)
      .select("*")
      .eq("user_id", userId)
      .eq("type", "consultation")
      .order("created_date", { ascending: false })
      .limit(10),
  ]);

  // Handle individual query errors.
  const results = [
    projectResult,
    savedResult,
    purchaseResult,
    consultationResult,
  ];

  const failedResult = results.find(
    (result) => result.error
  );

  if (failedResult) {
    console.error(
      "Dashboard query failed:",
      failedResult.error
    );

    throw failedResult.error;
  }

  return {
    projects: projectResult.data || [],
    saved: savedResult.data || [],
    purchases: purchaseResult.data || [],
    consultations: consultationResult.data || [],
  };
};