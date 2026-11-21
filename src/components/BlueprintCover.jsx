import { cn } from "@/lib/utils";

const PALETTES = {
  "Food & Beverage": ["#1B4B3A", "#2F7A5C"],
  "Fitness & Wellness": ["#233241", "#41677F"],
  Retail: ["#4A2E2A", "#8A5744"],
  "Beauty & Personal Care": ["#432D3F", "#7C4F6E"],
  Education: ["#2A3352", "#4B5A8C"],
  Services: ["#3B3222", "#7A6440"],
  Logistics: ["#20363B", "#3C6A6F"],
  Technology: ["#1C2A3A", "#3E5C7E"],
};

export default function BlueprintCover({ category = "", title = "", className = "" }) {
  const [from, to] = PALETTES[category] || ["#1F2A2E", "#3C5257"];

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ backgroundImage: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
    >
      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.55) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.55) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute -bottom-12 -right-4 select-none font-display text-[8rem] leading-none text-white/10">
        {title.charAt(0)}
      </div>
      <div className="absolute left-4 top-4 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
        <span className="text-[10px] uppercase tracking-[0.18em] text-white/80">{category}</span>
      </div>
      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
        <span className="max-w-[75%] text-[11px] leading-tight text-white/70">
          BizPath verified blueprint
        </span>
        <span className="font-display text-sm text-white/80">BP</span>
      </div>
    </div>
  );
}