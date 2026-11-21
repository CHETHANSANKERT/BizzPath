import { Link } from "react-router-dom";
import { ArrowUpRight, BadgeCheck } from "lucide-react";

export default function CreatorSpotlight({ creators, blueprints }) {
  if (!creators?.length) return null;

  return (
    <section className="border-y border-border/70 bg-card/40">
      <div className="wrap py-16 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Operators, not theorists</p>
            <h2 className="mt-3 text-3xl leading-tight sm:text-4xl">Meet the creators</h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Every blueprint is written by someone who has opened, run and fixed the business themselves.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((creator) => {
            const count = blueprints.filter((item) => item.creator_slug === creator.slug).length;
            return (
              <Link
                key={creator.id}
                to={`/creator/${creator.slug}`}
                className="group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/25"
              >
                <div className="flex items-start justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 font-display text-lg text-primary">
                    {creator.name.split(" ").map((word) => word[0]).slice(0, 2).join("")}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <p className="mt-5 flex items-center gap-1.5 text-[15px] font-medium">
                  {creator.name}
                  {creator.verified && <BadgeCheck className="h-4 w-4 text-primary" />}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{creator.headline}</p>
                <p className="mt-5 border-t border-border pt-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {count} blueprint{count === 1 ? "" : "s"} · {creator.city}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}