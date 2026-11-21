import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PenLine, Receipt, TrendingUp, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { findCreatorForUser } from "@/lib/creator";
import PageHeader from "@/components/account/PageHeader";
import StatCard from "@/components/account/StatCard";
import EmptyState from "@/components/account/EmptyState";
import StatusBadge from "@/components/account/StatusBadge";
import LoadingBlock from "@/components/LoadingBlock";
import { formatDate, formatINR } from "@/lib/format";

export default function CreatorEarnings() {
    const { user } = useAuth();
    const [creator, setCreator] = useState(null);
    const [sales, setSales] = useState([]);
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) {
            setCreator(null);
            setSales([]);
            setPayouts([]);
            setLoading(false);
            return;
        }

        let active = true;

        const fetchEarnings = async () => {
            setLoading(true);

            try {
                const found = await findCreatorForUser(user);

                if (!active) return;

                setCreator(found);

                if (!found) return;

                const [saleResult, payoutResult] = await Promise.all([
                    supabase
                        .from("purchases")
                        .select("*")
                        .eq("creator_user_id", user.id)
                        .order("created_at", { ascending: false })
                        .limit(100),

                    supabase
                        .from("payouts")
                        .select("*")
                        .eq("creator_user_id", user.id)
                        .order("created_at", { ascending: false })
                        .limit(50),
                ]);

                if (saleResult.error) throw saleResult.error;
                if (payoutResult.error) throw payoutResult.error;

                if (active) {
                    setSales(saleResult.data || []);
                    setPayouts(payoutResult.data || []);
                }
            } catch (error) {
                console.error("Creator earnings fetch error:", error);

                if (active) {
                    setSales([]);
                    setPayouts([]);
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchEarnings();

        return () => {
            active = false;
        };
    }, [user?.id]);
    const paidSales = sales.filter((sale) => sale.status === "paid");
    const total = paidSales.reduce(
        (sum, sale) => sum + (Number(sale.amount) || 0),
        0,
    );
    const paidOut = payouts
        .filter((payout) => payout.status === "paid")
        .reduce((sum, payout) => sum + (Number(payout.amount) || 0), 0);
    const balance = total - paidOut;
    const now = new Date();
    const thisMonth = paidSales
        .filter((sale) => {
            const date = new Date(sale.purchased_at || sale.created_at);
            return date.getMonth() === now.getMonth() &&
                date.getFullYear() === now.getFullYear();
        })
        .reduce((sum, sale) => sum + (Number(sale.amount) || 0), 0);

    const months = Array.from({ length: 6 }, (_, index) => {
        const date = new Date(
            now.getFullYear(),
            now.getMonth() - (5 - index),
            1,
        );
        return {
            key: `${date.getFullYear()}-${date.getMonth()}`,
            label: date.toLocaleDateString("en-IN", { month: "short" }),
            total: 0,
        };
    });
    paidSales.forEach((sale) => {
        const date = new Date(sale.purchased_at || sale.created_at);
        const bucket = months.find((month) =>
            month.key === `${date.getFullYear()}-${date.getMonth()}`
        );
        if (bucket) bucket.total += Number(sale.amount) || 0;
    });
    const peak = Math.max(...months.map((month) => month.total), 1);

    if (loading) {
        return (
            <div className="space-y-8">
                <PageHeader
                    eyebrow="Creator studio"
                    title="Earnings"
                    description="Loading your sales and payouts…"
                />
                <LoadingBlock rows={6} />
            </div>
        );
    }

    if (!creator) {
        return (
            <div className="space-y-8">
                <PageHeader eyebrow="Creator studio" title="Earnings" />
                <EmptyState
                    icon={TrendingUp}
                    title="You are not a creator yet"
                    description="Publish your first blueprint to open a creator profile, then track every sale and payout here."
                    action={
                        <Link
                            to="/blueprint-builder"
                            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                        >
                            <PenLine className="h-4 w-4" /> Create a blueprint
                        </Link>
                    }
                />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <PageHeader
                eyebrow={`Creator studio · ${creator.name}`}
                title="Earnings overview"
                description="Sales performance, month by month, and the payouts we have sent you."
                action={
                    <Link
                        to="/payout-settings"
                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary"
                    >
                        <Wallet className="h-4 w-4" /> Payout settings
                    </Link>
                }
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label="Total earnings"
                    value={formatINR(total)}
                    icon={TrendingUp}
                    hint={`${paidSales.length} paid sales`}
                />
                <StatCard
                    label="This month"
                    value={formatINR(thisMonth)}
                    hint="Settles next payout run"
                />
                <StatCard
                    label="Awaiting payout"
                    value={formatINR(balance > 0 ? balance : 0)}
                    icon={Wallet}
                    hint={`${formatINR(paidOut)} paid out`}
                />
                <StatCard
                    label="Blueprints live"
                    value={creator.verified ? "Verified" : "In review"}
                    hint="Creator account status"
                />
            </div>

            <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                <h2 className="text-lg">Last six months</h2>
                <div className="mt-6 flex items-end gap-3 sm:gap-6">
                    {months.map((month) => (
                        <div
                            key={month.key}
                            className="flex flex-1 flex-col items-center gap-2"
                        >
                            <span className="text-[11px] text-muted-foreground">
                                {month.total ? formatINR(month.total) : ""}
                            </span>
                            <div className="flex h-32 w-full items-end">
                                <div
                                    className="w-full rounded-t-lg bg-primary/80"
                                    style={{
                                        height: `${
                                            Math.max(
                                                (month.total / peak) * 100,
                                                month.total ? 8 : 2,
                                            )
                                        }%`,
                                    }}
                                />
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {month.label}
                            </span>
                        </div>
                    ))}
                </div>
            </section>

            <section>
                <h2 className="text-lg">Sales</h2>
                <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
                    {sales.length
                        ? (
                            <ul className="divide-y divide-border">
                                {sales.map((sale) => (
                                    <li
                                        key={sale.id}
                                        className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">
                                                {sale.blueprint_title}
                                            </p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {formatDate(
                                                    sale.purchased_at ||
                                                        sale.created_at,
                                                )} ·{" "}
                                                {sale.invoice_number || "—"}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-medium">
                                                {formatINR(sale.amount)}
                                            </span>
                                            <StatusBadge status={sale.status} />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )
                        : (
                            <p className="px-5 py-8 text-sm text-muted-foreground">
                                No sales yet. Publishing a blueprint is the
                                first step.
                            </p>
                        )}
                </div>
            </section>

            <section>
                <div className="flex items-end justify-between">
                    <h2 className="text-lg">Payout history</h2>
                    <Link
                        to="/payout-settings"
                        className="text-xs text-primary hover:underline"
                    >
                        Manage payouts
                    </Link>
                </div>
                <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
                    {payouts.length
                        ? (
                            <ul className="divide-y divide-border">
                                {payouts.map((payout) => (
                                    <li
                                        key={payout.id}
                                        className="flex items-center justify-between gap-4 px-5 py-4"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">
                                                {payout.period ||
                                                    formatDate(
                                                        payout.created_at,
                                                    )}
                                            </p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {payout.method || "Bank"} ·{" "}
                                                {payout.reference ||
                                                    "Reference pending"}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-medium">
                                                {formatINR(payout.amount)}
                                            </span>
                                            <StatusBadge
                                                status={payout.status}
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )
                        : (
                            <p className="flex items-center gap-2 px-5 py-8 text-sm text-muted-foreground">
                                <Receipt className="h-4 w-4" />{" "}
                                No payouts recorded yet.
                            </p>
                        )}
                </div>
            </section>
        </div>
    );
}
