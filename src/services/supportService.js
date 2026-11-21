import { supabase } from "@/lib/supabase";

export async function createSupportEnquiry({
  userId,
  name,
  email,
  message,
}) {
  const { data, error } = await supabase
    .from("enquiries")
    .insert({
      user_id: userId || null,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      type: "support",
      status: "new",
    })
    .select()
    .single();

  if (error) {
    console.error("Support enquiry submission failed:", error);
    throw error;
  }

  return data;
}