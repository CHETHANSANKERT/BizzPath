import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BadgeCheck, MapPin, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import BlueprintCard from "@/components/BlueprintCard";
import RequestDialog from "@/components/RequestDialog";
import LoadingBlock from "@/components/LoadingBlock";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/format";

export default function CreatorProfile() {
    const { slug } = useParams();
    const [creator, setCreator] = useState(null);
    const [blueprints, setBlueprints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        let active = true;

        const fetchCreatorProfile = async () => {
            setLoading(true);

            try {
                const { data: creatorData, error: creatorError } =
                    await supabase
                        .from("creators")
                        .select("*")
                        .eq("slug", slug)
                        .maybeSingle();

                if (creatorError) throw creatorError;

                if (!creatorData) {
                    if (active) {
                        setCreator(null);
                        setBlueprints([]);
                    }
                    return;
                }

                const { data: blueprintData, error: blueprintError } =
                    await supabase
                        .from("blueprints")
                        .select("*")
                        .eq("status", "published")
                        .eq("creator_slug", slug)
                        .order("buyer_count", { ascending: false })
                        .limit(12);

                if (blueprintError) throw blueprintError;

                if (active) {
                    setCreator(creatorData);
                    setBlueprints(blueprintData || []);
                }
            } catch (error) {
                console.error("Creator profile fetch error:", error);

                if (active) {
                    setCreator(null);
                    setBlueprints([]);
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchCreatorProfile();

        return () => {
            active = false;
        };
    }, [slug]);

    if (loading) {
        return (
            <div className="wrap max-w-3xl py-20">
                <LoadingBlock rows={5} />
            </div>
        );
    }

    if (!creator) {
        return (
            <div className="wrap py-24 text-center">
                <p className="eyebrow">Creator not found</p>
                <h1 className="mt-3 text-3xl">This profile isn't available.</h1>
                <Link
                    to="/explore"
                    className="mt-6 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
                >
                    Browse blueprints
                </Link>
            </div>
        );
    }

    const stats = [
        { label: "Blueprints", value: blueprints.length },
        { label: "Businesses built", value: creator.businesses_built || "—" },
        { label: "Years operating", value: creator.years_experience || "—" },
        {
            label: "Rating",
            value: creator.rating ? creator.rating.toFixed(1) : "—",
        },
    ];

    return (
        <div className="wrap py-12 sm:py-16">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div>
                    <div className="flex flex-wrap items-start gap-5">
                        <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-primary font-display text-2xl text-primary-foreground">
                            {creator.name.split(" ").map((word) => word[0])
                                .slice(0, 2).join("")}
                        </span>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="text-3xl leading-tight sm:text-4xl">
                                    {creator.name}
                                </h1>
                                {creator.verified && (
                                    <BadgeCheck className="h-5 w-5 text-primary" />
                                )}
                            </div>
                            <p className="mt-2 text-[15px] text-muted-foreground">
                                {creator.headline}
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                {creator.city && (
                                    <span className="inline-flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {creator.city}
                                    </span>
                                )}
                                {creator.rating
                                    ? (
                                        <span className="inline-flex items-center gap-1">
                                            <Star className="h-3 w-3 fill-accent text-accent" />
                                            {creator.rating.toFixed(1)} ·{" "}
                                            {creator.review_count || 0} reviews
                                        </span>
                                    )
                                    : null}
                            </div>
                        </div>
                    </div>

                    <p className="mt-7 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                        {creator.bio}
                    </p>

                    {creator.expertise?.length
                        ? (
                            <div className="mt-6 flex flex-wrap gap-2">
                                {creator.expertise.map((skill) => (
                                    <span
                                        key={skill}
                                        className="rounded-full border border-border px-3 py-1.5 text-xs text-foreground/75"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        )
                        : null}

                    <dl className="mt-9 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-4">
                        {stats.map((stat) => (
                            <div key={stat.label} className="bg-card px-4 py-5">
                                <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                                    {stat.label}
                                </dt>
                                <dd className="mt-1.5 font-display text-xl">
                                    {stat.value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>

                <aside className="lg:sticky lg:top-24 lg:self-start">
                    <div className="rounded-2xl border border-border bg-card p-6">
                        <p className="eyebrow">Paid consultation</p>
                        <p className="mt-3 font-display text-2xl">
                            {creator.consultation_fee
                                ? formatINR(creator.consultation_fee)
                                : "On request"}
                            {creator.consultation_fee
                                ? (
                                    <span className="ml-1.5 font-body text-xs text-muted-foreground">
                                        / {creator.consultation_duration || 45}
                                        {" "}
                                        min
                                    </span>
                                )
                                : null}
                        </p>
                        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                            A working session on your city, budget and timeline
                            — with the cost sheet open on the table.
                        </p>
                        <Button
                            className="mt-5 w-full rounded-full"
                            onClick={() => setOpen(true)}
                        >
                            Request a consultation
                        </Button>
                        <p className="mt-3 text-center text-[11px] text-muted-foreground">
                            Replies {creator.response_time || "within a day"}
                        </p>
                    </div>
                </aside>
            </div>

            <section className="mt-16 border-t border-border pt-12">
                <h2 className="text-2xl">
                    Blueprints by {creator.name.split(" ")[0]}
                </h2>
                {blueprints.length
                    ? (
                        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {blueprints.map((blueprint) => (
                                <BlueprintCard
                                    key={blueprint.id}
                                    blueprint={blueprint}
                                />
                            ))}
                        </div>
                    )
                    : (
                        <p className="mt-4 text-sm text-muted-foreground">
                            This creator has no published blueprints yet.
                        </p>
                    )}
            </section>

            <RequestDialog
                open={open}
                onOpenChange={setOpen}
                type="consultation"
                creator={creator}
            />
        </div>
    );
}
