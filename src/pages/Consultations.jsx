import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowUpRight,
    CalendarClock,
    MessageSquare,
    Video,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import PageHeader from "@/components/account/PageHeader";
import EmptyState from "@/components/account/EmptyState";
import StatusBadge from "@/components/account/StatusBadge";
import LoadingBlock from "@/components/LoadingBlock";
import MessageMentorDialog from "@/components/mentors/MessageMentorDialog";

const formatSlot = (value) =>
    new Date(value).toLocaleString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
    });

export default function Consultations() {
    const [items, setItems] = useState([]);
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [messageTarget, setMessageTarget] = useState(null);

    useEffect(() => {
        if (!user?.id) {
            setItems([]);
            setLoading(false);
            return;
        }

        let active = true;

        const fetchConsultations = async () => {
            setLoading(true);

            try {
                const { data, error } = await supabase
                    .from("enquiries")
                    .select("*")
                    .eq("type", "consultation")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false })
                    .limit(50);

                if (error) throw error;

                if (active) {
                    setItems(data || []);
                }
            } catch (error) {
                console.error("Consultations fetch error:", error);

                if (active) {
                    setItems([]);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        fetchConsultations();

        return () => {
            active = false;
        };
    }, [user?.id]);

    const upcoming = items
        .filter((item) =>
            item.scheduled_at && new Date(item.scheduled_at) >= new Date()
        )
        .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
    const requested = items.filter((item) =>
        !item.scheduled_at || new Date(item.scheduled_at) < new Date()
    );

    return (
        <div className="space-y-8">
            <PageHeader
                eyebrow="Mentorship"
                title="Consultation requests"
                description="Your conversations with the operators behind the blueprints you are considering."
                action={
                    <Link
                        to="/explore"
                        className="rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
                    >
                        Find a mentor
                    </Link>
                }
            />

            {loading
                ? <LoadingBlock rows={5} />
                : items.length
                ? (
                    <div className="space-y-8">
                        <section>
                            <h2 className="text-lg">Upcoming meetings</h2>
                            {upcoming.length
                                ? (
                                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                        {upcoming.map((item) => (
                                            <article
                                                key={item.id}
                                                className="rounded-2xl border border-border bg-card p-5"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="font-medium">
                                                            {item
                                                                .creator_name ||
                                                                "BizPath mentor"}
                                                        </p>
                                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                                            {item
                                                                .blueprint_title ||
                                                                "General business guidance"}
                                                        </p>
                                                    </div>
                                                    <StatusBadge
                                                        status={item.status}
                                                    />
                                                </div>
                                                <p className="mt-4 flex items-center gap-1.5 text-sm text-primary">
                                                    <CalendarClock className="h-4 w-4" />
                                                    {" "}
                                                    {formatSlot(
                                                        item.scheduled_at,
                                                    )}
                                                </p>
                                                {item.meeting_link
                                                    ? (
                                                        <a
                                                            href={item
                                                                .meeting_link}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground"
                                                        >
                                                            <Video className="h-3.5 w-3.5" />
                                                            {" "}
                                                            Join meeting
                                                        </a>
                                                    )
                                                    : (
                                                        <p className="mt-4 text-xs text-muted-foreground">
                                                            The joining link
                                                            appears here once
                                                            the creator
                                                            confirms.
                                                        </p>
                                                    )}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setMessageTarget(item)}
                                                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                                                >
                                                    <MessageSquare className="h-3.5 w-3.5" />
                                                    {" "}
                                                    Message mentor
                                                </button>
                                            </article>
                                        ))}
                                    </div>
                                )
                                : (
                                    <p className="mt-3 rounded-2xl border border-dashed border-border px-5 py-6 text-sm text-muted-foreground">
                                        No meetings scheduled yet.
                                    </p>
                                )}
                        </section>

                        <section>
                            <h2 className="text-lg">Requests &amp; history</h2>
                            <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
                                <ul className="divide-y divide-border">
                                    {requested.map((item) => (
                                        <li
                                            key={item.id}
                                            className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium">
                                                    {item.creator_name ||
                                                        "BizPath mentor"}
                                                </p>
                                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                    {item.blueprint_title ||
                                                        "General guidance"}{" "}
                                                    · requested{" "}
                                                    {new Date(
                                                        item.created_at ||
                                                            item.created_date,
                                                    ).toLocaleDateString(
                                                        "en-IN",
                                                        {
                                                            day: "numeric",
                                                            month: "short",
                                                        },
                                                    )}
                                                </p>
                                                {item.message && (
                                                    <p className="mt-2 line-clamp-2 max-w-xl text-xs text-muted-foreground">
                                                        “{item.message}”
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setMessageTarget(item)}
                                                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                                >
                                                    <MessageSquare className="h-3.5 w-3.5" />
                                                    {" "}
                                                    Message
                                                </button>
                                                <StatusBadge
                                                    status={item.status}
                                                />
                                                {item.creator_slug && (
                                                    <Link
                                                        to={`/creator/${item.creator_slug}`}
                                                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                                    >
                                                        Profile{" "}
                                                        <ArrowUpRight className="h-3 w-3" />
                                                    </Link>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                    {!requested.length && (
                                        <li className="px-5 py-6 text-sm text-muted-foreground">
                                            Nothing here yet.
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </section>
                    </div>
                )
                : (
                    <EmptyState
                        icon={MessageSquare}
                        title="No consultations requested"
                        description="Open any blueprint and choose “Talk to the creator” to request a paid session with the operator."
                        action={
                            <Link
                                to="/explore"
                                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                            >
                                Browse blueprints
                            </Link>
                        }
                    />
                )}

            <MessageMentorDialog
                open={Boolean(messageTarget)}
                onOpenChange={(open) => {
                    if (!open) setMessageTarget(null);
                }}
                request={messageTarget}
            />
        </div>
    );
}
