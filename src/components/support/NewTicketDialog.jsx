import { useEffect, useState } from "react";
import { supabase } from "@/api/supabaseClient";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const TICKET_CATEGORIES = [
  { value: "payments", label: "Payments & billing" },
  { value: "blueprint-access", label: "Blueprint access" },
  { value: "creator-payouts", label: "Creator payouts" },
  { value: "account", label: "Account & login" },
  { value: "other", label: "Something else" },
];

const EMPTY = {
  subject: "",
  category: "payments",
  message: "",
};

export default function NewTicketDialog({
  open,
  onOpenChange,
  onCreated,
}) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setForm(EMPTY);
      setError("");
      setSaving(false);
    }
  }, [open]);

  const submit = async (event) => {
    event.preventDefault();

    if (!form.subject.trim() || !form.message.trim()) {
      setError("Add a subject and describe the issue.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const { data, error: insertError } = await supabase
        .from("support_tickets")
        .insert({
          subject: form.subject.trim(),
          category: form.category,
          message: form.message.trim(),
          status: "open",
          priority: "normal",
          replies: [],
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      onCreated?.(data);
      onOpenChange(false);
    } catch (err) {
      console.error("Error creating support ticket:", err);

      setError(
        err?.message || "Could not create support ticket. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New support ticket</DialogTitle>

          <DialogDescription>
            Tell us what is going wrong. Our team replies on this thread.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ticket-subject">Subject</Label>

            <Input
              id="ticket-subject"
              value={form.subject}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  subject: event.target.value,
                }))
              }
              placeholder="Payment went through but no blueprint"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>

            <Select
              value={form.category}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  category: value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {TICKET_CATEGORIES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ticket-message">What happened?</Label>

            <Textarea
              id="ticket-message"
              rows={5}
              value={form.message}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  message: event.target.value,
                }))
              }
              placeholder="Include the blueprint name, the amount and the date so we can trace it."
              required
            />
          </div>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="rounded-full"
              disabled={saving}
            >
              {saving ? "Sending…" : "Create ticket"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}