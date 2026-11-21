import { useEffect, useState } from "react";
import { supabase } from "@/api/supabaseClient";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Loader2 } from "lucide-react";

const COPY = {
  "blueprint-access": {
    title: "Request this blueprint",
    description:
      "Tell us where to send the full blueprint and cost sheet. Our team confirms access with the creator and replies by email.",
    action: "Request access",
  },
  consultation: {
    title: "Book a consultation",
    description:
      "Share what you are planning. The creator's office will reply with available slots and the session fee.",
    action: "Request a call",
  },
  "creator-application": {
    title: "Publish your blueprint",
    description:
      "If you have built and operated a business, we would love to feature it. Share a few details and our editorial team will reach out.",
    action: "Apply to publish",
  },
};

export default function RequestDialog({
  open,
  onOpenChange,
  type = "blueprint-access",
  blueprint,
  creator,
}) {
  const copy = COPY[type] || COPY["blueprint-access"];

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      const timer = window.setTimeout(() => {
        setSent(false);
        setError("");
        setSaving(false);
      }, 200);

      return () => window.clearTimeout(timer);
    }
  }, [open]);

  const update = (field) => (event) =>
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));

  const submit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const { error: insertError } = await supabase
        .from("enquiries")
        .insert({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          message: form.message.trim(),
          type,
          blueprint_id: blueprint?.id || null,
          blueprint_title: blueprint?.title || "",
          creator_slug:
            creator?.slug || blueprint?.creator_slug || "",
          creator_name:
            creator?.name || blueprint?.creator_name || "",
          status: "new",
        });

      if (insertError) {
        throw insertError;
      }

      setSent(true);
    } catch (err) {
      console.error("Error submitting enquiry:", err);

      setError(
        err?.message || "Something went wrong. Please try again."
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
              Request received
            </DialogTitle>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              We have your details. Expect a reply at {form.email} within
              one working day.
            </p>

            <Button
              className="mt-6 w-full rounded-full"
              onClick={() => onOpenChange(false)}
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">
                {copy.title}
              </DialogTitle>

              <DialogDescription className="text-sm leading-relaxed">
                {copy.description}
              </DialogDescription>
            </DialogHeader>

            {(blueprint?.title || creator?.name) && (
              <p className="rounded-lg bg-secondary/70 px-3 py-2 text-xs text-muted-foreground">
                {blueprint?.title || creator?.name}

                {blueprint?.price
                  ? ` · ₹${blueprint.price.toLocaleString("en-IN")}`
                  : ""}
              </p>
            )}

            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="enq-name">Full name</Label>

                <Input
                  id="enq-name"
                  required
                  value={form.name}
                  onChange={update("name")}
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="enq-email">Email</Label>

                <Input
                  id="enq-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={update("email")}
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="enq-phone">
                  Phone (optional)
                </Label>

                <Input
                  id="enq-phone"
                  value={form.phone}
                  onChange={update("phone")}
                  placeholder="+91"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="enq-message">
                  Anything we should know?
                </Label>

                <Textarea
                  id="enq-message"
                  rows={3}
                  value={form.message}
                  onChange={update("message")}
                  placeholder="City, budget, timeline…"
                />
              </div>

              {error && (
                <p className="text-xs text-destructive">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={saving}
                className="w-full rounded-full"
              >
                {saving && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}

                {saving ? "Submitting…" : copy.action}
              </Button>

              <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
                Your details are shared only with BizPath and the blueprint creator.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}