import { supabase } from "@/lib/supabase";

/**
 * Fetch projects belonging to the logged-in user.
 */
export async function getMyProjects(userId) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("updated_date", { ascending: false })
    .limit(100);

  if (error) throw error;

  return data ?? [];
}

/**
 * Fetch paid blueprint purchases belonging to the user.
 */
export async function getMyPaidPurchases(userId) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("purchases")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "paid")
    .order("created_date", { ascending: false })
    .limit(100);

  if (error) throw error;

  return data ?? [];
}

/**
 * Fetch a blueprint by ID.
 */
export async function getBlueprintById(blueprintId) {
  if (!blueprintId) {
    throw new Error("Blueprint ID is required.");
  }

  const { data, error } = await supabase
    .from("blueprints")
    .select("*")
    .eq("id", blueprintId)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    throw new Error("Blueprint not found.");
  }

  return data;
}

/**
 * Convert blueprint roadmap data into project milestones.
 *
 * Supports common roadmap property names.
 * Adjust these candidates if your actual blueprint schema differs.
 */
function getBlueprintMilestones(blueprint) {
  const roadmap =
    blueprint.milestones ??
    blueprint.roadmap_steps ??
    blueprint.roadmap ??
    [];

  if (!Array.isArray(roadmap)) return [];

  return roadmap.map((item, index) => ({
    id: item.id || `milestone-${index}-${Date.now()}`,
    phase: item.phase || item.stage || "Getting started",
    title:
      typeof item === "string"
        ? item
        : item.title || item.name || item.description || "Untitled step",
    done: false,
  }));
}

/**
 * Create a project from a purchased blueprint.
 *
 * If a project already exists for this user and blueprint,
 * return the existing project instead of creating a duplicate.
 */
export async function ensureProject(blueprint, userId) {
  if (!blueprint?.id || !userId) {
    throw new Error("Blueprint and user information are required.");
  }

  const { data: existing, error: existingError } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .eq("blueprint_id", blueprint.id)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing) return existing;

  const projectPayload = {
    user_id: userId,
    blueprint_id: blueprint.id,
    blueprint_title: blueprint.title || blueprint.name || "My project",
    blueprint_slug: blueprint.slug || "",
    category: blueprint.category || "",
    status: "planning",
    start_date: new Date().toISOString().slice(0, 10),
    milestones: getBlueprintMilestones(blueprint),
    notes: "",
    updated_date: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("projects")
    .insert(projectPayload)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Update an existing project.
 */
export async function updateProject(projectId, userId, changes) {
  if (!projectId || !userId) {
    throw new Error("Project and user IDs are required.");
  }

  const { data, error } = await supabase
    .from("projects")
    .update({
      ...changes,
      updated_date: new Date().toISOString(),
    })
    .eq("id", projectId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Delete a project.
 */
export async function deleteProject(projectId, userId) {
  if (!projectId || !userId) {
    throw new Error("Project and user IDs are required.");
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", userId);

  if (error) throw error;

  return true;
}