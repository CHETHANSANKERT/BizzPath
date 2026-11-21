export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
      {Icon && (
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-secondary">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </span>
      )}
      <h2 className="mt-4 text-lg">{title}</h2>
      {description && (
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}