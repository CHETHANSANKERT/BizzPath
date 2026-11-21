import { supabase } from "@/lib/supabase";

/**
 * Fetch tickets belonging to the logged-in user.
 */
export async function getMySupportTickets(userId) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching support tickets:", error);
    throw error;
  }

  return data ?? [];
}

/**
 * Create a new support ticket.
 */
export async function createSupportTicket({
  userId,
  subject,
  category,
  message,
}) {
  if (!userId) {
    throw new Error("You must be logged in to create a support ticket.");
  }

  const { data, error } = await supabase
    .from("support_tickets")
    .insert({
      user_id: userId,
      subject: subject.trim(),
      category,
      status: "open",
      replies: [
        {
          id: crypto.randomUUID(),
          message: message.trim(),
          sender_id: userId,
          sender_type: "user",
          created_at: new Date().toISOString(),
        },
      ],
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating support ticket:", error);
    throw error;
  }

  return data;
}

/**
 * Add a reply to an existing ticket.
 */
export async function addTicketReply({
  ticketId,
  userId,
  message,
}) {
  if (!ticketId || !userId) {
    throw new Error("Ticket and user information are required.");
  }

  const { data: ticket, error: fetchError } = await supabase
    .from("support_tickets")
    .select("id, user_id, replies")
    .eq("id", ticketId)
    .eq("user_id", userId)
    .single();

  if (fetchError) throw fetchError;

  const replies = Array.isArray(ticket.replies)
    ? ticket.replies
    : [];

  const newReply = {
    id: crypto.randomUUID(),
    message: message.trim(),
    sender_id: userId,
    sender_type: "user",
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("support_tickets")
    .update({
      replies: [...replies, newReply],
      updated_at: new Date().toISOString(),
    })
    .eq("id", ticketId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error adding ticket reply:", error);
    throw error;
  }

  return data;
}