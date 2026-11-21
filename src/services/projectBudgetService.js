import { supabase } from "@/lib/supabase";

/**
 * Fetch projects belonging to the authenticated user.
 */
export async function getMyProjects(userId) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("updated_date", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }

  return data ?? [];
}

/**
 * Fetch budgets belonging to the authenticated user.
 */
export async function getMyProjectBudgets(userId) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("project_budgets")
    .select("*")
    .eq("user_id", userId)
    .order("updated_date", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching project budgets:", error);
    throw error;
  }

  return data ?? [];
}

/**
 * Create or update a project budget.
 */
export async function saveProjectBudget({
  budgetId,
  userId,
  payload,
}) {
  if (!userId) {
    throw new Error("You must be logged in to save a budget.");
  }

  if (budgetId) {
    const { data, error } = await supabase
      .from("project_budgets")
      .update({
        ...payload,
        updated_date: new Date().toISOString(),
      })
      .eq("id", budgetId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating project budget:", error);
      throw error;
    }

    return data;
  }

  const { data, error } = await supabase
    .from("project_budgets")
    .insert({
      ...payload,
      user_id: userId,
      updated_date: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating project budget:", error);
    throw error;
  }

  return data;
}