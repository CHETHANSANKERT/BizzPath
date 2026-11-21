import { Link } from "react-router-dom";
import {
  Dumbbell,
  GraduationCap,
  Laptop,
  Scissors,
  ShoppingBag,
  Truck,
  UtensilsCrossed,
  Wrench,
} from "lucide-react";

const ICONS = {
  UtensilsCrossed,
  Dumbbell,
  ShoppingBag,
  Scissors,
  GraduationCap,
  Wrench,
  Truck,
  Laptop,
};

export default function CategoryStrip({ categories, counts }) {
  return (
    <section id="categories" className="wrap scroll-mt-24 py-16 sm:py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Browse by category</p>
          <h2 className="mt-3 text-3xl leading-tight sm:text-4xl">Where do you want to build?</h2>
        </div>
        <Link to="/explore" className="text-sm text-primary underline-offset-4 hover:underline">
          View all blueprints
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((category) => {
          const Icon = ICONS[category.icon] || Wrench;
          return (
            <Link
              key={category.name}
              to={`/explore?category=${encodeURIComponent(category.name)}`}
              className="group rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_20px_40px_-30px_rgba(18,45,38,0.45)]"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-4 w-4" strokeWidth={1.6} />
              </span>
              <p className="mt-4 text-[15px] font-medium leading-snug">{category.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{category.blurb}</p>
              <p className="mt-4 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {counts?.[category.name] || 0} blueprints
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}