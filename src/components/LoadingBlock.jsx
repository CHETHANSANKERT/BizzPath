export default function LoadingBlock({ rows = 3, className = "" }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-4 animate-pulse rounded-full bg-secondary"
          style={{ width: `${88 - index * 12}%`, animationDelay: `${index * 90}ms` }}
        />
      ))}
    </div>
  );
}