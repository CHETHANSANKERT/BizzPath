export default function Roadmap({ phases = [] }) {
  return (
    <ol className="relative space-y-6 border-l border-border pl-6">
      {phases.map((phase, index) => (
        <li key={phase.phase} className="relative">
          <span className="absolute -left-[31px] top-1 grid h-4 w-4 place-items-center rounded-full border border-border bg-card">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h4 className="text-[15px] font-medium">{phase.phase}</h4>
            <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {phase.duration || `Phase ${index + 1}`}
            </span>
          </div>
          <ul className="mt-2 space-y-1.5">
            {(phase.actions || []).map((action) => (
              <li key={action} className="flex gap-2 text-[13px] leading-relaxed text-muted-foreground">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />
                {action}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}