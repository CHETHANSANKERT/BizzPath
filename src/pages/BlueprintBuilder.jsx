import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { ensureCreator, slugify } from "@/lib/creator";
import { Link } from "react-router-dom";
import { ArrowUpRight, CheckCircle2, Send } from "lucide-react";
import PageHeader from "@/components/account/PageHeader";
import LoadingBlock from "@/components/LoadingBlock";
import BuilderSection from "@/components/builder/BuilderSection";
import Repeater from "@/components/builder/Repeater";
import FormField from "@/components/builder/FormField";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const INITIAL = {
    title: "",
    tagline: "",
    category: "",
    difficulty: "Beginner",
    summary: "",
    city: "",
    space_requirement: "",
    setup_cost_min: "",
    setup_cost_max: "",
    working_capital: "",
    payback_months: "",
    gross_margin: "",
    monthly_revenue_potential: "",
    price: "",
    is_free: false,
    overview: "",
    market_demand: "",
    target_customer: "",
    infrastructure: "",
    revenue_model: "",
    marketing_plan: "",
    expansion_strategy: "",
    licenses: "",
    equipment: "",
    revenue_streams: "",
    tags: "",
    investment_breakdown: [{ item: "", amount: "", note: "" }],
    staff_roles: [{ role: "", count: "1", salary: "", description: "" }],
    roadmap: [{ phase: "", duration: "", actions: "" }],
    risks: [{ risk: "", mitigation: "" }],
};

const toNumber = (value) => {
    const parsed = Number(String(value).replace(/[^0-9.]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
};

const toLines = (value) =>
    String(value || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

const asText = (
    value,
) => (value === null || value === undefined ? "" : String(value));
const asLines = (list) => (Array.isArray(list) ? list.join("\n") : "");

// Fills the form from a blueprint the creator is editing.
const toFormValues = (blueprint) => ({
    ...INITIAL,
    title: blueprint.title || "",
    tagline: blueprint.tagline || "",
    category: blueprint.category || "",
    difficulty: blueprint.difficulty || "Beginner",
    summary: blueprint.summary || "",
    city: blueprint.city || "",
    space_requirement: blueprint.space_requirement || "",
    setup_cost_min: asText(blueprint.setup_cost_min),
    setup_cost_max: asText(blueprint.setup_cost_max),
    working_capital: asText(blueprint.working_capital),
    payback_months: asText(blueprint.payback_months),
    gross_margin: asText(blueprint.gross_margin),
    monthly_revenue_potential: asText(blueprint.monthly_revenue_potential),
    price: asText(blueprint.price),
    is_free: Boolean(blueprint.is_free),
    overview: blueprint.overview || "",
    market_demand: blueprint.market_demand || "",
    target_customer: blueprint.target_customer || "",
    infrastructure: blueprint.infrastructure || "",
    revenue_model: blueprint.revenue_model || "",
    marketing_plan: blueprint.marketing_plan || "",
    expansion_strategy: blueprint.expansion_strategy || "",
    licenses: asLines(blueprint.licenses),
    equipment: asLines(blueprint.equipment),
    revenue_streams: asLines(blueprint.revenue_streams),
    tags: asLines(blueprint.tags),
    investment_breakdown: blueprint.investment_breakdown?.length
        ? blueprint.investment_breakdown.map((row) => ({
            item: row.item || "",
            amount: asText(row.amount),
            note: row.note || "",
        }))
        : INITIAL.investment_breakdown,
    staff_roles: blueprint.staff_roles?.length
        ? blueprint.staff_roles.map((row) => ({
            role: row.role || "",
            count: asText(row.count),
            salary: asText(row.salary),
            description: row.description || "",
        }))
        : INITIAL.staff_roles,
    roadmap: blueprint.roadmap?.length
        ? blueprint.roadmap.map((row) => ({
            phase: row.phase || "",
            duration: row.duration || "",
            actions: asLines(row.actions),
        }))
        : INITIAL.roadmap,
    risks: blueprint.risks?.length
        ? blueprint.risks.map((row) => ({
            risk: row.risk || "",
            mitigation: row.mitigation || "",
        }))
        : INITIAL.risks,
});

export default function BlueprintBuilder() {
    const { user } = useAuth();
    const editId = new URLSearchParams(window.location.search).get("edit");
    const [categories, setCategories] = useState([]);
    const [values, setValues] = useState(INITIAL);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [submitted, setSubmitted] = useState(null);
    const [editing, setEditing] = useState(null);
    const [loadingEdit, setLoadingEdit] = useState(Boolean(editId));

    useEffect(() => {
        const fetchCategories = async () => {
            const { data, error } = await supabase
                .from("categories")
                .select("*")
                .order("order", { ascending: true })
                .limit(50);

            if (error) {
                console.error("Category fetch error:", error);
                return;
            }

            setCategories(data || []);
        };

        fetchCategories();
    }, []);

    useEffect(() => {
        if (!editId) return;

        const fetchBlueprint = async () => {
            try {
                const { data, error } = await supabase
                    .from("blueprints")
                    .select("*")
                    .eq("id", editId)
                    .single();

                if (error) throw error;

                if (data) {
                    setEditing(data);
                    setValues(toFormValues(data));
                }
            } catch (error) {
                console.error("Blueprint fetch error:", error);
                setError("That blueprint could not be opened for editing.");
            } finally {
                setLoadingEdit(false);
            }
        };

        fetchBlueprint();
    }, [editId]);

    const set = (key) => (value) =>
        setValues((current) => ({ ...current, [key]: value }));

    const submit = async (event) => {
        event.preventDefault();
        setError("");
        if (
            !values.title.trim() || !values.category || !values.summary.trim()
        ) {
            setError(
                "Add a title, choose a category and write a one-paragraph summary before submitting.",
            );
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        setSaving(true);
        try {
            const creator = await ensureCreator(user);
            const base = slugify(values.title);
            const { data: clash, error: slugError } = await supabase
                .from("blueprints")
                .select("id")
                .eq("slug", base)
                .neq(
                    "id",
                    editing?.id || "00000000-0000-0000-0000-000000000000",
                )
                .limit(1);

            if (slugError) throw slugError;

            const slug = clash?.length
                ? `${base}-${Math.random().toString(36).slice(2, 7)}`
                : base;
            const payload = {
                title: values.title.trim(),
                slug,
                tagline: values.tagline.trim(),
                category: values.category,
                difficulty: values.difficulty,
                summary: values.summary.trim(),
                city: values.city.trim(),
                space_requirement: values.space_requirement.trim(),
                setup_cost_min: toNumber(values.setup_cost_min),
                setup_cost_max: toNumber(values.setup_cost_max),
                working_capital: toNumber(values.working_capital),
                payback_months: toNumber(values.payback_months),
                gross_margin: toNumber(values.gross_margin),
                monthly_revenue_potential: toNumber(
                    values.monthly_revenue_potential,
                ),
                price: values.is_free ? 0 : toNumber(values.price),
                is_free: values.is_free,
                overview: values.overview.trim(),
                market_demand: values.market_demand.trim(),
                target_customer: values.target_customer.trim(),
                infrastructure: values.infrastructure.trim(),
                revenue_model: values.revenue_model.trim(),
                marketing_plan: values.marketing_plan.trim(),
                expansion_strategy: values.expansion_strategy.trim(),
                licenses: toLines(values.licenses),
                equipment: toLines(values.equipment),
                revenue_streams: toLines(values.revenue_streams),
                tags: toLines(values.tags),
                investment_breakdown: values.investment_breakdown
                    .filter((row) => row.item.trim())
                    .map((row) => ({
                        item: row.item.trim(),
                        amount: toNumber(row.amount),
                        note: row.note.trim(),
                    })),
                staff_roles: values.staff_roles
                    .filter((row) => row.role.trim())
                    .map((row) => ({
                        role: row.role.trim(),
                        count: toNumber(row.count) || 1,
                        salary: toNumber(row.salary),
                        description: row.description.trim(),
                    })),
                roadmap: values.roadmap
                    .filter((row) => row.phase.trim())
                    .map((row) => ({
                        phase: row.phase.trim(),
                        duration: row.duration.trim(),
                        actions: toLines(row.actions),
                    })),
                risks: values.risks
                    .filter((row) => row.risk.trim())
                    .map((row) => ({
                        risk: row.risk.trim(),
                        mitigation: row.mitigation.trim(),
                    })),
                creator_id: creator.id,
                creator_name: creator.name,
                creator_slug: creator.slug,
                status: "pending",
                review_note: "",
                version: editing?.version || 1,
                featured: editing?.featured || false,
                rating: editing?.rating || 0,
                review_count: editing?.review_count || 0,
                buyer_count: editing?.buyer_count || 0,
            };

            const { data: blueprint, error: saveError } = editing
                ? await supabase
                    .from("blueprints")
                    .update({
                        ...payload,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", editing.id)
                    .select()
                    .single()
                : await supabase
                    .from("blueprints")
                    .insert(payload)
                    .select()
                    .single();

            if (saveError) throw saveError;

            setSubmitted(blueprint);

            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        } catch (error) {
            console.error("Blueprint submission error:", error);
            setError(error.message || "Unable to submit blueprint.");
        } finally {
            setSaving(false);
        }
    };

    if (loadingEdit) {
        return (
            <div className="space-y-6">
                <PageHeader
                    eyebrow="Creator studio"
                    title="Opening your blueprint"
                />
                <LoadingBlock rows={6} />
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="space-y-6">
                <PageHeader
                    eyebrow="Creator studio"
                    title="Blueprint submitted"
                />
                <div className="rounded-2xl border border-border bg-card p-8 text-center">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10">
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                    </span>
                    <h2 className="mt-4 text-xl">{submitted.title}</h2>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                        Your blueprint is in review. Our team checks the cost
                        sheet, licences and roadmap, then publishes it to the
                        catalogue — usually within two working days. You will
                        see it under your creator earnings once it sells.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                        <Link
                            to="/creator-dashboard"
                            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                        >
                            Back to my blueprints
                        </Link>
                        <Link
                            to="/creator-earnings"
                            className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
                        >
                            Creator earnings
                        </Link>
                        <button
                            type="button"
                            onClick={() => {
                                setSubmitted(null);
                                setValues(INITIAL);
                            }}
                            className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
                        >
                            Submit another
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <form className="space-y-6" onSubmit={submit}>
            <PageHeader
                eyebrow="Creator studio"
                title="Blueprint builder"
                description="Document the business you have already built. Every field you fill in is a decision you save the next operator from making badly."
                action={
                    <Button
                        type="submit"
                        className="rounded-full"
                        disabled={saving}
                    >
                        <Send className="mr-1.5 h-4 w-4" />{" "}
                        {saving ? "Submitting…" : "Submit for review"}
                    </Button>
                }
            />

            {error && (
                <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {error}
                </p>
            )}

            <BuilderSection
                step="1"
                title="The basics"
                description="How the idea reads in the catalogue."
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                        label="Blueprint title"
                        value={values.title}
                        onChange={set("title")}
                        placeholder="Specialty Coffee Kiosk"
                    />
                    <FormField
                        label="Tagline"
                        value={values.tagline}
                        onChange={set("tagline")}
                        placeholder="One line on what makes it work"
                    />

                    <div>
                        <Label className="text-xs text-muted-foreground">
                            Sector
                        </Label>
                        <Select
                            value={values.category}
                            onValueChange={set("category")}
                        >
                            <SelectTrigger className="mt-1.5">
                                <SelectValue placeholder="Choose a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((category) => (
                                    <SelectItem
                                        key={category.id}
                                        value={category.name}
                                    >
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label className="text-xs text-muted-foreground">
                            Difficulty
                        </Label>
                        <Select
                            value={values.difficulty}
                            onValueChange={set("difficulty")}
                        >
                            <SelectTrigger className="mt-1.5">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {["Beginner", "Intermediate", "Advanced"].map((
                                    option,
                                ) => (
                                    <SelectItem key={option} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <FormField
                        label="Summary"
                        type="textarea"
                        span="sm:col-span-2"
                        rows={3}
                        value={values.summary}
                        onChange={set("summary")}
                        placeholder="Two or three sentences a buyer reads on the catalogue card."
                    />
                    <FormField
                        label="Best-fit city"
                        value={values.city}
                        onChange={set("city")}
                        placeholder="Chennai"
                    />
                    <FormField
                        label="Space needed"
                        value={values.space_requirement}
                        onChange={set("space_requirement")}
                        placeholder="600 sq ft, ground floor"
                    />
                </div>
            </BuilderSection>

            <BuilderSection
                step="2"
                title="The numbers"
                description="All amounts in rupees. Buyers filter on these, so be precise."
            >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <FormField
                        label="Setup cost — minimum"
                        type="number"
                        value={values.setup_cost_min}
                        onChange={set("setup_cost_min")}
                        placeholder="1200000"
                    />
                    <FormField
                        label="Setup cost — maximum"
                        type="number"
                        value={values.setup_cost_max}
                        onChange={set("setup_cost_max")}
                        placeholder="1800000"
                    />
                    <FormField
                        label="Working capital"
                        type="number"
                        value={values.working_capital}
                        onChange={set("working_capital")}
                        placeholder="300000"
                    />
                    <FormField
                        label="Payback (months)"
                        type="number"
                        value={values.payback_months}
                        onChange={set("payback_months")}
                        placeholder="14"
                    />
                    <FormField
                        label="Gross margin (%)"
                        type="number"
                        value={values.gross_margin}
                        onChange={set("gross_margin")}
                        placeholder="62"
                    />
                    <FormField
                        label="Monthly revenue potential"
                        type="number"
                        value={values.monthly_revenue_potential}
                        onChange={set("monthly_revenue_potential")}
                        placeholder="600000"
                    />
                    <FormField
                        label="Blueprint price"
                        type="number"
                        value={values.price}
                        onChange={set("price")}
                        placeholder="4999"
                        disabled={values.is_free}
                    />
                    <div className="flex items-end pb-1">
                        <label className="flex items-center gap-2.5 text-sm">
                            <Checkbox
                                checked={values.is_free}
                                onCheckedChange={(checked) =>
                                    set("is_free")(!!checked)}
                            />
                            Publish as a free blueprint
                        </label>
                    </div>
                </div>
            </BuilderSection>

            <BuilderSection
                step="3"
                title="What it takes"
                description="The context a buyer needs before they trust the numbers."
            >
                <div className="grid gap-4">
                    <FormField
                        label="Overview"
                        type="textarea"
                        rows={4}
                        value={values.overview}
                        onChange={set("overview")}
                        placeholder="The model in your own words, and why you would do it again."
                    />
                    <FormField
                        label="Market demand"
                        type="textarea"
                        rows={4}
                        value={values.market_demand}
                        onChange={set("market_demand")}
                        placeholder="What you saw locally that told you this would work."
                    />
                    <FormField
                        label="Target customer"
                        type="textarea"
                        rows={3}
                        value={values.target_customer}
                        onChange={set("target_customer")}
                        placeholder="Who actually pays you, and why."
                    />
                    <FormField
                        label="Space, equipment and infrastructure"
                        type="textarea"
                        rows={3}
                        value={values.infrastructure}
                        onChange={set("infrastructure")}
                        placeholder="Premises, utilities, fit-out detail."
                    />
                </div>
            </BuilderSection>

            <BuilderSection
                step="4"
                title="Cost sheet"
                description="Itemise the setup spend. These lines become the buyer's budget."
            >
                <Repeater
                    rows={values.investment_breakdown}
                    onChange={set("investment_breakdown")}
                    addLabel="Add cost line"
                    newRow={{ item: "", amount: "", note: "" }}
                    fields={[
                        {
                            key: "item",
                            label: "Item",
                            placeholder: "Espresso machine",
                        },
                        {
                            key: "amount",
                            label: "Amount (₹)",
                            type: "number",
                            placeholder: "450000",
                        },
                        {
                            key: "note",
                            label: "Note",
                            span: "sm:col-span-2",
                            placeholder: "What makes this line necessary",
                        },
                    ]}
                />
            </BuilderSection>

            <BuilderSection
                step="5"
                title="Licences & equipment"
                description="One item per line."
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                        label="Licences to obtain"
                        type="textarea"
                        rows={4}
                        value={values.licenses}
                        onChange={set("licenses")}
                        placeholder={"FSSAI licence\nTrade licence\nGST registration"}
                    />
                    <FormField
                        label="Equipment"
                        type="textarea"
                        rows={4}
                        value={values.equipment}
                        onChange={set("equipment")}
                        placeholder={"Espresso machine\nGrinder\nUnder-counter fridge"}
                    />
                </div>
            </BuilderSection>

            <BuilderSection
                step="6"
                title="Team"
                description="Every role you had to hire, with the salary you actually paid."
            >
                <Repeater
                    rows={values.staff_roles}
                    onChange={set("staff_roles")}
                    addLabel="Add role"
                    newRow={{
                        role: "",
                        count: "1",
                        salary: "",
                        description: "",
                    }}
                    fields={[
                        { key: "role", label: "Role", placeholder: "Barista" },
                        {
                            key: "count",
                            label: "People",
                            type: "number",
                            placeholder: "2",
                        },
                        {
                            key: "salary",
                            label: "Monthly salary (₹)",
                            type: "number",
                            placeholder: "28000",
                        },
                        {
                            key: "description",
                            label: "What they do",
                            placeholder: "Shift covers, opening and closing",
                        },
                    ]}
                />
            </BuilderSection>

            <BuilderSection
                step="7"
                title="Execution roadmap"
                description="Phases become the buyer's project checklist, so keep each action concrete."
            >
                <Repeater
                    rows={values.roadmap}
                    onChange={set("roadmap")}
                    addLabel="Add phase"
                    newRow={{ phase: "", duration: "", actions: "" }}
                    fields={[
                        {
                            key: "phase",
                            label: "Phase name",
                            placeholder: "Location & licences",
                        },
                        {
                            key: "duration",
                            label: "Duration",
                            placeholder: "Weeks 1–4",
                        },
                        {
                            key: "actions",
                            label: "Actions (one per line)",
                            type: "textarea",
                            span: "sm:col-span-2",
                            rows: 4,
                            placeholder:
                                "Shortlist three locations\nApply for FSSAI licence",
                        },
                    ]}
                />
            </BuilderSection>

            <BuilderSection
                step="8"
                title="Revenue & growth"
                description="How the money comes in, and how you would scale it."
            >
                <div className="grid gap-4">
                    <FormField
                        label="Revenue model"
                        type="textarea"
                        rows={4}
                        value={values.revenue_model}
                        onChange={set("revenue_model")}
                        placeholder="Unit economics in plain numbers."
                    />
                    <FormField
                        label="Revenue streams"
                        type="textarea"
                        rows={3}
                        value={values.revenue_streams}
                        onChange={set("revenue_streams")}
                        placeholder={"Walk-in sales\nSubscriptions\nCatering"}
                    />
                    <FormField
                        label="Marketing plan"
                        type="textarea"
                        rows={4}
                        value={values.marketing_plan}
                        onChange={set("marketing_plan")}
                        placeholder="What actually brought customers in."
                    />
                    <FormField
                        label="Expansion strategy"
                        type="textarea"
                        rows={3}
                        value={values.expansion_strategy}
                        onChange={set("expansion_strategy")}
                        placeholder="The next location, and when it makes sense."
                    />
                    <FormField
                        label="Tags"
                        type="textarea"
                        rows={2}
                        value={values.tags}
                        onChange={set("tags")}
                        placeholder={"coffee\nhigh-margin\nrepeat-customers"}
                    />
                </div>
            </BuilderSection>

            <BuilderSection
                step="9"
                title="Risks"
                description="Name what went wrong for you — buyers trust honesty more than optimism."
            >
                <Repeater
                    rows={values.risks}
                    onChange={set("risks")}
                    addLabel="Add risk"
                    newRow={{ risk: "", mitigation: "" }}
                    fields={[
                        {
                            key: "risk",
                            label: "Risk",
                            type: "textarea",
                            rows: 2,
                            placeholder: "Rent escalation in year two",
                        },
                        {
                            key: "mitigation",
                            label: "How you handled it",
                            type: "textarea",
                            rows: 2,
                            placeholder: "Negotiated a 3-year lock-in",
                        },
                    ]}
                />
            </BuilderSection>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-secondary/40 px-5 py-4">
                <p className="text-sm text-muted-foreground">
                    Submissions are reviewed before publishing. You can keep
                    editing until they go live.
                </p>
                <Button
                    type="submit"
                    className="rounded-full"
                    disabled={saving}
                >
                    <Send className="mr-1.5 h-4 w-4" />{" "}
                    {saving ? "Submitting…" : "Submit for review"}
                </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
                Questions about the review?{" "}
                <Link to="/support" className="text-primary hover:underline">
                    Read the creator guide{" "}
                    <ArrowUpRight className="inline h-3 w-3" />
                </Link>
            </p>
        </form>
    );
}
