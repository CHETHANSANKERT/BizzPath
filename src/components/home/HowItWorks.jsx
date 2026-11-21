const STEPS = [
  {
    title: "Discover",
    copy: "Filter by category, city and the capital you actually have. Every listing shows payback, staffing and licensing up front — no sales calls.",
  },
  {
    title: "Decide",
    copy: "Read the full blueprint: demand evidence, itemised costs, revenue model and the risks the creator hit. Compare two opportunities side by side.",
  },
  {
    title: "Execute",
    copy: "Work through the phased roadmap — licenses, hiring, fit-out, launch — with checklists you can track week by week as your business takes shape.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="wrap scroll-mt-24 pb-20">
      <div className="max-w-2xl">
        <p className="eyebrow">How BizPath works</p>
        <h2 className="mt-3 text-3xl leading-tight sm:text-4xl">
          From curiosity to open-for-business, in three movements.
        </h2>
      </div>

      <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
        {STEPS.map((step, index) => (
          <div key={step.title} className="bg-card p-7">
            <div className="flex items-baseline justify-between">
              <h3 className="font-display text-2xl">{step.title}</h3>
              <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
            </div>
            <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">{step.copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}