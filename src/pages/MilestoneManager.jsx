import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  ListChecks,
  Plus,
  Loader2,
} from "lucide-react";

import {
  groupByPhase,
  milestoneCounts,
  projectProgress,
  nextMilestone,
} from "@/lib/projects";

import {
  getProjects,
  updateProject,
} from "@/services/projectService";

import EmptyState from "@/components/account/EmptyState";
import LoadingBlock from "@/components/LoadingBlock";
import StatusBadge from "@/components/account/StatusBadge";

import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { formatDate } from "@/lib/format";

const STATUS_OPTIONS = [
  "planning",
  "active",
  "paused",
  "completed",
];

export default function MilestoneManager() {
  const [projects, setProjects] = useState([]);
  const [activeId, setActiveId] = useState("");

  const [loading, setLoading] = useState(true);
  const [newStep, setNewStep] = useState("");

  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /**
   * Load projects from Supabase.
   */
  useEffect(() => {
    let mounted = true;

    const loadProjects = async () => {
      try {
        setLoading(true);
        setError("");

        const list = await getProjects();

        if (!mounted) return;

        setProjects(list);

        const wanted = new URLSearchParams(
          window.location.search
        ).get("project");

        const match =
          list.find((item) => String(item.id) === wanted) ||
          list[0];

        setActiveId(match?.id || "");
      } catch (err) {
        console.error("Error loading projects:", err);

        if (mounted) {
          setError(
            err.message || "Unable to load projects."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProjects();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Current active project.
   */
  const active =
    projects.find(
      (item) => String(item.id) === String(activeId)
    ) || null;

  const milestones = active?.milestones || [];

  const groups = groupByPhase(milestones);

  const progress = projectProgress(active);

  const counts = milestoneCounts(active);

  const upcoming = nextMilestone(active);

  /**
   * Update project in Supabase.
   */
  const patch = async (changes) => {
    if (!active || saving) return;

    const projectId = active.id;

    const previousProjects = projects;

    // Optimistic UI update.
    setProjects((list) =>
      list.map((item) =>
        item.id === projectId
          ? { ...item, ...changes }
          : item
      )
    );

    setSaving(true);
    setError("");

    try {
      const updated = await updateProject(
        projectId,
        changes
      );

      // Replace local state with the database response.
      setProjects((list) =>
        list.map((item) =>
          item.id === projectId
            ? { ...item, ...updated }
            : item
        )
      );
    } catch (err) {
      console.error("Project update failed:", err);

      // Rollback optimistic update.
      setProjects(previousProjects);

      setError(
        err.message || "Failed to update project."
      );
    } finally {
      setSaving(false);
    }
  };

  /**
   * Toggle milestone completion.
   */
  const toggleStep = (id) => {
    const updated = milestones.map((item) =>
      item.id === id
        ? {
            ...item,
            done: !item.done,
          }
        : item
    );

    patch({
      milestones: updated,
    });
  };

  /**
   * Add custom milestone.
   */
  const addStep = async () => {
    const title = newStep.trim();

    if (!title || !active || busy || saving) return;

    setBusy(true);

    try {
      const id = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 6)}`;

      const updatedMilestones = [
        ...milestones,
        {
          id,
          phase: "My own steps",
          title,
          done: false,
        },
      ];

      await patch({
        milestones: updatedMilestones,
      });

      setNewStep("");
    } finally {
      setBusy(false);
    }
  };

  /**
   * Loading state.
   */
  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingBlock rows={2} />
        <LoadingBlock rows={6} />
      </div>
    );
  }

  /**
   * Empty state.
   */
  if (!projects.length) {
    return (
      <EmptyState
        icon={ListChecks}
        title="No milestones to manage yet"
        description="Start tracking a blueprint you own and its execution roadmap becomes a checklist here."
        action={
          <Link
            to="/business-roadmap"
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Start from a roadmap
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <p className="eyebrow">Execution</p>

        <h1 className="mt-2 text-2xl leading-tight sm:text-3xl">
          Milestone manager
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Update the steps for each business you are building.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {/* Project selector */}
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            onClick={() => setActiveId(project.id)}
            className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
              project.id === activeId
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground"
            }`}
          >
            {project.blueprint_title}
          </button>
        ))}
      </div>

      {active && (
        <>

          {/* Project overview */}
          <section className="rounded-2xl border border-border bg-card p-5">

            <div className="flex flex-wrap items-start justify-between gap-3">

              <div className="min-w-0">
                <p className="font-display text-xl leading-snug">
                  {active.blueprint_title}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {active.category || "Business"} · started{" "}
                  {formatDate(active.start_date)}
                </p>
              </div>

              {/* Project status */}
              <select
                value={active.status || "planning"}
                onChange={(event) =>
                  patch({
                    status: event.target.value,
                  })
                }
                disabled={saving}
                className="rounded-full border border-border bg-card px-3 py-2 text-xs outline-none"
                aria-label="Project status"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() +
                      status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Progress */}
            <div className="mt-4 flex items-center gap-3">

              <Progress
                value={progress}
                className="h-2"
              />

              <span className="shrink-0 text-xs font-medium">
                {progress}%
              </span>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              {counts.done} of {counts.total} milestones done

              {upcoming
                ? ` · next: ${upcoming.title}`
                : counts.total
                  ? " · all complete"
                  : ""}
            </p>

            {/* Status and target date */}
            <div className="mt-3 flex items-center gap-2">

              <StatusBadge status={active.status} />

              {active.target_date && (
                <span className="text-xs text-muted-foreground">
                  Target {formatDate(active.target_date)}
                </span>
              )}

              {saving && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </span>
              )}
            </div>
          </section>

          {/* Milestone groups */}
          <section className="space-y-4">

            {groups.map((group) => (
              <div
                key={group.phase}
                className="rounded-2xl border border-border bg-card"
              >

                {/* Group header */}
                <div className="flex items-center justify-between border-b border-border px-5 py-3">

                  <p className="text-sm font-medium">
                    {group.phase}
                  </p>

                  <span className="text-[11px] text-muted-foreground">
                    {
                      group.items.filter(
                        (item) => item.done
                      ).length
                    }
                    /{group.items.length}
                  </span>
                </div>

                {/* Milestones */}
                <ul className="divide-y divide-border">

                  {group.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start gap-3 px-5 py-3"
                    >

                      <Checkbox
                        id={String(item.id)}
                        checked={Boolean(item.done)}
                        disabled={saving}
                        onCheckedChange={() =>
                          toggleStep(item.id)
                        }
                        className="mt-0.5"
                      />

                      <label
                        htmlFor={String(item.id)}
                        className={`cursor-pointer text-sm leading-relaxed ${
                          item.done
                            ? "text-muted-foreground line-through"
                            : "text-foreground"
                        }`}
                      >
                        {item.title}
                      </label>

                    </li>
                  ))}

                </ul>
              </div>
            ))}

            {/* No milestones */}
            {!groups.length && (
              <p className="rounded-2xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
                This project has no milestones yet. Add the first step below.
              </p>
            )}

          </section>

          {/* Add custom milestone */}
          <section className="rounded-2xl border border-border bg-card p-5">

            <p className="text-sm font-medium">
              Add your own step
            </p>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row">

              <Input
                value={newStep}
                onChange={(event) =>
                  setNewStep(event.target.value)
                }
                placeholder="e.g. Sign the lease for the second outlet"
                className="h-11"
                disabled={busy || saving}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addStep();
                  }
                }}
              />

              <Button
                className="h-11 rounded-full sm:w-auto"
                onClick={addStep}
                disabled={
                  busy ||
                  saving ||
                  !newStep.trim()
                }
              >
                {busy ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-1.5 h-4 w-4" />
                )}

                Add step
              </Button>

            </div>
          </section>

        </>
      )}
    </div>
  );
}