import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { supabase } from "@/api/supabaseClient";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import StatusBadge from "@/components/account/StatusBadge";
import { TICKET_CATEGORIES } from "@/components/support/NewTicketDialog";
import { formatDate } from "@/lib/format";

const categoryLabel = (value) =>
  TICKET_CATEGORIES.find((item) => item.value === value)?.label || "General";

export default function TicketThread({
  ticket,
  open,
  onOpenChange,
  onReplied,
}) {
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setReply("");
      setError("");
    }
  }, [open, ticket?.id]);

  if (!ticket) return null;

  const send = async () => {
    if (!reply.trim() || saving) return;

    setSaving(true);
    setError("");

    try {
      const entry = {
        author: "You",
        role: "seeker",
        message: reply.trim(),
        created_at: new Date().toISOString(),
      };

      const updatedReplies = [
        ...(ticket.replies || []),
        entry,
      ];

      const { data, error: updateError } = await supabase
        .from("support_tickets")
        .update({
          replies: updatedReplies,
        })
        .eq("id", ticket.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setReply("");
      onReplied?.(data);

    } catch (err) {
      console.error("Error sending ticket reply:", err);

      setError(
        err?.message || "Could not send your reply. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="pr-6">
            {ticket.subject}
          </DialogTitle>

          <DialogDescription>
            Opened {formatDate(ticket.created_date)} ·{" "}
            {categoryLabel(ticket.category)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <StatusBadge status={ticket.status} />

          <span className="text-xs text-muted-foreground">
            {(ticket.replies || []).length}{" "}
            {(ticket.replies || []).length === 1 ? "reply" : "replies"}
          </span>
        </div>

        <div className="max-h-[46vh] space-y-3 overflow-y-auto pr-1">
          <div className="rounded-xl bg-secondary/70 px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">
              You
            </p>

            <p className="mt-1 whitespace-pre-line text-sm">
              {ticket.message}
            </p>
          </div>

          {(ticket.replies || []).map((entry, index) => (
            <div
              key={`${entry.created_at}-${index}`}
              className={`rounded-xl px-4 py-3 ${
                entry.role === "admin"
                  ? "bg-primary/10"
                  : "bg-secondary/70"
              }`}
            >
              <p className="text-xs font-medium text-muted-foreground">
                {entry.author || "Support"}
                {entry.role === "admin" ? " · BizPath team" : ""}
              </p>

              <p className="mt-1 whitespace-pre-line text-sm">
                {entry.message}
              </p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Textarea
            rows={3}
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            placeholder="Add more detail or answer the team's question…"
          />

          {error && (
            <p className="text-xs text-destructive">
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <Button
              className="rounded-full"
              onClick={send}
              disabled={saving || !reply.trim()}
            >
              <Send className="h-4 w-4" />
              {saving ? "Sending…" : "Send reply"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}