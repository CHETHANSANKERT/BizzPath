import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ArrowRight } from "lucide-react";
import { formatINRShort } from "@/lib/format";

const SHEET_BARS = [
  { label: "Equipment & fit-out", value: 38 },
  { label: "Interiors", value: 27 },
  { label: "Working capital", value: 21 },
  { label: "Licenses & deposits", value: 8 },
];

export default function Hero({ stats }) {
  const [term, setTerm] = useState("");
  const navigate = useNavigate();

  const submit = (event) => {
    event.preventDefault();
    navigate(term.trim() ? `/explore?q=${encodeURIComponent(term.trim())}` : "/explore");
  };

  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div className="pointer-events-none absolute -right-24 -top-32 h-[420px] w-[420px] rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 top-40 h-[320px] w-[320px] rounded-full bg-primary/10 blur-3xl" />

      <div className="wrap relative grid items-center gap-14 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Blueprints from real operators
          </span>

          <h1 className="mt-6 text-[2.7rem] leading-[1.02] tracking-tight sm:text-[3.6rem]">
            Find the business
            <br />
            <span className="italic text-primary">you're built to run.</span>
          </h1>

          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            Explore detailed, real-world playbooks — investment, licenses, staffing, timelines and
            revenue models — published by people who have actually built them.
          </p>

          <form
            onSubmit={submit}
            className="mt-8 flex max-w-lg items-center gap-2 rounded-full border border-border bg-card p-1.5 shadow-[0_10px_30px_-22px_rgba(18,45,38,0.5)]"
          >
            <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search a business, category or skill"
              className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/70"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Search
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Popular</span>
            {["Cloud kitchen", "Coffee kiosk", "Preschool", "Bike service"].map((tag) => (
              <Link
                key={tag}
                to={`/explore?q=${encodeURIComponent(tag)}`}
                className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {tag}
              </Link>
            ))}
          </div>

          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-border pt-6">
            {[
              { label: "Blueprints", value: stats.blueprints },
              { label: "Verified creators", value: stats.creators },
              { label: "Categories", value: stats.categories },
            ].map((item) => (
              <div key={item.label}>
                <dt className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  {item.label}
                </dt>
                <dd className="mt-1 font-display text-2xl">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-[2rem] bg-card/70 blur-2xl" />
          <div className="relative rounded-[1.5rem] border border-border bg-card p-6 shadow-[0_40px_80px_-50px_rgba(18,45,38,0.6)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Blueprint · Food &amp; Beverage
                </p>
                <h2 className="mt-2 text-2xl leading-snug">Specialty coffee kiosk</h2>
              </div>
              <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-primary">
                Verified
              </span>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { label: "Setup", value: `${formatINRShort(850000)}–${formatINRShort(1200000)}` },
                { label: "Payback", value: "14 mo" },
                { label: "Gross margin", value: "62%" },
              ].map((metric) => (
                <div key={metric.label} className="rounded-xl bg-secondary/70 px-3 py-3">
                  <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                    {metric.label}
                  </p>
                  <p className="mt-1 text-[13px] font-medium leading-tight">{metric.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Investment breakdown
              </p>
              {SHEET_BARS.map((bar) => (
                <div key={bar.label}>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-foreground/75">{bar.label}</span>
                    <span className="text-muted-foreground">{bar.value}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{ width: `${bar.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-dashed border-border pt-4 text-[11px] text-muted-foreground">
              <span>12-step roadmap</span>
              <span>4 roles</span>
              <span>3 licenses</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}