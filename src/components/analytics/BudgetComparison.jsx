import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatINR, formatINRShort } from "@/lib/format";

export default function BudgetComparison({ rows }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" interval={0} />
          <YAxis
            tickFormatter={(value) => formatINRShort(value)}
            tick={{ fontSize: 11 }}
            stroke="hsl(var(--muted-foreground))"
            width={52}
          />
          <Tooltip formatter={(value) => formatINR(value)} contentStyle={{ fontSize: 12, borderRadius: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="capital" name="Capital" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} />
          <Bar dataKey="spent" name="Spent" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}