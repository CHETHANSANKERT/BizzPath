import { useEffect, useRef, useState } from "react";
import { Clock3 } from "lucide-react";

function secondsLeft(expiresAt) {
  return Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

function clock(total) {
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export default function PreviewBar({ expiresAt, onExpire }) {
  const [left, setLeft] = useState(() => secondsLeft(expiresAt));
  const total = useRef(Math.max(secondsLeft(expiresAt), 1));
  const expireRef = useRef(onExpire);
  expireRef.current = onExpire;

  useEffect(() => {
    const tick = setInterval(() => {
      const next = secondsLeft(expiresAt);
      setLeft(next);
      if (next === 0) {
        clearInterval(tick);
        expireRef.current?.();
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [expiresAt]);

  const pct = Math.round((left / total.current) * 100);

  return (
    <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="inline-flex items-center gap-2 font-medium text-foreground">
          <Clock3 className="h-4 w-4 text-accent" />
          Preview ends in {clock(left)}
        </span>
        <span className="text-xs text-muted-foreground">
          Subscribe to keep this blueprint, its roadmap and cost sheet.
        </span>
      </div>
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full bg-accent transition-[width] duration-1000" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}