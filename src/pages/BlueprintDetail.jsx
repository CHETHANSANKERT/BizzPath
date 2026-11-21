import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { acquireBlueprint, ensureProject } from "@/lib/acquisitions";
import { getBlueprintAccess, startBlueprintPreview } from "@/lib/access";
import BlueprintHeader from "@/components/detail/BlueprintHeader";
import BlueprintBody from "@/components/detail/BlueprintBody";
import BlueprintSidebar from "@/components/detail/BlueprintSidebar";
import BlueprintCard from "@/components/BlueprintCard";
import RequestDialog from "@/components/RequestDialog";
import LoadingBlock from "@/components/LoadingBlock";
import PreviewBar from "@/components/paywall/PreviewBar";
import AccessWall from "@/components/paywall/AccessWall";

export default function BlueprintDetail() {
    const { slug } = useParams();
    const [blueprint, setBlueprint] = useState(null);
    const [creator, setCreator] = useState(null);
    const [related, setRelated] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialog, setDialog] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();
    const [saved, setSaved] = useState(null);
    const [acquiring, setAcquiring] = useState(false);
    const [access, setAccess] = useState(null);
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        let active = true;

        const fetchBlueprintData = async () => {
            setLoading(true);
            setBlueprint(null);
            setCreator(null);
            setRelated([]);

            try {
                const { data: item, error } = await supabase
                    .from("blueprints")
                    .select("*")
                    .eq("slug", slug)
                    .eq("status", "published")
                    .maybeSingle();

                if (error) throw error;
                if (!active) return;

                setBlueprint(item);

                if (!item) return;

                const [creatorResponse, relatedResponse] = await Promise.all([
                    item.creator_slug
                        ? supabase
                            .from("creators")
                            .select("*")
                            .eq("slug", item.creator_slug)
                            .limit(1)
                            .maybeSingle()
                        : Promise.resolve({ data: null, error: null }),

                    supabase
                        .from("blueprints")
                        .select("*")
                        .eq("status", "published")
                        .eq("category", item.category)
                        .order("buyer_count", { ascending: false })
                        .limit(4),
                ]);

                if (creatorResponse.error) throw creatorResponse.error;
                if (relatedResponse.error) throw relatedResponse.error;

                if (!active) return;

                setCreator(creatorResponse.data || null);

                setRelated(
                    (relatedResponse.data || [])
                        .filter((entry) => entry.slug !== item.slug)
                        .slice(0, 3),
                );
            } catch (error) {
                console.error("Blueprint fetch error:", error);
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchBlueprintData();

        return () => {
            active = false;
        };
    }, [slug]);
    useEffect(() => {
        if (!blueprint?.slug) return;

        const key = `bizpath-view-${blueprint.slug}`;

        if (sessionStorage.getItem(key)) return;

        sessionStorage.setItem(key, "1");

        const trackView = async () => {
            try {
                await supabase.rpc("track_blueprint_view", {
                    p_slug: blueprint.slug,
                });
            } catch (error) {
                console.error("Blueprint view tracking error:", error);
            }
        };

        trackView();
    }, [blueprint?.slug]);

    useEffect(() => {
        if (loading || blueprint) return undefined;
        const meta = document.createElement("meta");
        meta.name = "prerender-status-code";
        meta.content = "404";
        document.head.appendChild(meta);
        return () => document.head.removeChild(meta);
    }, [loading, blueprint]);

    useEffect(() => {
        if (!user?.id || !blueprint?.id) {
            setSaved(null);
            return;
        }

        let active = true;

        const fetchSavedBlueprint = async () => {
            const { data, error } = await supabase
                .from("saved_blueprints")
                .select("*")
                .eq("blueprint_id", blueprint.id)
                .eq("user_id", user.id)
                .maybeSingle();

            if (error) {
                console.error("Saved blueprint fetch error:", error);
                return;
            }

            if (active) setSaved(data || null);
        };

        fetchSavedBlueprint();

        return () => {
            active = false;
        };
    }, [user?.id, blueprint?.id]);

    const refreshAccess = useCallback(async () => {
        if (!blueprint?.slug) return;
        setAccess(await getBlueprintAccess(blueprint.slug));
    }, [blueprint?.slug]);

    useEffect(() => {
        refreshAccess();
    }, [refreshAccess]);

    if (loading) {
        return (
            <div className="wrap max-w-3xl py-20">
                <LoadingBlock rows={6} />
            </div>
        );
    }

    if (!blueprint) {
        return (
            <div className="wrap py-24 text-center">
                <p className="eyebrow">Blueprint unavailable</p>
                <h1 className="mt-3 text-3xl">
                    We couldn't find that blueprint.
                </h1>
                <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
                    It may have been unpublished while the creator updates the
                    numbers.
                </p>
                <Link
                    to="/explore"
                    className="mt-6 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
                >
                    Browse all blueprints
                </Link>
            </div>
        );
    }

    const goToLogin = () =>
        navigate(
            `/login?returnTo=${encodeURIComponent(window.location.pathname)}`,
        );

    const handleStartPreview = async () => {
        if (!user) {
            goToLogin();
            return;
        }
        setStarting(true);
        const result = await startBlueprintPreview(blueprint.slug);
        setStarting(false);
        if (result?.access) setAccess(result.access);
        else await refreshAccess();
    };

    const handleSave = async () => {
        if (!user) {
            goToLogin();
            return;
        }

        try {
            if (saved) {
                const { error } = await supabase
                    .from("saved_blueprints")
                    .delete()
                    .eq("id", saved.id)
                    .eq("user_id", user.id);

                if (error) throw error;

                setSaved(null);
                return;
            }

            const { data, error } = await supabase
                .from("saved_blueprints")
                .insert({
                    user_id: user.id,
                    blueprint_id: blueprint.id,
                    blueprint_title: blueprint.title,
                    blueprint_slug: blueprint.slug,
                    category: blueprint.category,
                    price: blueprint.price || 0,
                    is_free: Boolean(blueprint.is_free),
                })
                .select()
                .single();

            if (error) throw error;

            setSaved(data);
        } catch (error) {
            console.error("Save blueprint error:", error);
        }
    };

    const handleAcquire = async () => {
        if (!user) {
            goToLogin();
            return;
        }
        setAcquiring(true);
        const purchase = await acquireBlueprint(blueprint, creator);
        if (purchase.status === "paid") {
            const project = await ensureProject(blueprint);
            setAcquiring(false);
            navigate(`/project-tracker?project=${project.id}`);
            return;
        }
        setAcquiring(false);
        navigate("/purchase-history");
    };

    return (
        <div className="wrap py-10 sm:py-14">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div>
                    <BlueprintHeader blueprint={blueprint} creator={creator} />
                    {access?.access === "preview" && access.expires_at
                        ? (
                            <PreviewBar
                                expiresAt={access.expires_at}
                                onExpire={refreshAccess}
                            />
                        )
                        : null}
                    <div className="mt-10">
                        {access === null
                            ? <LoadingBlock rows={6} />
                            : access.can_view_full
                            ? <BlueprintBody blueprint={blueprint} />
                            : (
                                <AccessWall
                                    access={access}
                                    blueprint={blueprint}
                                    onStart={handleStartPreview}
                                    onLogin={goToLogin}
                                    starting={starting}
                                />
                            )}
                    </div>
                </div>
                <BlueprintSidebar
                    blueprint={blueprint}
                    creator={creator}
                    onRequest={() => setDialog("blueprint-access")}
                    onConsult={() => setDialog("consultation")}
                    onAcquire={handleAcquire}
                    onStartPreview={handleStartPreview}
                    onSubscribe={() => navigate("/plans")}
                    onSave={handleSave}
                    saved={Boolean(saved)}
                    acquiring={acquiring}
                    access={access}
                    starting={starting}
                />
            </div>

            {related.length
                ? (
                    <section className="mt-20 border-t border-border pt-12">
                        <div className="flex items-end justify-between gap-4">
                            <h2 className="text-2xl">
                                More in {blueprint.category}
                            </h2>
                            <Link
                                to={`/explore?category=${
                                    encodeURIComponent(blueprint.category || "")
                                }`}
                                className="text-sm text-primary underline-offset-4 hover:underline"
                            >
                                View all
                            </Link>
                        </div>
                        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {related.map((item) => (
                                <BlueprintCard key={item.id} blueprint={item} />
                            ))}
                        </div>
                    </section>
                )
                : null}

            <RequestDialog
                open={!!dialog}
                onOpenChange={(value) => setDialog(value ? dialog : null)}
                type={dialog || "blueprint-access"}
                blueprint={blueprint}
                creator={creator}
            />
        </div>
    );
}
