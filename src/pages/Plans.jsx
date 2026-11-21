import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, KeyRound, Sparkles } from "lucide-react";
import { getPlans, getMySubscription, startCheckout, cancelSubscription } from "@/lib/access";
import { formatINR } from "@/lib/format";
import { useAuth } from "@/lib/AuthContext";
import LoadingBlock from "@/components/LoadingBlock";
import { Button } from "@/components/ui/button";

export default function Plans() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const live = Boolean(subscription) && ["active", "trialing"].includes(subscription.status);

  const handleSubscribe = async (code) => {
    if (!user) {
      navigate("/login?returnTo=/plans");
      return;
    }
    setBusy(code);
    setError("");
    const result = await startCheckout(code);
    setBusy("");
    if (result?.subscription) setSubscription(result.subscription);
    else setError(result?.error || "Could not start that plan.");
  };

  const handleCancel = async () => {
    setBusy("cancel");
    const result = await cancelSubscription();
    setBusy("");
    if (result?.canceled) setSubscription(null);
    else setError(result?.error || "Nothing to cancel.");
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const rows = await getPlans();
      const mine = user ? await getMySubscription() : null;
      if (!active) return;
      setPlans(rows);
      setSubscription(mine);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  return (
    <div className="wrap py-12 sm:py-16">
      <div className="max-w-2xl">
        <p className="eyebrow">BizPath Pro</p>
        <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">
          Every blueprint, unlocked, for as long as you're building.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Paying per blueprint works when you know exactly what you're building. A subscription
          is for the rest of us — open the cost sheet, roadmap and hiring briefs on any blueprint,
          as many times as you need.
        </p>
      </div>

      {subscription && (
        <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-primary/25 bg-primary/5 px-5 py-4 text-sm">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-medium capitalize">{subscription.status}</span>
          <span className="text-muted-foreground">
            {subscription.plan_code}
            {subscription.current_period_end
              ? ` · runs to ${new Date(subscription.current_period_end).toLocaleDateString("en-IN")}`
              : ""}
          </span>
          {live && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={busy === "cancel"}
              className="ml-auto text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {busy === "cancel" ? "Cancelling…" : "Cancel test subscription"}
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {loading ? (
          <div className="md:col-span-2">
            <LoadingBlock rows={4} />
          </div>
        ) : plans.length === 0 ? (
          <p className="text-sm text-muted-foreground">Plans are being finalised — check back shortly.</p>
        ) : (
          plans.map((plan, index) => {
            const monthly = Number(plan.price_month) > 0;
            const price = monthly ? plan.price_month : plan.price_year;
            return (
              <div
                key={plan.code}
                className={`rounded-2xl border bg-card p-7 ${
                  index === 0 ? "border-primary/30 shadow-[0_24px_50px_-40px_rgba(18,45,38,0.5)]" : "border-border"
                }`}
              >
                <p className="eyebrow">{monthly ? "Monthly" : "Annual"}</p>
                <h2 className="mt-2 font-display text-2xl">{plan.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>

                <p className="mt-5 font-display text-4xl">
                  {formatINR(price)}
                  <span className="ml-1 font-body text-sm text-muted-foreground">
                    / {monthly ? "month" : "year"}
                  </span>
                </p>

                <ul className="mt-5 space-y-2 text-[13px]">
                  {(plan.features || []).map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="mt-6 w-full rounded-full"
                  onClick={() => handleSubscribe(plan.code)}
                  disabled={busy === plan.code || (live && subscription.plan_code === plan.code)}
                >
                  {busy === plan.code
                    ? "Activating…"
                    : live && subscription.plan_code === plan.code
                    ? "Your current plan"
                    : "Subscribe"}
                </Button>
                <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                  <KeyRound className="h-3 w-3" /> Test mode — sample key, no card charged.
                </p>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-secondary/40 p-6 text-sm">
        <p className="font-medium">Prefer one blueprint at a time?</p>
        <p className="mt-1 text-muted-foreground">
          Every blueprint can still be bought on its own page — you keep permanent access to that
          one.{" "}
          <Link to="/explore" className="text-primary underline-offset-4 hover:underline">
            Browse blueprints
          </Link>
          .
        </p>
      </div>
    </div>
  );
}