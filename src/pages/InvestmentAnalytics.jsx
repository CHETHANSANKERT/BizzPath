import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Receipt, TrendingUp, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import PageHeader from "@/components/account/PageHeader";
import StatCard from "@/components/account/StatCard";
import EmptyState from "@/components/account/EmptyState";
import LoadingBlock from "@/components/LoadingBlock";
import BudgetComparison from "@/components/analytics/BudgetComparison";
import ReturnsProjection from "@/components/analytics/ReturnsProjection";
import ExpenseBreakdown from "@/components/analytics/ExpenseBreakdown";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { formatINR } from "@/lib/format";

const spentOf = (budget) =>
    (budget.expenses || []).reduce(
        (sum, expense) => sum + (Number(expense.amount) || 0),
        0,
    );

export default function InvestmentAnalytics() {
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeId, setActiveId] = useState("");

    const { user } = useAuth();

    useEffect(() => {
        if (!user?.id) {
            setBudgets([]);
            setActiveId("");
            setLoading(false);
            return;
        }

        let active = true;

        const fetchBudgets = async () => {
            setLoading(true);

            try {
                const { data, error } = await supabase
                    .from("project_budgets")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("updated_at", { ascending: false })
                    .limit(100);

                if (error) throw error;

                if (active) {
                    const rows = data || [];
                    setBudgets(rows);
                    setActiveId(rows[0]?.id || "");
                }
            } catch (error) {
                console.error("Investment analytics fetch error:", error);

                if (active) {
                    setBudgets([]);
                    setActiveId("");
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchBudgets();

        return () => {
            active = false;
        };
    }, [user?.id]);

    const active = budgets.find((budget) => budget.id === activeId) ||
        budgets[0] || null;
    const totalCapital = budgets.reduce(
        (sum, budget) => sum + (Number(budget.capital) || 0),
        0,
    );
    const totalSpent = budgets.reduce(
        (sum, budget) => sum + spentOf(budget),
        0,
    );
    const monthly = budgets.reduce(
        (sum, budget) => sum + (Number(budget.expected_monthly_revenue) || 0),
        0,
    );

    const comparison = budgets.map((budget) => ({
        name: (budget.project_title || budget.blueprint_title || "Project")
            .slice(0, 14),
        capital: Number(budget.capital) || 0,
        spent: spentOf(budget),
    }));

    const categoryMap = new Map();
    budgets.forEach((budget) => {
        (budget.expenses || []).forEach((expense) => {
            const key = expense.category || "Other";
            categoryMap.set(
                key,
                (categoryMap.get(key) || 0) + (Number(expense.amount) || 0),
            );
        });
    });
    const expenseRows = [...categoryMap.entries()]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    return (
        <div className="space-y-8">
            <PageHeader
                eyebrow="Execution"
                title="Investment analytics"
                description="Budget, spend and projected returns across every business you are actively building."
                action={
                    <Link
                        to="/project-budget"
                        className="rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
                    >
                        Manage budgets
                    </Link>
                }
            />

            {loading ? <LoadingBlock rows={6} /> : !budgets.length
                ? (
                    <EmptyState
                        icon={BarChart3}
                        title="No budgets tracked yet"
                        description="Set your capital and log a few expenses in Project budget and this dashboard fills with live charts."
                        action={
                            <Link
                                to="/project-budget"
                                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                            >
                                Create a budget
                            </Link>
                        }
                    />
                )
                : (
                    <>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <StatCard
                                label="Capital committed"
                                value={formatINR(totalCapital)}
                                icon={Wallet}
                                hint={`${budgets.length} budgets`}
                            />
                            <StatCard
                                label="Total expenses"
                                value={formatINR(totalSpent)}
                                icon={Receipt}
                                hint="Logged across projects"
                            />
                            <StatCard
                                label="Funds remaining"
                                value={formatINR(
                                    Math.max(totalCapital - totalSpent, 0),
                                )}
                                hint={`${
                                    totalCapital
                                        ? Math.round(
                                            (totalSpent / totalCapital) * 100,
                                        )
                                        : 0
                                }% deployed`}
                            />
                            <StatCard
                                label="Projected monthly"
                                value={formatINR(monthly)}
                                icon={TrendingUp}
                                hint="Estimated revenue at full tilt"
                            />
                        </div>

                        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                            <h2 className="text-lg">
                                Capital vs spend by project
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Every budget you track, side by side.
                            </p>
                            <div className="mt-4">
                                <BudgetComparison rows={comparison} />
                            </div>
                        </section>

                        <div className="grid gap-6 lg:grid-cols-2">
                            <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h2 className="text-lg">
                                            Estimated returns
                                        </h2>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Cumulative revenue over 12 months.
                                        </p>
                                    </div>
                                    <Select
                                        value={active?.id || ""}
                                        onValueChange={setActiveId}
                                    >
                                        <SelectTrigger className="w-full sm:w-48">
                                            <SelectValue placeholder="Choose a project" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {budgets.map((budget) => (
                                                <SelectItem
                                                    key={budget.id}
                                                    value={budget.id}
                                                >
                                                    {budget.project_title ||
                                                        budget.blueprint_title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="mt-4">
                                    <ReturnsProjection budget={active} />
                                </div>
                                {active && (
                                    <p className="mt-3 text-xs text-muted-foreground">
                                        Break-even at{" "}
                                        {formatINR(
                                            active.expected_monthly_revenue,
                                        )} a month lands around month{" "}
                                        {active.expected_monthly_revenue
                                            ? Math.max(
                                                Math.ceil(
                                                    (Number(active.capital) ||
                                                        0) /
                                                        Number(
                                                            active
                                                                .expected_monthly_revenue,
                                                        ),
                                                ),
                                                1,
                                            )
                                            : "—"}
                                        .
                                    </p>
                                )}
                            </section>

                            <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                                <h2 className="text-lg">
                                    Where the money goes
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Expenses grouped by category.
                                </p>
                                <div className="mt-4">
                                    {expenseRows.length
                                        ? (
                                            <ExpenseBreakdown
                                                data={expenseRows}
                                            />
                                        )
                                        : (
                                            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                                                No expenses logged yet.
                                            </p>
                                        )}
                                </div>
                            </section>
                        </div>
                    </>
                )}
        </div>
    );
}
