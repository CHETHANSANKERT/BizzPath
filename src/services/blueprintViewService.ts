import { supabase } from "@/lib/supabase";

// -----------------------------------------------------------------------------
// CONSTANTS
// -----------------------------------------------------------------------------

const SLUG = /^[a-z0-9][a-z0-9-]{0,120}$/i;

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

interface TrackViewResponse {
  ok: boolean;
  error?: string;
}

// -----------------------------------------------------------------------------
// TRACK BLUEPRINT VIEW
// -----------------------------------------------------------------------------

export async function trackBlueprintView(
  slug: string
): Promise<TrackViewResponse> {
  try {
    // Validate slug
    if (typeof slug !== "string" || !SLUG.test(slug)) {
      throw new Error("slug is required");
    }

    // Find published blueprint
    const { data: blueprint, error: fetchError } = await supabase
      .from("blueprints")
      .select("id")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (!blueprint) {
      return {
        ok: false,
        error: "Blueprint not found",
      };
    }

    // Increment view count through PostgreSQL RPC
    const { error: updateError } = await supabase.rpc(
      "increment_blueprint_views",
      {
        p_blueprint_id: blueprint.id,
      }
    );

    if (updateError) {
      throw updateError;
    }

    return {
      ok: true,
    };

  } catch (error) {
    console.error("Blueprint view tracking failed:", error);

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to track blueprint view",
    };
  }
}