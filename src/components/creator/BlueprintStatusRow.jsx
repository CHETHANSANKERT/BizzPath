import { Link } from "react-router-dom";
import { ArrowUpRight, PenLine } from "lucide-react";
import StatusBadge from "@/components/account/StatusBadge";
import { formatINR } from "@/lib/format";

const LABELS = { draft: "Draft", pending: "In review", published: "Live", rejected: "Needs changes" };
const TONES = { draft: "draft", pending: "pending", published: "published", rejected: "rejected" };

export default function BlueprintStatusRow({ blueprint }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-medium">{blueprint.title}</h2>
            <StatusBadge
              status={TONES[blueprint.status] || "draft"}
              label={LABELS[blueprint.status] || blueprint.status}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {blueprint.category || "Uncategorised"} · {blueprint.is_free ? "Free" : formatINR(blueprint.price)} · updated{" "}
            {new Date(blueprint.updated_date || blueprint.created_date).toLocaleDateString("en-IN")}
          </p>
          {blueprint.status === "rejected" && blueprint.review_note && (
            <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm leading-relaxed text-rose-800">
              <span className="font-medium">Reviewer feedback: </span>
              {blueprint.review_note}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            to={`/blueprint-builder?edit=${blueprint.id}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs font-medium hover:bg-secondary"
          >
            <PenLine className="h-3.5 w-3.5" /> Edit
          </Link>
          {blueprint.status === "published" && (
            <Link
              to={`/blueprint/${blueprint.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground"
            >
              View live <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}