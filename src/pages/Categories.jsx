import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
    Cpu,
    Dumbbell,
    GraduationCap,
    ShoppingBag,
    Sparkles,
    Truck,
    Utensils,
    Wrench,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import BlueprintCard from "@/components/BlueprintCard";
import LoadingBlock from "@/components/LoadingBlock";
import { cn } from "@/lib/utils";

const ICONS = {
    utensils: Utensils,
    dumbbell: Dumbbell,
    "shopping-bag": ShoppingBag,
    "graduation-cap": GraduationCap,
    truck: Truck,
    sparkles: Sparkles,
    cpu: Cpu,
    wrench: Wrench,
};

export default function Categories() {
    const [searchParams, setSearchParams] = useSearchParams();
    const active = searchParams.get("category") || "";
    const [categories, setCategories] = useState([]);
    const [blueprints, setBlueprints] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        const fetchData = async () => {
            setLoading(true);

            try {
                const [categoryResult, blueprintResult] = await Promise.all([
                    supabase
                        .from("categories")
                        .select("*")
                        .order("order", { ascending: true })
                        .limit(50),

                    supabase
                        .from("blueprints")
                        .select("*")
                        .eq("status", "published")
                        .order("buyer_count", { ascending: false })
                        .limit(100),
                ]);

                if (categoryResult.error) throw categoryResult.error;
                if (blueprintResult.error) throw blueprintResult.error;

                if (active) {
                    setCategories(categoryResult.data || []);
                    setBlueprints(blueprintResult.data || []);
                }
            } catch (error) {
                console.error("Categories fetch error:", error);

                if (active) {
                    setCategories([]);
                    setBlueprints([]);
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchData();

        return () => {
            active = false;
        };
    }, []);
    const select = (name) => {
        if (!name) setSearchParams({});
        else setSearchParams({ category: name });
    };

    const countFor = (name) =>
        blueprints.filter((item) => item.category === name).length;
    const results = active
        ? blueprints.filter((item) => item.category === active)
        : blueprints;

    return (
        <div className="wrap py-10 sm:py-14">
            <p className="eyebrow">Sectors</p>
            <h1 className="mt-3 max-w-2xl text-3xl sm:text-4xl">
                Every kind of business, sorted by the industry you know.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Start from the sector you already understand. Each blueprint
                carries its real cost sheet, licences and operating model, so
                you can judge whether the numbers suit your market.
            </p>

            {loading
                ? (
                    <div className="mt-10">
                        <LoadingBlock rows={6} />
                    </div>
                )
                : (
                    <>
                        <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto pb-1">
                            <button
                                type="button"
                                onClick={() => select("")}
                                className={cn(
                                    "shrink-0 rounded-full border px-4 py-2 text-sm",
                                    !active
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-border text-muted-foreground",
                                )}
                            >
                                All sectors
                            </button>
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => select(category.name)}
                                    className={cn(
                                        "shrink-0 rounded-full border px-4 py-2 text-sm",
                                        active === category.name
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : "border-border text-muted-foreground",
                                    )}
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>

                        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {categories.map((category) => {
                                const Icon =
                                    ICONS[
                                        (category.icon || "").toLowerCase()
                                    ] || Wrench;
                                const isActive = active === category.name;
                                return (
                                    <button
                                        key={category.id}
                                        type="button"
                                        onClick={() => select(category.name)}
                                        className={cn(
                                            "flex flex-col rounded-2xl border p-5 text-left transition-colors",
                                            isActive
                                                ? "border-primary bg-primary/5"
                                                : "border-border bg-card hover:border-primary/30",
                                        )}
                                    >
                                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary">
                                            <Icon className="h-4 w-4 text-primary" />
                                        </span>
                                        <span className="mt-4 font-medium">
                                            {category.name}
                                        </span>
                                        <span className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                            {category.blurb}
                                        </span>
                                        <span className="mt-4 text-xs text-muted-foreground">
                                            {countFor(category.name)}{" "}
                                            blueprint{countFor(
                                                    category.name,
                                                ) === 1
                                                ? ""
                                                : "s"}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <section className="mt-14 border-t border-border pt-10">
                            <div className="flex items-end justify-between gap-4">
                                <h2 className="text-2xl">
                                    {active || "All blueprints"}
                                </h2>
                                <Link
                                    to="/explore"
                                    className="text-sm text-primary hover:underline"
                                >
                                    Advanced filters
                                </Link>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {results.length}{" "}
                                blueprint{results.length === 1 ? "" : "s"}{" "}
                                in this sector
                            </p>

                            {results.length
                                ? (
                                    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                        {results.map((blueprint) => (
                                            <BlueprintCard
                                                key={blueprint.id}
                                                blueprint={blueprint}
                                            />
                                        ))}
                                    </div>
                                )
                                : (
                                    <p className="mt-8 rounded-2xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
                                        No blueprints published in this sector
                                        yet.
                                    </p>
                                )}
                        </section>
                    </>
                )}
        </div>
    );
}
