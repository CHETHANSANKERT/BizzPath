import { useMemo, useState } from "react";
import { Calculator, TrendingUp, TrendingDown, IndianRupee, Target } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { formatINR, formatINRShort } from "@/lib/format";

const FIELDS = [
  { key: "setup", label: "Setup investment", min: 100000, max: 5000000, step: 50000, format: formatINR },
  { key: "fixed", label: "Monthly operating cost", min: 20000, max: 1000000, step: 10000, format: formatINR },
  { key: "ticket", label: "Average sale value", min: 50, max: 5000, step: 50, format: formatINR },
  { key: "units", label: "Sales per month", min: 10, max: 5000, step: 10, format: (value) => `${value}` },
  { key: "margin", label: "Gross margin", min: 10, max: 90, step: 1, format: (value) => `${value}%` },
];

export default function RevenueCalculator() {
  const [values, setValues] = useState({ setup: 800000, fixed: 120000, ticket: 450, units: 900, margin: 55 });

  const result = useMemo(() => {
    const monthlyRevenue = values.ticket * values.units;
    const grossProfit = (monthlyRevenue * values.margin) / 100;
    const monthlyNet = grossProfit - values.fixed;
    const payback = monthlyNet > 0 ? values.setup / monthlyNet : null;
    const perUnitMargin = (values.ticket * values.margin) / 100;
    const breakEvenUnits = perUnitMargin > 0 ? Math.ceil(values.fixed / perUnitMargin) : 0;

    return { monthlyRevenue, grossProfit, monthlyNet, payback, breakEvenUnits, annualNet: monthlyNet * 12 };
  }, [values]);

  const profitable = result.monthlyNet > 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Tool</p>
        <h1 className="mt-2 text-2xl leading-tight sm:text-3xl">Revenue calculator</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Adjust the numbers to see what the business has to do to pay you back.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-5 rounded-2xl border border-border bg-card p-5">
          {FIELDS.map((field) => (
            <div key={field.key}>
              <div className="flex items-center justify-between gap-3">
                <label htmlFor={field.key} className="text-sm">
                  {field.label}
                </label>
                <span className="text-sm font-medium">{field.format(values[field.key])}</span>
              </div>
              <Slider
                id={field.key}
                className="mt-3"
                min={field.min}
                max={field.max}
                step={field.step}
                value={[values[field.key]]}
                onValueChange={([next]) =>
                  setValues((prev) => ({ ...prev, [field.key]: next }))
                }
              />
            </div>
          ))}
        </section>

        <aside className="space-y-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calculator className="h-3.5 w-3.5" /> Monthly revenue
            </p>
            <p className="mt-1 font-display text-2xl">{formatINR(result.monthlyRevenue)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Gross profit {formatINR(result.grossProfit)}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {profitable ? (
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-destructive" />
              )}
              Monthly net profit
            </p>
            <p
              className={`mt-1 font-display text-2xl ${
                profitable ? "text-foreground" : "text-destructive"
              }`}
            >
              {formatINR(result.monthlyNet)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {profitable
                ? `${formatINRShort(result.annualNet)} in year one`
                : "Costs are above gross profit — raise volume, price or margin."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <IndianRupee className="h-3 w-3" /> Payback
              </p>
              <p className="mt-1 font-display text-xl">
                {result.payback ? `${result.payback.toFixed(1)} mo` : "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Target className="h-3 w-3" /> Break-even
              </p>
              <p className="mt-1 font-display text-xl">{result.breakEvenUnits}</p>
              <p className="text-[11px] text-muted-foreground">sales / month</p>
            </div>
          </div>

          <p className="rounded-2xl border border-dashed border-border px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
            A planning estimate, not a forecast. Real results depend on location, rent, staffing and
            how quickly demand ramps up.
          </p>
        </aside>
      </div>
    </div>
  );
}