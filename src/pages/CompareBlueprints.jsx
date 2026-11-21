import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GitCompare, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import PageHeader from "@/components/account/PageHeader";
import LoadingBlock from "@/components/LoadingBlock";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { formatINR, formatINRShort, formatRange } from "@/lib/format";

const ROWS = [
    { label: "Category", value: (b) => b.category || "—" },
    { label: "Difficulty", value: (b) => b.difficulty || "—" },
    {
        label: "Setup capital",
        value: (b) => formatRange(b.setup_cost_min, b.setup_cost_max),
    },
    { label: "Working capital", value: (b) => formatINR(b.working_capital) },
    {
        label: "Payback period",
        value: (b) => (b.payback_months ? `${b.payback_months} months` : "—"),
    },
    {
        label: "Gross margin",
        value: (b) => (b.gross_margin ? `${b.gross_margin}%` : "—"),
    },
    {
        label: "Monthly revenue potential",
        value: (b) => formatINRShort(b.monthly_revenue_potential),
    },
    { label: "Space needed", value: (b) => b.space_requirement || "—" },
    {
        label: "Team roles",
        value: (
            b,
        ) => (b.staff_roles?.length ? `${b.staff_roles.length} roles` : "—"),
    },
    {
        label: "Licences",
        value: (
            b,
        ) => (b.licenses?.length ? `${b.licenses.length} to obtain` : "—"),
    },
    {
        label: "Blueprint price",
        value: (b) => (b.is_free ? "Free" : formatINR(b.price)),
    },
    { label: "Rating", value: (b) => (b.rating ? `${b.rating} / 5` : "New") },
    { label: "Market demand", value: (b) => shorten(b.market_demand) },
    { label: "Revenue model", value: (b) => shorten(b.revenue_model) },
];

const shorten = (text, max = 90) => {
    if (!text) return "—";
    const value = String(text).trim();
    return value.length > max ? `${value.slice(0, max).trimEnd()}…` : value;
};

export default function CompareBlueprints() {
    const [blueprints, setBlueprints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [slugs, setSlugs] = useState(() => {
        const raw = new URLSearchParams(window.location.search).get("slugs") ||
            "";
        const list = raw.split(",").filter(Boolean).slice(0, 3);
        while (list.length < 3) list.push("");
        return list;
    });

    useEffect(() => {
        let active = true;

        const fetchBlueprints = async () => {
            setLoading(true);

            try {
                const { data, error } = await supabase
                    .from("blueprints")
                    .select("*")
                    .eq("status", "published")
                    .order("buyer_count", { ascending: false })
                    .limit(100);

                if (error) throw error;

                if (active) {
                    setBlueprints(data || []);
                }
            } catch (error) {
                console.error("Blueprint comparison fetch error:", error);

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
    const selected = slugs.map((slug) =>
        blueprints.find((item) => item.slug === slug) || null
    );
    const chosen = selected.filter(Boolean);

    const setSlot = (index, value) => {
        setSlugs((current) =>
            current.map((
                slug,
                i,
            ) => (i === index ? (value === "none" ? "" : value) : slug))
        );
    };

    return (
        <div className="space-y-8">
            <PageHeader
                eyebrow="Decide"
                title="Compare blueprints"
                description="Put up to three businesses side by side on capital, margin, timeline and licensing before you commit."
            />

            {loading ? <LoadingBlock rows={5} /> : (
                <>
                    <div className="grid gap-3 sm:grid-cols-3">
                        {slugs.map((slug, index) => (
                            <div
                                key={index}
                                className="rounded-2xl border border-border bg-card p-4"
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                                        Option {index + 1}
                                    </p>
                                    {slug && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setSlot(index, "none")}
                                            className="text-muted-foreground hover:text-foreground"
                                            aria-label="Clear selection"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                                <Select
                                    value={slug || "none"}
                                    onValueChange={(value) =>
                                        setSlot(index, value)}
                                >
                                    <SelectTrigger className="mt-2 border-0 px-0 shadow-none focus:ring-0">
                                        <SelectValue placeholder="Choose a blueprint" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            Not selected
                                        </SelectItem>
                                        {blueprints.map((item) => (
                                            <SelectItem
                                                key={item.id}
                                                value={item.slug}
                                            >
                                                {item.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ))}
                    </div>

                    {chosen.length < 2
                        ? (
                            <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
                                <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-secondary">
                                    <GitCompare className="h-5 w-5 text-muted-foreground" />
                                </span>
                                <h2 className="mt-4 text-lg">
                                    Pick at least two blueprints
                                </h2>
                                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                                    Choose from the menus above and the full
                                    comparison table appears here.
                                </p>
                            </div>
                        )
                        : (
                            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
                                <table className="w-full min-w-[640px] border-collapse text-sm">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="w-44 px-5 py-4 text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                                                Measure
                                            </th>
                                            {chosen.map((item) => (
                                                <th
                                                    key={item.id}
                                                    className="px-5 py-4 text-left align-top"
                                                >
                                                    <Link
                                                        to={`/blueprint/${item.slug}`}
                                                        className="font-display text-base hover:text-primary"
                                                    >
                                                        {item.title}
                                                    </Link>
                                                    <p className="mt-1 text-[11px] font-normal text-muted-foreground">
                                                        {item.creator_name ||
                                                            "BizPath creator"}
                                                    </p>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ROWS.map((row) => (
                                            <tr
                                                key={row.label}
                                                className="border-b border-border/70 last:border-0"
                                            >
                                                <th className="px-5 py-3 text-left text-xs font-normal text-muted-foreground">
                                                    {row.label}
                                                </th>
                                                {chosen.map((item) => (
                                                    <td
                                                        key={item.id}
                                                        className="px-5 py-3 font-medium"
                                                    >
                                                        {row.value(item)}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                        <tr>
                                            <th className="px-5 py-4" />
                                            {chosen.map((item) => (
                                                <td
                                                    key={item.id}
                                                    className="px-5 py-4"
                                                >
                                                    <Link
                                                        to={`/blueprint/${item.slug}`}
                                                        className="inline-block rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground"
                                                    >
                                                        View blueprint
                                                    </Link>
                                                </td>
                                            ))}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                </>
            )}
        </div>
    );
}
