import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, PenLine, Receipt, Star, TrendingUp } from "lucide-react";
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
import { useAuth } from "@/lib/AuthContext";
import { findCreatorForUser } from "@/lib/creator";
import PageHeader from "@/components/account/PageHeader";
import StatCard from "@/components/account/StatCard";
import EmptyState from "@/components/account/EmptyState";
import StatusBadge from "@/components/account/StatusBadge";
import LoadingBlock from "@/components/LoadingBlock";
import { formatINR } from "@/lib/format";

export default function CreatorAnalytics() {
    const { user } = useAuth();
    const [creator, setCreator] = useState(null);
    const [blueprints, setBlueprints] = useState([]);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) {
            setCreator(null);
            setBlueprints([]);
            setSales([]);
            setLoading(false);
            return;
        }

        let active = true;

        const fetchAnalytics = async () => {
            setLoading(true);

            try {
                const found = await findCreatorForUser(user);

                if (!found) {
                    if (active) setCreator(null);
                    return;
                }

                const [blueprintResult, salesResult] = await Promise.all([
                    supabase
                        .from("blueprints")
                        .select("*")
                        .eq("creator_id", found.id)
                        .order("buyer_count", { ascending: false })
                        .limit(100),

                    supabase
                        .from("purchases")
                        .select("*")
                        .eq("creator_user_id", user.id)
                        .order("created_at", { ascending: false })
                        .limit(200),
                ]);

                if (blueprintResult.error) throw blueprintResult.error;
                if (salesResult.error) throw salesResult.error;

                if (active) {
                    setCreator(found);
                    setBlueprints(blueprintResult.data || []);
                    setSales(salesResult.data || []);
                }
            } catch (error) {
                console.error("Creator analytics fetch error:", error);

                if (active) {
                    setCreator(null);
                    setBlueprints([]);
                    setSales([]);
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchAnalytics();

        return () => {
            active = false;
        };
    }, [user?.id]);

    if (loading) {
        return (
            <div className="space-y-8">
                <PageHeader
                    eyebrow="Creator studio"
                    title="Creator analytics"
                    description="Loading your performance…"
                />
                <LoadingBlock rows={6} />
            </div>
        );
    }

    if (!creator) {
        return (
            <div className="space-y-8">
                <PageHeader
                    eyebrow="Creator studio"
                    title="Creator analytics"
                />
                <EmptyState
                    icon={PenLine}
                    title="You are not a creator yet"
                    description="Publish your first blueprint to open a creator profile and start collecting views and sales data."
                    action={
                        <Link
                            to="/blueprint-builder"
                            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                        >
                            Create a blueprint
                        </Link>
                    }
                />
            </div>
        );
    }

    const paidSales = sales.filter((sale) => sale.status === "paid");
    const revenue = paidSales.reduce(
        (sum, sale) => sum + (Number(sale.amount) || 0),
        0,
    );
    const views = blueprints.reduce(
        (sum, item) => sum + (Number(item.views) || 0),
        0,
    );
    const buyers = blueprints.reduce(
        (sum, item) => sum + (Number(item.buyer_count) || 0),
        0,
    );
    const rated = blueprints.filter((item) => Number(item.rating) > 0);
    const avgRating = rated.length
        ? (rated.reduce((sum, item) => sum + Number(item.rating), 0) /
            rated.length).toFixed(1)
        : "—";

    const chartRows = [...blueprints]
        .sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0))
        .slice(0, 6)
        .map((item) => ({
            name: (item.title || "Blueprint").slice(0, 14),
            views: Number(item.views) || 0,
        }));

    return (
        <div className="space-y-8">
            <PageHeader
                eyebrow={`Creator studio · ${creator.name}`}
                title="Creator analytics"
                description="Which blueprints are being read, which are selling, and what that adds up to."
                action={
                    <Link
                        to="/creator-earnings"
                        className="rounded-full border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary"
                    >
                        Earnings
                    </Link>
                }
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label="Total views"
                    value={views}
                    icon={Eye}
                    hint={`${blueprints.length} blueprints`}
                />
                <StatCard
                    label="Total sales"
                    value={paidSales.length}
                    icon={Receipt}
                    hint={`${buyers} owners on the platform`}
                />
                <StatCard
                    label="Revenue"
                    value={formatINR(revenue)}
                    icon={TrendingUp}
                    hint="Paid sales to date"
                />
                <StatCard
                    label="Average rating"
                    value={avgRating}
                    icon={Star}
                    hint={`${rated.length} rated blueprints`}
                />
            </div>

            <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                <h2 className="text-lg">Views by blueprint</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Page views are counted from the moment a blueprint goes
                    live.
                </p>
                <div className="mt-4 h-64 w-full">
                    {chartRows.length
                        ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartRows}
                                    margin={{
                                        top: 8,
                                        right: 8,
                                        bottom: 0,
                                        left: -12,
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="hsl(var(--border))"
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 11 }}
                                        stroke="hsl(var(--muted-foreground))"
                                        interval={0}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11 }}
                                        stroke="hsl(var(--muted-foreground))"
                                        width={40}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            fontSize: 12,
                                            borderRadius: 12,
                                        }}
                                    />
                                    <Bar
                                        dataKey="views"
                                        name="Views"
                                        fill="hsl(var(--chart-1))"
                                        radius={[6, 6, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )
                        : (
                            <p className="grid h-full place-items-center text-sm text-muted-foreground">
                                No blueprints yet.
                            </p>
                        )}
                </div>
            </section>

            <section>
                <h2 className="text-lg">Blueprint performance</h2>
                <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
                    <table className="w-full min-w-[620px] border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-border text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                                <th className="px-5 py-3 text-left font-normal">
                                    Blueprint
                                </th>
                                <th className="px-4 py-3 text-right font-normal">
                                    Views
                                </th>
                                <th className="px-4 py-3 text-right font-normal">
                                    Buyers
                                </th>
                                <th className="px-4 py-3 text-right font-normal">
                                    Rating
                                </th>
                                <th className="px-4 py-3 text-right font-normal">
                                    Price
                                </th>
                                <th className="px-5 py-3 text-right font-normal">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {blueprints.length
                                ? (
                                    blueprints.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="border-b border-border/70 last:border-0"
                                        >
                                            <td className="px-5 py-3">
                                                <Link
                                                    to={`/blueprint/${item.slug}`}
                                                    className="font-medium hover:text-primary"
                                                >
                                                    {item.title}
                                                </Link>
                                                <p className="text-xs text-muted-foreground">
                                                    {item.category ||
                                                        "Blueprint"}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {Number(item.views) || 0}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {Number(item.buyer_count) || 0}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {Number(item.rating)
                                                    ? Number(item.rating)
                                                        .toFixed(1)
                                                    : "—"}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {item.is_free
                                                    ? "Free"
                                                    : formatINR(item.price)}
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <StatusBadge
                                                    status={item.status}
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )
                                : (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-5 py-8 text-sm text-muted-foreground"
                                        >
                                            Nothing published yet.
                                        </td>
                                    </tr>
                                )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
