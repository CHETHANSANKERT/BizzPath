import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Check, Clock, Loader2, Video } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { formatINR } from "@/lib/format";

const SLOTS = ["10:00", "11:30", "14:00", "15:30", "17:00", "18:30"];
const today = () => new Date().toISOString().slice(0, 10);

export default function BookConsultation() {
    const { user } = useAuth();
    const preselect =
        new URLSearchParams(window.location.search).get("mentor") || "";

    const [mentors, setMentors] = useState([]);
    const [blueprints, setBlueprints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [sent, setSent] = useState(null);

    const [form, setForm] = useState({
        mentor: preselect,
        blueprint: "none",
        date: "",
        time: SLOTS[0],
        name: "",
        email: "",
        phone: "",
        notes: "",
    });

    useEffect(() => {
        let active = true;

        const fetchData = async () => {
            setLoading(true);

            try {
                const [creatorResult, blueprintResult] = await Promise.all([
                    supabase
                        .from("creators")
                        .select("*")
                        .order("rating", { ascending: false })
                        .limit(100),

                    supabase
                        .from("blueprints")
                        .select("*")
                        .eq("status", "published")
                        .order("buyer_count", { ascending: false })
                        .limit(60),
                ]);

                if (creatorResult.error) throw creatorResult.error;
                if (blueprintResult.error) throw blueprintResult.error;

                if (active) {
                    setMentors(creatorResult.data || []);
                    setBlueprints(blueprintResult.data || []);
                }
            } catch (error) {
                console.error("Consultation data fetch error:", error);
                if (active) {
                    setMentors([]);
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

    useEffect(() => {
        setForm((prev) => ({
            ...prev,
            name: prev.name || user?.full_name || "",
            email: prev.email || user?.email || "",
        }));
    }, [user]);

    const mentor = mentors.find((item) => item.slug === form.mentor) || null;
    const update = (field) => (event) =>
        setForm((prev) => ({ ...prev, [field]: event.target.value }));

    const submit = async (event) => {
        event.preventDefault();
        setError("");

        if (!mentor) {
            setError("Choose a mentor to continue.");
            return;
        }

        if (!form.date) {
            setError("Pick a preferred date.");
            return;
        }

        if (!form.name.trim() || !form.email.trim()) {
            setError("Name and email are required.");
            return;
        }

        setSaving(true);

        try {
            const blueprint = blueprints.find((item) =>
                item.slug === form.blueprint
            ) || null;

            const scheduled = new Date(`${form.date}T${form.time}:00`);

            const { error: enquiryError } = await supabase
                .from("enquiries")
                .insert({
                    name: form.name.trim(),
                    email: form.email.trim(),
                    phone: form.phone.trim(),
                    type: "consultation",
                    message: form.notes.trim(),
                    blueprint_id: blueprint?.id || null,
                    blueprint_title: blueprint?.title || "",
                    creator_slug: mentor.slug,
                    creator_name: mentor.name,
                    scheduled_at: scheduled.toISOString(),
                    status: "new",
                    user_id: user?.id || null,
                });

            if (enquiryError) throw enquiryError;

            setSent({ mentor, blueprint, scheduled });
        } catch (err) {
            console.error("Consultation submission error:", err);
            setError(
                err?.message ||
                    "Could not send your request. Please try again.",
            );
        } finally {
            setSaving(false);
        }
    };

    if (sent) {
        return (
            <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-6 text-center sm:p-8">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                    <Check className="h-5 w-5" />
                </span>
                <h1 className="mt-5 font-display text-2xl">Request sent</h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {sent.mentor.name}{" "}
                    will confirm the session and share the joining link. You
                    asked for
                </p>
                <p className="mt-3 rounded-xl bg-secondary px-4 py-3 text-sm font-medium">
                    {sent.scheduled.toLocaleString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "numeric",
                        minute: "2-digit",
                    })}
                </p>
                {sent.blueprint && (
                    <p className="mt-2 text-xs text-muted-foreground">
                        Topic: {sent.blueprint.title}
                    </p>
                )}
                <div className="mt-6 flex flex-col gap-2">
                    <Link
                        to="/mentorship-requests"
                        className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
                    >
                        Track this request
                    </Link>
                    <Link
                        to="/mentor-marketplace"
                        className="rounded-full border border-border px-5 py-2.5 text-sm font-medium"
                    >
                        Browse more mentors
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <p className="eyebrow">Mentorship</p>
                <h1 className="mt-2 text-2xl leading-tight sm:text-3xl">
                    Book a private consultation.
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Choose a mentor, tell them what you are planning and pick a
                    preferred slot.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                <form
                    onSubmit={submit}
                    className="space-y-5 rounded-2xl border border-border bg-card p-5"
                >
                    <div className="space-y-2">
                        <Label>Mentor</Label>
                        <Select
                            value={form.mentor}
                            onValueChange={(value) =>
                                setForm((prev) => ({ ...prev, mentor: value }))}
                        >
                            <SelectTrigger className="h-11">
                                <SelectValue
                                    placeholder={loading
                                        ? "Loading mentors…"
                                        : "Choose a mentor"}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {mentors.map((item) => (
                                    <SelectItem key={item.id} value={item.slug}>
                                        {item.name}
                                        {item.consultation_fee
                                            ? ` · ${
                                                formatINR(item.consultation_fee)
                                            }`
                                            : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Blueprint or topic</Label>
                        <Select
                            value={form.blueprint}
                            onValueChange={(value) =>
                                setForm((prev) => ({
                                    ...prev,
                                    blueprint: value,
                                }))}
                        >
                            <SelectTrigger className="h-11">
                                <SelectValue placeholder="General business guidance" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">
                                    General business guidance
                                </SelectItem>
                                {blueprints.map((item) => (
                                    <SelectItem key={item.id} value={item.slug}>
                                        {item.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="date">Preferred date</Label>
                            <Input
                                id="date"
                                type="date"
                                min={today()}
                                value={form.date}
                                onChange={update("date")}
                                className="h-11"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="time">Preferred time</Label>
                            <select
                                id="time"
                                value={form.time}
                                onChange={update("time")}
                                className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none"
                            >
                                {SLOTS.map((slot) => (
                                    <option key={slot} value={slot}>
                                        {slot}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Your name</Label>
                            <Input
                                id="name"
                                value={form.name}
                                onChange={update("name")}
                                className="h-11"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={form.email}
                                onChange={update("email")}
                                className="h-11"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone (optional)</Label>
                        <Input
                            id="phone"
                            value={form.phone}
                            onChange={update("phone")}
                            className="h-11"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">
                            What do you want to cover?
                        </Label>
                        <Textarea
                            id="notes"
                            value={form.notes}
                            onChange={update("notes")}
                            placeholder="Where you are with the plan, the numbers you are unsure about, the decision you are weighing."
                            className="min-h-[110px]"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}

                    <Button
                        type="submit"
                        className="h-11 w-full rounded-full"
                        disabled={saving || loading}
                    >
                        {saving
                            ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {" "}
                                    Sending request…
                                </>
                            )
                            : (
                                "Request consultation"
                            )}
                    </Button>
                </form>

                <aside className="space-y-4">
                    {mentor && (
                        <div className="rounded-2xl border border-border bg-card p-5">
                            <p className="text-sm font-medium">{mentor.name}</p>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                {mentor.headline}
                            </p>
                            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                                <p className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    {mentor.consultation_duration || 45}{" "}
                                    minute session
                                </p>
                                <p className="flex items-center gap-1.5">
                                    <Video className="h-3.5 w-3.5" />{" "}
                                    Video call, link shared on confirmation
                                </p>
                                <p className="flex items-center gap-1.5">
                                    <CalendarClock className="h-3.5 w-3.5" />
                                    {mentor.response_time
                                        ? `Replies in ${mentor.response_time}`
                                        : "Replies within a day"}
                                </p>
                            </div>
                            <p className="mt-4 border-t border-border pt-3 text-sm font-medium">
                                {mentor.consultation_fee
                                    ? formatINR(mentor.consultation_fee)
                                    : "Fee on request"}
                            </p>
                        </div>
                    )}

                    <div className="rounded-2xl border border-dashed border-border p-5">
                        <p className="eyebrow">What happens next</p>
                        <ol className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
                            <li>
                                1. Your request reaches the mentor with your
                                preferred slot.
                            </li>
                            <li>
                                2. They confirm a time and share a joining link.
                            </li>
                            <li>
                                3. You can follow up in Mentorship requests at
                                any point.
                            </li>
                        </ol>
                    </div>
                </aside>
            </div>
        </div>
    );
}
