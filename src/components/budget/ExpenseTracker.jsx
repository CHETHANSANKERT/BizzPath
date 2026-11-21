import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, formatINR } from "@/lib/format";

const CATEGORIES = ["Rent", "Equipment", "Inventory", "Staff", "Marketing", "Licences", "Utilities", "Other"];

export default function ExpenseTracker({ expenses, onAdd, onRemove, spent }) {
  const [draft, setDraft] = useState({ label: "", amount: "", category: "Equipment" });
  const [error, setError] = useState("");

  const submit = () => {
    const amount = Number(draft.amount);
    if (!draft.label.trim() || !amount) {
      setError("Add a description and an amount.");
      return;
    }
    onAdd({
      label: draft.label.trim(),
      amount,
      category: draft.category,
      spent_on: new Date().toISOString().slice(0, 10),
    });
    setDraft({ label: "", amount: "", category: draft.category });
    setError("");
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg">Estimated &amp; actual expenses</h2>
          <p className="mt-1 text-sm text-muted-foreground">Log spend as it leaves your account.</p>
        </div>
        <p className="shrink-0 text-sm font-medium">{formatINR(spent)}</p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1.4fr_0.8fr_0.9fr_auto]">
        <div className="space-y-1.5">
          <Label htmlFor="expense-label" className="text-xs">What was it for?</Label>
          <Input
            id="expense-label"
            value={draft.label}
            onChange={(event) => setDraft((prev) => ({ ...prev, label: event.target.value }))}
            placeholder="Espresso machine"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="expense-amount" className="text-xs">Amount (₹)</Label>
          <Input
            id="expense-amount"
            type="number"
            min="0"
            inputMode="numeric"
            value={draft.amount}
            onChange={(event) => setDraft((prev) => ({ ...prev, amount: event.target.value }))}
            placeholder="45000"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Category</Label>
          <Select
            value={draft.category}
            onValueChange={(value) => setDraft((prev) => ({ ...prev, category: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button className="w-full rounded-full sm:w-auto" onClick={submit}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      <ul className="mt-5 divide-y divide-border border-t border-border">
        {expenses.length ? (
          expenses.map((expense, index) => (
            <li key={`${expense.label}-${index}`} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{expense.label}</p>
                <p className="text-xs text-muted-foreground">
                  {expense.category || "Other"}
                  {expense.spent_on ? ` · ${formatDate(expense.spent_on)}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-medium">{formatINR(expense.amount)}</span>
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  aria-label={`Remove ${expense.label}`}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))
        ) : (
          <li className="py-6 text-sm text-muted-foreground">No expenses logged yet.</li>
        )}
      </ul>
    </section>
  );
}