import { Link } from "react-router-dom";
import { Clock3, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const included = [
  "Itemised setup and working-capital sheet",
  "Licensing and compliance checklist",
  "Hiring briefs with salary bands",
  "Month-by-month execution roadmap",
  "Marketing plan and risk register",
];

export default function AccessWall({ access, blueprint, onStart, onLogin, starting }) {
  const state = access?.access || "anonymous";
  const minutes = Math.round((blueprint?.preview_seconds || 600) / 60);
  const expired = state === "expired";
  const anonymous = state === "anonymous";

  const heading = expired
    ? "Your preview has ended"
    : anonymous
    ? "Sign in to preview this blueprint"
    : `See everything free for ${minutes} minutes`;

  const sub = expired
    ? "The timed preview for this blueprint is used up. BizPath Pro reopens it — along with every other blueprint — while your plan is active."
    : anonymous
    ? `This is a paid blueprint. Sign in and your first look is free for ${minutes} minutes — the full cost sheet, roadmap and hiring briefs.`
    : `Every section unlocks for ${minutes} minutes so you can judge it properly. After that it takes a subscription.`;

  return (
    <section className="rounded-2xl border border-border bg-card p-7">
      <span className="eyebrow inline-flex items-center gap-1.5">
        <Lock className="h-3 w-3" />
        {expired ? "Preview used" : "Timed preview"}
      </span>

      <h2 className="mt-3 font-display text-2xl leading-snug">{heading}</h2>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">{sub}</p>

      <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
        {included.map((item) => (
          <li key={item} className="flex items-start gap-2 text-[13px] text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
            {item}
          </li>
        ))}
      </ul>

      <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:items-center">
        {anonymous ? (
          <Button className="rounded-full sm:w-auto" onClick={onLogin}>
            Sign in to start the preview
          </Button>
        ) : expired ? (
          <Button asChild className="rounded-full sm:w-auto">
            <Link to="/plans">See subscription plans</Link>
          </Button>
        ) : (
          <Button className="rounded-full sm:w-auto" onClick={onStart} disabled={starting}>
            <Clock3 className="mr-1.5 h-4 w-4" />
            {starting ? "Starting preview…" : `Start ${minutes}-minute preview`}
          </Button>
        )}

        {!expired && (
          <Button asChild variant="outline" className="rounded-full sm:w-auto">
            <Link to="/plans">Compare plans</Link>
          </Button>
        )}
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
        One preview per blueprint per account. Buying a single blueprint or holding an active
        subscription keeps it open permanently.
      </p>
    </section>
  );
}