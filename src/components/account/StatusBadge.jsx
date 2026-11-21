import { cn } from "@/lib/utils";

const TONES = {
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  verified: "border-emerald-200 bg-emerald-50 text-emerald-700",
  published: "border-emerald-200 bg-emerald-50 text-emerald-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  planning: "border-amber-200 bg-amber-50 text-amber-700",
  processing: "border-blue-200 bg-blue-50 text-blue-700",
  active: "border-blue-200 bg-blue-50 text-blue-700",
  contacted: "border-blue-200 bg-blue-50 text-blue-700",
  new: "border-blue-200 bg-blue-50 text-blue-700",
  draft: "border-border bg-secondary text-muted-foreground",
  paused: "border-border bg-secondary text-muted-foreground",
  closed: "border-border bg-secondary text-muted-foreground",
  refunded: "border-border bg-secondary text-muted-foreground",
  failed: "border-rose-200 bg-rose-50 text-rose-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
};

export default function StatusBadge({ status, label, className }) {
  if (!status) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize",
        TONES[status] || "border-border bg-secondary text-muted-foreground",
        className
      )}
    >
      {label || status.replace(/_/g, " ")}
    </span>
  );
}