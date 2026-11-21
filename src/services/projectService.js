import { supabase } from "@/lib/supabase";

const TABLE = "projects";

/**
 * Fetch projects.
 */
export const getProjects = async () => {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("updated_date", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Failed to fetch projects:", error);
    throw error;
  }

  return data || [];
};

/**
 * Fetch a single project.
 */
export const getProjectById = async (id) => {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Failed to fetch project:", error);
    throw error;
  }

  return data;
};

/**
 * Update project.
 */
export const updateProject = async (id, changes) => {
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      ...changes,
      updated_date: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Failed to update project:", error);
    throw error;
  }

  return data;
};