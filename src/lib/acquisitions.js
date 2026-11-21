import { supabase } from "@/lib/supabase";
import { milestonesFromRoadmap } from "@/lib/projects";

export function invoiceNumber() {
  const stamp = Date.now().toString().slice(-7);
  return `BP-${new Date().getFullYear()}-${stamp}`;
}

// --------------------------------------------------
// ACQUIRE BLUEPRINT
// --------------------------------------------------

export async function acquireBlueprint(blueprint, creator) {
  // Check whether a purchase already exists
  const { data: existing, error: fetchError } = await supabase
    .from("purchases")
    .select("*")
    .eq("blueprint_id", blueprint.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (existing) {
    return existing;
  }

  // Create new purchase
  const { data, error } = await supabase
    .from("purchases")
    .insert({
      blueprint_id: blueprint.id,
      blueprint_title: blueprint.title,
      blueprint_slug: blueprint.slug,
      category: blueprint.category,
      creator_name: blueprint.creator_name,
      creator_slug: blueprint.creator_slug,
      creator_user_id: creator?.user_id || "",
      amount: blueprint.is_free ? 0 : blueprint.price || 0,
      status: blueprint.is_free ? "paid" : "pending",
      invoice_number: invoiceNumber(),
      payment_method: blueprint.is_free ? "free access" : "invoice",
      purchased_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// --------------------------------------------------
// ENSURE PROJECT
// --------------------------------------------------

export async function ensureProject(blueprint) {
  // Check whether project already exists
  const { data: existing, error: fetchError } = await supabase
    .from("projects")
    .select("*")
    .eq("blueprint_id", blueprint.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (existing) {
    return existing;
  }

  // Create new project
  const { data, error } = await supabase
    .from("projects")
    .insert({
      blueprint_id: blueprint.id,
      blueprint_title: blueprint.title,
      blueprint_slug: blueprint.slug,
      category: blueprint.category,
      status: "planning",
      start_date: new Date().toISOString().slice(0, 10),
      milestones: milestonesFromRoadmap(blueprint.roadmap),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}