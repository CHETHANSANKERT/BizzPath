import { Link } from "react-router-dom";
import BlueprintCard from "@/components/BlueprintCard";

export default function TrendingGrid({ items }) {
  return (
    <section className="border-y border-border/70 bg-card/50">
      <div className="wrap py-16 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Trending this month</p>
            <h2 className="mt-3 text-3xl leading-tight sm:text-4xl">Opportunities people are buying</h2>
          </div>
          <Link to="/explore" className="text-sm text-primary underline-offset-4 hover:underline">
            See all opportunities
          </Link>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((blueprint) => (
            <BlueprintCard key={blueprint.slug || blueprint.id} blueprint={blueprint} />
          ))}
        </div>
      </div>
    </section>
  );
}