import { useEffect, useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, Loader2, Send } from "lucide-react";

export default function MessageMentorDialog({ open, onOpenChange, request }) {
  const { user } = useAuth();

  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      const timer = window.setTimeout(() => {
        setMessage("");
        setSent(false);
        setError("");
        setSaving(false);
      }, 200);

      return () => window.clearTimeout(timer);
    }
  }, [open]);

  const submit = async (event) => {
    event.preventDefault();

    if (!message.trim()) return;

    setSaving(true);
    setError("");

    try {
      const { error: insertError } = await supabase
        .from("enquiries")
        .insert({
          type: "consultation",
          name: user?.full_name || user?.email || "Seeker",
          email: user?.email || "",
          message: `Follow-up: ${message.trim()}`,
          blueprint_title: request?.blueprint_title || "",
          creator_slug: request?.creator_slug || "",
          creator_name: request?.creator_name || "",
          status: "new",
        });

      if (insertError) {
        throw insertError;
      }

      setSent(true);
    } catch (err) {
      console.error("Error sending mentor message:", err);

      setError(
        err?.message || "Could not send your message. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        {sent ? (
          <div className="py-6 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <Check className="h-5 w-5" />
            </span>

            <DialogTitle className="mt-5 text-xl">
              Message sent
            </DialogTitle>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {request?.creator_name || "Your mentor"} will see this in
              their next review. Replies arrive by email.
            </p>

            <Button
              className="mt-6 w-full rounded-full"
              onClick={() => onOpenChange(false)}
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle className="text-xl">
                Message {request?.creator_name || "your mentor"}
              </DialogTitle>

              <DialogDescription>
                Ask a question about{" "}
                {request?.blueprint_title || "your project"}. It is added
                to this mentorship thread.
              </DialogDescription>
            </DialogHeader>

            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="What would you like to ask?"
              className="mt-4 min-h-[110px]"
              required
            />

            {error && (
              <p className="mt-3 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="mt-4 w-full rounded-full"
              disabled={saving || !message.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send message
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}