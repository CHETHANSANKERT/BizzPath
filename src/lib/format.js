export function formatINR(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(value))}`;
}

export function formatINRShort(value) {
  const n = Number(value);
  if (!n) return "—";
  if (n >= 10000000) return `₹${+(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${+(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${Math.round(n / 1000)}k`;
  return `₹${n}`;
}

export function formatRange(min, max) {
  if (!min && !max) return "—";
  if (!max) return `${formatINRShort(min)}+`;
  return `${formatINRShort(min)} – ${formatINRShort(max)}`;
}

export function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}