import { Link } from "react-router-dom";
import { ArrowUpRight, Check, ShieldCheck, X } from "lucide-react";

const CREATOR_RULES = [
  "Publish only businesses you have personally operated, or worked in closely enough to know the numbers.",
  "Show real costs: fit-out, equipment, licences, staff and working capital. Round numbers without a basis are rejected.",
  "Disclose the city, format and year the numbers come from — a Bengaluru kiosk is not a Jaipur café.",
  "Keep the roadmap honest about what took longer than planned and what you would do differently.",
  "Respond to seeker questions within three working days.",
  "Update a blueprint when a cost line moves by more than 20%.",
];

const SEEKER_RULES = [
  "A blueprint is a licence for one business you own or operate — not a document to resell or republish.",
  "Previews are timed. Screenshotting or scraping paid sections ends access without a refund.",
  "Numbers are the creator's experience, not a guarantee. Validate rent, licences and demand in your own city.",
  "Approach creators with specific questions. Consultation slots are for planning, not for requesting the file for free.",
  "Payments, refunds and disputes go through the platform so both sides have a record.",
];

const QUALITY = [
  "Every blueprint passes editorial review before it goes live — financials, roadmap and licensing are all checked.",
  "Investment totals must reconcile with the line items in the breakdown.",
  "Roadmaps need phases with durations and concrete actions, not vague milestones.",
  "Risks need a mitigation, not just a list of worries.",
  "Blueprints that go stale are flagged and the creator is asked to refresh them.",
];

const NOT_ALLOWED = [
  "Get-rich-quick schemes, guaranteed returns, or earnings claims without evidence.",
  "Franchise resale, course repackaging or copied content from another creator.",
  "Businesses that need a licence the creator cannot show (alcohol, pharmacy, lending).",
  "Harassment, spam or off-platform payment requests in consultation threads.",
];

export default function Guidelines() {
  return (
    <div className="wrap py-12 sm:py-16">
      <div className="max-w-3xl">
        <p className="eyebrow">Platform guidelines</p>
        <h1 className="mt-3 text-3xl sm:text-4xl">Rules that keep BizPath useful</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Blueprints only work when the numbers are real and the people on both sides act in good faith.
          These are the standards we hold creators and seekers to, and what happens when they are missed.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl">For blueprint creators</h2>
          <ul className="mt-4 space-y-3">
            {CREATOR_RULES.map((rule) => (
              <li key={rule} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl">For business seekers</h2>
          <ul className="mt-4 space-y-3">
            {SEEKER_RULES.map((rule) => (
              <li key={rule} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl">Quality standards</h2>
          <ul className="mt-4 space-y-3">
            {QUALITY.map((rule) => (
              <li key={rule} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl">Not allowed</h2>
          <ul className="mt-4 space-y-3">
            {NOT_ALLOWED.map((rule) => (
              <li key={rule} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-secondary/50 p-6">
        <h2 className="text-xl">Enforcement</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          A first breach usually means a request to fix the blueprint or the thread. Repeated or deliberate
          breaches remove the listing, hold payouts for review, or close the account. Seekers who resell or
          scrape content lose access without a refund. Decisions are recorded against the blueprint, and
          creators see the review note on their creator dashboard.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to="/support-tickets"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Report an issue <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            to="/help-center"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary"
          >
            Help center
          </Link>
        </div>
      </section>
    </div>
  );
}