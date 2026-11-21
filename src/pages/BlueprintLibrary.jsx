import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import BlueprintCard from "@/components/BlueprintCard";
import LoadingBlock from "@/components/LoadingBlock";

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

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

export default function BlueprintLibrary() {
    const [term, setTerm] = useState("");
    const [category, setCategory] = useState("all");
    const [difficulty, setDifficulty] = useState("all");
    const [sortKey, setSortKey] = useState("popular");

    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

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

                if (difficulty !== "all") {
                    query = query.eq("difficulty", difficulty);
                }

                const sort = SORTS.find((item) => item.key === sortKey) ||
                    SORTS[0];

                const { data, error } = await query
                    .order(sort.column, { ascending: sort.ascending })
                    .limit(100);

                if (error) throw error;

                if (active) {
                    setItems(data || []);
                }
            } catch (error) {
                console.error("Blueprint fetch error:", error);

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
    }, [category, difficulty, sortKey]);

    useEffect(() => {
        let active = true;

        const fetchCategories = async () => {
            const { data, error } = await supabase
                .from("categories")
                .select("*")
                .order("order", { ascending: true })
                .limit(20);

            if (error) {
                console.error("Category fetch error:", error);
                return;
            }

            if (active) {
                setCategories(data || []);
            }
        };

        fetchCategories();

        return () => {
            active = false;
        };
    }, []);
    const needle = term.trim().toLowerCase();
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

    const hasFilters = needle || category !== "all" || difficulty !== "all";
    const clearAll = () => {
        setTerm("");
        setCategory("all");
        setDifficulty("all");
        setSortKey("popular");
    };

    return (
        <div className="wrap py-10 sm:py-14">
            <div className="max-w-2xl">
                <p className="eyebrow">Blueprint library</p>
                <h1 className="mt-3 text-3xl leading-tight sm:text-4xl">
                    Every published blueprint, in one place.
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Search the full library, narrow it by category and
                    difficulty, then sort by investment, popularity or rating.
                </p>
            </div>

            <div className="mt-7 flex items-center gap-2 rounded-full border border-border bg-card p-1.5">
                <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                    value={term}
                    onChange={(event) => setTerm(event.target.value)}
                    placeholder="Search blueprints or cities"
                    className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/70"
                    aria-label="Search blueprints"
                />
                {term && (
                    <button
                        type="button"
                        aria-label="Clear search"
                        onClick={() => setTerm("")}
                    >
                        <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="rounded-xl border border-border bg-card px-3 py-2.5 text-xs text-foreground outline-none sm:rounded-full"
                    aria-label="Filter by category"
                >
                    <option value="all">All categories</option>
                    {categories.map((item) => (
                        <option key={item.name} value={item.name}>
                            {item.name}
                        </option>
                    ))}
                </select>

                <select
                    value={difficulty}
                    onChange={(event) => setDifficulty(event.target.value)}
                    className="rounded-xl border border-border bg-card px-3 py-2.5 text-xs text-foreground outline-none sm:rounded-full"
                    aria-label="Filter by difficulty"
                >
                    <option value="all">Any difficulty</option>
                    {DIFFICULTIES.map((level) => (
                        <option key={level} value={level}>
                            {level}
                        </option>
                    ))}
                </select>

                <select
                    value={sortKey}
                    onChange={(event) => setSortKey(event.target.value)}
                    className="col-span-2 flex items-center rounded-xl border border-border bg-card px-3 py-2.5 text-xs text-foreground outline-none sm:col-span-1 sm:rounded-full"
                    aria-label="Sort blueprints"
                >
                    {SORTS.map((item) => (
                        <option key={item.key} value={item.key}>
                            {item.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                    {loading
                        ? "Loading blueprints…"
                        : `${visible.length} blueprint${
                            visible.length === 1 ? "" : "s"
                        }`}
                    {category !== "all" && ` in ${category}`}
                    {needle && ` · “${term.trim()}”`}
                </p>
                {hasFilters && (
                    <button
                        type="button"
                        onClick={clearAll}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                        <SlidersHorizontal className="h-3.5 w-3.5" />{" "}
                        Clear filters
                    </button>
                )}
            </div>

            {loading
                ? (
                    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {visible.map((blueprint) => (
                            <BlueprintCard
                                key={blueprint.id}
                                blueprint={blueprint}
                            />
                        ))}
                    </div>
                )
                : (
                    <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
                        <p className="font-display text-2xl">
                            Nothing matches those filters.
                        </p>
                        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                            Try a broader search or clear the filters to see the
                            whole library.
                        </p>
                        <button
                            type="button"
                            onClick={clearAll}
                            className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
                        >
                            Show all blueprints
                        </button>
                    </div>
                )}
        </div>
    );
}
