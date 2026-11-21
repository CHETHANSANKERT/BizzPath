import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { portalHome, portalLabel } from "@/lib/portal";

export default function AccessDenied({ role }) {
  const home = portalHome(role);
  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-secondary">
        <Lock className="h-5 w-5 text-muted-foreground" />
      </span>
      <h2 className="mt-4 text-lg">This area belongs to another portal</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        You are signed in as {role ? `a ${role}` : "a guest"}. Your work lives in the{" "}
        {(role && portalLabel(role).toLowerCase()) || "seeker portal"}.
      </p>
      <Link
        to={home}
        className="mt-5 inline-block rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Go to my portal
      </Link>
    </div>
  );
}