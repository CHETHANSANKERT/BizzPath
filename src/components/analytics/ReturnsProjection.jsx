import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatINR, formatINRShort } from "@/lib/format";

export default function ReturnsProjection({ budget }) {
  const capital = Number(budget?.capital) || 0;
  const monthly = Number(budget?.expected_monthly_revenue) || 0;

  const data = Array.from({ length: 12 }, (_, index) => ({
    month: `M${index + 1}`,
    returns: monthly * (index + 1),
    capital,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id="returnsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis
            tickFormatter={(value) => formatINRShort(value)}
            tick={{ fontSize: 11 }}
            stroke="hsl(var(--muted-foreground))"
            width={52}
          />
          <Tooltip formatter={(value) => formatINR(value)} contentStyle={{ fontSize: 12, borderRadius: 12 }} />
          <Area
            type="monotone"
            dataKey="returns"
            name="Cumulative revenue"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            fill="url(#returnsFill)"
          />
          <Line
            type="monotone"
            dataKey="capital"
            name="Capital in"
            stroke="hsl(var(--chart-1))"
            strokeDasharray="5 4"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}