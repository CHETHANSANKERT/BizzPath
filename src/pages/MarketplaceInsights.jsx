import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Flame, Target, TrendingUp } from "lucide-react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { supabase } from "@/lib/supabase";
import LoadingBlock from "@/components/LoadingBlock";
import { formatINRShort, formatRange } from "@/lib/format";

export default function MarketplaceInsights() {
    const [blueprints, setBlueprints] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        const fetchBlueprints = async () => {
            try {
                const { data, error } = await supabase
                    .from("blueprints")
                    .select("*")
                    .eq("status", "published")
                    .order("buyer_count", { ascending: false })
                    .limit(200);

                if (error) throw error;

                if (active) {
                    setBlueprints(data || []);
                }
            } catch (error) {
                console.error("Marketplace insights fetch error:", error);

                if (active) {
                    setBlueprints([]);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        fetchBlueprints();

        return () => {
            active = false;
        };
    }, []);

    const { categories, trending, recommended, popular } = useMemo(() => {
        const map = new Map();
        blueprints.forEach((item) => {
            const key = item.category || "Other";
            const row = map.get(key) ||
                {
                    category: key,
                    count: 0,
                    owners: 0,
                    setupSum: 0,
                    setupN: 0,
                    paybackSum: 0,
                    paybackN: 0,
                    revenueSum: 0,
                    revenueN: 0,
                };
            row.count += 1;
            row.owners += item.buyer_count || 0;
            if (item.setup_cost_min) {
                row.setupSum += item.setup_cost_min;
                row.setupN += 1;
            }
            if (item.payback_months) {
                row.paybackSum += item.payback_months;
                row.paybackN += 1;
            }
            if (item.monthly_revenue_potential) {
                row.revenueSum += item.monthly_revenue_potential;
                row.revenueN += 1;
            }
            map.set(key, row);
        });

        const rows = [...map.values()].map((row) => ({
            ...row,
            avgSetup: row.setupN ? Math.round(row.setupSum / row.setupN) : 0,
            avgPayback: row.paybackN
                ? Math.round(row.paybackSum / row.paybackN)
                : null,
            avgRevenue: row.revenueN
                ? Math.round(row.revenueSum / row.revenueN)
                : 0,
        }));

        return {
            categories: rows,
            trending: [...rows].sort((a, b) => b.owners - a.owners).slice(0, 5),
            recommended: [...rows]
                .filter((row) => row.avgPayback)
                .sort((a, b) => a.avgPayback - b.avgPayback)
                .slice(0, 4),
            popular: [...blueprints].sort((a, b) =>
                (b.buyer_count || 0) - (a.buyer_count || 0)
            ).slice(0, 5),
        };
    }, [blueprints]);

    if (loading) {
        return (
            <div className="space-y-4">
                <LoadingBlock rows={2} />
                <LoadingBlock rows={8} />
            </div>
        );
    }

    const chartData = trending.map((row) => ({
        name: row.category,
        owners: row.owners,
    }));

    return (
        <div className="space-y-6">
            <div>
                <p className="eyebrow">Marketplace insights</p>
                <h1 className="mt-2 text-2xl leading-tight sm:text-3xl">
                    Where the demand is right now.
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Built from {blueprints.length}{" "}
                    published blueprint{blueprints.length === 1 ? "" : "s"}{" "}
                    on BizPath.
                </p>
            </div>

            {!blueprints.length
                ? (
                    <p className="rounded-2xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
                        Insights appear once blueprints are published.
                    </p>
                )
                : (
                    <>
                        <section className="rounded-2xl border border-border bg-card p-5">
                            <div className="flex items-center gap-2">
                                <Flame className="h-4 w-4 text-accent" />
                                <p className="text-sm font-medium">
                                    Trending categories
                                </p>
                            </div>
                            <div className="mt-4 h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={chartData}
                                        margin={{
                                            top: 4,
                                            right: 4,
                                            left: -18,
                                            bottom: 0,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="hsl(var(--border))"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: 10 }}
                                            interval={0}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 10 }}
                                            tickLine={false}
                                            axisLine={false}
                                            allowDecimals={false}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: 12,
                                                border:
                                                    "1px solid hsl(var(--border))",
                                                background: "hsl(var(--card))",
                                                fontSize: 12,
                                            }}
                                        />
                                        <Bar
                                            dataKey="owners"
                                            name="Owners"
                                            fill="hsl(var(--primary))"
                                            radius={[6, 6, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <ul className="mt-4 space-y-2">
                                {trending.map((row) => (
                                    <li
                                        key={row.category}
                                        className="flex items-center justify-between text-sm"
                                    >
                                        <span className="truncate">
                                            {row.category}
                                        </span>
                                        <span className="shrink-0 text-xs text-muted-foreground">
                                            {row.owners} owners · {row.count}
                                            {" "}
                                            blueprints
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </section>

                        <section>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                <h2 className="text-lg">Popular blueprints</h2>
                            </div>
                            <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card">
                                <ul className="divide-y divide-border">
                                    {popular.map((item) => (
                                        <li
                                            key={item.id}
                                            className="flex items-center justify-between gap-3 px-5 py-3"
                                        >
                                            <div className="min-w-0">
                                                <Link
                                                    to={`/blueprint/${item.slug}`}
                                                    className="truncate text-sm font-medium hover:underline"
                                                >
                                                    {item.title}
                                                </Link>
                                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                    {item.category} ·{" "}
                                                    {formatRange(
                                                        item.setup_cost_min,
                                                        item.setup_cost_max,
                                                    )} setup
                                                </p>
                                            </div>
                                            <span className="shrink-0 text-xs text-muted-foreground">
                                                {item.buyer_count || 0} owners
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>

                        <section>
                            <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-primary" />
                                <h2 className="text-lg">
                                    Recommended industries
                                </h2>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Ranked by the fastest average payback across
                                published blueprints.
                            </p>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                {recommended.map((row) => (
                                    <Link
                                        key={row.category}
                                        to={`/blueprints`}
                                        className="rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/30"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-medium">
                                                {row.category}
                                            </p>
                                            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                        </div>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            {row.avgPayback} month payback ·
                                            {" "}
                                            {formatINRShort(row.avgRevenue)}/mo
                                            potential
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Avg setup{" "}
                                            {formatINRShort(row.avgSetup)} ·
                                            {" "}
                                            {row.count}{" "}
                                            blueprint{row.count === 1
                                                ? ""
                                                : "s"}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-2xl border border-border bg-card p-5">
                            <p className="text-sm font-medium">
                                All categories at a glance
                            </p>
                            <div className="mt-3 -mx-5 overflow-x-auto px-5">
                                <table className="w-full min-w-[420px] text-left text-sm">
                                    <thead>
                                        <tr className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                                            <th className="pb-2 font-medium">
                                                Category
                                            </th>
                                            <th className="pb-2 text-right font-medium">
                                                Blueprints
                                            </th>
                                            <th className="pb-2 text-right font-medium">
                                                Owners
                                            </th>
                                            <th className="pb-2 text-right font-medium">
                                                Avg setup
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {categories
                                            .sort((a, b) => b.owners - a.owners)
                                            .map((row) => (
                                                <tr key={row.category}>
                                                    <td className="py-2.5 pr-3">
                                                        {row.category}
                                                    </td>
                                                    <td className="py-2.5 text-right text-muted-foreground">
                                                        {row.count}
                                                    </td>
                                                    <td className="py-2.5 text-right text-muted-foreground">
                                                        {row.owners}
                                                    </td>
                                                    <td className="py-2.5 text-right text-muted-foreground">
                                                        {formatINRShort(
                                                            row.avgSetup,
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </>
                )}
        </div>
    );
}
