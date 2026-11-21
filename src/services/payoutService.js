import { supabase } from "@/lib/supabase";

const CREATORS_TABLE = "creators";
const PAYOUT_ACCOUNTS_TABLE = "payout_accounts";
const PAYOUTS_TABLE = "payouts";
const PURCHASES_TABLE = "purchases";

/**
 * Find creator associated with logged-in user.
 */
export const getCreatorByUserId = async (userId) => {
  if (!userId) {
    throw new Error("User authentication required.");
  }

  const { data, error } = await supabase
    .from(CREATORS_TABLE)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Fetch creator payout account.
 */
export const getPayoutAccount = async (creatorId) => {
  const { data, error } = await supabase
    .from(PAYOUT_ACCOUNTS_TABLE)
    .select("*")
    .eq("creator_id", creatorId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Fetch creator payout history.
 */
export const getCreatorPayouts = async (userId) => {
  const { data, error } = await supabase
    .from(PAYOUTS_TABLE)
    .select("*")
    .eq("creator_user_id", userId)
    .order("created_date", {
      ascending: false,
    })
    .limit(50);

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * Calculate creator earnings from paid purchases.
 */
export const getCreatorEarnings = async (userId) => {
  const { data, error } = await supabase
    .from(PURCHASES_TABLE)
    .select("amount")
    .eq("creator_user_id", userId)
    .eq("status", "paid")
    .limit(100);

  if (error) {
    throw error;
  }

  return (data || []).reduce(
    (sum, purchase) =>
      sum + (Number(purchase.amount) || 0),
    0
  );
};

/**
 * Fetch complete payout dashboard data.
 */
export const getPayoutDashboard = async (userId) => {
  const creator = await getCreatorByUserId(userId);

  if (!creator) {
    return {
      creator: null,
      account: null,
      payouts: [],
      earned: 0,
    };
  }

  const [
    account,
    payouts,
    earned,
  ] = await Promise.all([
    getPayoutAccount(creator.id),
    getCreatorPayouts(userId),
    getCreatorEarnings(userId),
  ]);

  return {
    creator,
    account,
    payouts,
    earned,
  };
};

/**
 * Create or update payout account.
 */
export const savePayoutAccount = async ({
  accountId,
  payload,
}) => {
  if (accountId) {
    const { data, error } = await supabase
      .from(PAYOUT_ACCOUNTS_TABLE)
      .update({
        ...payload,
        status: "pending",
      })
      .eq("id", accountId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  const { data, error } = await supabase
    .from(PAYOUT_ACCOUNTS_TABLE)
    .insert({
      ...payload,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};