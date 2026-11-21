import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  rows = 3,
  span,
  hint,
  disabled,
}) {
  return (
    <div className={span || ""}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {type === "textarea" ? (
        <Textarea
          rows={rows}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="mt-1.5"
        />
      ) : (
        <Input
          type={type}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="mt-1.5"
          disabled={disabled}
        />
      )}
      {hint && <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  );
}