import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import BlueprintCard from "@/components/BlueprintCard";
import LoadingBlock from "@/components/LoadingBlock";

const BUDGETS = [
    { key: "under5", label: "Under ₹5L", query: { $lt: 500000 } },
    {
        key: "5to15",
        label: "₹5L – ₹15L",
        query: { $gte: 500000, $lte: 1500000 },
    },
    {
        key: "15to50",
        label: "₹15L – ₹50L",
        query: { $gt: 1500000, $lte: 5000000 },
    },
    { key: "50plus", label: "₹50L+", query: { $gt: 5000000 } },
];
const SORTS = [
    {
        key: "popular",
        label: "Most popular",
        column: "buyer_count",
        ascending: false,
    },
    {
        key: "newest",
        label: "Newest first",
        column: "created_at",
        ascending: false,
    },
    {
        key: "lowcost",
        label: "Lowest investment",
        column: "setup_cost_min",
        ascending: true,
    },
    { key: "rating", label: "Top rated", column: "rating", ascending: false },
];
export default function Explore() {
    const [params, setParams] = useSearchParams();
    const q = params.get("q") || "";
    const category = params.get("category") || "all";
    const budget = params.get("budget") || "all";
    const sortKey = params.get("sort") || "popular";

    const [term, setTerm] = useState(q);
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => setTerm(q), [q]);

    const setParam = (key, value) => {
        const next = new URLSearchParams(params);
        if (!value || value === "all") next.delete(key);
        else next.set(key, value);
        setParams(next, { replace: true });
    };

    useEffect(() => {
        let active = true;

        const fetchBlueprints = async () => {
            setLoading(true);

            try {
                let query = supabase
                    .from("blueprints")
                    .select("*")
                    .eq("status", "published");

                if (category !== "all") {
                    query = query.eq("category", category);
                }

                const range = BUDGETS.find((item) => item.key === budget);

                if (range) {
                    switch (range.key) {
                        case "under5":
                            query = query.lt("setup_cost_min", 500000);
                            break;

                        case "5to15":
                            query = query.gte("setup_cost_min", 500000)
                                .lte("setup_cost_min", 1500000);
                            break;

                        case "15to50":
                            query = query.gt("setup_cost_min", 1500000)
                                .lte("setup_cost_min", 5000000);
                            break;

                        case "50plus":
                            query = query.gt("setup_cost_min", 5000000);
                            break;

                        default:
                            break;
                    }
                }

                const sort = SORTS.find((item) => item.key === sortKey) ||
                    SORTS[0];

                const { data, error } = await query
                    .order(sort.column, { ascending: sort.ascending })
                    .limit(60);

                if (error) throw error;

                if (active) {
                    setItems(data || []);
                }
            } catch (error) {
                console.error("Explore blueprints fetch error:", error);

                if (active) {
                    setItems([]);
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
    }, [category, budget, sortKey]);

    useEffect(() => {
        let active = true;

        const fetchCategories = async () => {
            try {
                const { data, error } = await supabase
                    .from("categories")
                    .select("*")
                    .order("order", { ascending: true })
                    .limit(20);

                if (error) throw error;

                if (active) {
                    setCategories(data || []);
                }
            } catch (error) {
                console.error("Categories fetch error:", error);
                if (active) setCategories([]);
            }
        };

        fetchCategories();

        return () => {
            active = false;
        };
    }, []);

    const needle = q.trim().toLowerCase();
    const visible = needle
        ? items.filter((item) =>
            [
                item.title,
                item.tagline,
                item.category,
                item.creator_name,
                item.city,
            ]
                .filter(Boolean)
                .some((field) => field.toLowerCase().includes(needle))
        )
        : items;

    const hasFilters = q || category !== "all" || budget !== "all";
    const activeBudget = BUDGETS.find((item) => item.key === budget);

    return (
        <div className="wrap py-12 sm:py-16">
            <div className="max-w-2xl">
                <p className="eyebrow">Blueprint marketplace</p>
                <h1 className="mt-3 text-[2.2rem] leading-tight sm:text-5xl">
                    Every option, with the numbers attached.
                </h1>
                <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
                    Filter by category and the capital you have. Each blueprint
                    carries a real cost sheet, staffing plan and licensing
                    checklist written by someone who ran it.
                </p>
            </div>

            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    setParam("q", term.trim());
                }}
                className="mt-8 flex max-w-xl items-center gap-2 rounded-full border border-border bg-card p-1.5"
            >
                <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                    value={term}
                    onChange={(event) => setTerm(event.target.value)}
                    placeholder="Search blueprints, categories or cities"
                    className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/70"
                />
                {term && (
                    <button
                        type="button"
                        aria-label="Clear search"
                        onClick={() => {
                            setTerm("");
                            setParam("q", "");
                        }}
                    >
                        <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                )}
                <button
                    type="submit"
                    className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
                >
                    Search
                </button>
            </form>

            <div className="mt-8 flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => setParam("category", "all")}
                    className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
                        category === "all"
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                >
                    All categories
                </button>
                {categories.map((item) => (
                    <button
                        key={item.name}
                        type="button"
                        onClick={() => setParam("category", item.name)}
                        className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
                            category === item.name
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        {item.name}
                    </button>
                ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    Investment
                </span>
                <button
                    type="button"
                    onClick={() => setParam("budget", "all")}
                    className={`rounded-md px-2.5 py-1 text-xs ${
                        budget === "all"
                            ? "bg-secondary text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    Any
                </button>
                {BUDGETS.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        onClick={() => setParam("budget", item.key)}
                        className={`rounded-md px-2.5 py-1 text-xs ${
                            budget === item.key
                                ? "bg-secondary text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                    {loading
                        ? "Loading blueprints…"
                        : `${visible.length} blueprint${
                            visible.length === 1 ? "" : "s"
                        }`}
                    {category !== "all" && ` in ${category}`}
                    {activeBudget && ` · ${activeBudget.label}`}
                    {needle && ` · “${q}”`}
                </p>
                <div className="flex items-center gap-3">
                    {hasFilters && (
                        <button
                            type="button"
                            onClick={() =>
                                setParams(new URLSearchParams(), {
                                    replace: true,
                                })}
                            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                        >
                            Clear all
                        </button>
                    )}
                    <select
                        value={sortKey}
                        onChange={(event) =>
                            setParam(
                                "sort",
                                event.target.value === "popular"
                                    ? ""
                                    : event.target.value,
                            )}
                        className="rounded-full border border-border bg-card px-3 py-2 text-xs text-foreground outline-none"
                    >
                        {SORTS.map((item) => (
                            <option key={item.key} value={item.key}>
                                {item.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {loading
                ? (
                    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {[0, 1, 2].map((key) => (
                            <div
                                key={key}
                                className="rounded-2xl border border-border bg-card p-5"
                            >
                                <LoadingBlock rows={4} />
                            </div>
                        ))}
                    </div>
                )
                : visible.length
                ? (
                    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {visible.map((blueprint) => (
                            <BlueprintCard
                                key={blueprint.id}
                                blueprint={blueprint}
                            />
                        ))}
                    </div>
                )
                : (
                    <div className="mt-10 rounded-2xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
                        <p className="font-display text-2xl">
                            No blueprints match that yet.
                        </p>
                        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                            Try a wider investment range, a different category,
                            or clear your search.
                        </p>
                        <button
                            type="button"
                            onClick={() =>
                                setParams(new URLSearchParams(), {
                                    replace: true,
                                })}
                            className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
                        >
                            Show all blueprints
                        </button>
                    </div>
                )}
        </div>
    );
}
