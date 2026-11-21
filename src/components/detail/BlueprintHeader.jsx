import { Link } from "react-router-dom";
import { BadgeCheck, ChevronRight, Star } from "lucide-react";
import { formatRange } from "@/lib/format";

export default function BlueprintHeader({ blueprint, creator }) {
  return (
    <header>
      <nav className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Link to="/explore" className="hover:text-foreground">Explore</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to={`/explore?category=${encodeURIComponent(blueprint.category || "")}`} className="hover:text-foreground">
          {blueprint.category}
        </Link>
      </nav>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="rounded-full bg-secondary px-2.5 py-1 font-medium text-secondary-foreground">
          {blueprint.difficulty || "Beginner"}
        </span>
        <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">
          Version {blueprint.version || 1}
        </span>
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <Star className="h-3 w-3 fill-accent text-accent" />
          {(blueprint.rating || 0).toFixed(1)} · {blueprint.review_count || 0} reviews
        </span>
        <span className="text-muted-foreground">· {blueprint.buyer_count || 0} owners started this</span>
      </div>

      <h1 className="mt-4 max-w-3xl text-[2rem] leading-[1.1] sm:text-[2.6rem]">{blueprint.title}</h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{blueprint.tagline}</p>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border pt-5 text-sm">
        <Link to={`/creator/${blueprint.creator_slug}`} className="inline-flex items-center gap-2 hover:text-primary">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-[11px] font-medium text-primary">
            {(blueprint.creator_name || "B").slice(0, 1)}
          </span>
          <span>{blueprint.creator_name || "BizPath editorial"}</span>
          {creator?.verified && <BadgeCheck className="h-4 w-4 text-primary" />}
        </Link>
        <span className="text-muted-foreground">
          Setup capital <strong className="font-medium text-foreground">{formatRange(blueprint.setup_cost_min, blueprint.setup_cost_max)}</strong>
        </span>
        {blueprint.payback_months ? (
          <span className="text-muted-foreground">
            Payback <strong className="font-medium text-foreground">{blueprint.payback_months} months</strong>
          </span>
        ) : null}
      </div>
    </header>
  );
}