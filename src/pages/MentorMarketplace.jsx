import { useEffect, useMemo, useState } from "react";
import { Search, Users, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import MentorCard from "@/components/mentors/MentorCard";
import LoadingBlock from "@/components/LoadingBlock";

const SORTS = [
    { key: "rating", label: "Top rated", column: "rating", ascending: false },
    {
        key: "fee",
        label: "Lowest fee",
        column: "consultation_fee",
        ascending: true,
    },
    {
        key: "experience",
        label: "Most experienced",
        column: "years_experience",
        ascending: false,
    },
];

export default function MentorMarketplace() {
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [term, setTerm] = useState("");
    const [expertise, setExpertise] = useState("all");
    const [city, setCity] = useState("all");
    const [sortKey, setSortKey] = useState("rating");

    useEffect(() => {
        let active = true;

        const fetchMentors = async () => {
            setLoading(true);

            try {
                const sort = SORTS.find((item) => item.key === sortKey) ||
                    SORTS[0];

                const { data, error } = await supabase
                    .from("creators")
                    .select("*")
                    .order(sort.column, { ascending: sort.ascending })
                    .limit(100);

                if (error) throw error;

                if (active) {
                    setMentors(data || []);
                }
            } catch (error) {
                console.error("Mentor marketplace fetch error:", error);

                if (active) {
                    setMentors([]);
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        fetchMentors();

        return () => {
            active = false;
        };
    }, [sortKey]);

    const { cities, topics } = useMemo(() => {
        const citySet = new Set();
        const topicSet = new Set();
        mentors.forEach((mentor) => {
            if (mentor.city) citySet.add(mentor.city);
            (mentor.expertise || []).forEach((tag) => topicSet.add(tag));
        });
        return { cities: [...citySet].sort(), topics: [...topicSet].sort() };
    }, [mentors]);

    const needle = term.trim().toLowerCase();
    const visible = mentors.filter((mentor) => {
        if (city !== "all" && mentor.city !== city) return false;
        if (
            expertise !== "all" && !(mentor.expertise || []).includes(expertise)
        ) return false;
        if (!needle) return true;
        return [
            mentor.name,
            mentor.headline,
            mentor.city,
            ...(mentor.expertise || []),
        ]
            .filter(Boolean)
            .some((field) => field.toLowerCase().includes(needle));
    });

    return (
        <div className="space-y-6">
            <div>
                <p className="eyebrow">Mentorship</p>
                <h1 className="mt-2 text-2xl leading-tight sm:text-3xl">
                    Mentors who have already run it.
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Book a paid session with the operator behind a blueprint you
                    are considering.
                </p>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-border bg-card p-1.5">
                <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                    value={term}
                    onChange={(event) => setTerm(event.target.value)}
                    placeholder="Search mentors or expertise"
                    className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/70"
                    aria-label="Search mentors"
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

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <select
                    value={expertise}
                    onChange={(event) => setExpertise(event.target.value)}
                    className="rounded-xl border border-border bg-card px-3 py-2.5 text-xs outline-none sm:rounded-full"
                    aria-label="Filter by expertise"
                >
                    <option value="all">Any expertise</option>
                    {topics.map((tag) => (
                        <option key={tag} value={tag}>
                            {tag}
                        </option>
                    ))}
                </select>

                <select
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    className="rounded-xl border border-border bg-card px-3 py-2.5 text-xs outline-none sm:rounded-full"
                    aria-label="Filter by city"
                >
                    <option value="all">Any city</option>
                    {cities.map((name) => (
                        <option key={name} value={name}>
                            {name}
                        </option>
                    ))}
                </select>

                <select
                    value={sortKey}
                    onChange={(event) => setSortKey(event.target.value)}
                    className="col-span-2 rounded-xl border border-border bg-card px-3 py-2.5 text-xs outline-none sm:col-span-1 sm:rounded-full"
                    aria-label="Sort mentors"
                >
                    {SORTS.map((item) => (
                        <option key={item.key} value={item.key}>
                            {item.label}
                        </option>
                    ))}
                </select>
            </div>

            {loading
                ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                    <>
                        <p className="text-sm text-muted-foreground">
                            {visible.length}{" "}
                            mentor{visible.length === 1 ? "" : "s"} available
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {visible.map((mentor) => (
                                <MentorCard key={mentor.id} mentor={mentor} />
                            ))}
                        </div>
                    </>
                )
                : (
                    <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
                        <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-secondary">
                            <Users className="h-5 w-5 text-muted-foreground" />
                        </span>
                        <p className="mt-4 font-display text-xl">
                            No mentors match that yet.
                        </p>
                        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                            Clear the filters to see everyone offering
                            consultations.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setTerm("");
                                setCity("all");
                                setExpertise("all");
                            }}
                            className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
                        >
                            Show all mentors
                        </button>
                    </div>
                )}
        </div>
    );
}
