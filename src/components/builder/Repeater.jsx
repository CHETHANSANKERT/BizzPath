import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Repeater({ rows, fields, onChange, addLabel, newRow }) {
  const update = (index, key, value) => {
    onChange(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)));
  };

  const remove = (index) => onChange(rows.filter((_, rowIndex) => rowIndex !== index));
  const add = () => onChange([...rows, { ...newRow }]);

  return (
    <div className="space-y-4">
      {rows.map((row, index) => (
        <div key={index} className="rounded-xl border border-border/70 bg-secondary/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Entry {index + 1}
            </span>
            <button
              type="button"
              onClick={() => remove(index)}
              className="text-muted-foreground hover:text-destructive"
              aria-label="Remove entry"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.key} className={field.span || ""}>
                <Label htmlFor={`${field.key}-${index}`} className="text-xs text-muted-foreground">
                  {field.label}
                </Label>
                {field.type === "textarea" ? (
                  <Textarea
                    id={`${field.key}-${index}`}
                    rows={field.rows || 3}
                    value={row[field.key] ?? ""}
                    onChange={(event) => update(index, field.key, event.target.value)}
                    placeholder={field.placeholder}
                    className="mt-1.5 bg-background"
                  />
                ) : (
                  <Input
                    id={`${field.key}-${index}`}
                    type={field.type === "number" ? "number" : "text"}
                    value={row[field.key] ?? ""}
                    onChange={(event) => update(index, field.key, event.target.value)}
                    placeholder={field.placeholder}
                    className="mt-1.5 bg-background"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-3.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" /> {addLabel}
      </button>
    </div>
  );
}