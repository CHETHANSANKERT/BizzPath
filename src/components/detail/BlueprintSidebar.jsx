import { Link } from "react-router-dom";
import { ArrowUpRight, BadgeCheck, CalendarClock, Phone, Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatINR, formatRange } from "@/lib/format";

export default function BlueprintSidebar({
  blueprint,
  creator,
  onRequest,
  onConsult,
  onAcquire,
  onStartPreview,
  onSubscribe,
  onSave,
  saved,
  acquiring,
  access,
  starting,
}) {
  const locked = access ? !access.can_view_full : false;
  const canPreview = access?.access === "not_started";

  const facts = [
    { label: "Setup capital", value: formatRange(blueprint.setup_cost_min, blueprint.setup_cost_max) },
    { label: "Working capital", value: formatINR(blueprint.working_capital) },
    { label: "Gross margin", value: blueprint.gross_margin ? `${blueprint.gross_margin}%` : "—" },
    { label: "Space needed", value: blueprint.space_requirement || "—" },
    { label: "Best-fit city", value: blueprint.city || "Metro & tier 2" },
    { label: "Team size", value: blueprint.staff_roles?.length ? `${blueprint.staff_roles.length} roles` : "—" },
  ];

  return (
    <aside className="lg:sticky lg:top-24">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_24px_50px_-40px_rgba(18,45,38,0.5)]">
        <p className="eyebrow">Full blueprint access</p>
        <div className="mt-3 flex items-end gap-2">
          <span className="font-display text-3xl">{blueprint.is_free ? "Free" : formatINR(blueprint.price)}</span>
          {!blueprint.is_free && <span className="pb-1 text-xs text-muted-foreground">one-time</span>}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Includes the itemised cost sheet, licensing checklist, hiring briefs and the 12-month roadmap.
        </p>

        {locked && access?.access !== "anonymous" ? (
          <Button
            className="mt-5 w-full rounded-full"
            onClick={canPreview ? onStartPreview : onSubscribe}
            disabled={starting}
          >
            {canPreview ? "Start free preview" : "Unlock with BizPath Pro"}
            <ArrowUpRight className="ml-1.5 h-4 w-4" />
          </Button>
        ) : (
          <Button className="mt-5 w-full rounded-full" onClick={onAcquire} disabled={acquiring}>
            {acquiring
              ? "Opening…"
              : blueprint.is_free
              ? "Get free access"
              : `Buy blueprint · ${formatINR(blueprint.price)}`}
            <ArrowUpRight className="ml-1.5 h-4 w-4" />
          </Button>
        )}
        <Button variant="outline" className="mt-2 w-full rounded-full" onClick={onConsult}>
          <Phone className="mr-1.5 h-4 w-4" /> Talk to the creator
        </Button>
        <div className="mt-3 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={onRequest}
            className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Ask a question first
          </button>
          <button
            type="button"
            onClick={onSave}
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            {saved ? <BookmarkCheck className="h-3.5 w-3.5 text-primary" /> : <Bookmark className="h-3.5 w-3.5" />}
            {saved ? "Saved" : "Save"}
          </button>
        </div>

        <dl className="mt-6 space-y-3 border-t border-border pt-5">
          {facts.map((fact) => (
            <div key={fact.label} className="flex items-baseline justify-between gap-3 text-[13px]">
              <dt className="text-muted-foreground">{fact.label}</dt>
              <dd className="text-right font-medium">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {creator && (
        <Link
          to={`/creator/${creator.slug}`}
          className="mt-4 flex items-start gap-3 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/30"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-medium text-primary">
            {creator.name.slice(0, 1)}
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              {creator.name}
              {creator.verified && <BadgeCheck className="h-3.5 w-3.5 text-primary" />}
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{creator.headline}</span>
            <span className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
              <CalendarClock className="h-3 w-3" /> Replies {creator.response_time || "in 1 day"}
            </span>
          </span>
        </Link>
      )}

      <p className="mt-4 px-1 text-[11px] leading-relaxed text-muted-foreground">
        Figures are the creator's documented experience, not a guarantee of returns. Always validate
        locally before you invest.
      </p>
    </aside>
  );
}