import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown, Loader2, Route as RouteIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ensureProject } from "@/lib/acquisitions";
import { projectProgress } from "@/lib/projects";
import LoadingBlock from "@/components/LoadingBlock";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export default function BusinessRoadmap() {
    const [projects, setProjects] = useState([]);
    const [blueprints, setBlueprints] = useState([]);
    const [selected, setSelected] = useState("");
    const [openPhase, setOpenPhase] = useState(0);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let active = true;

        const fetchData = async () => {
            setLoading(true);

            try {
                const [projectResult, blueprintResult] = await Promise.all([
                    supabase
                        .from("projects")
                        .select("*")
                        .order("updated_at", { ascending: false })
                        .limit(100),

                    supabase
                        .from("blueprints")
                        .select("*")
                        .eq("status", "published")
                        .order("buyer_count", { ascending: false })
                        .limit(60),
                ]);

                if (projectResult.error) throw projectResult.error;
                if (blueprintResult.error) throw blueprintResult.error;

                if (!active) return;

                const projectList = projectResult.data || [];
                const blueprintList = blueprintResult.data || [];

                setProjects(projectList);
                setBlueprints(blueprintList);

                const wanted = new URLSearchParams(window.location.search).get(
                    "blueprint",
                );

                const initial = blueprintList.find((item) =>
                    item.id === wanted
                )?.id ||
                    projectList[0]?.blueprint_id ||
                    blueprintList[0]?.id ||
                    "";

                setSelected(initial);
            } catch (error) {
                console.error("Business roadmap fetch error:", error);
                if (active) {
                    setProjects([]);
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

    const blueprint = blueprints.find((item) => item.id === selected) || null;
    const project = projects.find((item) => item.blueprint_id === selected) ||
        null;
    const roadmap = blueprint?.roadmap || [];
    const progress = projectProgress(project);

    const isDone = (phaseName, title) =>
        (project?.milestones || []).some(
            (item) =>
                item.phase === phaseName && item.title === title && item.done,
        );

    const toggle = async (phaseName, title) => {
        if (!project) return;

        const previousMilestones = project.milestones || [];

        const milestones = previousMilestones.map((item) =>
            item.phase === phaseName && item.title === title
                ? { ...item, done: !item.done }
                : item
        );

        // Optimistic UI update
        setProjects((list) =>
            list.map((item) =>
                item.id === project.id ? { ...item, milestones } : item
            )
        );

        const { error } = await supabase
            .from("projects")
            .update({
                milestones,
                updated_at: new Date().toISOString(),
            })
            .eq("id", project.id);

        if (error) {
            console.error("Milestone update error:", error);

            // Roll back if database update fails
            setProjects((list) =>
                list.map((item) =>
                    item.id === project.id
                        ? { ...item, milestones: previousMilestones }
                        : item
                )
            );
        }
    };

    const startTracking = async () => {
        if (!blueprint || busy) return;

        setBusy(true);

        try {
            const created = await ensureProject(blueprint);

            setProjects((list) => {
                const exists = list.some((item) => item.id === created.id);

                return exists
                    ? list.map((
                        item,
                    ) => (item.id === created.id ? created : item))
                    : [created, ...list];
            });
        } catch (error) {
            console.error("Project creation error:", error);
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <LoadingBlock rows={2} />
                <LoadingBlock rows={8} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <p className="eyebrow">Execution</p>
                <h1 className="mt-2 text-2xl leading-tight sm:text-3xl">
                    Business roadmap
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    The phased path from day one to opening day, step by step.
                </p>
            </div>

            <div className="space-y-2">
                <label htmlFor="blueprint" className="eyebrow">
                    Blueprint
                </label>
                <select
                    id="blueprint"
                    value={selected}
                    onChange={(event) => {
                        setSelected(event.target.value);
                        setOpenPhase(0);
                    }}
                    className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none sm:max-w-md"
                >
                    {blueprints.map((item) => (
                        <option key={item.id} value={item.id}>
                            {item.title}
                        </option>
                    ))}
                </select>
            </div>

            {!blueprint
                ? (
                    <p className="rounded-2xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
                        No roadmap to show yet.{" "}
                        <Link
                            to="/blueprints"
                            className="font-medium text-primary hover:underline"
                        >
                            Browse the library
                        </Link>
                    </p>
                )
                : (
                    <>
                        <section className="rounded-2xl border border-border bg-card p-5">
                            <p className="font-display text-xl leading-snug">
                                {blueprint.title}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {blueprint.category} · {roadmap.length}{" "}
                                phase{roadmap.length === 1 ? "" : "s"}
                            </p>

                            {project
                                ? (
                                    <div className="mt-4">
                                        <div className="flex items-center gap-3">
                                            <Progress
                                                value={progress}
                                                className="h-2"
                                            />
                                            <span className="shrink-0 text-xs font-medium">
                                                {progress}%
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            Tick a step to update your milestone
                                            manager.
                                        </p>
                                    </div>
                                )
                                : (
                                    <Button
                                        className="mt-4 h-10 rounded-full"
                                        onClick={startTracking}
                                        disabled={busy}
                                    >
                                        {busy
                                            ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            )
                                            : (
                                                <RouteIcon className="mr-2 h-4 w-4" />
                                            )}
                                        Start tracking this plan
                                    </Button>
                                )}
                        </section>

                        {roadmap.length
                            ? (
                                <ol className="relative space-y-3 border-l border-border pl-5">
                                    {roadmap.map((phase, index) => {
                                        const phaseName = phase.phase ||
                                            `Phase ${index + 1}`;
                                        const actions = phase.actions || [];
                                        const doneCount =
                                            actions.filter((action) =>
                                                isDone(phaseName, action)
                                            ).length;
                                        const open = openPhase === index;

                                        return (
                                            <li
                                                key={`${phaseName}-${index}`}
                                                className="relative"
                                            >
                                                <span className="absolute -left-[27px] top-4 grid h-5 w-5 place-items-center rounded-full border border-border bg-card text-[10px] font-medium">
                                                    {index + 1}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setOpenPhase(
                                                            open ? -1 : index,
                                                        )}
                                                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left"
                                                >
                                                    <span className="min-w-0">
                                                        <span className="block text-sm font-medium">
                                                            {phaseName}
                                                        </span>
                                                        <span className="mt-0.5 block text-xs text-muted-foreground">
                                                            {phase.duration ||
                                                                "Flexible timeline"}
                                                            {project &&
                                                                    actions
                                                                        .length
                                                                ? ` · ${doneCount}/${actions.length} done`
                                                                : ""}
                                                        </span>
                                                    </span>
                                                    <ChevronDown
                                                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                                                            open
                                                                ? "rotate-180"
                                                                : ""
                                                        }`}
                                                    />
                                                </button>

                                                {open && actions.length > 0 && (
                                                    <ul className="mt-2 space-y-2 rounded-2xl border border-dashed border-border p-4">
                                                        {actions.map(
                                                            (action) => {
                                                                const done =
                                                                    isDone(
                                                                        phaseName,
                                                                        action,
                                                                    );
                                                                return (
                                                                    <li
                                                                        key={action}
                                                                    >
                                                                        <button
                                                                            type="button"
                                                                            disabled={!project}
                                                                            onClick={() =>
                                                                                toggle(
                                                                                    phaseName,
                                                                                    action,
                                                                                )}
                                                                            className={`flex w-full items-start gap-2 text-left text-sm leading-relaxed ${
                                                                                done
                                                                                    ? "text-muted-foreground line-through"
                                                                                    : ""
                                                                            } ${
                                                                                project
                                                                                    ? ""
                                                                                    : "cursor-default"
                                                                            }`}
                                                                        >
                                                                            <span
                                                                                className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                                                                                    done
                                                                                        ? "border-primary bg-primary text-primary-foreground"
                                                                                        : "border-border"
                                                                                }`}
                                                                            >
                                                                                {done &&
                                                                                    (
                                                                                        <Check className="h-2.5 w-2.5" />
                                                                                    )}
                                                                            </span>
                                                                            <span>
                                                                                {action}
                                                                            </span>
                                                                        </button>
                                                                    </li>
                                                                );
                                                            },
                                                        )}
                                                    </ul>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ol>
                            )
                            : (
                                <p className="rounded-2xl border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
                                    This blueprint does not include a phased
                                    roadmap yet.
                                </p>
                            )}
                    </>
                )}
        </div>
    );
}
