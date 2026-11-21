import { Link } from "react-router-dom";
import { ArrowUpRight, Star } from "lucide-react";
import BlueprintCover from "@/components/BlueprintCover";
import { formatRange, formatINR } from "@/lib/format";

export default function BlueprintCard({ blueprint }) {
  const {
    title,
    slug,
    tagline,
    category,
    setup_cost_min,
    setup_cost_max,
    payback_months,
    difficulty,
    creator_name,
    price,
    rating,
    buyer_count,
  } = blueprint;

  return (
    <Link
      to={`/blueprint/${slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_24px_50px_-32px_rgba(18,45,38,0.45)]"
    >
      <BlueprintCover category={category} title={title} className="h-40" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="rounded-full bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">
            {difficulty || "Beginner"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Star className="h-3 w-3 fill-accent text-accent" />
            {(rating || 0).toFixed(1)}
          </span>
          <span>· {buyer_count || 0} owners</span>
        </div>

        <h3 className="mt-3 font-display text-xl leading-snug transition-colors group-hover:text-primary">
          {title}
        </h3>
        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{tagline}</p>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-[12px]">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Setup</p>
            <p className="mt-1 font-medium">{formatRange(setup_cost_min, setup_cost_max)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Payback</p>
            <p className="mt-1 font-medium">{payback_months ? `${payback_months} months` : "—"}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-dashed border-border pt-3">
          <span className="text-[12px] text-muted-foreground">by {creator_name || "BizPath"}</span>
          <span className="inline-flex items-center gap-1 text-[13px] font-medium">
            {price ? formatINR(price) : "Free"}
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}