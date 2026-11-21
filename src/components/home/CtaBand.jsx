import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export default function CtaBand({ onPublish }) {
  return (
    <section className="wrap pb-20">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-primary px-7 py-14 text-primary-foreground sm:px-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize: "34px 34px",
          }}
        />
        <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-xl">
            <p className="text-[10px] uppercase tracking-[0.22em] text-primary-foreground/60">
              For business owners
            </p>
            <h2 className="mt-3 text-3xl leading-tight text-primary-foreground sm:text-[2.6rem]">
              Built something that works? Turn it into the blueprint someone else needs.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-primary-foreground/70">
              Publish your cost sheet, hiring plan and roadmap. Set your price, keep ownership of your
              work, and earn from every founder who follows your path.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onPublish}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary-foreground px-6 py-3 text-sm font-medium text-primary transition-transform hover:-translate-y-0.5"
            >
              Publish your blueprint <ArrowUpRight className="h-4 w-4" />
            </button>
            <Link
              to="/explore"
              className="inline-flex items-center justify-center rounded-full border border-primary-foreground/30 px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10"
            >
              Explore blueprints
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}