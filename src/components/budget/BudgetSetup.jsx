import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function BudgetSetup({ capital, expectedRevenue, onCapital, onExpectedRevenue, onSave, saving, hasSaved }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 className="text-lg">Funding</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        What you have committed to this business, and the revenue you expect once it is trading.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="capital">Capital available (₹)</Label>
          <Input
            id="capital"
            type="number"
            min="0"
            inputMode="numeric"
            value={capital}
            onChange={(event) => onCapital(event.target.value)}
            placeholder="e.g. 850000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expected-revenue">Expected monthly revenue (₹)</Label>
          <Input
            id="expected-revenue"
            type="number"
            min="0"
            inputMode="numeric"
            value={expectedRevenue}
            onChange={(event) => onExpectedRevenue(event.target.value)}
            placeholder="e.g. 120000"
          />
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button className="rounded-full" onClick={onSave} disabled={saving}>
          {saving ? "Saving…" : hasSaved ? "Update budget" : "Save budget"}
        </Button>
        <span className="text-xs text-muted-foreground">
          {hasSaved ? "Saved — expenses below are stored with it." : "Save once, then log expenses as you spend."}
        </span>
      </div>
    </section>
  );
}