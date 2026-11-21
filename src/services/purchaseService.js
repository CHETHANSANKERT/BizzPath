import { supabase } from "@/lib/supabase";

const PURCHASES_TABLE = "purchases";
const BLUEPRINTS_TABLE = "blueprints";

/**
 * Fetch purchases belonging to the logged-in user.
 */
export const getMyPurchases = async (userId) => {
  if (!userId) {
    throw new Error("User authentication required.");
  }

  const { data, error } = await supabase
    .from(PURCHASES_TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("created_date", {
      ascending: false,
    })
    .limit(100);

  if (error) {
    console.error("Failed to fetch purchases:", error);
    throw error;
  }

  return data || [];
};

/**
 * Fetch blueprints using their slugs.
 */
export const getBlueprintsBySlugs = async (slugs) => {
  const uniqueSlugs = [
    ...new Set(slugs.filter(Boolean)),
  ];

  if (!uniqueSlugs.length) {
    return {};
  }

  const { data, error } = await supabase
    .from(BLUEPRINTS_TABLE)
    .select("*")
    .in("slug", uniqueSlugs);

  if (error) {
    console.error("Failed to fetch blueprints:", error);
    throw error;
  }

  const blueprintMap = {};

  (data || []).forEach((blueprint) => {
    blueprintMap[blueprint.slug] = blueprint;
  });

  return blueprintMap;
};

/**
 * Fetch purchase history and associated blueprints.
 */
export const getPurchaseLibrary = async (userId) => {
  const purchases = await getMyPurchases(userId);

  const slugs = purchases.map(
    (purchase) => purchase.blueprint_slug
  );

  const blueprints = await getBlueprintsBySlugs(slugs);

  return {
    purchases,
    blueprints,
  };
};