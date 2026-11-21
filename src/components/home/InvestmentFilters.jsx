import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

const RANGES = [
  { key: "under5", label: "Under ₹5 lakh", note: "Lean, service-led starts", amount: "₹3L – ₹5L" },
  { key: "5to15", label: "₹5 – 15 lakh", note: "Single-outlet retail & F&B", amount: "₹5L – ₹15L" },
  { key: "15to50", label: "₹15 – 50 lakh", note: "Established formats", amount: "₹15L – ₹50L" },
  { key: "50plus", label: "₹50 lakh+", note: "Multi-unit operations", amount: "₹50L+" },
];

export default function InvestmentFilters() {
  return (
    <section className="wrap py-16 sm:py-20">
      <div className="rounded-[1.75rem] bg-primary px-6 py-10 text-primary-foreground sm:px-10 sm:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-primary-foreground/60">
              Start with your budget
            </p>
            <h2 className="mt-3 max-w-lg text-3xl leading-tight text-primary-foreground sm:text-4xl">
              What can you comfortably invest?
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-primary-foreground/70">
            Every blueprint lists a full, itemised cost sheet — so you compare like-for-like before
            you commit a rupee.
          </p>
        </div>

        <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RANGES.map((range) => (
            <Link
              key={range.key}
              to={`/explore?budget=${range.key}`}
              className="group rounded-2xl border border-primary-foreground/15 bg-primary-foreground/[0.06] p-5 transition-colors hover:border-primary-foreground/40 hover:bg-primary-foreground/[0.12]"
            >
              <div className="flex items-start justify-between">
                <p className="text-[15px] font-medium">{range.label}</p>
                <ArrowUpRight className="h-4 w-4 text-primary-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
              <p className="mt-1 text-xs text-primary-foreground/60">{range.note}</p>
              <p className="mt-6 font-display text-lg text-primary-foreground/90">{range.amount}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}