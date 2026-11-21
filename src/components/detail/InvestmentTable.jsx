import { formatINR } from "@/lib/format";

export default function InvestmentTable({ items = [], workingCapital, total }) {
  const sum = total || items.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  const grand = sum + (Number(workingCapital) || 0);

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-left text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Item</th>
            <th className="px-4 py-3 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.item} className="border-t border-border/70">
              <td className="px-4 py-3">
                <p className="font-medium text-foreground">{item.item}</p>
                {item.note && <p className="mt-0.5 text-xs text-muted-foreground">{item.note}</p>}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{formatINR(item.amount)}</td>
            </tr>
          ))}
          {workingCapital ? (
            <tr className="border-t border-border/70">
              <td className="px-4 py-3">
                <p className="font-medium">Working capital (3 months)</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Rent, salaries and stock buffer</p>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">{formatINR(workingCapital)}</td>
            </tr>
          ) : null}
          <tr className="border-t border-border bg-secondary/40">
            <td className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">Total</td>
            <td className="whitespace-nowrap px-4 py-3 text-right font-display text-lg">{formatINR(grand)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}