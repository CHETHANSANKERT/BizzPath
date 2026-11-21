import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FilePlus2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import PageHeader from "@/components/account/PageHeader";
import LoadingBlock from "@/components/LoadingBlock";
import BlueprintStatusRow from "@/components/creator/BlueprintStatusRow";
import { Button } from "@/components/ui/button";

export default function CreatorDashboard() {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) {
            setItems([]);
            setLoading(false);
            return;
        }

        let active = true;

        const fetchBlueprints = async () => {
            setLoading(true);

            try {
                const { data, error } = await supabase
                    .from("blueprints")
                    .select("*")
                    .eq("created_by_id", user.id)
                    .order("updated_at", { ascending: false })
                    .limit(100);

                if (error) throw error;

                if (active) {
                    setItems(data || []);
                }
            } catch (error) {
                console.error("Creator dashboard fetch error:", error);

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
    }, [user?.id]);

    const count = (status) =>
        items.filter((item) => item.status === status).length;
    const stats = [
        { label: "Live", value: count("published") },
        { label: "In review", value: count("pending") },
        { label: "Needs changes", value: count("rejected") },
        { label: "Drafts", value: count("draft") },
    ];

    return (
        <div className="space-y-8">
            <PageHeader
                eyebrow="Creator portal"
                title="Your blueprints"
                description="Build a blueprint, send it for review, and follow its status through to publication."
            />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="rounded-2xl border border-border bg-card p-4"
                    >
                        <p className="font-display text-2xl">{stat.value}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {stat.label}
                        </p>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Button asChild className="rounded-full">
                    <Link to="/blueprint-builder">
                        <FilePlus2 className="mr-1.5 h-4 w-4" /> New blueprint
                    </Link>
                </Button>
                <span className="text-xs text-muted-foreground">
                    Only published blueprints appear in the public catalogue.
                </span>
            </div>

            {loading
                ? <LoadingBlock rows={4} />
                : items.length
                ? (
                    <div className="space-y-3">
                        {items.map((blueprint) => (
                            <BlueprintStatusRow
                                key={blueprint.id}
                                blueprint={blueprint}
                            />
                        ))}
                    </div>
                )
                : (
                    <div className="rounded-2xl border border-dashed border-border px-5 py-12 text-center">
                        <h2 className="text-lg">No blueprints yet</h2>
                        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                            Start with the numbers you know best — setup costs,
                            licences, staffing and the first 12 months.
                        </p>
                        <Link
                            to="/blueprint-builder"
                            className="mt-5 inline-block rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                        >
                            Create your first blueprint
                        </Link>
                    </div>
                )}
        </div>
    );
}
