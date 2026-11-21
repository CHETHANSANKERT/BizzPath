import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ArrowUpRight,
  LifeBuoy,
  CheckCircle2,
} from "lucide-react";

import { useAuth } from "@/lib/AuthContext";
import { HELP_GUIDES, HELP_SECTIONS } from "@/data/helpContent";

import { createSupportEnquiry } from "@/services/supportService";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function Support() {
  const { user } = useAuth();

  const [query, setQuery] = useState("");

  const [form, setForm] = useState({
    name: user?.full_name || "",
    email: user?.email || "",
    message: "",
  });

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  // Populate user details if authentication loads after this component.
  useEffect(() => {
    setForm((current) => ({
      ...current,
      name: current.name || user?.full_name || "",
      email: current.email || user?.email || "",
    }));
  }, [user]);

  // FAQ search
  const term = query.trim().toLowerCase();

  const sections = HELP_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) =>
        !term ||
        `${item.q} ${item.a}`.toLowerCase().includes(term)
    ),
  })).filter((section) => section.items.length);

  const handleChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();

    setError("");

    const name = form.name.trim();
    const email = form.email.trim();
    const message = form.message.trim();

    if (!name || !email || !message) {
      setError(
        "Add your name, email and a short message so we can reply."
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setSending(true);

      await createSupportEnquiry({
        userId: user?.id,
        name,
        email,
        message,
      });

      setSent(true);
    } catch (err) {
      console.error("Support submission error:", err);

      setError(
        err?.message ||
          "Unable to send your message. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setSent(false);
    setError("");

    setForm((current) => ({
      ...current,
      message: "",
    }));
  };

  return (
    <div className="wrap py-10 sm:py-14">
      {/* Header */}
      <div className="max-w-2xl">
        <p className="eyebrow">Help center</p>

        <h1 className="mt-3 text-3xl sm:text-4xl">
          Answers for seekers, buyers and creators.
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          How access works, where your invoices live, how payouts
          are released — and how to reach a human when you need one.
        </p>

        {/* FAQ Search */}
        <div className="relative mt-6">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search guides and questions…"
            className="h-12 rounded-full pl-11"
          />
        </div>
      </div>

      {/* Help Guides */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {HELP_GUIDES.map((guide) => (
          <Link
            key={guide.title}
            to={guide.to}
            className="flex flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-secondary">
              <LifeBuoy className="h-4 w-4 text-primary" />
            </span>

            <span className="mt-4 text-sm font-medium">
              {guide.title}
            </span>

            <span className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {guide.description}
            </span>

            <span className="mt-auto pt-4 text-xs font-medium text-primary">
              Open <ArrowUpRight className="inline h-3 w-3" />
            </span>
          </Link>
        ))}
      </div>

      {/* FAQ and Contact */}
      <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* FAQ Section */}
        <section>
          <h2 className="text-2xl">Frequently asked</h2>

          {sections.length ? (
            <div className="mt-6 space-y-8">
              {sections.map((section) => (
                <div key={section.title}>
                  <p className="eyebrow">{section.title}</p>

                  <Accordion
                    type="single"
                    collapsible
                    className="mt-3"
                  >
                    {section.items.map((item) => (
                      <AccordionItem
                        key={item.q}
                        value={item.q}
                      >
                        <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                          {item.q}
                        </AccordionTrigger>

                        <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-6 rounded-2xl border border-dashed border-border px-5 py-8 text-sm text-muted-foreground">
              No answers match “{query}”. Ask us directly using
              the form.
            </p>
          )}
        </section>

        {/* Contact Form */}
        <section className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg">Contact the team</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              We reply within one working day, Monday to Friday.
            </p>

            {sent ? (
              <div className="mt-5 rounded-xl bg-primary/5 p-4 text-sm">
                <p className="flex items-center gap-2 font-medium text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  Message sent
                </p>

                <p className="mt-2 text-muted-foreground">
                  Thanks {form.name.split(" ")[0]} — your question
                  is with the team. We will reply to {form.email}.
                </p>

                <Button
                  variant="outline"
                  className="mt-4 rounded-full"
                  onClick={resetForm}
                >
                  Ask another question
                </Button>
              </div>
            ) : (
              <form
                className="mt-5 space-y-4"
                onSubmit={submit}
              >
                {/* Name */}
                <div>
                  <Label htmlFor="support-name">
                    Your name
                  </Label>

                  <Input
                    id="support-name"
                    value={form.name}
                    onChange={(event) =>
                      handleChange("name", event.target.value)
                    }
                    className="mt-1.5"
                    placeholder="Enter your name"
                    disabled={sending}
                  />
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="support-email">
                    Email
                  </Label>

                  <Input
                    id="support-email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      handleChange("email", event.target.value)
                    }
                    className="mt-1.5"
                    placeholder="Enter your email"
                    disabled={sending}
                  />
                </div>

                {/* Message */}
                <div>
                  <Label htmlFor="support-message">
                    How can we help?
                  </Label>

                  <Textarea
                    id="support-message"
                    rows={4}
                    value={form.message}
                    onChange={(event) =>
                      handleChange("message", event.target.value)
                    }
                    className="mt-1.5"
                    placeholder="Describe your question or issue..."
                    disabled={sending}
                  />
                </div>

                {/* Error */}
                {error && (
                  <p className="text-sm text-destructive">
                    {error}
                  </p>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full rounded-full"
                  disabled={sending}
                >
                  {sending ? "Sending…" : "Send message"}
                </Button>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}